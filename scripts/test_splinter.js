import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.whzzmrjoztjcllxmaztk',
  password: 'Phutho2024@!',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();

  // Query đúng theo logic của Supabase Security Advisor (splinter)
  const res = await client.query(`
    SELECT
      n.nspname AS schema,
      c.relname AS table,
      pol.polname AS policy,
      pol.polcmd AS cmd,
      pg_get_expr(pol.polqual, pol.polrelid) AS qual,
      pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM
      pg_policy pol
      JOIN pg_class c ON pol.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE
      n.nspname = 'public'
      AND pol.polcmd != 'r'
      AND (
        pg_get_expr(pol.polqual, pol.polrelid) = 'true'
        OR pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
      )
    ORDER BY c.relname, pol.polname;
  `);

  console.log(`Số cảnh báo Splinter tìm thấy: ${res.rows.length}`);
  for (const r of res.rows) {
    console.log(`- [${r.table}] "${r.policy}" (cmd: ${r.cmd}) | qual: ${r.qual} | with_check: ${r.with_check}`);
  }

  await client.end();
}

run();
