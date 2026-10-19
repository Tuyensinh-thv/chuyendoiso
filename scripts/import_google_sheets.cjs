const fs = require('fs');
const path = require('path');

// 1. Read .env file for Supabase credentials
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

if (!urlMatch || !keyMatch) {
  console.error('Missing Supabase URL or Anon Key in .env');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

console.log('Connecting to Supabase:', supabaseUrl);

const headers = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

// 2. Department mapping according to 8 functional areas
function mapDepartment(section) {
  if (section.includes('(1)')) return 'Phòng Đào tạo';
  if (section.includes('(2)')) return 'Phòng Khảo thí và Đảm bảo chất lượng';
  if (section.includes('(3)')) return 'Phòng KHCN & HTQT';
  if (section.includes('(4)')) return 'Phòng Tổ chức cán bộ';
  if (section.includes('(5)')) return 'Văn phòng';
  if (section.includes('(6)')) return 'Phòng Kế hoạch - Tài chính';
  if (section.includes('(7)')) return 'Phòng Quản lý sinh viên và học viên';
  if (section.includes('(8)')) return 'Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp';
  return 'Văn phòng';
}

// 3. Load parsed tasks from JSON files
const parsedT9Path = 'C:/Users/Admin/.gemini/antigravity-ide/brain/248256d8-3b74-433d-9035-9f1395aba991/scratch/parsed_thang9.json';
const parsedT10Path = 'C:/Users/Admin/.gemini/antigravity-ide/brain/248256d8-3b74-433d-9035-9f1395aba991/scratch/parsed_thang10.json';

const t9Data = JSON.parse(fs.readFileSync(parsedT9Path, 'utf8'));
const t10Data = JSON.parse(fs.readFileSync(parsedT10Path, 'utf8'));

console.log(`Loaded ${t9Data.tasks.length} tasks for Tháng 9, ${t10Data.tasks.length} tasks for Tháng 10`);

async function runImport() {
  try {
    // A. Register new plan groups in `plan_groups` table
    console.log('\n--- 1. Registering Plan Groups ---');
    const newPlanGroups = [
      { id: 'Đại học Hùng Vương - Tháng 9', name: 'Đại học Hùng Vương - Tháng 9' },
      { id: 'Đại học Hùng Vương - Tháng 10', name: 'Đại học Hùng Vương - Tháng 10' }
    ];

    const pgResp = await fetch(`${supabaseUrl}/rest/v1/plan_groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newPlanGroups)
    });
    console.log('Plan groups upsert status:', pgResp.status);

    // B. Register new departments in `departments` table
    console.log('\n--- 2. Registering Departments ---');
    const newDepts = [
      { id: 'Phòng Tổ chức cán bộ', name: 'Phòng Tổ chức cán bộ' },
      { id: 'Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp', name: 'Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp' }
    ];
    const deptResp = await fetch(`${supabaseUrl}/rest/v1/departments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newDepts)
    });
    console.log('Departments upsert status:', deptResp.status);

    // C. Format tasks for Tháng 9
    console.log('\n--- 3. Formatting Tasks for Tháng 9 ---');
    const tasksT9 = t9Data.tasks.map((t, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      const id = `T09_${numStr}`;
      const donVi = mapDepartment(t.section);
      const hasResult = t.ketQua && t.ketQua.trim().length > 0;

      return {
        id,
        nhom_ke_hoach: 'Đại học Hùng Vương - Tháng 9',
        ten_nhiem_vu: t.noiDung.trim(),
        san_pham_dau_ra: t.sanPham ? t.sanPham.trim() : '',
        don_vi_chu_tri: donVi,
        don_vi_phoi_hop: 'Các đơn vị liên quan',
        ngay_bat_dau: '2026-09-01',
        thoi_han: '2026-09-30',
        trang_thai: hasResult ? 'Đã hoàn thành' : 'Đang thực hiện',
        tiendo: hasResult ? 100 : 80,
        approval_status: 'Da_Duyet',
        muc_do_uu_tien: 'Bình thường',
        nguoi_phu_trach: donVi,
        email_phu_trach: '',
        nguoi_giao_viec: 'Ban Giám hiệu',
        milestone: `Mục ${t.stt || ''}`,
        category: t.section,
        link_minh_chung: '',
        files_minh_chung: [],
        ghi_chu_noi_bo: hasResult ? `[Kết quả thực hiện]: ${t.ketQua.trim()}` : '',
        notes_history: [],
        y_kien_chi_dao: '',
        directives_history: [],
        checklist: [],
        comments: [],
        ngay_cap_nhat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // D. Format tasks for Tháng 10
    console.log('--- 4. Formatting Tasks for Tháng 10 ---');
    const tasksT10 = t10Data.tasks.map((t, idx) => {
      const numStr = String(idx + 1).padStart(2, '0');
      const id = `T10_${numStr}`;
      const donVi = mapDepartment(t.section);

      return {
        id,
        nhom_ke_hoach: 'Đại học Hùng Vương - Tháng 10',
        ten_nhiem_vu: t.noiDung.trim(),
        san_pham_dau_ra: t.sanPham ? t.sanPham.trim() : '',
        don_vi_chu_tri: donVi,
        don_vi_phoi_hop: 'Các đơn vị liên quan',
        ngay_bat_dau: '2026-10-01',
        thoi_han: '2026-10-31',
        trang_thai: 'Đang thực hiện',
        tiendo: 15,
        approval_status: 'Chua_Nop',
        muc_do_uu_tien: 'Bình thường',
        nguoi_phu_trach: donVi,
        email_phu_trach: '',
        nguoi_giao_viec: 'Ban Giám hiệu',
        milestone: `Mục ${t.stt || ''}`,
        category: t.section,
        link_minh_chung: '',
        files_minh_chung: [],
        ghi_chu_noi_bo: '',
        notes_history: [],
        y_kien_chi_dao: '',
        directives_history: [],
        checklist: [],
        comments: [],
        ngay_cap_nhat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // E. Upsert in batches of 25 items
    const allTasks = [...tasksT9, ...tasksT10];
    console.log(`\n--- 5. Upserting ${allTasks.length} tasks to Supabase ---`);

    const batchSize = 25;
    for (let i = 0; i < allTasks.length; i += batchSize) {
      const batch = allTasks.slice(i, i + batchSize);
      console.log(`Upserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} items, IDs: ${batch[0].id} -> ${batch[batch.length - 1].id})...`);
      
      const res = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error in batch ${i}: status ${res.status}:`, errorText);
        throw new Error(errorText);
      }
    }

    console.log('\n✅ ALL TASKS UPSERTED SUCCESSFULLY TO SUPABASE!');

    // F. Verify final counts in Supabase
    const countResp = await fetch(`${supabaseUrl}/rest/v1/tasks?select=id,nhom_ke_hoach`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const verifyTasks = await countResp.json();
    console.log('\n--- Verification ---');
    console.log('Total tasks in Supabase now:', verifyTasks.length);
    const countT9 = verifyTasks.filter(t => t.nhom_ke_hoach === 'Đại học Hùng Vương - Tháng 9').length;
    const countT10 = verifyTasks.filter(t => t.nhom_ke_hoach === 'Đại học Hùng Vương - Tháng 10').length;
    console.log(`- Đại học Hùng Vương - Tháng 9: ${countT9} tasks`);
    console.log(`- Đại học Hùng Vương - Tháng 10: ${countT10} tasks`);

  } catch (err) {
    console.error('Import failed with error:', err);
    process.exit(1);
  }
}

runImport();
