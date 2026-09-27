const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local', override: true });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing from backend/.env.local.');
  process.exit(1);
}

const command = process.argv[2] ?? 'dev';
if (!['dev', 'status'].includes(command)) {
  console.error('Supported local migration commands are "dev" and "status".');
  process.exit(1);
}

const prismaCli = require.resolve('prisma');
const result = spawnSync(process.execPath, [
  prismaCli,
  'migrate',
  command,
  '--schema',
  'prisma/schema.prisma',
], {
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);