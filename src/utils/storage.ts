import { TaskNQ57, UserAccount, CustomCategory, AuditLogEntry } from '../types';
import { INITIAL_TASKS, INITIAL_ACCOUNTS } from '../data/initialData';
import { 
  saveAllTasksToSupabase, 
  saveAccountToSupabase, 
  saveCategoriesToSupabase, 
  addAuditLogToSupabase 
} from './supabaseService';

export type { AuditLogEntry };

const TASKS_KEY = 'hvu_nq57_tasks_v7';
const CURRENT_USER_KEY = 'hvu_nq57_current_user_v3';
const ACCOUNTS_KEY = 'hvu_nq57_accounts_v3';
const REMINDER_SETTINGS_KEY = 'hvu_nq57_reminder_settings';
const CATEGORIES_KEY = 'hvu_custom_categories_v2';

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'cat_work', name: 'Work (Công việc Nhà trường)', color: 'blue', description: 'Nhiệm vụ chính quy theo kế hoạch Nhà trường' },
  { id: 'cat_study', name: 'Study (Nghiên cứu & Học thuật)', color: 'purple', description: 'Đề tài, bài báo khoa học, biên soạn giáo trình' },
  { id: 'cat_personal', name: 'Personal (Cá nhân / Độc lập)', color: 'emerald', description: 'Nhiệm vụ cán bộ tự quản lý, trau dồi nghiệp vụ' },
  { id: 'cat_cds', name: 'Chuyển đổi số (NQ57)', color: 'amber', description: 'Trọng tâm hạ tầng & cơ sở dữ liệu số' },
  { id: 'cat_admin', name: 'Hành chính & Quản trị', color: 'rose', description: 'Văn bản, quyết định, quy chế nội bộ' },
];

export function loadCategoriesFromStorage(): CustomCategory[] {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load categories from storage', err);
  }
  saveCategoriesToStorage(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function saveCategoriesToStorage(categories: CustomCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories to storage', err);
  }
  saveCategoriesToSupabase(categories).catch((err) => {
    console.warn('Supabase background save categories:', err);
  });
}

export type CanonicalPriority = 'High' | 'Medium' | 'Low';

export function normalizePriority(p?: string): CanonicalPriority {
  if (!p) return 'Medium';
  const lower = p.toLowerCase().trim();
  if (lower === 'cao' || lower === 'high') return 'High';
  if (lower === 'trung bình' || lower === 'medium' || lower === 'tb') return 'Medium';
  return 'Low'; // 'bình thường', 'thấp', 'low'
}

export function getPriorityWeight(p?: string): number {
  const norm = normalizePriority(p);
  if (norm === 'High') return 3;
  if (norm === 'Medium') return 2;
  return 1;
}

export function getPriorityMeta(p?: string) {
  const norm = normalizePriority(p);
  if (norm === 'High') {
    return {
      key: 'High' as CanonicalPriority,
      vnLabel: 'Cao',
      shortLabel: 'Cao',
      fullLabel: 'Cao / High',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
      dotClass: 'bg-rose-500',
      iconColor: 'text-rose-600',
    };
  }
  if (norm === 'Medium') {
    return {
      key: 'Medium' as CanonicalPriority,
      vnLabel: 'Trung bình',
      shortLabel: 'T.Bình',
      fullLabel: 'Trung bình / Medium',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90',
      dotClass: 'bg-amber-500',
      iconColor: 'text-amber-600',
    };
  }
  return {
    key: 'Low' as CanonicalPriority,
    vnLabel: 'Thấp',
    shortLabel: 'Thấp',
    fullLabel: 'Thấp / Low',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dotClass: 'bg-zinc-500',
    iconColor: 'text-zinc-600',
  };
}

export function getCategoryBadgeClass(color?: string) {
  switch (color) {
    case 'rose':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'purple':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'cyan':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'indigo':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'blue':
    default:
      return 'bg-sky-50 text-sky-700 border-sky-200';
  }
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // e.g. "08:00"
  notifyDaysBefore: number; // e.g. 3
  sound: boolean;
  browserNotification: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  time: '08:00',
  notifyDaysBefore: 3,
  sound: true,
  browserNotification: false,
};

/**
 * SHA-256 hash for password storage
 */
export async function hashPassword(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(plain);
  return computed === hash;
}

// Pre-computed SHA-256 hash for default password 'hvu2026'
export const DEFAULT_PASSWORD_HASH = '755ba7f3aae8ee88024d0d0ee89bbd3ad80dfa9dee5f6f0dc74c914d9507ea51';

export function loadTasksFromStorage(): TaskNQ57[] {
  try {
    // Clean up old versions
    ['hvu_nq57_tasks_v2', 'hvu_nq57_tasks_v3', 'hvu_nq57_tasks_v4', 'hvu_nq57_tasks_v5', 'hvu_nq57_tasks_v6'].forEach(k => {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    });
    const data = localStorage.getItem(TASKS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load tasks from storage', err);
  }
  saveTasksToStorage(INITIAL_TASKS);
  return INITIAL_TASKS;
}

export function saveTasksToStorage(tasks: TaskNQ57[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to storage', err);
  }
  // Asynchronous background sync to Supabase PostgreSQL
  saveAllTasksToSupabase(tasks).catch((err) => {
    console.warn('Supabase background save tasks:', err);
  });
}

export function loadCurrentUser(): UserAccount {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) {
      const user = JSON.parse(data);
      if (user.email === 'kiennt@hvu.edu.vn') {
        user.vaiTro = 'Admin';
        user.hoTen = 'Nguyễn Trung Kiên (Admin)';
        user.donVi = 'Khoa KT-CN / Ban Quản trị Hệ thống';
      }
      return user;
    }
  } catch (err) {
    console.error('Failed to load user from storage', err);
  }
  const defaultAdmin = INITIAL_ACCOUNTS.find(a => a.email === 'kiennt@hvu.edu.vn') || INITIAL_ACCOUNTS[0];
  saveCurrentUser(defaultAdmin);
  return defaultAdmin;
}

export function saveCurrentUser(user: UserAccount): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user to storage', err);
  }
}

export function loadAccountsFromStorage(): UserAccount[] {
  try {
    // Clean up old versions
    ['hvu_nq57_accounts_v1', 'hvu_nq57_accounts_v2'].forEach(k => {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    });
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load accounts from storage', err);
  }
  return INITIAL_ACCOUNTS;
}

export function saveAccountsToStorage(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts to storage', err);
  }
  // Asynchronous background sync to Supabase user_accounts
  accounts.forEach((acc) => {
    saveAccountToSupabase(acc).catch((err) => {
      console.warn('Supabase background save account:', err);
    });
  });
}

export function loadReminderSettings(): ReminderSettings {
  try {
    const data = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load reminder settings', err);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

export function saveReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save reminder settings', err);
  }
}

export function exportTasksToCSV(tasks: TaskNQ57[]): void {
  const headers = [
    'Mã NV',
    'Nhóm kế hoạch',
    'Tên nhiệm vụ',
    'Đơn vị chủ trì',
    'Đơn vị phối hợp',
    'Sản phẩm đầu ra',
    'Thời hạn',
    'Trạng thái',
    'Tiến độ (%)',
    'Mức độ ưu tiên',
    'Người phụ trách',
    'Số lượng file minh chứng',
    'Ghi chú nội bộ',
    'Ý kiến chỉ đạo của BGH',
    'Ngày cập nhật',
  ];

  const escapeCSV = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = tasks.map((t) => [
    escapeCSV(t.id),
    escapeCSV(t.nhomKeHoach),
    escapeCSV(t.tenNhiemVu),
    escapeCSV(t.donViChuTri),
    escapeCSV(t.donViPhoiHop),
    escapeCSV(t.sanPhamDauRa),
    escapeCSV(t.thoiHan),
    escapeCSV(t.trangThai),
    escapeCSV(t.tiendo),
    escapeCSV(t.mucDoUuTien),
    escapeCSV(t.nguoiPhuTrach),
    escapeCSV(t.filesMinhChung?.length || 0),
    escapeCSV(t.ghiChuNoiBo),
    escapeCSV(t.yKienChiDao),
    escapeCSV(t.ngayCapNhat),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bao_Cao_Tien_Do_NQ57_HVU_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function playReminderChime(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {
    // AudioContext might be restricted until user gesture
  }
}

const AUDIT_LOGS_KEY = 'hvu_nq57_audit_logs_v2';

export function loadAuditLogsFromStorage(): AuditLogEntry[] {
  try {
    // Clean old version
    if (localStorage.getItem('hvu_nq57_audit_logs_v1')) {
      localStorage.removeItem('hvu_nq57_audit_logs_v1');
    }
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load audit logs', err);
  }
  return [];
}

export function saveAuditLogsToStorage(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch (err) {
    console.error('Failed to save audit logs', err);
  }
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const current = loadAuditLogsFromStorage();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `log_${Date.now()}`,
    timestamp: dateStr,
  };
  saveAuditLogsToStorage([newEntry, ...current]);
  addAuditLogToSupabase(newEntry).catch((err) => {
    console.warn('Supabase background add audit log:', err);
  });
  return newEntry;
}
