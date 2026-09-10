import { UserRole, TaskNQ57 } from '../types';

export interface RolePermissions {
  canManageUsers: boolean;        // Chỉ Admin
  canSyncGoogleSheets: boolean;    // Admin, To_Chuyen_Trach
  canConfigureAi: boolean;        // Chỉ Admin
  canCreateTask: boolean;         // Admin, To_Chuyen_Trach
  canDeleteTask: boolean;         // Admin, To_Chuyen_Trach
  canEditTaskContent: boolean;    // Admin, To_Chuyen_Trach (sửa tên, hạn, văn bản gốc)
  canDirectLead: boolean;         // Admin, Lanh_Dao (ban hành ý kiến chỉ đạo)
  canApproveTask: boolean;        // Admin, Lanh_Dao (nghiệm thu/duyệt nhiệm vụ)
  canUpdateProgress: boolean;     // Admin, To_Chuyen_Trach, Don_Vi (đơn vị chỉ sửa NV của mình)
  canViewAllUnits: boolean;       // Admin, Lanh_Dao, To_Chuyen_Trach (Don_Vi chỉ xem đơn vị mình)
  canViewAuditLogs: boolean;      // Admin, To_Chuyen_Trach
  canExportReports: boolean;      // Admin, To_Chuyen_Trach (Lãnh đạo & Đơn vị không cần xuất file thô)
  canManageDrive: boolean;        // Admin, To_Chuyen_Trach (quản lý kho minh chứng toàn hệ thống)
}

/**
 * Ma trận phân quyền chuẩn hóa theo quy định
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'Admin':
      return {
        canManageUsers: true,
        canSyncGoogleSheets: true,
        canConfigureAi: true,
        canCreateTask: true,
        canDeleteTask: true,
        canEditTaskContent: true,
        canDirectLead: true,
        canApproveTask: true,
        canUpdateProgress: true,
        canViewAllUnits: true,
        canViewAuditLogs: true,
        canExportReports: true,
        canManageDrive: true,
      };

    case 'Lanh_Dao':
      return {
        canManageUsers: false,
        canSyncGoogleSheets: false,
        canConfigureAi: false,
        canCreateTask: true,         // Ban Giám hiệu có quyền giao thêm nhiệm vụ
        canDeleteTask: false,
        canEditTaskContent: true,    // Ban Giám hiệu có quyền điều chỉnh tên, hạn, người phụ trách, đơn vị
        canDirectLead: true,         // Được phép cho ý kiến chỉ đạo
        canApproveTask: true,        // Phê duyệt nghiệm thu
        canUpdateProgress: true,     // Ban Giám hiệu có quyền điều chỉnh tiến độ
        canViewAllUnits: true,       // Xem toàn bộ dữ liệu & biểu đồ
        canViewAuditLogs: false,
        canExportReports: false,     // Lãnh đạo điều hành qua Dashboard/KPI, không xuất file thô
        canManageDrive: false,      // Lãnh đạo không quản lý kho file
      };

    case 'To_Chuyen_Trach':
      return {
        canManageUsers: false,
        canSyncGoogleSheets: true,
        canConfigureAi: false,
        canCreateTask: true,         // Thêm nhiệm vụ
        canDeleteTask: true,         // Xóa nhiệm vụ
        canEditTaskContent: true,    // Sửa thông tin nhiệm vụ
        canDirectLead: false,        // Chỉ xem chỉ đạo
        canApproveTask: false,
        canUpdateProgress: true,     // Cập nhật tiến độ
        canViewAllUnits: true,       // Xem toàn bộ dữ liệu & biểu đồ
        canViewAuditLogs: true,      // Xem nhật ký hoạt động
        canExportReports: true,      // Tổ chuyên trách xuất báo cáo tổng hợp
        canManageDrive: true,       // Quản lý kho minh chứng chung
      };

    case 'Don_Vi':
    default:
      return {
        canManageUsers: false,
        canSyncGoogleSheets: false,
        canConfigureAi: false,
        canCreateTask: false,
        canDeleteTask: false,
        canEditTaskContent: false,
        canDirectLead: false,
        canApproveTask: false,
        canUpdateProgress: true,     // Cập nhật tiến độ & checklist đơn vị mình
        canViewAllUnits: false,      // Chỉ xem đơn vị mình
        canViewAuditLogs: false,
        canExportReports: false,
        canManageDrive: false,
      };
  }
}

const UNIT_SYNONYMS: string[][] = [
  ['quản lý sinh viên và học viên', 'qlsv-hv', 'qlsv', 'sinh viên và học viên', 'quản lý sinh viên', 'ql sv&hv', 'qlsv&hv'],
  ['khoa học công nghệ và hợp tác quốc tế', 'phòng khcn & htqt', 'khcn & htqt', 'khcn', 'qlkh - qhqt', 'qlkh', 'qhqt', 'htqt', 'khoa học công nghệ', 'hợp tác quốc tế'],
  ['khảo thí và đảm bảo chất lượng', 'khảo thí & đbcl', 'khảo thí', 'đảm bảo chất lượng', 'đbcl'],
  ['đào tạo', 'phòng đào tạo'],
  ['văn phòng'],
  ['kế hoạch tài chính', 'kế hoạch - tài chính', 'khtc'],
  ['trạm y tế', 'y tế'],
  ['học liệu và truyền thông', 'trung tâm học liệu', 'học liệu'],
  ['tổ chuyển đổi số', 'tổ cđs', 'chuyển đổi số trường dhhv'],
  ['kỹ thuật công nghệ', 'khoa kt-cn', 'khoa ktcn', 'kt-cn', 'ktcn'],
  ['khoa tiếng trung quốc', 'khoa tiếng trung', 'tiếng trung'],
  ['khoa nt&tdtt', 'nghệ thuật và thể dục thể thao', 'nghệ thuật & tdtt', 'nt&tdtt'],
  ['ban biên tập tạp chí', 'tạp chí'],
  ['khởi nghiệp và đổi mới sáng tạo', 'trung tâm kn & đmst', 'kn & đmst'],
];

/**
 * Kiểm tra một nhiệm vụ có thuộc hoặc liên quan tới đơn vị hay không
 * Hỗ trợ:
 * - Đơn vị chủ trì (1 hoặc nhiều đơn vị cách nhau dấu phẩy hoặc chấm phẩy)
 * - Đơn vị phối hợp (danh sách nhiều đơn vị)
 * - Khái niệm chung: "Các đơn vị thuộc và trực thuộc", "Toàn trường"
 * - Tên viết tắt hoặc từ đồng nghĩa (QLSV-HV, KHCN, ĐBCL, KTCN,...)
 */
export function isTaskRelatedToUnit(task: TaskNQ57, unitName?: string): boolean {
  if (!unitName) return true;
  const target = unitName.toLowerCase().trim();
  if (!target) return true;

  // Lãnh đạo hoặc ban giám hiệu xem hết
  if (target.includes('ban giám hiệu') || target.includes('lãnh đạo')) {
    return true;
  }

  const chuTri = (task.donViChuTri || '').toLowerCase();
  const phoiHop = (task.donViPhoiHop || '').toLowerCase();
  const combinedUnits = `${chuTri} ; ${phoiHop}`;

  // 1. Kiểm tra trực tiếp chuỗi con hai chiều
  if (chuTri.includes(target) || target.includes(chuTri)) return true;
  if (phoiHop.includes(target)) return true;

  // 2. Cụm từ áp dụng cho toàn bộ các đơn vị
  if (
    phoiHop.includes('các đơn vị thuộc và trực thuộc') ||
    phoiHop.includes('toàn trường') ||
    phoiHop.includes('các đơn vị')
  ) {
    return true;
  }

  // 3. Kiểm tra qua từ điển viết tắt / đồng nghĩa
  for (const group of UNIT_SYNONYMS) {
    const targetMatchesGroup = group.some((syn) => target.includes(syn) || syn.includes(target));
    if (targetMatchesGroup) {
      const taskMatchesGroup = group.some((syn) => combinedUnits.includes(syn));
      if (taskMatchesGroup) {
        return true;
      }
    }
  }

  return false;
}
