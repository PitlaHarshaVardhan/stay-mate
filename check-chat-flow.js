const base = 'http://localhost:4000';
const jarA = new Map();
const jarB = new Map();

function cookieHeader(map) {
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(path, options = {}, passedJar = jarA) {
  const headers = { ...(options.headers || {}) };
  const c = cookieHeader(passedJar);
  if (c) headers.Cookie = c;

  const res = await fetch(base + path, {
    ...options,
    headers,
    credentials: 'include'
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const parts = setCookie.split(',').map((v) => v.trim()).filter(Boolean);
    for (const part of parts) {
      const token = part.split(';')[0];
      if (!token || !token.includes('=')) continue;
      const idx = token.indexOf('=');
      const name = token.slice(0, idx);
      const value = token.slice(idx + 1);
      passedJar.set(name, value);
    }
  }

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return { status: res.status, body, cookieHeader: cookieHeader(passedJar) };
}

(async () => {
  const emailA = `chataccepta${Date.now()}@example.com`;
  const emailB = `chatacceptb${Date.now()}@example.com`;
  const phoneA = `99999${String(Date.now()).slice(-6)}`;
  const phoneB = `88888${String(Date.now()).slice(-6)}`;

  const regA = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Chat Accept A',
      email: emailA,
      phone: phoneA,
      password: 'Password123!'
    })
  }, jarA);

  const regB = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Chat Accept B',
      email: emailB,
      phone: phoneB,
      password: 'Password123!'
    })
  }, jarB);

  console.log('REGISTER_A', regA.status, JSON.stringify(regA.body));
  console.log('REGISTER_B', regB.status, JSON.stringify(regB.body));

  const loginA = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password: 'Password123!' })
  }, jarA);

  const loginB = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, password: 'Password123!' })
  }, jarB);

  console.log('LOGIN_A', loginA.status, JSON.stringify(loginA.body));
  console.log('LOGIN_B', loginB.status, JSON.stringify(loginB.body));

  const conn = await request('/api/connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverId: regB.body.data.id })
  }, jarA);

  console.log('CONNECTION_REQUEST', conn.status, JSON.stringify(conn.body));

  const accept = await request(`/api/connections/${conn.body.data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ACCEPTED' })
  }, jarB);

  console.log('ACCEPT_CONNECTION', accept.status, JSON.stringify(accept.body));

  const convsA = await request('/api/chat', { method: 'GET' }, jarA);
  const convsB = await request('/api/chat', { method: 'GET' }, jarB);

  console.log('CONVERSATIONS_A', convsA.status, JSON.stringify(convsA.body));
  console.log('CONVERSATIONS_B', convsB.status, JSON.stringify(convsB.body));

  const conversationId = (convsA.body.data && convsA.body.data[0] && convsA.body.data[0].id) || null;
  if (conversationId) {
    const msg = await request('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, content: 'Hello from chat flow' })
    }, jarA);

    console.log('SEND_MESSAGE', msg.status, JSON.stringify(msg.body));

    const history = await request(`/api/chat/${conversationId}`, { method: 'GET' }, jarB);
    console.log('MESSAGE_HISTORY', history.status, JSON.stringify(history.body));
  }
})().catch((err) => {
  console.error('CHAT_ACCEPT_FLOW_ERROR', err);
  process.exit(1);
});
