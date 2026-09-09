import pg from 'pg';
import { INITIAL_TASKS, INITIAL_ACCOUNTS, PLAN_GROUPS, DEPARTMENTS } from '../src/data/initialData';
import { DEFAULT_CATEGORIES } from '../src/utils/storage';

const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.whzzmrjoztjcllxmaztk',
  password: 'Phutho2024@!',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected!');

    console.log('1. Creating schema tables...');

    // Departments
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

    // Plan groups
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

    // Categories
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

    // User accounts
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

    // Tasks table
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

    // Subtasks
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

    // Audit logs
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

    console.log('2. Seeding Departments (' + DEPARTMENTS.length + ')...');
    for (const dept of DEPARTMENTS) {
      await client.query(`
        INSERT INTO departments (id, name)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE SET name = $2;
      `, [dept, dept]);
    }

    console.log('3. Seeding Plan Groups (' + PLAN_GROUPS.length + ')...');
    for (const pgItem of PLAN_GROUPS) {
      await client.query(`
        INSERT INTO plan_groups (id, name)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE SET name = $2;
      `, [pgItem, pgItem]);
    }

    console.log('4. Seeding Custom Categories (' + DEFAULT_CATEGORIES.length + ')...');
    for (const cat of DEFAULT_CATEGORIES) {
      await client.query(`
        INSERT INTO custom_categories (id, name, color, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET name = $2, color = $3, description = $4;
      `, [cat.id, cat.name, cat.color, cat.description]);
    }

    console.log('5. Seeding User Accounts (' + INITIAL_ACCOUNTS.length + ')...');
    for (const acc of INITIAL_ACCOUNTS) {
      await client.query(`
        INSERT INTO user_accounts (email, ho_ten, don_vi, vai_tro, avatar, password_hash, trang_thai)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          ho_ten = $2,
          don_vi = $3,
          vai_tro = $4,
          avatar = $5,
          password_hash = $6,
          trang_thai = $7,
          updated_at = NOW();
      `, [
        acc.email,
        acc.hoTen,
        acc.donVi,
        acc.vaiTro,
        acc.avatar || '👤',
        acc.passwordHash || '755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51',
        acc.trangThai || 'Hoạt động'
      ]);
    }

    console.log('6. Seeding Tasks (' + INITIAL_TASKS.length + ' tasks)...');
    for (const task of INITIAL_TASKS) {
      await client.query(`
        INSERT INTO tasks (
          id, nhom_ke_hoach, ten_nhiem_vu, don_vi_chu_tri, don_vi_phoi_hop,
          san_pham_dau_ra, ngay_bat_dau, thoi_han, trang_thai, tiendo,
          approval_status, muc_do_uu_tien, nguoi_phu_trach, email_phu_trach,
          nguoi_giao_viec, milestone, category, link_minh_chung,
          files_minh_chung, ghi_chu_noi_bo, notes_history,
          y_kien_chi_dao, directives_history, checklist, comments,
          ngay_cap_nhat
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21,
          $22, $23, $24, $25,
          NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          nhom_ke_hoach = $2,
          ten_nhiem_vu = $3,
          don_vi_chu_tri = $4,
          don_vi_phoi_hop = $5,
          san_pham_dau_ra = $6,
          ngay_bat_dau = $7,
          thoi_han = $8,
          trang_thai = $9,
          tiendo = $10,
          approval_status = $11,
          muc_do_uu_tien = $12,
          nguoi_phu_trach = $13,
          email_phu_trach = $14,
          nguoi_giao_viec = $15,
          milestone = $16,
          category = $17,
          link_minh_chung = $18,
          files_minh_chung = $19,
          ghi_chu_noi_bo = $20,
          notes_history = $21,
          y_kien_chi_dao = $22,
          directives_history = $23,
          checklist = $24,
          comments = $25,
          ngay_cap_nhat = NOW(),
          updated_at = NOW();
      `, [
        task.id,
        task.nhomKeHoach,
        task.tenNhiemVu,
        task.donViChuTri,
        task.donViPhoiHop || '',
        task.sanPhamDauRa || '',
        task.ngayBatDau || '',
        task.thoiHan || '',
        task.trangThai || 'Chưa thực hiện',
        task.tiendo || 0,
        task.approvalStatus || 'Chua_Nop',
        task.mucDoUuTien || 'Bình thường',
        task.nguoiPhuTrach || '',
        task.emailPhuTrach || '',
        task.nguoiGiaoViec || '',
        task.milestone || '',
        task.category || '',
        task.linkMinhChung || '',
        JSON.stringify(task.filesMinhChung || []),
        task.ghiChuNoiBo || '',
        JSON.stringify(task.notesHistory || []),
        task.yKienChiDao || '',
        JSON.stringify(task.directivesHistory || []),
        JSON.stringify(task.checklist || []),
        JSON.stringify(task.comments || []),
      ]);

      // Seed task subtasks if any
      if (task.checklist && task.checklist.length > 0) {
        for (const item of task.checklist) {
          await client.query(`
            INSERT INTO task_subtasks (id, task_id, title, completed)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET title = $3, completed = $4;
          `, [item.id, task.id, item.title, item.completed]);
        }
      }
    }

    console.log('7. Seeding Initial Audit Log...');
    await client.query(`
      INSERT INTO audit_logs (id, timestamp, actor, actor_role, action, details)
      VALUES ($1, NOW(), $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING;
    `, [
      'log_init_supabase',
      'Hệ Thống Chuyển Đổi Số',
      'Admin',
      'SYNC',
      'Khởi tạo và đồng bộ toàn diện CSDL Supabase PostgreSQL thành công'
    ]);

    console.log('=== SEED COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Migration & Seed Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
