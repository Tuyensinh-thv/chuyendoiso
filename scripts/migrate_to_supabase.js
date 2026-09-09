import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.whzzmrjoztjcllxmaztk',
  password: 'Phutho2024@!',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Creating tables and schema...');

    // 1. Departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for departments" ON departments;
      CREATE POLICY "Allow public all for departments" ON departments FOR ALL USING (true) WITH CHECK (true);
    `);

    // 2. Plan groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE plan_groups ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for plan_groups" ON plan_groups;
      CREATE POLICY "Allow public all for plan_groups" ON plan_groups FOR ALL USING (true) WITH CHECK (true);
    `);

    // 3. Custom Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for custom_categories" ON custom_categories;
      CREATE POLICY "Allow public all for custom_categories" ON custom_categories FOR ALL USING (true) WITH CHECK (true);
    `);

    // 4. User accounts table (Ready for SSO)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        email TEXT PRIMARY KEY,
        ho_ten TEXT NOT NULL,
        don_vi TEXT NOT NULL,
        vai_tro TEXT NOT NULL,
        avatar TEXT,
        password_hash TEXT,
        trang_thai TEXT DEFAULT 'Hoạt động',
        sso_provider TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for user_accounts" ON user_accounts;
      CREATE POLICY "Allow public all for user_accounts" ON user_accounts FOR ALL USING (true) WITH CHECK (true);
    `);

    // 5. Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        nhom_ke_hoach TEXT NOT NULL,
        ten_nhiem_vu TEXT NOT NULL,
        don_vi_chu_tri TEXT NOT NULL,
        don_vi_phoi_hop TEXT DEFAULT '',
        san_pham_dau_ra TEXT DEFAULT '',
        ngay_bat_dau TEXT,
        thoi_han TEXT,
        trang_thai TEXT NOT NULL DEFAULT 'Chưa thực hiện',
        tiendo INTEGER DEFAULT 0,
        approval_status TEXT DEFAULT 'Chua_Nop',
        muc_do_uu_tien TEXT DEFAULT 'Bình thường',
        nguoi_phu_trach TEXT DEFAULT '',
        email_phu_trach TEXT DEFAULT '',
        nguoi_giao_viec TEXT DEFAULT '',
        milestone TEXT DEFAULT '',
        category TEXT DEFAULT '',
        link_minh_chung TEXT DEFAULT '',
        files_minh_chung JSONB DEFAULT '[]'::jsonb,
        ghi_chu_noi_bo TEXT DEFAULT '',
        notes_history JSONB DEFAULT '[]'::jsonb,
        y_kien_chi_dao TEXT DEFAULT '',
        directives_history JSONB DEFAULT '[]'::jsonb,
        checklist JSONB DEFAULT '[]'::jsonb,
        comments JSONB DEFAULT '[]'::jsonb,
        ngay_cap_nhat TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for tasks" ON tasks;
      CREATE POLICY "Allow public all for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
    `);

    // 6. Subtasks / Checklist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for task_subtasks" ON task_subtasks;
      CREATE POLICY "Allow public all for task_subtasks" ON task_subtasks FOR ALL USING (true) WITH CHECK (true);
    `);

    // 7. Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        actor TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        task_id TEXT,
        task_title TEXT,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow public all for audit_logs" ON audit_logs;
      CREATE POLICY "Allow public all for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
    `);

    console.log('Tables created successfully with RLS policies enabled.');

    // Now import and seed initial data
    console.log('Loading seed data...');
    // We can read initialData.ts directly or dynamically
    const initialDataPath = path.resolve(__dirname, '../src/data/initialData.ts');
    const initialDataContent = fs.readFileSync(initialDataPath, 'utf-8');

    // Load initial accounts
    console.log('Seeding user accounts...');
    // Default sha-256 for 'hvu2026'
    const defaultHash = '755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51';
    
    // Dynamically extract data or write the seed array
    // Let's import using tsx or dynamic extraction
    console.log('Seeding default categories...');
    const defaultCategories = [
      { id: 'cat_work', name: 'Work (Công việc Nhà trường)', color: 'blue', description: 'Nhiệm vụ chính quy theo kế hoạch Nhà trường' },
      { id: 'cat_study', name: 'Study (Nghiên cứu & Học thuật)', color: 'purple', description: 'Đề tài, bài báo khoa học, biên soạn giáo trình' },
      { id: 'cat_personal', name: 'Personal (Cá nhân / Độc lập)', color: 'emerald', description: 'Nhiệm vụ cán bộ tự quản lý, trau dồi nghiệp vụ' },
      { id: 'cat_cds', name: 'Chuyển đổi số (NQ57)', color: 'amber', description: 'Trọng tâm hạ tầng & cơ sở dữ liệu số' },
      { id: 'cat_admin', name: 'Hành chính & Quản trị', color: 'rose', description: 'Văn bản, quyết định, quy chế nội bộ' },
    ];
    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO custom_categories (id, name, color, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET name = $2, color = $3, description = $4;
      `, [cat.id, cat.name, cat.color, cat.description]);
    }

    console.log('Migration step 1 completed. Seeding script will now load initial tasks, departments and accounts.');

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
