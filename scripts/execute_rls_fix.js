import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    const sqlFile = path.join(__dirname, 'fix_supabase_rls_warnings.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing SQL migration...');
    await client.query(sql);
    console.log('✅ SQL migration executed successfully!');

    // Kiểm tra lại danh sách policies sau khi cập nhật
    const res = await client.query(`
      SELECT tablename, policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      ORDER BY tablename, policyname;
    `);

    console.log('\n📋 DANH SÁCH CHÍNH SÁCH MỚI:');
    for (const r of res.rows) {
      console.log(`- [${r.tablename}] "${r.policyname}" | Lệnh: ${r.cmd}`);
    }
  } catch (err) {
    console.error('❌ Lỗi khi thực thi SQL:', err.message);
  } finally {
    await client.end();
  }
}

run();
