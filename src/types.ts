export type TaskStatus = 'Chưa thực hiện' | 'Đang thực hiện' | 'Sắp đến hạn' | 'Đã hoàn thành' | 'Quá hạn';

export type UserRole = 'Admin' | 'Lanh_Dao' | 'To_Chuyen_Trach' | 'Don_Vi';

export type PriorityLevel = 'High' | 'Medium' | 'Low' | 'Cao' | 'Trung bình' | 'Bình thường' | 'Thấp';

export type TaskApprovalStatus = 'Chua_Nop' | 'Cho_Duyet' | 'Da_Duyet' | 'Yeu_Cau_Sua';

export type BaseWeworkPerspective = 
  | 'all' 
  | 'my_assigned' 
  | 'my_delegated' 
  | 'pending_approval' 
  | 'overdue_urgent' 
  | 'ai_suggested';

export type ChecklistEvaluationStatus = 'Chua_Danh_Gia' | 'Dat' | 'Yeu_Cau_Sua' | 'Can_Bo_Sung';

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  assigneeEmail?: string;
  assigneeRole?: string;
  dueDate?: string;
  evaluationStatus?: ChecklistEvaluationStatus;
  evaluationNote?: string;
  evaluator?: string;
  evaluatedAt?: string;
}

export interface TaskDiscussionComment {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  content: string;
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string; // e.g. 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan'
  description?: string;
}

export interface MenuSettings {
  showMyDelegated: boolean;
  showAiSuggested: boolean;
}

export interface UserAccount {
  email: string;
  hoTen: string;
  donVi: string;
  vaiTro: UserRole;
  avatar?: string;
  passwordHash?: string;
  trangThai?: 'Hoạt động' | 'Tạm khóa';
}

export type AuditLogAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'SYNC' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SECURITY';

export type AuditLogCategory = 'DATA' | 'SYSTEM';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: AuditLogAction;
  category?: AuditLogCategory;
  taskId?: string;
  taskTitle?: string;
  details: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: string;
  driveUrl: string;
  driveFolder: string;
  fileData?: string; // base64 preview if available
  isExternalLink?: boolean;
  docType?: 'KH' | 'BC' | 'QD' | 'HD' | 'MC';
  originalName?: string;
}

export interface TaskDirective {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface TaskNote {
  id: string;
  author: string;
  donVi: string;
  content: string;
  createdAt: string;
}

export interface TaskNQ57 {
  id: string; // NV01 -> NV48
  nhomKeHoach: string; // e.g. "Kế hoạch 197 (100 ngày CĐS)", "Kế hoạch 200 (90 ngày Kho dữ liệu)"
  tenNhiemVu: string;
  donViChuTri: string;
  donViPhoiHop: string;
  sanPhamDauRa: string;
  ngayBatDau?: string; // YYYY-MM-DD
  thoiHan: string; // YYYY-MM-DD
  trangThai: TaskStatus;
  nguoiPhuTrach: string;
  emailPhuTrach?: string;
  linkMinhChung?: string;
  filesMinhChung: EvidenceFile[];
  ghiChuNoiBo: string;
  notesHistory?: TaskNote[];
  yKienChiDao: string;
  directivesHistory?: TaskDirective[];
  ngayCapNhat: string;
  tiendo: number; // 0 to 100%
  mucDoUuTien: 'Cao' | 'Trung bình' | 'Bình thường' | 'High' | 'Medium' | 'Low';
  category?: string; // ID of custom category e.g. 'cat_work', 'cat_personal', 'cat_study', or custom name
  // Base Wework Enterprise Features
  checklist?: TaskChecklistItem[];
  approvalStatus?: TaskApprovalStatus;
  comments?: TaskDiscussionComment[];
  milestone?: string;
  nguoiGiaoViec?: string;
}

export interface FilterOptions {
  search: string;
  nhomKeHoach: string;
  donViChuTri: string;
  trangThai: string;
  chiMinhToi: boolean;
  category: string;
  priority: string;
  sortBy: string;
  perspective?: BaseWeworkPerspective;
}
