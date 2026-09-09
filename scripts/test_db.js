import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.whzzmrjoztjcllxmaztk',
  password: 'Phutho2024@!',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), version();');
    console.log('CONNECTED SUCCESSFULLY:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('CONNECTION ERROR:', err.message);
    process.exit(1);
  }
}

main();
