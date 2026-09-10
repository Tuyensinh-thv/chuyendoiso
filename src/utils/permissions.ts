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
        canCreateTask: false,
        canDeleteTask: false,
        canEditTaskContent: false,
        canDirectLead: true,         // Được phép cho ý kiến chỉ đạo
        canApproveTask: true,        // Phê duyệt nghiệm thu
        canUpdateProgress: false,
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

/**
 * Kiểm tra một nhiệm vụ có thuộc hoặc liên quan tới đơn vị hay không
 * Hỗ trợ:
 * - Đơn vị chủ trì (1 hoặc nhiều đơn vị cách nhau dấu phẩy hoặc chấm phẩy)
 * - Đơn vị phối hợp (danh sách nhiều đơn vị)
 * - Khái niệm chung: "Các đơn vị thuộc và trực thuộc", "Toàn trường"
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

  // Kiểm tra đơn vị chủ trì
  if (chuTri.includes(target)) return true;

  // Kiểm tra đơn vị phối hợp
  if (phoiHop.includes(target)) return true;

  // Cụm từ áp dụng cho toàn bộ các đơn vị
  if (
    phoiHop.includes('các đơn vị thuộc và trực thuộc') ||
    phoiHop.includes('toàn trường') ||
    phoiHop.includes('các đơn vị')
  ) {
    return true;
  }

  return false;
}
