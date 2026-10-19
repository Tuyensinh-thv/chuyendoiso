const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'initialData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Update PLAN_GROUPS
if (!content.includes('"Đại học Hùng Vương - Tháng 9"')) {
  content = content.replace(
    /export const PLAN_GROUPS = \[/,
    'export const PLAN_GROUPS = [\r\n  "Đại học Hùng Vương - Tháng 9",\r\n  "Đại học Hùng Vương - Tháng 10",'
  );
  if (!content.includes('"Đại học Hùng Vương - Tháng 9"')) {
    content = content.replace(
      /export const PLAN_GROUPS = \[/,
      'export const PLAN_GROUPS = [\n  "Đại học Hùng Vương - Tháng 9",\n  "Đại học Hùng Vương - Tháng 10",'
    );
  }
}

// Update DEPARTMENTS
if (!content.includes('"Phòng Tổ chức cán bộ"')) {
  content = content.replace(
    /"Phòng Đào tạo",/,
    '"Phòng Tổ chức cán bộ",\r\n  "Phòng Đào tạo",'
  );
  if (!content.includes('"Phòng Tổ chức cán bộ"')) {
    content = content.replace(
      /"Phòng Đào tạo",/,
      '"Phòng Tổ chức cán bộ",\n  "Phòng Đào tạo",'
    );
  }
}

if (!content.includes('"Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp"')) {
  content = content.replace(
    /"Trung tâm KN & ĐMST",/,
    '"Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp",\r\n  "Trung tâm KN & ĐMST",'
  );
  if (!content.includes('"Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp"')) {
    content = content.replace(
      /"Trung tâm KN & ĐMST",/,
      '"Trung tâm Hợp tác doanh nghiệp và Khởi nghiệp",\n  "Trung tâm KN & ĐMST",'
    );
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated src/data/initialData.ts');
