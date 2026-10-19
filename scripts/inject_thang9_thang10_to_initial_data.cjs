const fs = require('fs');
const path = require('path');

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

const parsedT9Path = 'C:/Users/Admin/.gemini/antigravity-ide/brain/248256d8-3b74-433d-9035-9f1395aba991/scratch/parsed_thang9.json';
const parsedT10Path = 'C:/Users/Admin/.gemini/antigravity-ide/brain/248256d8-3b74-433d-9035-9f1395aba991/scratch/parsed_thang10.json';

const t9Data = JSON.parse(fs.readFileSync(parsedT9Path, 'utf8'));
const t10Data = JSON.parse(fs.readFileSync(parsedT10Path, 'utf8'));

const tasksT9 = t9Data.tasks.map((t, idx) => {
  const numStr = String(idx + 1).padStart(2, '0');
  const id = `T09_${numStr}`;
  const donVi = mapDepartment(t.section);
  const hasResult = t.ketQua && t.ketQua.trim().length > 0;

  return {
    id,
    nhomKeHoach: 'Đại học Hùng Vương - Tháng 9',
    tenNhiemVu: t.noiDung.trim(),
    sanPhamDauRa: t.sanPham ? t.sanPham.trim() : '',
    donViChuTri: donVi,
    donViPhoiHop: 'Các đơn vị liên quan',
    ngayBatDau: '2026-09-01',
    thoiHan: '2026-09-30',
    trangThai: hasResult ? 'Đã hoàn thành' : 'Đang thực hiện',
    tiendo: hasResult ? 100 : 80,
    approvalStatus: 'Da_Duyet',
    mucDoUuTien: 'Bình thường',
    nguoiPhuTrach: donVi,
    emailPhuTrach: '',
    nguoiGiaoViec: 'Ban Giám hiệu',
    milestone: `Mục ${t.stt || ''}`,
    category: 'cat_work',
    linkMinhChung: '',
    filesMinhChung: [],
    ghiChuNoiBo: hasResult ? `[Kết quả thực hiện]: ${t.ketQua.trim()}` : '',
    notesHistory: [],
    yKienChiDao: '',
    directivesHistory: [],
    checklist: [],
    comments: [],
    ngayCapNhat: '2026-09-30T17:00:00.000Z'
  };
});

const tasksT10 = t10Data.tasks.map((t, idx) => {
  const numStr = String(idx + 1).padStart(2, '0');
  const id = `T10_${numStr}`;
  const donVi = mapDepartment(t.section);

  return {
    id,
    nhomKeHoach: 'Đại học Hùng Vương - Tháng 10',
    tenNhiemVu: t.noiDung.trim(),
    sanPhamDauRa: t.sanPham ? t.sanPham.trim() : '',
    donViChuTri: donVi,
    donViPhoiHop: 'Các đơn vị liên quan',
    ngayBatDau: '2026-10-01',
    thoiHan: '2026-10-31',
    trangThai: 'Đang thực hiện',
    tiendo: 15,
    approvalStatus: 'Chua_Nop',
    mucDoUuTien: 'Bình thường',
    nguoiPhuTrach: donVi,
    emailPhuTrach: '',
    nguoiGiaoViec: 'Ban Giám hiệu',
    milestone: `Mục ${t.stt || ''}`,
    category: 'cat_work',
    linkMinhChung: '',
    filesMinhChung: [],
    ghiChuNoiBo: '',
    notesHistory: [],
    yKienChiDao: '',
    directivesHistory: [],
    checklist: [],
    comments: [],
    ngayCapNhat: '2026-10-01T08:00:00.000Z'
  };
});

const initialDataFile = path.join(__dirname, '..', 'src', 'data', 'initialData.ts');
let content = fs.readFileSync(initialDataFile, 'utf8');

// Check if already injected
if (content.includes("'T09_01'") || content.includes('"T09_01"')) {
  console.log('Tasks already present in initialData.ts');
  process.exit(0);
}

// Format the items as TypeScript code
function formatTask(task) {
  return `  {\n` +
    `    id: ${JSON.stringify(task.id)},\n` +
    `    nhomKeHoach: ${JSON.stringify(task.nhomKeHoach)},\n` +
    `    tenNhiemVu: ${JSON.stringify(task.tenNhiemVu)},\n` +
    `    donViChuTri: ${JSON.stringify(task.donViChuTri)},\n` +
    `    donViPhoiHop: ${JSON.stringify(task.donViPhoiHop)},\n` +
    `    sanPhamDauRa: ${JSON.stringify(task.sanPhamDauRa)},\n` +
    `    ngayBatDau: ${JSON.stringify(task.ngayBatDau)},\n` +
    `    thoiHan: ${JSON.stringify(task.thoiHan)},\n` +
    `    trangThai: ${JSON.stringify(task.trangThai)},\n` +
    `    tiendo: ${task.tiendo},\n` +
    `    approvalStatus: ${JSON.stringify(task.approvalStatus)},\n` +
    `    mucDoUuTien: ${JSON.stringify(task.mucDoUuTien)},\n` +
    `    nguoiPhuTrach: ${JSON.stringify(task.nguoiPhuTrach)},\n` +
    `    emailPhuTrach: ${JSON.stringify(task.emailPhuTrach)},\n` +
    `    nguoiGiaoViec: ${JSON.stringify(task.nguoiGiaoViec)},\n` +
    `    milestone: ${JSON.stringify(task.milestone)},\n` +
    `    category: ${JSON.stringify(task.category)},\n` +
    `    linkMinhChung: '',\n` +
    `    filesMinhChung: [],\n` +
    `    ghiChuNoiBo: ${JSON.stringify(task.ghiChuNoiBo)},\n` +
    `    notesHistory: [],\n` +
    `    yKienChiDao: '',\n` +
    `    directivesHistory: [],\n` +
    `    checklist: [],\n` +
    `    comments: [],\n` +
    `    ngayCapNhat: ${JSON.stringify(task.ngayCapNhat)}\n` +
    `  }`;
}

const allNewTasks = [...tasksT9, ...tasksT10];
const tasksString = allNewTasks.map(formatTask).join(',\n');

// Insert at the end of INITIAL_TASKS array
const lastBracketIndex = content.lastIndexOf('];');
if (lastBracketIndex === -1) {
  console.error('Cannot find closing bracket ]; in initialData.ts');
  process.exit(1);
}

const updatedContent = content.slice(0, lastBracketIndex).trimEnd() + ',\n' + tasksString + '\n];\n';
fs.writeFileSync(initialDataFile, updatedContent, 'utf8');

console.log(`Successfully injected ${allNewTasks.length} tasks into initialData.ts! Total file size: ${updatedContent.length} bytes`);
