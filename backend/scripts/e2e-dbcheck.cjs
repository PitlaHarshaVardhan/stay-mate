const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe('SELECT 1 as ok')
  .then((r) => { console.log('DB_CONNECT_OK', JSON.stringify(r)); return p.$disconnect(); })
  .catch((e) => { console.error('DB_ERR', (e.message || '').split('\n')[0]); process.exit(2); });
