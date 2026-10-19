const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

async function run() {
  console.log('Fetching tasks from Supabase...');
  const res = await fetch(`${supabaseUrl}/rest/v1/tasks?select=*&order=id.asc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });

  const rows = await res.json();
  console.log('Total fetched:', rows.length);

  const tasks = rows.map(r => ({
    id: r.id,
    nhomKeHoach: r.nhom_ke_hoach,
    tenNhiemVu: r.ten_nhiem_vu,
    donViChuTri: r.don_vi_chu_tri,
    donViPhoiHop: r.don_vi_phoi_hop || '',
    sanPhamDauRa: r.san_pham_dau_ra || '',
    ngayBatDau: r.ngay_bat_dau || '',
    thoiHan: r.thoi_han || '',
    trangThai: r.trang_thai,
    tiendo: typeof r.tiendo === 'number' ? r.tiendo : Number(r.tiendo || 0),
    approvalStatus: r.approval_status || 'Chua_Nop',
    mucDoUuTien: r.muc_do_uu_tien || 'Bình thường',
    nguoiPhuTrach: r.nguoi_phu_trach || '',
    emailPhuTrach: r.email_phu_trach || '',
    nguoiGiaoViec: r.nguoi_giao_viec || '',
    milestone: r.milestone || '',
    category: r.category || '',
    linkMinhChung: r.link_minh_chung || '',
    filesMinhChung: Array.isArray(r.files_minh_chung) ? r.files_minh_chung : [],
    ghiChuNoiBo: r.ghi_chu_noi_bo || '',
    notesHistory: Array.isArray(r.notes_history) ? r.notes_history : [],
    yKienChiDao: r.y_kien_chi_dao || '',
    directivesHistory: Array.isArray(r.directives_history) ? r.directives_history : [],
    checklist: Array.isArray(r.checklist) ? r.checklist : [],
    comments: Array.isArray(r.comments) ? r.comments : [],
    ngayCapNhat: r.ngay_cap_nhat || new Date().toISOString()
  }));

  const initialDataPath = path.join(__dirname, '..', 'src', 'data', 'initialData.ts');
  const currentContent = fs.readFileSync(initialDataPath, 'utf8');

  // Keep everything before INITIAL_TASKS
  const splitMarker = 'export const INITIAL_TASKS: TaskNQ57[] = [';
  const parts = currentContent.split(splitMarker);
  if (parts.length < 2) {
    console.error('Could not find splitMarker in initialData.ts');
    process.exit(1);
  }

  const beforeTasks = parts[0];
  const newTasksJson = JSON.stringify(tasks, null, 2);
  const newContent = `${beforeTasks}${splitMarker}\n${newTasksJson.slice(1, -1)}\n];\n`;

  fs.writeFileSync(initialDataPath, newContent, 'utf8');
  console.log(`Successfully updated ${initialDataPath} with ${tasks.length} tasks!`);
}

run().catch(console.error);
