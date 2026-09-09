import React, { useState, useEffect, useMemo } from 'react';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadCurrentUser, 
  saveCurrentUser,
  loadReminderSettings,
  saveReminderSettings,
  exportTasksToCSV,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  normalizePriority,
  loadAccountsFromStorage,
  saveAccountsToStorage,
} from './utils/storage';
import { TaskNQ57, UserAccount, TaskStatus, CustomCategory, BaseWeworkPerspective, AuditLogEntry } from './types';
import { computeTaskStatus, getDaysDifference } from './utils/dateUtils';
import { INITIAL_TASKS, PLAN_GROUPS, DEPARTMENTS, INITIAL_ACCOUNTS } from './data/initialData';
import { 
  loadEthicalAiSettings, 
  saveEthicalAiSettings, 
  getEthicalAiRecommendations, 
  EthicalAiSettings 
} from './utils/ethicalAi';
import { getRolePermissions, isTaskRelatedToUnit } from './utils/permissions';
import { 
  fetchTasksFromSupabase, 
  fetchAccountsFromSupabase, 
  fetchAuditLogsFromSupabase, 
  fetchCategoriesFromSupabase, 
  deleteTaskFromSupabase, 
  subscribeToTasks, 
  subscribeToAuditLogs 
} from './utils/supabaseService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProjectSubBar } from './components/ProjectSubBar';
import { DashboardKPI } from './components/DashboardKPI';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { GanttView } from './components/GanttView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';

import { TaskModal } from './components/TaskModal';
import { DailyReminderModal } from './components/DailyReminderModal';
import { DriveFileManagerModal } from './components/DriveFileManagerModal';
import { NewTaskModal } from './components/NewTaskModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { EthicalAiSettingsModal } from './components/EthicalAiSettingsModal';
import { EthicalAiFocusBar } from './components/EthicalAiFocusBar';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { UserManagementModal } from './components/UserManagementModal';
import { LoginPage } from './components/LoginPage';
import { QuickStatusBar } from './components/QuickStatusBar';
import { AuditLogPanel } from './components/AuditLogPanel';
import { DirectivePanel } from './components/DirectivePanel';
import { addAuditLog, loadAuditLogsFromStorage } from './utils/storage';
import { 
  loadSyncConfig, 
  loadAccessToken, 
  exportToGoogleSheets, 
  importFromGoogleSheets, 
  fetchTasksFromGas,
  fetchPublicSpreadsheetData,
  pushTasksToGas,
  pushAuditLogToGas
} from './utils/googleSheets';

import { 
  AlertTriangle, 
  Sparkles, 
  X, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Building, 
  RotateCcw
} from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('hvu_is_logged_in') === 'true';
  });

  const [tasks, setTasks] = useState<TaskNQ57[]>(() => {
    const loaded = loadTasksFromStorage();
    return loaded.map((t) => ({
      ...t,
      trangThai: computeTaskStatus(t),
    }));
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => loadCurrentUser());
  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadAccountsFromStorage());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadAuditLogsFromStorage());

  const recordAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const created = addAuditLog(entry);
    setAuditLogs((prev) => [created, ...prev]);
    const config = loadSyncConfig();
    if (config.gasWebAppUrl) {
      pushAuditLogToGas(config.gasWebAppUrl, created).catch((err) =>
        console.warn('Failed to push audit log to GAS:', err)
      );
    }
    return created;
  };

  const handleUpdateAccounts = (newAccounts: UserAccount[]) => {
    setAccounts(newAccounts);
    saveAccountsToStorage(newAccounts);
    const updatedSelf = newAccounts.find((a) => a.email.toLowerCase() === currentUser.email.toLowerCase());
    if (updatedSelf) {
      setCurrentUser(updatedSelf);
      saveCurrentUser(updatedSelf);
    }
  };

  const handleLogin = (account: UserAccount) => {
    setCurrentUser(account);
    saveCurrentUser(account);
    setIsLoggedIn(true);
    sessionStorage.setItem('hvu_is_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.setItem('hvu_is_logged_in', 'false');
  };
  const [reminderSettings, setReminderSettings] = useState(() => loadReminderSettings());
  const [categories, setCategories] = useState<CustomCategory[]>(() => loadCategoriesFromStorage());
  const [ethicalAiSettings, setEthicalAiSettings] = useState<EthicalAiSettings>(() => loadEthicalAiSettings());

  // Base Wework Multi-View Navigation: Table (List), Kanban, Gantt, Calendar, Stats
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'kanban' | 'table' | 'gantt' | 'calendar' | 'stats'>('table');

  // Base Wework Perspective (My Tasks)
  const [selectedPerspective, setSelectedPerspective] = useState<BaseWeworkPerspective>('all');

  // Modals
  const [selectedTask, setSelectedTask] = useState<TaskNQ57 | null>(null);
  const [isDailyReminderOpen, setIsDailyReminderOpen] = useState(false);
  const [isDriveManagerOpen, setIsDriveManagerOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isEthicalAiSettingsOpen, setIsEthicalAiSettingsOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isDirectivesOpen, setIsDirectivesOpen] = useState(false);
  const [newTaskInitialDate, setNewTaskInitialDate] = useState<string | undefined>(undefined);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanGroup, setSelectedPlanGroup] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'progress' | 'id'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const assignees = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.nguoiPhuTrach).filter(Boolean)));
  }, [tasks]);

  // Persistence effects
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveCategoriesToStorage(categories);
  }, [categories]);

  useEffect(() => {
    saveEthicalAiSettings(ethicalAiSettings);
  }, [ethicalAiSettings]);

  // Automatic background backup if OAuth is enabled or auto-push to GAS if configured
  useEffect(() => {
    saveTasksToStorage(tasks);
    const config = loadSyncConfig();
    const token = loadAccessToken();
    if (config.autoBackup && token && config.spreadsheetId) {
      exportToGoogleSheets(tasks, accounts && accounts.length > 0 ? accounts : INITIAL_ACCOUNTS, categories).catch((err) => {
        console.error('Auto backup failed', err);
      });
    }

    // Auto-push changes to Google Apps Script if URL is configured
    if (config.gasWebAppUrl) {
      const timer = setTimeout(() => {
        pushTasksToGas(config.gasWebAppUrl, tasks).catch((e) => console.warn('Background auto-push to GAS failed:', e));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [tasks, categories, accounts]);

  // Load tasks, accounts, categories, and audit logs from Supabase on startup & Realtime Live Sync
  useEffect(() => {
    let isMounted = true;

    const initSupabase = async () => {
      try {
        const [sbTasks, sbAccounts, sbLogs, sbCategories] = await Promise.all([
          fetchTasksFromSupabase(),
          fetchAccountsFromSupabase(),
          fetchAuditLogsFromSupabase(),
          fetchCategoriesFromSupabase(),
        ]);

        if (isMounted) {
          if (sbTasks && sbTasks.length > 0) {
            setTasks(sbTasks);
          }
          if (sbAccounts && sbAccounts.length > 0) {
            handleUpdateAccounts(sbAccounts);
          }
          if (sbLogs && sbLogs.length > 0) {
            setAuditLogs(sbLogs);
          }
          if (sbCategories && sbCategories.length > 0) {
            setCategories(sbCategories);
          }
        }
      } catch (err) {
        console.warn('Supabase initial fetch failed, relying on local storage cache:', err);
      }
    };

    initSupabase();

    // Supabase Realtime live sync across devices/tabs
    const tasksSubscription = subscribeToTasks(async () => {
      try {
        const freshTasks = await fetchTasksFromSupabase();
        if (freshTasks && freshTasks.length > 0 && isMounted) {
          setTasks(freshTasks);
        }
      } catch (e) {
        console.warn('Realtime task fetch error:', e);
      }
    });

    const auditSubscription = subscribeToAuditLogs(async () => {
      try {
        const freshLogs = await fetchAuditLogsFromSupabase();
        if (freshLogs && freshLogs.length > 0 && isMounted) {
          setAuditLogs(freshLogs);
        }
      } catch (e) {
        console.warn('Realtime audit fetch error:', e);
      }
    });

    // Refresh when tab gains focus
    const handleFocus = async () => {
      try {
        const freshTasks = await fetchTasksFromSupabase();
        if (freshTasks && freshTasks.length > 0 && isMounted) {
          setTasks(freshTasks);
        }
      } catch (e) {
        // silent
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      tasksSubscription?.unsubscribe();
      auditSubscription?.unsubscribe();
    };
  }, []);

  // Role permissions calculation
  const perms = useMemo(() => getRolePermissions(currentUser.vaiTro), [currentUser.vaiTro]);

  // Tasks accessible to the current user (Don_Vi only sees tasks of their own unit; Admin, Lanh_Dao, To_Chuyen_Trach see all)
  const accessibleTasks = useMemo(() => {
    if (perms.canViewAllUnits) {
      return tasks;
    }
    return tasks.filter((t) => isTaskRelatedToUnit(t, currentUser.donVi));
  }, [tasks, perms.canViewAllUnits, currentUser.donVi]);

  // Urgent and Overdue Tasks
  const urgentTasks = useMemo(() => {
    return accessibleTasks.filter((t) => {
      if (t.trangThai === 'Đã hoàn thành') return false;
      const diff = getDaysDifference(t.thoiHan);
      return diff <= 3;
    });
  }, [accessibleTasks]);

  const overdueTasksCount = useMemo(() => {
    return accessibleTasks.filter((t) => t.trangThai === 'Quá hạn').length;
  }, [accessibleTasks]);

  const todayTasksCount = useMemo(() => {
    return accessibleTasks.filter((t) => t.trangThai === 'Hạn hôm nay').length;
  }, [accessibleTasks]);

  const dueSoonTasksCount = useMemo(() => {
    return accessibleTasks.filter((t) => t.trangThai === 'Sắp đến hạn').length;
  }, [accessibleTasks]);

  const completedTasksCount = useMemo(() => {
    return accessibleTasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
  }, [accessibleTasks]);

  const myUnitTasksCount = useMemo(() => {
    return accessibleTasks.filter((t) => isTaskRelatedToUnit(t, currentUser.donVi)).length;
  }, [accessibleTasks, currentUser.donVi]);

  const myDelegatedCount = useMemo(() => {
    return accessibleTasks.filter((t) => t.nguoiGiaoViec === currentUser.hoTen || (currentUser.vaiTro !== 'Don_Vi' && !!t.yKienChiDao)).length || (currentUser.vaiTro !== 'Don_Vi' ? accessibleTasks.length : 0);
  }, [accessibleTasks, currentUser]);

  const pendingApprovalCount = useMemo(() => {
    return accessibleTasks.filter((t) => t.approvalStatus === 'Cho_Duyet' || (t.filesMinhChung && t.filesMinhChung.length > 0 && t.approvalStatus !== 'Da_Duyet' && t.trangThai !== 'Đã hoàn thành')).length;
  }, [accessibleTasks]);

  // Ethical AI Recommendations
  const aiRecommendations = useMemo(() => {
    return getEthicalAiRecommendations(accessibleTasks, currentUser, ethicalAiSettings);
  }, [accessibleTasks, currentUser, ethicalAiSettings]);

  const aiRecommendedTaskIds = useMemo(() => {
    return new Set(aiRecommendations.map((r) => r.task.id));
  }, [aiRecommendations]);

  // Task count per custom category
  const taskCountsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of accessibleTasks) {
      if (t.category) {
        map[t.category] = (map[t.category] || 0) + 1;
      }
    }
    return map;
  }, [accessibleTasks]);

  // Filter tasks based on Base Wework Perspectives, Search, Plan, Dept, Status, Priority, Category
  const filteredTasks = useMemo(() => {
    return accessibleTasks.filter((t) => {
      // 1. Search Omnibox
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        t.id.toLowerCase().includes(searchLower) ||
        t.tenNhiemVu.toLowerCase().includes(searchLower) ||
        t.nguoiPhuTrach.toLowerCase().includes(searchLower) ||
        t.donViChuTri.toLowerCase().includes(searchLower) ||
        t.donViPhoiHop.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Base Wework Perspective (My Tasks)
      if (selectedPerspective === 'my_assigned') {
        const isMyUnit = isTaskRelatedToUnit(t, currentUser.donVi);
        if (!isMyUnit) return false;
      } else if (selectedPerspective === 'my_delegated') {
        const isDelegated = t.nguoiGiaoViec === currentUser.hoTen || (currentUser.vaiTro !== 'Don_Vi' && !!t.yKienChiDao);
        if (!isDelegated && currentUser.vaiTro === 'Don_Vi') return false;
      } else if (selectedPerspective === 'pending_approval') {
        const isPending = t.approvalStatus === 'Cho_Duyet' || (t.filesMinhChung && t.filesMinhChung.length > 0 && t.approvalStatus !== 'Da_Duyet' && t.trangThai !== 'Đã hoàn thành');
        if (!isPending) return false;
      } else if (selectedPerspective === 'overdue_urgent') {
        const isOverdue = t.trangThai === 'Quá hạn' || (t.trangThai !== 'Đã hoàn thành' && getDaysDifference(t.thoiHan) <= 3);
        if (!isOverdue) return false;
      } else if (selectedPerspective === 'ai_suggested') {
        if (!aiRecommendedTaskIds.has(t.id)) return false;
      }

      // 3. Plan Group
      if (selectedPlanGroup !== 'all' && t.nhomKeHoach !== selectedPlanGroup) {
        return false;
      }

      // 4. Department (Supports multi-unit match)
      if (selectedDept !== 'all' && !isTaskRelatedToUnit(t, selectedDept)) {
        return false;
      }

      // 5. Status
      if (selectedStatus && t.trangThai !== selectedStatus) {
        return false;
      }

      // 6. Priority Filter
      if (selectedPriority !== 'all') {
        const pNorm = normalizePriority(t.mucDoUuTien);
        if (pNorm !== selectedPriority) return false;
      }

      // 7. Category Filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'uncategorized') {
          if (t.category) return false;
        } else {
          if (t.category !== selectedCategory) return false;
        }
      }

      // 8. Time Range Filter
      if (selectedTimeRange !== 'all') {
        const diff = getDaysDifference(t.thoiHan);
        if (selectedTimeRange === 'this_week' && (diff < 0 || diff > 7)) return false;
        if (selectedTimeRange === 'this_month' && (diff < 0 || diff > 30)) return false;
        if (selectedTimeRange === 'q1_q2') {
          const parts = t.thoiHan.split('-');
          const month = parseInt(parts[1], 10);
          if (month > 6) return false;
        }
        if (selectedTimeRange === 'overdue' && diff >= 0) return false;
      }

      // 9. Assignee Filter
      if (selectedAssignee !== 'all' && t.nguoiPhuTrach !== selectedAssignee) {
        return false;
      }

      return true;
    });
  }, [
    accessibleTasks, 
    searchTerm, 
    selectedPerspective,
    selectedPlanGroup, 
    selectedDept, 
    selectedStatus, 
    selectedPriority, 
    selectedCategory, 
    selectedTimeRange,
    selectedAssignee,
    currentUser, 
    aiRecommendedTaskIds
  ]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        const weightA = priorityWeight[normalizePriority(a.mucDoUuTien)] || 1;
        const weightB = priorityWeight[normalizePriority(b.mucDoUuTien)] || 1;
        const diff = sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
        if (diff !== 0) return diff;
        return a.thoiHan.localeCompare(b.thoiHan);
      }
      if (sortBy === 'deadline') {
        const diff = a.thoiHan.localeCompare(b.thoiHan);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortBy === 'progress') {
        const diff = a.tiendo - b.tiendo;
        return sortOrder === 'desc' ? -diff : diff;
      }
      if (sortBy === 'id') {
        const diff = a.id.localeCompare(b.id);
        return sortOrder === 'asc' ? diff : -diff;
      }
      return 0;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  // Handlers
  const handleSaveTask = (updatedTask: TaskNQ57) => {
    const computed = {
      ...updatedTask,
      trangThai: computeTaskStatus(updatedTask),
    };
    setTasks((prev) => prev.map((t) => (t.id === computed.id ? computed : t)));
    setSelectedTask(null);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (currentUser.vaiTro === 'Lanh_Dao') {
      alert('Lãnh đạo trường thực hiện chức năng chỉ đạo và phê duyệt nghiệm thu, không trực tiếp thay đổi trạng thái tác nghiệp.');
      return;
    }
    if (currentUser.vaiTro === 'Don_Vi') {
      const target = tasks.find((item) => item.id === taskId);
      if (target && !isTaskRelatedToUnit(target, currentUser.donVi)) {
        alert('Đơn vị chỉ có quyền cập nhật trạng thái nhiệm vụ thuộc đơn vị mình!');
        return;
      }
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = newStatus === 'Đã hoàn thành';
          const updated: TaskNQ57 = {
            ...t,
            trangThai: newStatus,
            tiendo: isComplete ? 100 : t.tiendo,
            approvalStatus: isComplete && t.approvalStatus !== 'Da_Duyet' ? 'Cho_Duyet' : t.approvalStatus,
            ngayCapNhat: new Date().toISOString(),
          };
          recordAuditLog({
            actor: currentUser.hoTen,
            actorRole: currentUser.vaiTro === 'Lanh_Dao' ? 'Lãnh đạo trường' : currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : currentUser.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : currentUser.donVi,
            action: 'UPDATE',
            taskId: t.id,
            taskTitle: t.tenNhiemVu,
            details: `Chuyển trạng thái sang "${newStatus}"`,
          });
          return updated;
        }
        return t;
      })
    );
  };

  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    if (currentUser.vaiTro === 'Lanh_Dao') {
      alert('Lãnh đạo trường thực hiện chức năng chỉ đạo và phê duyệt nghiệm thu, không trực tiếp thay đổi tiến độ tác nghiệp.');
      return;
    }
    if (currentUser.vaiTro === 'Don_Vi') {
      const target = tasks.find((item) => item.id === taskId);
      if (target && !isTaskRelatedToUnit(target, currentUser.donVi)) {
        alert('Đơn vị chỉ có quyền cập nhật tiến độ nhiệm vụ thuộc đơn vị mình!');
        return;
      }
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComplete = newProgress === 100;
          const updated: TaskNQ57 = {
            ...t,
            tiendo: newProgress,
            approvalStatus: isComplete && t.approvalStatus !== 'Da_Duyet' ? 'Cho_Duyet' : t.approvalStatus,
            ngayCapNhat: new Date().toISOString(),
          };
          updated.trangThai = computeTaskStatus(updated);
          recordAuditLog({
            actor: currentUser.hoTen,
            actorRole: currentUser.vaiTro === 'Lanh_Dao' ? 'Lãnh đạo trường' : currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : currentUser.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : currentUser.donVi,
            action: 'UPDATE',
            taskId: t.id,
            taskTitle: t.tenNhiemVu,
            details: `Cập nhật tiến độ thành ${newProgress}%`,
          });
          return updated;
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    if (!perms.canDeleteTask) {
      alert('Chỉ Quản trị viên (Admin) hoặc Tổ chuyên trách mới có quyền xóa nhiệm vụ!');
      return;
    }
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    deleteTaskFromSupabase(taskId).catch((err) => {
      console.warn('Supabase background delete task:', err);
    });
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    recordAuditLog({
      actor: currentUser.hoTen,
      actorRole: currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : currentUser.vaiTro === 'To_Chuyen_Trach' ? 'Tổ CĐS' : 'Lãnh đạo trường',
      action: 'DELETE',
      taskId: taskId,
      taskTitle: taskToDelete?.tenNhiemVu,
      details: `Đã xóa nhiệm vụ ${taskId} khỏi hệ thống`,
    });
  };

  const handleApproveTask = (taskId: string, status: any = 'Da_Duyet') => {
    if (!perms.canApproveTask) {
      alert('Chỉ Ban Giám hiệu (Lãnh đạo trường) hoặc Quản trị viên mới có quyền duyệt nghiệm thu nhiệm vụ!');
      return;
    }
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isApproved = status === 'Da_Duyet';
          const updated: TaskNQ57 = {
            ...t,
            approvalStatus: status,
            tiendo: isApproved ? 100 : t.tiendo,
            trangThai: isApproved ? 'Đã hoàn thành' : t.trangThai,
            ngayCapNhat: new Date().toISOString(),
          };
          recordAuditLog({
            actor: currentUser.hoTen,
            actorRole: currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : 'Lãnh đạo trường',
            action: isApproved ? 'APPROVE' : 'REJECT',
            taskId: t.id,
            taskTitle: t.tenNhiemVu,
            details: isApproved ? 'Phê duyệt nghiệm thu hoàn tất nhiệm vụ' : 'Yêu cầu đơn vị bổ sung chỉnh sửa minh chứng',
          });
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddDirectiveToTask = (taskId: string, directiveText: string) => {
    if (!perms.canDirectLead) {
      alert('Chỉ Ban Giám hiệu (Lãnh đạo trường) mới có quyền ban hành ý kiến chỉ đạo!');
      return;
    }
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newDirectives = [
            ...(t.directivesHistory || []),
            {
              id: `dir_${Date.now()}`,
              author: currentUser.hoTen,
              role: currentUser.vaiTro === 'Lanh_Dao' ? 'Ban Giám hiệu' : 'Quản trị viên',
              content: directiveText,
              createdAt: new Date().toLocaleDateString('vi-VN'),
            },
          ];
          const updated: TaskNQ57 = {
            ...t,
            yKienChiDao: directiveText,
            directivesHistory: newDirectives,
            ngayCapNhat: new Date().toISOString(),
          };
          recordAuditLog({
            actor: currentUser.hoTen,
            actorRole: currentUser.vaiTro === 'Lanh_Dao' ? 'Ban Giám hiệu' : 'Quản trị viên',
            action: 'UPDATE',
            taskId: t.id,
            taskTitle: t.tenNhiemVu,
            details: `Ban hành chỉ đạo mới: "${directiveText}"`,
          });
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddTask = (newTask: TaskNQ57) => {
    if (!perms.canCreateTask) {
      alert('Chỉ Quản trị viên hoặc Tổ chuyên trách mới có quyền thêm nhiệm vụ mới!');
      return;
    }
    setTasks((prev) => [newTask, ...prev]);
    recordAuditLog({
      actor: currentUser.hoTen,
      actorRole: currentUser.vaiTro === 'Admin' ? 'Quản trị viên' : 'Tổ CĐS',
      action: 'CREATE',
      taskId: newTask.id,
      taskTitle: newTask.tenNhiemVu,
      details: `Khởi tạo nhiệm vụ mới [${newTask.id}] giao cho ${newTask.donViChuTri}`,
    });
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu mẫu ban đầu?')) {
      const fresh = INITIAL_TASKS.map((t) => ({
        ...t,
        trangThai: computeTaskStatus(t),
      }));
      setTasks(fresh);
      saveTasksToStorage(fresh);
    }
  };

  const handleSaveReminderSettings = (settings: typeof reminderSettings) => {
    setReminderSettings(settings);
    saveReminderSettings(settings);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} accounts={accounts} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden selection:bg-red-100 selection:text-red-900">
      
      {/* 1. Official HVU Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        accounts={accounts}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          saveCurrentUser(user);
          if (user.vaiTro === 'Don_Vi') {
            setSelectedPerspective('my_assigned');
          } else {
            setSelectedPerspective('all');
          }
        }}
        onLogout={handleLogout}
        urgentCount={urgentTasks.length}
        onOpenDailyReminder={() => setIsDailyReminderOpen(true)}
        onOpenDriveManager={() => setIsDriveManagerOpen(true)}
        onOpenNewTaskModal={() => {
          setNewTaskInitialDate(undefined);
          setIsNewTaskOpen(true);
        }}
        onOpenEthicalAiSettings={() => setIsEthicalAiSettingsOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        totalFilteredCount={sortedTasks.length}
      />

      {/* 2. Single Web Page Body: Left Sidebar + Right Base Wework Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left Sidebar (HVU Navigation, Perspectives, Views, Projects, Categories) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenNewTaskModal={() => {
            setNewTaskInitialDate(undefined);
            setIsNewTaskOpen(true);
          }}
          onOpenDailyReminder={() => setIsDailyReminderOpen(true)}
          onOpenDriveManager={() => setIsDriveManagerOpen(true)}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
          onOpenEthicalAiSettings={() => setIsEthicalAiSettingsOpen(true)}
          onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
          onOpenDirectives={() => setIsDirectivesOpen(true)}
          onExportData={() => exportTasksToCSV(tasks)}
          onResetData={handleResetData}
          totalTasksCount={accessibleTasks.length}
          urgentCount={urgentTasks.length}
          overdueCount={overdueTasksCount}
          todayCount={todayTasksCount}
          dueSoonCount={dueSoonTasksCount}
          completedCount={completedTasksCount}
          myUnitCount={myUnitTasksCount}
          myDelegatedCount={myDelegatedCount}
          pendingApprovalCount={pendingApprovalCount}
          aiRecommendedCount={aiRecommendations.length}
          selectedPerspective={selectedPerspective}
          onSelectPerspective={setSelectedPerspective}
          selectedPlanGroup={selectedPlanGroup}
          onSelectPlanGroup={setSelectedPlanGroup}
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          currentUser={currentUser}
          categories={categories}
          taskCountsByCategory={taskCountsByCategory}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#fafafb] overflow-y-auto">
          
          {/* Top KPI Cards right below Header */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-1.5 shadow-2xs">
            <div className="max-w-[1600px] mx-auto">
              <QuickStatusBar
                tasks={accessibleTasks}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
              />
            </div>
          </div>

          {/* Main Content Workspace Container */}
          <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
            
            {/* Filter Bar (ProjectSubBar) right above Data Table */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
              <ProjectSubBar
                activeView={activeView}
                onSelectView={setActiveView}
                selectedDept={selectedDept}
                onSelectDept={setSelectedDept}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                selectedTimeRange={selectedTimeRange}
                onSelectTimeRange={setSelectedTimeRange}
                selectedAssignee={selectedAssignee}
                onSelectAssignee={setSelectedAssignee}
                assignees={assignees}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onToggleSortOrder={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                totalFilteredCount={sortedTasks.length}
              />
            </div>

            {/* Active Perspective Indicator & Reset Filter Chips */}
            {(selectedPerspective !== 'all' || selectedPlanGroup !== 'all' || selectedDept !== 'all' || selectedStatus || selectedPriority !== 'all' || selectedCategory !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap text-xs bg-white p-2.5 px-3.5 rounded-xl border border-zinc-200/90 shadow-2xs">
                <span className="text-zinc-500 font-medium">Bộ lọc đang chọn:</span>
                
                {selectedPerspective !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                    <span>
                      {selectedPerspective === 'my_assigned' && `Đơn vị: ${currentUser.donVi}`}
                      {selectedPerspective === 'my_delegated' && 'Tôi giao việc'}
                      {selectedPerspective === 'pending_approval' && 'Chờ duyệt nghiệm thu'}
                      {selectedPerspective === 'overdue_urgent' && 'Quá hạn & Khẩn cấp'}
                      {selectedPerspective === 'ai_suggested' && 'Gợi ý AI ưu tiên'}
                    </span>
                    <button onClick={() => setSelectedPerspective('all')} className="hover:text-zinc-300 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedPlanGroup !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>{selectedPlanGroup}</span>
                    <button onClick={() => setSelectedPlanGroup('all')} className="hover:text-rose-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDept !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>Đơn vị: {selectedDept}</span>
                    <button onClick={() => setSelectedDept('all')} className="hover:text-rose-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedStatus && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>Trạng thái: {selectedStatus}</span>
                    <button onClick={() => setSelectedStatus('')} className="hover:text-rose-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedPriority !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>Ưu tiên: {selectedPriority}</span>
                    <button onClick={() => setSelectedPriority('all')} className="hover:text-rose-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSelectedPerspective('all');
                    setSelectedPlanGroup('all');
                    setSelectedDept('all');
                    setSelectedStatus('');
                    setSelectedPriority('all');
                    setSelectedCategory('all');
                  }}
                  className="text-zinc-500 hover:text-zinc-900 underline ml-auto text-[11px] cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {/* View Component Display */}
            <div className="flex-1">
              {activeView === 'table' && (
                <TableView
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onUpdateTaskProgress={handleUpdateTaskProgress}
                  onApproveTask={(id) => handleApproveTask(id, 'Da_Duyet')}
                  currentUser={currentUser}
                  categories={categories}
                  recommendedTaskIds={Array.from(aiRecommendedTaskIds)}
                />
              )}

              {activeView === 'kanban' && (
                <KanbanBoard
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  currentUser={currentUser}
                  categories={categories}
                  recommendedTaskIds={Array.from(aiRecommendedTaskIds)}
                />
              )}

              {activeView === 'gantt' && (
                <GanttView
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                />
              )}

              {activeView === 'calendar' && (
                <CalendarView
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onAddNewTask={(date) => {
                    setNewTaskInitialDate(date);
                    setIsNewTaskOpen(true);
                  }}
                  categories={categories}
                />
              )}

              {activeView === 'stats' && (
                <div className="space-y-4">
                  <DashboardKPI
                    tasks={accessibleTasks}
                    selectedStatusFilter={selectedStatus}
                    onSelectStatusFilter={(status) => setSelectedStatus(status)}
                    onSelectPlanGroup={(group) => {
                      setSelectedPlanGroup(group);
                      setActiveView('table');
                    }}
                    onSelectDept={(dept) => {
                      setSelectedDept(dept);
                      setActiveView('table');
                    }}
                    onSelectTask={(task) => setSelectedTask(task)}
                  />
                  <StatsView
                    tasks={accessibleTasks}
                    onFilterStatus={(status) => {
                      setSelectedStatus(status);
                      setActiveView('table');
                    }}
                    onFilterDept={(dept) => {
                      setSelectedDept(dept);
                      setActiveView('table');
                    }}
                  />
                </div>
              )}
            </div>

            {/* HVU Official System Footer */}
            <footer className="mt-12 py-5 px-6 border-t border-slate-200 bg-white text-slate-600 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0B2545]">TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG (HUNG VUONG UNIVERSITY)</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium">Cổng Điều Hành Chuyển Đổi Số - Thực Thi Nghị Quyết 57-NQ/TW</span>
              </div>
              <span className="text-[11px] text-slate-400">© 2026 HVU. Tất cả các quyền được bảo lưu.</span>
            </footer>

          </div>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Base Wework Enhanced Task Modal (Checklist, Approval, Discussions, Drive Evidence) */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
          onApproveTask={handleApproveTask}
          categories={categories}
          accounts={accounts}
        />
      )}

      {/* 2. Base Wework New Task Modal */}
      {isNewTaskOpen && (
        <NewTaskModal
          isOpen={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          onAddTask={handleAddTask}
          currentUser={currentUser}
          initialDate={newTaskInitialDate}
          categories={categories}
        />
      )}

      {/* 3. Daily Reminder Modal */}
      {isDailyReminderOpen && (
        <DailyReminderModal
          isOpen={isDailyReminderOpen}
          onClose={() => setIsDailyReminderOpen(false)}
          tasks={tasks}
          settings={reminderSettings}
          onSaveSettings={handleSaveReminderSettings}
          onSelectTask={(task) => {
            setIsDailyReminderOpen(false);
            setSelectedTask(task);
          }}
          currentUser={currentUser}
        />
      )}

      {/* 4. Google Drive Evidence Manager */}
      {isDriveManagerOpen && (
        <DriveFileManagerModal
          isOpen={isDriveManagerOpen}
          onClose={() => setIsDriveManagerOpen(false)}
          tasks={tasks}
          onSelectTask={(task) => {
            setIsDriveManagerOpen(false);
            setSelectedTask(task);
          }}
        />
      )}

      {/* 5. Category Manager Modal */}
      {isCategoryManagerOpen && (
        <CategoryManagerModal
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          categories={categories}
          onSaveCategories={setCategories}
          tasks={tasks}
        />
      )}

      {/* 6. Ethical AI Settings Modal */}
      {isEthicalAiSettingsOpen && (
        <EthicalAiSettingsModal
          isOpen={isEthicalAiSettingsOpen}
          onClose={() => setIsEthicalAiSettingsOpen(false)}
          settings={ethicalAiSettings}
          onSaveSettings={setEthicalAiSettings}
        />
      )}

      {/* 7. Google Workspace Sync and Backup Manager */}
      {isGoogleSyncOpen && (
        <GoogleSyncModal
          isOpen={isGoogleSyncOpen}
          onClose={() => setIsGoogleSyncOpen(false)}
          currentUser={currentUser}
          tasks={tasks}
          onUpdateTasks={setTasks}
          categories={categories}
          onUpdateCategories={setCategories}
          accounts={accounts}
          onUpdateAccounts={handleUpdateAccounts}
        />
      )}

      {/* 7b. User & Account Management Modal (04_Tai_Khoan_Nguoi_Dung) */}
      {isUserManagementOpen && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          accounts={accounts}
          onUpdateAccounts={handleUpdateAccounts}
          currentUser={currentUser}
        />
      )}

      {/* 8. System Audit Log Panel */}
      <AuditLogPanel
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
        logs={auditLogs}
        onRefresh={async () => {
          const config = loadSyncConfig();
          if (config.gasWebAppUrl) {
            try {
              const res = await fetchTasksFromGas(config.gasWebAppUrl);
              if (res.auditLogs && res.auditLogs.length > 0) setAuditLogs(res.auditLogs);
            } catch (e) {
              console.warn('Failed to refresh audit logs from GAS:', e);
            }
          } else if (config.spreadsheetId) {
            try {
              const res = await fetchPublicSpreadsheetData(config.spreadsheetId);
              if (res.auditLogs && res.auditLogs.length > 0) setAuditLogs(res.auditLogs);
            } catch (e) {
              console.warn('Failed to refresh audit logs from Sheets:', e);
            }
          }
        }}
        onSelectTask={(id) => {
          const t = tasks.find((item) => item.id === id);
          if (t) setSelectedTask(t);
        }}
      />

      {/* 9. Leadership Directives & Communication Center */}
      <DirectivePanel
        isOpen={isDirectivesOpen}
        onClose={() => setIsDirectivesOpen(false)}
        tasks={tasks}
        currentUser={currentUser}
        onSelectTask={(t) => setSelectedTask(t)}
        onAddDirectiveToTask={handleAddDirectiveToTask}
      />

    </div>
  );
}
