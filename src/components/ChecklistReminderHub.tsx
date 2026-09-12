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
  ChevronDown,
  Activity
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
  const [filterTime, setFilterTime] = useState<'all' | 'overdue' | 'today' | 'dueSoon' | 'inProgress' | 'completed'>('all');
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

      // Time Range / Status Filter
      if (filterTime === 'overdue') {
        if (item.completed || item.dueDateStatus.status !== 'overdue') return false;
      } else if (filterTime === 'today') {
        if (item.completed || item.dueDateStatus.status !== 'today') return false;
      } else if (filterTime === 'dueSoon') {
        if (item.completed || (item.dueDateStatus.status !== 'today' && item.dueDateStatus.status !== 'dueSoon')) return false;
      } else if (filterTime === 'inProgress') {
        if (item.completed) return false;
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

  const statCards = [
    {
      id: 'all',
      label: 'Tất cả việc con',
      count: metrics.total,
      sub: `${metrics.completionRate}% hoàn thành`,
      icon: Layers,
      badgeColor: 'bg-slate-100 text-[#0B2545]',
      activeStyle: 'border-[#0B2545] ring-2 ring-[#0B2545]/15 bg-slate-50/90 text-slate-900',
      activeBadgeColor: 'bg-[#0B2545] text-white',
      countColor: 'text-[#0B2545]',
    },
    {
      id: 'completed',
      label: 'Đã hoàn thành',
      count: metrics.completed,
      sub: `${metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% tổng số`,
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-100 text-emerald-700',
      activeStyle: 'border-emerald-600 ring-2 ring-emerald-500/15 bg-emerald-50/50 text-emerald-950',
      activeBadgeColor: 'bg-emerald-600 text-white',
      countColor: 'text-emerald-700',
    },
    {
      id: 'inProgress',
      label: 'Đang thực hiện',
      count: metrics.inProgress,
      sub: 'Đang xúc tiến',
      icon: Activity,
      badgeColor: 'bg-sky-100 text-sky-700',
      activeStyle: 'border-sky-600 ring-2 ring-sky-500/15 bg-sky-50/50 text-sky-950',
      activeBadgeColor: 'bg-sky-600 text-white',
      countColor: 'text-sky-700',
    },
    {
      id: 'dueSoon',
      label: 'Sắp đến hạn',
      count: metrics.dueSoon + metrics.today,
      sub: metrics.today > 0 ? `${metrics.today} việc hôm nay` : 'Cần chú ý',
      icon: Clock,
      badgeColor: 'bg-amber-100 text-amber-700',
      activeStyle: 'border-amber-600 ring-2 ring-amber-500/15 bg-amber-50/50 text-amber-950',
      activeBadgeColor: 'bg-amber-600 text-white',
      countColor: 'text-amber-700',
    },
    {
      id: 'overdue',
      label: 'Quá hạn',
      count: metrics.overdue,
      sub: 'Cần đôn đốc ngay',
      icon: AlertTriangle,
      badgeColor: 'bg-rose-100 text-rose-700',
      activeStyle: 'border-rose-600 ring-2 ring-rose-500/15 bg-rose-50/50 text-rose-950',
      activeBadgeColor: 'bg-rose-600 text-white',
      countColor: 'text-rose-700',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">

      <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* 2. Top Metric Cards */}
        <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {statCards.map((item, index) => {
              const Icon = item.icon;
              const isActive = filterTime === item.id || (filterTime === 'all' && item.id === 'all');
              const spanClass = index === 0 ? 'col-span-2 sm:col-span-1' : 'col-span-1';

              return (
                <button
                  key={item.id}
                  onClick={() => setFilterTime(filterTime === item.id && item.id !== 'all' ? 'all' : item.id as any)}
                  className={`relative flex items-center justify-between py-2 px-3 sm:px-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer group shadow-2xs ${spanClass} ${
                    isActive 
                      ? `${item.activeStyle} shadow-xs font-medium` 
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? item.activeBadgeColor : item.badgeColor
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-semibold leading-tight truncate text-slate-800">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`text-lg sm:text-xl font-bold tabular-nums ${isActive ? item.countColor : 'text-slate-800'}`}>
                      {item.count}
                    </span>
                  </div>
                </button>
              );
            })}
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

            {/* Thời hạn / Trạng thái */}
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value as any)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">Tất cả thời hạn</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="inProgress">Đang thực hiện</option>
              <option value="dueSoon">Sắp đến hạn</option>
              <option value="today">Hạn hôm nay</option>
              <option value="overdue">Quá hạn</option>
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
