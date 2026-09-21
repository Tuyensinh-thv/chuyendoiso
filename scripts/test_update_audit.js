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

  await client.query(`
    DROP POLICY IF EXISTS "Allow insert audit_logs" ON public.audit_logs;
    CREATE POLICY "Allow insert audit_logs" 
    ON public.audit_logs 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (auth.role() IN ('anon', 'authenticated'));
  `);

  console.log('✅ Updated audit_logs policy!');
  await client.end();
}

run();
