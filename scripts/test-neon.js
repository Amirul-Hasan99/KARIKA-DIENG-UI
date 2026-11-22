process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { neon, neonConfig } = require('@neondatabase/serverless');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

async function run() {
  console.log('Testing neon connection...');
  try {
    const sql = neon(url);
    const res = await sql`SELECT 1 as test, NOW() as time`;
    console.log('Connection SUCCESS!', res);
    return;
  } catch (e) {
    console.warn('Connection failed:', e.message);
  }
}

run();
