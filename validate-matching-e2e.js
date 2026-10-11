// End-to-end validation of the matching + preferences flow, focused on the
// rule that EVERY person appears in recommendations: a genuine match ranks
// first, and people who are far away are still listed with a distance-based
// location score (NOT a hard "Not a match" — location never blocks; budget
// and verified gender mismatches still do). Distances come from the map pins
// saved with each preference and are surfaced for the UI to display.
//
// Run against a live backend:  node validate-matching-e2e.js
const base = 'http://localhost:4000';
const stamp = Date.now();
const suffix = String(stamp).slice(-7);

const jarA = new Map();
const jarB = new Map();
const jarC = new Map();

function mergeCookieHeader(map) {
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(path, options = {}, jar = jarA) {
  const headers = { ...(options.headers || {}) };
  const cookie = mergeCookieHeader(jar);
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(base + path, { ...options, headers, credentials: 'include' });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const parts = setCookie.split(',').map((v) => v.trim()).filter(Boolean);
    for (const part of parts) {
      const token = part.split(';')[0];
      if (!token || !token.includes('=')) continue;
      const idx = token.indexOf('=');
      jar.set(token.slice(0, idx), token.slice(idx + 1));
    }
  }
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: res.status, body };
}

function pref(over = {}) {
  return {
    city: 'Hyderabad',
    area: 'Madhapur',
    // Map pin of Madhapur (overridden per user below where it matters).
    latitude: 17.4439,
    longitude: 78.3779,
    budgetMin: 8000,
    budgetMax: 15000,
    moveInDate: '2026-11-01',
    roomType: 'DOUBLE',
    roommatesRequired: 1,
    smokingPreference: 'NON_SMOKER',
    drinkingPreference: 'NO_PREFERENCE',
    foodPreference: 'ANY',
    sleepSchedule: 'FLEXIBLE',
    cleanlinessPreference: 'MEDIUM',
    genderPreference: 'ANY',
    ...over,
  };
}

async function registerAndPref(name, email, phone, prefBody, jar) {
  const reg = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password: 'Password123!' }),
  }, jar);
  if (reg.status !== 201) throw new Error(`REGISTER ${name} failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  const save = await request('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefBody),
  }, jar);
  if (!save.body?.success) throw new Error(`PREF ${name} failed: ${save.status} ${JSON.stringify(save.body)}`);
  return reg.body.data.id;
}

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT_FAILED: ' + msg);
  console.log('  ok -', msg);
}

(async () => {
  const health = await request('/health', { method: 'GET' }, new Map());
  console.log('HEALTH', health.status, JSON.stringify(health.body));
  assert(health.body?.success === true, 'backend health is up');

  // A = current user. B = compatible (same city/area/budget + nearby pin).
  // C = far away (different city, hundreds of km away).
  const idA = await registerAndPref('Match User A', `matcha${suffix}@example.com`, `9800${suffix}`, pref(), jarA);
  const idB = await registerAndPref('Match User B', `matchb${suffix}@example.com`, `9801${suffix}`, pref({ budgetMax: 16000, latitude: 17.4421, longitude: 78.3755 }), jarB);
  const idC = await registerAndPref('Match User C', `matchc${suffix}@example.com`, `9802${suffix}`, pref({ city: 'Bangalore', area: 'Koramangala', latitude: 12.9352, longitude: 77.6245 }), jarC);
  console.log('REGISTERED', { idA, idB, idC });

  // Auth gate: an anonymous request must be rejected outright (401) — this is
  // the regression guard for the previously unauthenticated matching route.
  const anon = await request('/api/matching/people', { method: 'GET' }, new Map());
  assert(anon.status === 401, 'matching endpoint rejects unauthenticated requests');

  // The current user derives identity from the JWT cookie, not ?userId=.
  const match = await request('/api/matching/people', { method: 'GET' }, jarA);
  console.log('MATCH_STATUS', match.status);
  assert(match.body?.success === true, 'matching endpoint returns success');

  // Sanitization guard: no credentials or contact details may leak for anyone.
  const serialized = JSON.stringify(match.body);
  assert(
    !/passwordHash|"email"|"phone"|@example\.com/.test(serialized),
    'response contains no password hash, email or phone for any user',
  );

  const list = match.body?.data ?? [];
  console.log('MATCH_COUNT', list.length);
  assert(Array.isArray(list) && list.length > 0, 'matching returns candidates');

  // The far-away person (different city) MUST still be present, scored by
  // distance instead of badged "Not a match".
  const c = list.find((m) => m.user?.id === idC);
  assert(!!c, 'far-away person (different city) is still listed, not hidden');
  assert(c.eligible === true, 'far-away person stays eligible — location is scored, not gated');
  assert(typeof c.locationDistanceKm === 'number' && c.locationDistanceKm > 100, `far-away person has a real distance reported (${c.locationDistanceKm} km)`);
  const cLocation = (c.breakdown ?? []).find((x) => x.key === 'location');
  console.log('  C location:', cLocation?.score, '|', cLocation?.explanation, '| distance', c.locationDistanceKm, 'km');
  assert(cLocation?.score !== null && cLocation?.score <= 25, 'far-away person gets a low distance-based location score');
  assert(/km apart/.test(cLocation?.explanation ?? ''), 'location explanation includes the distance');

  // Genuine match ranked first and eligible.
  const b = list.find((m) => m.user?.id === idB);
  assert(!!b, 'compatible person is listed');
  const bIdx = list.findIndex((m) => m.user?.id === idB);
  const cIdx = list.findIndex((m) => m.user?.id === idC);
  assert(bIdx < cIdx, `compatible person ranks above the far-away person (B@${bIdx} < C@${cIdx})`);
  assert(b.eligible === true && b.compatibilityScore !== null, 'compatible person has a real score');
  const bLocation = (b.breakdown ?? []).find((x) => x.key === 'location');
  assert(typeof b.locationDistanceKm === 'number' && b.locationDistanceKm < 5, `nearby pin reports a small distance (${b.locationDistanceKm} km)`);
  assert(bLocation?.score >= 90, 'nearby pin scores high on location');

  // Common ground is exposed in the breakdown for everyone (incl. non-matches).
  const cMatched = (c.breakdown ?? []).filter((x) => x.score !== null && x.score >= 70);
  console.log('  C common-ground count:', cMatched.length, '| compared', c.comparedCount, '/', c.totalCriteria);
  assert((c.breakdown ?? []).length > 0, 'far-away person still has a per-criterion breakdown to show common ground');

  const bMatched = (b.breakdown ?? []).filter((x) => x.score !== null && x.score >= 70);
  console.log('  B common-ground count:', bMatched.length, '| score', b.compatibilityScore);
  assert(bMatched.length > 0, 'genuine match has shared criteria (common ground)');

  // Regression: a viewer who stated an explicit gender requirement must NOT see
  // every candidate badged "Not a match" merely because those candidates have
  // not set a profile gender (9/11 real users had no profile gender when this
  // fired). Missing data is a note, not a blocker — a genuine gate still holds.
  const jarD = new Map();
  await registerAndPref('Match User D', `matchd${suffix}@example.com`, `9803${suffix}`, pref({ genderPreference: 'FEMALE' }), jarD);
  const matchD = await request('/api/matching/people', { method: 'GET' }, jarD);
  const listD = matchD.body?.data ?? [];
  const dViewOfB = listD.find((m) => m.user?.id === idB);
  assert(
    dViewOfB?.eligible === true && dViewOfB?.compatibilityScore !== null,
    `explicit gender requirement + candidate with no profile gender still gets a real score (${dViewOfB?.compatibilityScore}%)`,
  );
  assert(
    (dViewOfB?.notes ?? []).some((n) => String(n).includes('gender requirement could not be verified')),
    'unverifiable gender requirement is surfaced as a note, not a blocker',
  );
  const dViewOfC = listD.find((m) => m.user?.id === idC);
  assert(dViewOfC?.eligible === true && typeof dViewOfC?.locationDistanceKm === 'number',
    'far-away person is still eligible for other viewers too, with a reported distance');

  console.log('\nMATCHING_E2E_PASS: everyone appears; real match ranked first; far-away people are distance-scored instead of badged "Not a match"; missing gender no longer fails closed.');
})().catch((error) => {
  console.error('MATCHING_E2E_FAILURE', error.message);
  process.exit(1);
});
