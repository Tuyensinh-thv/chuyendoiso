import React, { useState, useMemo } from 'react';
import { 
  ListTodo, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  ArrowRight, 
  ExternalLink, 
  MessageSquareQuote, 
  Sparkles, 
  TrendingUp, 
  CheckCheck, 
  XCircle, 
  RotateCcw, 
  Building,
  Table as TableIcon,
  Layers,
  ChevronDown
} from 'lucide-react';
import { TaskNQ57, TaskChecklistItem, UserAccount } from '../types';
import { DEPARTMENTS } from '../data/initialData';

interface ChecklistReminderHubProps {
  tasks: TaskNQ57[];
  currentUser: UserAccount;
  onUpdateTask: (task: TaskNQ57) => void;
  onSelectTask: (task: TaskNQ57) => void;
  onOpenDirectives?: () => void;
}

interface FlattenedChecklist extends TaskChecklistItem {
  parentTask: TaskNQ57;
  dueDateStatus: {
    daysDiff: number;
    status: 'overdue' | 'today' | 'dueSoon' | 'future' | 'completed' | 'noDate';
    label: string;
    badgeClass: string;
  };
}

export const ChecklistReminderHub: React.FC<ChecklistReminderHubProps> = ({
  tasks,
  currentUser,
  onUpdateTask,
  onSelectTask,
  onOpenDirectives,
}) => {
  // State: Filter & Views
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTime, setFilterTime] = useState<'all' | 'overdue' | 'today' | 'dueSoon' | 'completed'>('all');
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'mine' | string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterEvaluation, setFilterEvaluation] = useState<'all' | 'Dat' | 'Chua_Dat' | 'Chua_Danh_Gia'>('all');

  const isLeaderOrAdmin = currentUser.vaiTro === 'Admin' || currentUser.vaiTro === 'Lanh_Dao';

  // Helper date calculation
  const calculateDateStatus = (dueDateStr?: string, completed?: boolean) => {
    if (completed) {
      return {
        daysDiff: 0,
        status: 'completed' as const,
        label: 'Đã hoàn thành',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (!dueDateStr) {
      return {
        daysDiff: 999,
        status: 'noDate' as const,
        label: 'Chưa đặt hạn',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dueDateStr.split('-');
    if (parts.length !== 3) {
      return {
        daysDiff: 999,
        status: 'noDate' as const,
        label: dueDateStr,
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200'
      };
    }

    const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        daysDiff: diffDays,
        status: 'overdue' as const,
        label: `Quá hạn ${Math.abs(diffDays)} ngày`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse'
      };
    }
    if (diffDays === 0) {
      return {
        daysDiff: 0,
        status: 'today' as const,
        label: 'Hạn chót hôm nay',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
      };
    }
    if (diffDays <= 3) {
      return {
        daysDiff: diffDays,
        status: 'dueSoon' as const,
        label: `Còn ${diffDays} ngày`,
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
      };
    }
    return {
      daysDiff: diffDays,
      status: 'future' as const,
      label: `Còn ${diffDays} ngày`,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  };

  // 1. Flatten all checklist items from tasks
  const allFlattenedItems = useMemo(() => {
    const list: FlattenedChecklist[] = [];
    tasks.forEach(task => {
      if (task.checklist && task.checklist.length > 0) {
        task.checklist.forEach(item => {
          list.push({
            ...item,
            parentTask: task,
            dueDateStatus: calculateDateStatus(item.dueDate, item.completed)
          });
        });
      }
    });
    return list;
  }, [tasks]);

  // Extract unique assignees for dropdown filter
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    allFlattenedItems.forEach(i => {
      if (i.assignee && i.assignee.trim()) {
        set.add(i.assignee.trim());
      }
    });
    return Array.from(set).sort();
  }, [allFlattenedItems]);

  // Metric counts across ALL items
  const metrics = useMemo(() => {
    let total = allFlattenedItems.length;
    let completed = 0;
    let overdue = 0;
    let today = 0;
    let dueSoon = 0;
    let inProgress = 0;

    allFlattenedItems.forEach(item => {
      if (item.completed) {
        completed++;
      } else {
        inProgress++;
        if (item.dueDateStatus.status === 'overdue') overdue++;
        else if (item.dueDateStatus.status === 'today') today++;
        else if (item.dueDateStatus.status === 'dueSoon') dueSoon++;
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, overdue, today, dueSoon, inProgress, completionRate };
  }, [allFlattenedItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allFlattenedItems.filter(item => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(term);
        const matchesParentId = item.parentTask.id.toLowerCase().includes(term);
        const matchesParentName = item.parentTask.tenNhiemVu.toLowerCase().includes(term);
        const matchesAssignee = (item.assignee || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesParentId && !matchesParentName && !matchesAssignee) {
          return false;
        }
      }

      // Time Range Filter
      if (filterTime === 'overdue') {
        if (item.completed || item.dueDateStatus.status !== 'overdue') return false;
      } else if (filterTime === 'today') {
        if (item.completed || item.dueDateStatus.status !== 'today') return false;
      } else if (filterTime === 'dueSoon') {
        if (item.completed || (item.dueDateStatus.status !== 'today' && item.dueDateStatus.status !== 'dueSoon')) return false;
      } else if (filterTime === 'completed') {
        if (!item.completed) return false;
      }

      // Assignee Filter
      if (filterAssignee === 'mine') {
        const isMine = 
          (item.assignee && item.assignee.toLowerCase().includes(currentUser.hoTen.toLowerCase())) ||
          (item.assigneeEmail && item.assigneeEmail === currentUser.email) ||
          (item.parentTask.nguoiPhuTrach && item.parentTask.nguoiPhuTrach.toLowerCase().includes(currentUser.hoTen.toLowerCase()));
        if (!isMine) return false;
      } else if (filterAssignee !== 'all') {
        if (item.assignee !== filterAssignee) return false;
      }

      // Department Filter
      if (filterDept !== 'all') {
        if (item.parentTask.donViChuTri !== filterDept) return false;
      }

      // Evaluation Status Filter
      if (filterEvaluation !== 'all') {
        const evalStatus = item.evaluationStatus || 'Chua_Danh_Gia';
        if (evalStatus !== filterEvaluation) return false;
      }

      return true;
    });
  }, [allFlattenedItems, searchTerm, filterTime, filterAssignee, filterDept, filterEvaluation, currentUser]);

  // Grouped by timeline categories
  const timelineGroups = useMemo(() => {
    const overdueGroup = filteredItems.filter(i => !i.completed && i.dueDateStatus.status === 'overdue');
    const todayGroup = filteredItems.filter(i => !i.completed && i.dueDateStatus.status === 'today');
    const dueSoonGroup = filteredItems.filter(i => !i.completed && i.dueDateStatus.status === 'dueSoon');
    const futureGroup = filteredItems.filter(i => !i.completed && (i.dueDateStatus.status === 'future' || i.dueDateStatus.status === 'noDate'));
    const completedGroup = filteredItems.filter(i => i.completed);

    return [
      {
        id: 'overdue',
        title: 'Quá hạn cần đôn đốc ngay',
        items: overdueGroup,
        color: 'rose',
        icon: AlertTriangle,
        badgeBg: 'bg-rose-500 text-white',
        cardBorder: 'border-rose-200 bg-rose-50/20'
      },
      {
        id: 'today',
        title: 'Hạn chót hôm nay',
        items: todayGroup,
        color: 'amber',
        icon: Clock,
        badgeBg: 'bg-amber-500 text-white',
        cardBorder: 'border-amber-200 bg-amber-50/20'
      },
      {
        id: 'dueSoon',
        title: 'Sắp đến hạn (Trong 3 ngày tới)',
        items: dueSoonGroup,
        color: 'orange',
        icon: Calendar,
        badgeBg: 'bg-orange-500 text-white',
        cardBorder: 'border-orange-200 bg-orange-50/20'
      },
      {
        id: 'future',
        title: 'Các đầu việc tiếp theo',
        items: futureGroup,
        color: 'blue',
        icon: ListTodo,
        badgeBg: 'bg-blue-600 text-white',
        cardBorder: 'border-slate-200 bg-slate-50/30'
      },
      {
        id: 'completed',
        title: 'Đã hoàn thành',
        items: completedGroup,
        color: 'emerald',
        icon: CheckCircle2,
        badgeBg: 'bg-emerald-600 text-white',
        cardBorder: 'border-emerald-200 bg-emerald-50/20'
      }
    ].filter(g => g.items.length > 0);
  }, [filteredItems]);

  // Actions
  const handleToggleChecklist = (item: FlattenedChecklist) => {
    const parent = item.parentTask;
    const nextCompleted = !item.completed;

    const updatedChecklist = (parent.checklist || []).map(c => {
      if (c.id === item.id) {
        return {
          ...c,
          completed: nextCompleted,
          evaluationStatus: nextCompleted ? (c.evaluationStatus || 'Chua_Danh_Gia') : c.evaluationStatus
        };
      }
      return c;
    });

    const total = updatedChecklist.length;
    const completed = updatedChecklist.filter(c => c.completed).length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : parent.tiendo;

    let newStatus = parent.trangThai;
    if (newProgress === 100 && parent.approvalStatus === 'Da_Duyet') {
      newStatus = 'Hoàn thành';
    } else if (newProgress > 0 && newStatus === 'Chưa thực hiện') {
      newStatus = 'Đang thực hiện';
    }

    const updatedTask: TaskNQ57 = {
      ...parent,
      checklist: updatedChecklist,
      tiendo: newProgress,
      trangThai: newStatus,
      ngayCapNhat: new Date().toISOString()
    };

    onUpdateTask(updatedTask);
  };

  const handleEvaluationChange = (item: FlattenedChecklist, status: 'Dat' | 'Chua_Dat' | 'Chua_Danh_Gia') => {
    const parent = item.parentTask;
    const updatedChecklist = (parent.checklist || []).map(c => {
      if (c.id === item.id) {
        return { ...c, evaluationStatus: status };
      }
      return c;
    });

    const updatedTask: TaskNQ57 = {
      ...parent,
      checklist: updatedChecklist,
      ngayCapNhat: new Date().toISOString()
    };

    onUpdateTask(updatedTask);
  };

  const formatVNDate = (dStr?: string) => {
    if (!dStr) return 'Chưa đặt';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0B2545] via-[#133E87] to-[#1E3A8A] text-white px-5 sm:px-8 py-5 shadow-md">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FFD700] shadow-inner">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Trung Tâm Nhắc Nhở & Đôn Đốc Hàng Ngày
                </h1>
                <p className="text-xs sm:text-sm text-slate-200">
                  Hệ thống giám sát và quản lý chi tiết toàn bộ đầu việc con (Checklist) của 59 nhiệm vụ NQ57
                </p>
              </div>
            </div>
          </div>

          {/* Quick Directive Shortcut for Leaders */}
          {isLeaderOrAdmin && onOpenDirectives && (
            <button
              onClick={onOpenDirectives}
              className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all shadow-xs cursor-pointer"
            >
              <MessageSquareQuote className="w-4 h-4 text-amber-400" />
              <span>Phát hành chỉ đạo BGH</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card: Overdue */}
          <div 
            onClick={() => setFilterTime(filterTime === 'overdue' ? 'all' : 'overdue')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTime === 'overdue' 
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30' 
                : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Quá hạn</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">{metrics.overdue}</div>
            <p className="text-[10px] text-slate-500 mt-1">Cần đôn đốc ngay</p>
          </div>

          {/* Card: Today */}
          <div 
            onClick={() => setFilterTime(filterTime === 'today' ? 'all' : 'today')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTime === 'today' 
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30' 
                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Hạn hôm nay</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{metrics.today}</div>
            <p className="text-[10px] text-slate-500 mt-1">Ưu tiên xử lý</p>
          </div>

          {/* Card: Due Soon (3 days) */}
          <div 
            onClick={() => setFilterTime(filterTime === 'dueSoon' ? 'all' : 'dueSoon')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTime === 'dueSoon' 
                ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/30' 
                : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Trong 3 ngày</span>
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-orange-700">{metrics.dueSoon}</div>
            <p className="text-[10px] text-slate-500 mt-1">Sắp đến hạn</p>
          </div>

          {/* Card: In Progress */}
          <div 
            onClick={() => setFilterTime('all')}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Đang làm</span>
              <RotateCcw className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-800">{metrics.inProgress}</div>
            <p className="text-[10px] text-slate-500 mt-1">Chưa nộp / Đang chạy</p>
          </div>

          {/* Card: Completed */}
          <div 
            onClick={() => setFilterTime(filterTime === 'completed' ? 'all' : 'completed')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterTime === 'completed' 
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30' 
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Đã xong</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{metrics.completed}</div>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.completionRate}% hoàn thành</p>
          </div>

          {/* Card: Progress Overall */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0B2545] text-white shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Tiến độ vi mô</span>
              <TrendingUp className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="my-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xl font-black text-[#FFD700]">{metrics.completionRate}%</span>
                <span className="text-[11px] text-slate-300">{metrics.completed}/{metrics.total} việc</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-[#FFD700] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${metrics.completionRate}%` }} 
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-400">Toàn bộ 59 nhiệm vụ</p>
          </div>

        </div>

        {/* 3. Filter Bar & View Mode Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm việc con, mã nhiệm vụ NVxx, người phụ trách..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-blue-600 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Presets & View Mode Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Nút "Việc của tôi" */}
              <button
                onClick={() => setFilterAssignee(filterAssignee === 'mine' ? 'all' : 'mine')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  filterAssignee === 'mine'
                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Việc của tôi</span>
              </button>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'timeline'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem theo dòng thời gian phân loại hạn"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dòng thời gian</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem dạng bảng chi tiết"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bảng chi tiết</span>
                </button>
              </div>

              {/* Reset filter button if active */}
              {(filterTime !== 'all' || filterAssignee !== 'all' || filterDept !== 'all' || filterEvaluation !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterTime('all');
                    setFilterAssignee('all');
                    setFilterDept('all');
                    setFilterEvaluation('all');
                    setSearchTerm('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}

            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Lọc theo:
            </span>

            {/* Cán bộ */}
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Tất cả cán bộ</option>
              <option value="mine">-- Việc của tôi ({currentUser.hoTen}) --</option>
              {uniqueAssignees.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Đơn vị */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600 max-w-[180px] truncate"
            >
              <option value="all">Tất cả đơn vị</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Thời hạn */}
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value as any)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Tất cả thời hạn</option>
              <option value="overdue">Quá hạn</option>
              <option value="today">Hạn hôm nay</option>
              <option value="dueSoon">Trong 3 ngày tới</option>
              <option value="completed">Đã hoàn thành</option>
            </select>

            {/* Đánh giá chất lượng */}
            <select
              value={filterEvaluation}
              onChange={(e) => setFilterEvaluation(e.target.value as any)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="Dat">Đánh giá: Đạt</option>
              <option value="Chua_Dat">Đánh giá: Chưa đạt</option>
              <option value="Chua_Danh_Gia">Chưa đánh giá</option>
            </select>

            <span className="ml-auto text-[11px] text-slate-500 font-medium">
              Hiển thị <strong className="text-slate-800">{filteredItems.length}</strong> / {allFlattenedItems.length} việc con
            </span>
          </div>
        </div>

        {/* 4. Main Content: Dual Views */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CheckCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy đầu việc con nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Không có việc con nào phù hợp với bộ lọc hiện tại, hoặc tất cả các nhiệm vụ chưa được tạo checklist.
            </p>
          </div>
        ) : viewMode === 'timeline' ? (
          
          /* VIEW 1: TIMELINE GROUPED VIEW */
          <div className="space-y-6">
            {timelineGroups.map(group => {
              const IconComp = group.icon;
              return (
                <div key={group.id} className="space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${group.badgeBg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">{group.title}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                        {group.items.length}
                      </span>
                    </div>
                  </div>

                  {/* Group Item Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map(item => (
                      <div
                        key={`${item.parentTask.id}_${item.id}`}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                          item.completed 
                            ? 'bg-emerald-50/20 border-emerald-200/80' 
                            : group.cardBorder
                        }`}
                      >
                        {/* Top: Task ID, Tag, Due Date */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => onSelectTask(item.parentTask)}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 hover:underline border border-blue-200 flex items-center gap-1 cursor-pointer"
                              title="Bấm để mở chi tiết nhiệm vụ cha"
                            >
                              <span>[{item.parentTask.id}]</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.dueDateStatus.badgeClass}`}>
                              {item.dueDateStatus.label}
                            </span>
                          </div>

                          {/* Parent Task Context Title */}
                          <p className="text-[11px] text-slate-500 line-clamp-1" title={item.parentTask.tenNhiemVu}>
                            {item.parentTask.tenNhiemVu}
                          </p>

                          {/* Checklist Title & Checkbox */}
                          <div className="flex items-start gap-2.5 pt-1">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => handleToggleChecklist(item)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-semibold leading-snug block ${
                                item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}>
                                {item.title}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Assignee, Evaluation & Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium text-[11px]" title={item.assignee || 'Chưa phân công'}>
                              {item.assignee || 'Chưa phân công'}
                            </span>
                          </div>

                          {/* Evaluation Status */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isLeaderOrAdmin ? (
                              /* Leader quick evaluation dropdown */
                              <select
                                value={item.evaluationStatus || 'Chua_Danh_Gia'}
                                onChange={(e) => handleEvaluationChange(item, e.target.value as any)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border cursor-pointer focus:outline-hidden ${
                                  item.evaluationStatus === 'Dat'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : item.evaluationStatus === 'Chua_Dat'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}
                              >
                                <option value="Chua_Danh_Gia">Chờ duyệt</option>
                                <option value="Dat">Đạt</option>
                                <option value="Chua_Dat">Chưa đạt</option>
                              </select>
                            ) : (
                              /* Staff badge */
                              item.evaluationStatus === 'Dat' ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Đạt
                                </span>
                              ) : item.evaluationStatus === 'Chua_Dat' ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  Chưa đạt
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full text-slate-500 bg-slate-100">
                                  Chờ duyệt
                                </span>
                              )
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          /* VIEW 2: DETAILED TABLE MATRIX VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-10 text-center">Xong</th>
                    <th className="py-3 px-3 w-20">Mã NV</th>
                    <th className="py-3 px-4">Nội dung việc con (Checklist)</th>
                    <th className="py-3 px-3">Thuộc nhiệm vụ</th>
                    <th className="py-3 px-3">Người phụ trách</th>
                    <th className="py-3 px-3">Hạn chót</th>
                    <th className="py-3 px-3">Tình trạng hạn</th>
                    <th className="py-3 px-3 text-center">Đánh giá</th>
                    <th className="py-3 px-3 text-center w-20">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr 
                      key={`${item.parentTask.id}_${item.id}`}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        item.completed ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(item)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Parent Task ID */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        <button
                          onClick={() => onSelectTask(item.parentTask)}
                          className="hover:underline cursor-pointer"
                        >
                          [{item.parentTask.id}]
                        </button>
                      </td>

                      {/* Checklist Title */}
                      <td className="py-3 px-4 font-medium">
                        <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-900 font-semibold'}>
                          {item.title}
                        </span>
                      </td>

                      {/* Parent Task Name */}
                      <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={item.parentTask.tenNhiemVu}>
                        {item.parentTask.tenNhiemVu}
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {item.assignee || <span className="text-slate-400 italic">Chưa giao</span>}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatVNDate(item.dueDate)}
                      </td>

                      {/* Date Status Badge */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block ${item.dueDateStatus.badgeClass}`}>
                          {item.dueDateStatus.label}
                        </span>
                      </td>

                      {/* Evaluation */}
                      <td className="py-3 px-3 text-center">
                        {isLeaderOrAdmin ? (
                          <select
                            value={item.evaluationStatus || 'Chua_Danh_Gia'}
                            onChange={(e) => handleEvaluationChange(item, e.target.value as any)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border cursor-pointer focus:outline-hidden ${
                              item.evaluationStatus === 'Dat'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : item.evaluationStatus === 'Chua_Dat'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            <option value="Chua_Danh_Gia">Chờ duyệt</option>
                            <option value="Dat">Đạt</option>
                            <option value="Chua_Dat">Chưa đạt</option>
                          </select>
                        ) : (
                          item.evaluationStatus === 'Dat' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Đạt
                            </span>
                          ) : item.evaluationStatus === 'Chua_Dat' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Chưa đạt
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-slate-500 bg-slate-100">
                              Chờ duyệt
                            </span>
                          )
                        )}
                      </td>

                      {/* Action View */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectTask(item.parentTask)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Mở toàn bộ nhiệm vụ"
                        >
                          <ExternalLink className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
