import { supabase } from './supabaseClient';
import { TaskNQ57, UserAccount, CustomCategory, AuditLogEntry, TaskChecklistItem, MenuSettings } from '../types';

/**
 * Maps database row (snake_case) to TaskNQ57 (camelCase)
 */
export function mapRowToTask(row: any): TaskNQ57 {
  return {
    id: row.id,
    nhomKeHoach: row.nhom_ke_hoach,
    tenNhiemVu: row.ten_nhiem_vu,
    donViChuTri: row.don_vi_chu_tri,
    donViPhoiHop: row.don_vi_phoi_hop || '',
    sanPhamDauRa: row.san_pham_dau_ra || '',
    ngayBatDau: row.ngay_bat_dau || '',
    thoiHan: row.thoi_han || '',
    trangThai: row.trang_thai,
    tiendo: typeof row.tiendo === 'number' ? row.tiendo : Number(row.tiendo || 0),
    approvalStatus: row.approval_status || 'Chua_Nop',
    mucDoUuTien: row.muc_do_uu_tien || 'Bình thường',
    nguoiPhuTrach: row.nguoi_phu_trach || '',
    emailPhuTrach: row.email_phu_trach || '',
    nguoiGiaoViec: row.nguoi_giao_viec || '',
    milestone: row.milestone || '',
    category: row.category || '',
    linkMinhChung: row.link_minh_chung || '',
    filesMinhChung: Array.isArray(row.files_minh_chung) ? row.files_minh_chung : [],
    ghiChuNoiBo: row.ghi_chu_noi_bo || '',
    notesHistory: Array.isArray(row.notes_history) ? row.notes_history : [],
    yKienChiDao: row.y_kien_chi_dao || '',
    directivesHistory: Array.isArray(row.directives_history) ? row.directives_history : [],
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    ngayCapNhat: row.ngay_cap_nhat || new Date().toISOString(),
  };
}

/**
 * Maps TaskNQ57 (camelCase) to database row (snake_case)
 */
export function mapTaskToRow(task: TaskNQ57): any {
  return {
    id: task.id,
    nhom_ke_hoach: task.nhomKeHoach,
    ten_nhiem_vu: task.tenNhiemVu,
    donVi_chu_tri: task.donViChuTri,
    don_vi_chu_tri: task.donViChuTri,
    don_vi_phoi_hop: task.donViPhoiHop || '',
    san_pham_dau_ra: task.sanPhamDauRa || '',
    ngay_bat_dau: task.ngayBatDau || '',
    thoi_han: task.thoiHan || '',
    trang_thai: task.trangThai,
    tiendo: task.tiendo || 0,
    approval_status: task.approvalStatus || 'Chua_Nop',
    muc_do_uu_tien: task.mucDoUuTien || 'Bình thường',
    nguoi_phu_trach: task.nguoiPhuTrach || '',
    email_phu_trach: task.emailPhuTrach || '',
    nguoi_giao_viec: task.nguoiGiaoViec || '',
    milestone: task.milestone || '',
    category: task.category || '',
    link_minh_chung: task.linkMinhChung || '',
    files_minh_chung: task.filesMinhChung || [],
    ghi_chu_noi_bo: task.ghiChuNoiBo || '',
    notes_history: task.notesHistory || [],
    y_kien_chi_dao: task.yKienChiDao || '',
    directives_history: task.directivesHistory || [],
    checklist: task.checklist || [],
    comments: task.comments || [],
    ngay_cap_nhat: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ==================== TASKS API ====================

export async function fetchTasksFromSupabase(): Promise<TaskNQ57[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      throw error;
    }

    if (data && data.length > 0) {
      return data.map(mapRowToTask);
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch tasks from Supabase:', err);
    return [];
  }
}

export async function saveTaskToSupabase(task: TaskNQ57): Promise<boolean> {
  try {
    const row = mapTaskToRow(task);
    delete row.donVi_chu_tri; // cleanup
    const { error } = await supabase
      .from('tasks')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting task in Supabase:', error);
      return false;
    }

    // Also sync subtasks / checklist items cleanly
    await supabase.from('task_subtasks').delete().eq('task_id', task.id);
    if (task.checklist && task.checklist.length > 0) {
      const subtaskRows = task.checklist.map((item) => ({
        id: item.id,
        task_id: task.id,
        title: item.title,
        completed: !!item.completed,
      }));
      await supabase.from('task_subtasks').insert(subtaskRows);
    }

    return true;
  } catch (err) {
    console.error('Failed to save task to Supabase:', err);
    return false;
  }
}

export async function saveAllTasksToSupabase(tasks: TaskNQ57[]): Promise<boolean> {
  try {
    const rows = tasks.map((t) => {
      const r = mapTaskToRow(t);
      delete r.donVi_chu_tri;
      return r;
    });
    const { error } = await supabase
      .from('tasks')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Error batch upserting tasks to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to batch save tasks to Supabase:', err);
    return false;
  }
}

export async function deleteTaskFromSupabase(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete task from Supabase:', err);
    return false;
  }
}

// ==================== USER ACCOUNTS API ====================

export async function fetchAccountsFromSupabase(): Promise<UserAccount[]> {
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .order('email', { ascending: true });

    if (error) {
      console.error('Error fetching accounts from Supabase:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((r: any) => ({
        email: r.email,
        hoTen: r.ho_ten,
        donVi: r.don_vi,
        vaiTro: r.vai_tro,
        avatar: r.avatar,
        passwordHash: r.password_hash,
        trangThai: r.trang_thai,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch accounts from Supabase:', err);
    return [];
  }
}

export async function saveAccountToSupabase(account: UserAccount): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_accounts')
      .upsert({
        email: account.email,
        ho_ten: account.hoTen,
        don_vi: account.donVi,
        vai_tro: account.vaiTro,
        avatar: account.avatar || '👤',
        password_hash: account.passwordHash,
        trang_thai: account.trangThai || 'Hoạt động',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (error) {
      console.error('Error saving account to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save account to Supabase:', err);
    return false;
  }
}

export async function deleteAccountFromSupabase(email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_accounts')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('Error deleting account from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete account from Supabase:', err);
    return false;
  }
}

// ==================== AUDIT LOGS API ====================

export async function fetchAuditLogsFromSupabase(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching audit logs from Supabase:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp || r.created_at,
        actor: r.actor,
        actorRole: r.actor_role,
        action: r.action,
        taskId: r.task_id,
        taskTitle: r.task_title,
        details: r.details,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch audit logs from Supabase:', err);
    return [];
  }
}

export async function addAuditLogToSupabase(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        id: entry.id,
        timestamp: entry.timestamp,
        actor: entry.actor,
        actor_role: entry.actorRole,
        action: entry.action,
        task_id: entry.taskId || null,
        task_title: entry.taskTitle || null,
        details: entry.details,
      });

    if (error) {
      console.error('Error adding audit log to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to insert audit log to Supabase:', err);
    return false;
  }
}

// ==================== CATEGORIES API ====================

export async function fetchCategoriesFromSupabase(): Promise<CustomCategory[]> {
  try {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        description: r.description,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch categories from Supabase:', err);
    return [];
  }
}

export async function saveCategoriesToSupabase(categories: CustomCategory[]): Promise<boolean> {
  try {
    const rows = categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      description: c.description,
    }));
    const { error } = await supabase
      .from('custom_categories')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Error saving categories to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save categories to Supabase:', err);
    return false;
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================

export function subscribeToTasks(onUpdate: () => void) {
  return supabase
    .channel('public:tasks')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}

export function subscribeToAuditLogs(onUpdate: () => void) {
  return supabase
    .channel('public:audit_logs')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}

// ==================== SYSTEM SETTINGS (MENU TOGGLES) API ====================

export async function fetchMenuSettingsFromSupabase(): Promise<MenuSettings | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'menu_visibility')
      .maybeSingle();

    if (error) {
      console.warn('System settings table or key may not exist yet in Supabase:', error.message);
      return null;
    }

    if (data && data.value) {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch menu settings from Supabase:', err);
    return null;
  }
}

export async function saveMenuSettingsToSupabase(settings: MenuSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'menu_visibility',
        value: settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.warn('Error saving menu settings to Supabase (using local fallback):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to save menu settings to Supabase:', err);
    return false;
  }
}
