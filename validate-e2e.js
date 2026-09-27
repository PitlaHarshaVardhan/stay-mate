const base = 'http://localhost:4000';
const jarA = new Map();
const jarB = new Map();

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
      const name = token.slice(0, idx);
      const value = token.slice(idx + 1);
      jar.set(name, value);
    }
  }

  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; }
  catch { body = { raw: text }; }

  return { status: res.status, body, cookieHeader: mergeCookieHeader(jar) };
}

(async () => {
  const health = await request('/health', { method: 'GET' }, new Map());
  console.log('HEALTH', health.status, JSON.stringify(health.body));

  const regA = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'API User A', email: 'apiusera@example.com', phone: '9999910050', password: 'Password123!' })
  }, jarA);
  console.log('REGISTER_A', regA.status, JSON.stringify(regA.body));

  const regB = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'API User B', email: 'apiuserb@example.com', phone: '9999910051', password: 'Password123!' })
  }, jarB);
  console.log('REGISTER_B', regB.status, JSON.stringify(regB.body));

  const loginA = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'apiusera@example.com', password: 'Password123!' })
  }, jarA);
  console.log('LOGIN_A', loginA.status, JSON.stringify(loginA.body));

  const meA = await request('/api/auth/me', { method: 'GET' }, jarA);
  console.log('ME_A', meA.status, JSON.stringify(meA.body));

  const loginB = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'apiuserb@example.com', password: 'Password123!' })
  }, jarB);
  console.log('LOGIN_B', loginB.status, JSON.stringify(loginB.body));

  const createConn = await request('/api/connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverId: regB.body.data.id })
  }, jarA);
  console.log('CREATE_CONN', createConn.status, JSON.stringify(createConn.body));

  const listConn = await request('/api/connections', { method: 'GET' }, jarA);
  console.log('LIST_CONN', listConn.status, JSON.stringify(listConn.body));

  const createGroup = await request('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'API Group',
      city: 'Hyderabad',
      area: 'Madhapur',
      budgetMin: 8000,
      budgetMax: 15000,
      moveInDate: '2026-10-01',
      targetMembers: 3,
      description: 'Validation group'
    })
  }, jarA);
  console.log('CREATE_GROUP', createGroup.status, JSON.stringify(createGroup.body));

  const groupId = createGroup.body?.data?.id;
  const joinGroup = await request(`/api/groups/${groupId}/join`, { method: 'POST' }, jarB);
  console.log('JOIN_GROUP', joinGroup.status, JSON.stringify(joinGroup.body));

  const groupList = await request('/api/groups', { method: 'GET' }, jarA);
  console.log('LIST_GROUPS', groupList.status, JSON.stringify(groupList.body));

  const propertySearch = await request('/api/properties/search?city=Hyderabad&verifiedOnly=true', { method: 'GET' }, new Map());
  console.log('PROPERTY_SEARCH', propertySearch.status, JSON.stringify(propertySearch.body));

  const notifications = await request('/api/notifications', { method: 'GET' }, jarA);
  console.log('NOTIFICATIONS', notifications.status, JSON.stringify(notifications.body));

  const logout = await request('/api/auth/logout', { method: 'POST' }, jarA);
  console.log('LOGOUT', logout.status, JSON.stringify(logout.body));
})().catch((error) => {
  console.error('E2E_FAILURE', error);
  process.exit(1);
});
