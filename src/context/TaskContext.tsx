import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TaskNQ57, UserAccount, TaskStatus, CustomCategory, AuditLogEntry, MenuSettings } from '../types';
import { EthicalAiSettings, loadEthicalAiSettings, saveEthicalAiSettings } from '../utils/ethicalAi';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadReminderSettings,
  saveReminderSettings,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  loadAuditLogsFromStorage,
  loadMenuSettingsFromStorage,
  saveMenuSettingsToStorage,
} from '../utils/storage';
import { computeTaskStatus } from '../utils/dateUtils';
import { INITIAL_TASKS } from '../data/initialData';
import { getRolePermissions, getActorRole, isTaskRelatedToUnit } from '../utils/permissions';
import {
  saveTaskToSupabase,
  saveAllTasksToSupabase,
  deleteTaskFromSupabase,
} from '../utils/supabaseService';
import { useAuth } from './AuthContext';
import { useAuditLog } from '../hooks/useAuditLog';

interface TaskContextValue {
  tasks: TaskNQ57[];
  setTasks: React.Dispatch<React.SetStateAction<TaskNQ57[]>>;
  categories: CustomCategory[];
  setCategories: React.Dispatch<React.SetStateAction<CustomCategory[]>>;
  ethicalAiSettings: EthicalAiSettings;
  setEthicalAiSettings: React.Dispatch<React.SetStateAction<EthicalAiSettings>>;
  reminderSettings: ReturnType<typeof loadReminderSettings>;
  menuSettings: MenuSettings;
  setMenuSettings: React.Dispatch<React.SetStateAction<MenuSettings>>;
  handleSaveMenuSettings: (settings: MenuSettings) => void;
  auditLogs: AuditLogEntry[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
  recordAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => AuditLogEntry;

  handleSaveTask: (updatedTask: TaskNQ57) => Promise<void>;
  handleUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  handleUpdateTaskProgress: (taskId: string, newProgress: number) => void;
  handleDeleteTask: (taskId: string) => void;
  handleApproveTask: (taskId: string, status?: string) => void;
  handleAddDirectiveToTask: (taskId: string, directiveText: string) => void;
  handleAddTask: (newTask: TaskNQ57) => void;
  handleResetData: () => void;
  handleSaveReminderSettings: (settings: ReturnType<typeof loadReminderSettings>) => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const perms = getRolePermissions(currentUser.vaiTro);

  const [tasks, setTasks] = useState<TaskNQ57[]>(() => {
    const loaded = loadTasksFromStorage();
    return loaded.map((t) => ({ ...t, trangThai: computeTaskStatus(t) }));
  });

  const [categories, setCategories] = useState<CustomCategory[]>(() => loadCategoriesFromStorage());
  const [ethicalAiSettings, setEthicalAiSettings] = useState<EthicalAiSettings>(() => loadEthicalAiSettings());
  const [reminderSettings, setReminderSettings] = useState(() => loadReminderSettings());
  const [menuSettings, setMenuSettings] = useState<MenuSettings>(() => loadMenuSettingsFromStorage());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadAuditLogsFromStorage());

  const { recordAuditLog } = useAuditLog(setAuditLogs);

  // Persistence effects
  useEffect(() => { saveTasksToStorage(tasks); }, [tasks]);
  useEffect(() => { saveCategoriesToStorage(categories); }, [categories]);
  useEffect(() => { saveEthicalAiSettings(ethicalAiSettings); }, [ethicalAiSettings]);
  useEffect(() => { saveMenuSettingsToStorage(menuSettings); }, [menuSettings]);

  const handleSaveMenuSettings = useCallback((newSettings: MenuSettings) => {
    setMenuSettings(newSettings);
    saveMenuSettingsToStorage(newSettings);
  }, []);

  const handleSaveTask = useCallback(async (updatedTask: TaskNQ57) => {
    const computed: TaskNQ57 = {
      ...updatedTask,
      trangThai: computeTaskStatus(updatedTask),
      ngayCapNhat: new Date().toISOString(),
    };

    setTasks((prev) => {
      const next = prev.map((t) => (t.id === computed.id ? computed : t));
      saveTasksToStorage(next);
      return next;
    });

    try {
      await saveTaskToSupabase(computed);
    } catch (err) {
      console.warn('Direct Supabase save task error:', err);
    }

    recordAuditLog({
      actor: currentUser.hoTen,
      actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
      action: 'UPDATE',
      taskId: computed.id,
      taskTitle: computed.tenNhiemVu,
      details: `Cập nhật thông tin chi tiết nhiệm vụ [${computed.id}]`,
    });
  }, [currentUser, recordAuditLog]);

  const handleUpdateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    if (currentUser.vaiTro === 'Don_Vi') {
      const target = tasks.find((item) => item.id === taskId);
      if (target && !isTaskRelatedToUnit(target, currentUser.donVi)) {
        alert('Đơn vị chỉ có quyền cập nhật trạng thái nhiệm vụ thuộc đơn vị mình!');
        return;
      }
    }

    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;
      const isComplete = newStatus === 'Đã hoàn thành';
      const updated: TaskNQ57 = {
        ...target,
        trangThai: newStatus,
        tiendo: isComplete ? 100 : target.tiendo,
        approvalStatus: isComplete && target.approvalStatus !== 'Da_Duyet' ? 'Cho_Duyet' : target.approvalStatus,
        ngayCapNhat: new Date().toISOString(),
      };
      saveTaskToSupabase(updated).catch((err) => console.warn('Supabase status update error:', err));
      recordAuditLog({
        actor: currentUser.hoTen,
        actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
        action: 'UPDATE',
        taskId: target.id,
        taskTitle: target.tenNhiemVu,
        details: `Chuyển trạng thái sang "${newStatus}"`,
      });
      const next = prev.map((t) => (t.id === taskId ? updated : t));
      saveTasksToStorage(next);
      return next;
    });
  }, [currentUser, tasks, recordAuditLog]);

  const handleUpdateTaskProgress = useCallback((taskId: string, newProgress: number) => {
    if (currentUser.vaiTro === 'Don_Vi') {
      const target = tasks.find((item) => item.id === taskId);
      if (target && !isTaskRelatedToUnit(target, currentUser.donVi)) {
        alert('Đơn vị chỉ có quyền cập nhật tiến độ nhiệm vụ thuộc đơn vị mình!');
        return;
      }
    }

    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;
      const isComplete = newProgress === 100;
      const updated: TaskNQ57 = {
        ...target,
        tiendo: newProgress,
        approvalStatus: isComplete && target.approvalStatus !== 'Da_Duyet' ? 'Cho_Duyet' : target.approvalStatus,
        ngayCapNhat: new Date().toISOString(),
      };
      updated.trangThai = computeTaskStatus(updated);
      saveTaskToSupabase(updated).catch((err) => console.warn('Supabase progress update error:', err));
      recordAuditLog({
        actor: currentUser.hoTen,
        actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
        action: 'UPDATE',
        taskId: target.id,
        taskTitle: target.tenNhiemVu,
        details: `Cập nhật tiến độ thành ${newProgress}%`,
      });
      const next = prev.map((t) => (t.id === taskId ? updated : t));
      saveTasksToStorage(next);
      return next;
    });
  }, [currentUser, tasks, recordAuditLog]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!perms.canDeleteTask) {
      alert('Chỉ Quản trị viên (Admin) hoặc Tổ chuyên trách mới có quyền xóa nhiệm vụ!');
      return;
    }
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      saveTasksToStorage(next);
      return next;
    });
    deleteTaskFromSupabase(taskId).catch((err) => console.warn('Supabase background delete task:', err));
    recordAuditLog({
      actor: currentUser.hoTen,
      actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
      action: 'DELETE',
      taskId,
      taskTitle: taskToDelete?.tenNhiemVu,
      details: `Đã xóa nhiệm vụ ${taskId} khỏi hệ thống`,
    });
  }, [perms.canDeleteTask, tasks, currentUser, recordAuditLog]);

  const handleApproveTask = useCallback((taskId: string, status: string = 'Da_Duyet') => {
    if (!perms.canApproveTask) {
      alert('Chỉ Ban Giám hiệu (Lãnh đạo trường) hoặc Quản trị viên mới có quyền duyệt nghiệm thu nhiệm vụ!');
      return;
    }
    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;
      const isApproved = status === 'Da_Duyet';
      const updated: TaskNQ57 = {
        ...target,
        approvalStatus: status as TaskNQ57['approvalStatus'],
        tiendo: isApproved ? 100 : target.tiendo,
        trangThai: isApproved ? 'Đã hoàn thành' : target.trangThai,
        ngayCapNhat: new Date().toISOString(),
      };
      saveTaskToSupabase(updated).catch((err) => console.warn('Supabase approve task error:', err));
      recordAuditLog({
        actor: currentUser.hoTen,
        actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
        action: isApproved ? 'APPROVE' : 'REJECT',
        taskId: target.id,
        taskTitle: target.tenNhiemVu,
        details: isApproved ? 'Phê duyệt nghiệm thu hoàn tất nhiệm vụ' : 'Yêu cầu đơn vị bổ sung chỉnh sửa minh chứng',
      });
      const next = prev.map((t) => (t.id === taskId ? updated : t));
      saveTasksToStorage(next);
      return next;
    });
  }, [perms.canApproveTask, currentUser, recordAuditLog]);

  const handleAddDirectiveToTask = useCallback((taskId: string, directiveText: string) => {
    if (!perms.canDirectLead) {
      alert('Chỉ Ban Giám hiệu (Lãnh đạo trường) mới có quyền ban hành ý kiến chỉ đạo!');
      return;
    }
    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;
      const newDirectives = [
        ...(target.directivesHistory || []),
        {
          id: `dir_${Date.now()}`,
          author: currentUser.hoTen,
          role: currentUser.vaiTro === 'Lanh_Dao' ? 'Ban Giám hiệu' : 'Quản trị viên',
          content: directiveText,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
      ];
      const updated: TaskNQ57 = {
        ...target,
        yKienChiDao: directiveText,
        directivesHistory: newDirectives,
        ngayCapNhat: new Date().toISOString(),
      };
      saveTaskToSupabase(updated).catch((err) => console.warn('Supabase directive error:', err));
      recordAuditLog({
        actor: currentUser.hoTen,
        actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
        action: 'UPDATE',
        taskId: target.id,
        taskTitle: target.tenNhiemVu,
        details: `Ban hành chỉ đạo mới: "${directiveText}"`,
      });
      const next = prev.map((t) => (t.id === taskId ? updated : t));
      saveTasksToStorage(next);
      return next;
    });
  }, [perms.canDirectLead, currentUser, recordAuditLog]);

  const handleAddTask = useCallback((newTask: TaskNQ57) => {
    if (!perms.canCreateTask) {
      alert('Chỉ Quản trị viên hoặc Ban Giám hiệu mới có quyền thêm nhiệm vụ mới!');
      return;
    }
    setTasks((prev) => {
      const next = [newTask, ...prev];
      saveTasksToStorage(next);
      return next;
    });
    saveTaskToSupabase(newTask).catch((err) => console.warn('Supabase add task error:', err));
    recordAuditLog({
      actor: currentUser.hoTen,
      actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
      action: 'CREATE',
      taskId: newTask.id,
      taskTitle: newTask.tenNhiemVu,
      details: `Khởi tạo nhiệm vụ mới [${newTask.id}] giao cho ${newTask.donViChuTri}`,
    });
  }, [perms.canCreateTask, currentUser, recordAuditLog]);

  const handleResetData = useCallback(() => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu mẫu ban đầu?')) {
      const fresh = INITIAL_TASKS.map((t) => ({ ...t, trangThai: computeTaskStatus(t) }));
      setTasks(fresh);
      saveTasksToStorage(fresh);
      saveAllTasksToSupabase(fresh).catch((err) => console.warn('Supabase reset tasks error:', err));
    }
  }, []);

  const handleSaveReminderSettings = useCallback((settings: typeof reminderSettings) => {
    setReminderSettings(settings);
    saveReminderSettings(settings);
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
        categories,
        setCategories,
        ethicalAiSettings,
        setEthicalAiSettings,
        reminderSettings,
        menuSettings,
        setMenuSettings,
        handleSaveMenuSettings,
        auditLogs,
        setAuditLogs,
        recordAuditLog,
        handleSaveTask,
        handleUpdateTaskStatus,
        handleUpdateTaskProgress,
        handleDeleteTask,
        handleApproveTask,
        handleAddDirectiveToTask,
        handleAddTask,
        handleResetData,
        handleSaveReminderSettings,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
