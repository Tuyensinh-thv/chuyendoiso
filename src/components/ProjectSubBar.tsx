import React from 'react';
import { 
  Table, 
  LayoutGrid, 
  GitBranch, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Building, 
  ArrowUpDown,
  Filter,
  User,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { DEPARTMENTS } from '../data/initialData';

interface ProjectSubBarProps {
  activeView?: 'kanban' | 'table' | 'gantt' | 'calendar' | 'stats';
  onSelectView?: (view: 'kanban' | 'table' | 'gantt' | 'calendar' | 'stats') => void;
  selectedDept: string;
  onSelectDept: (dept: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedTimeRange?: string;
  onSelectTimeRange?: (range: string) => void;
  selectedAssignee?: string;
  onSelectAssignee?: (assignee: string) => void;
  assignees?: string[];
  sortBy: 'priority' | 'deadline' | 'progress' | 'id';
  onSortByChange: (sort: 'priority' | 'deadline' | 'progress' | 'id') => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
  totalFilteredCount: number;
}

export const ProjectSubBar: React.FC<ProjectSubBarProps> = ({
  activeView = 'table',
  selectedDept,
  onSelectDept,
  selectedStatus,
  onSelectStatus,
  selectedTimeRange = 'all',
  onSelectTimeRange,
  selectedAssignee = 'all',
  onSelectAssignee,
  assignees = [],
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  totalFilteredCount,
}) => {
  const getViewInfo = () => {
    switch (activeView) {
      case 'kanban':
        return { label: 'Bảng Kanban', icon: LayoutGrid };
      case 'gantt':
        return { label: 'Sơ đồ Gantt', icon: GitBranch };
      case 'calendar':
        return { label: 'Lịch biểu', icon: CalendarIcon };
      case 'stats':
        return { label: 'Báo cáo KPI', icon: BarChart3 };
      case 'table':
      default:
        return { label: 'Danh sách', icon: Table };
    }
  };

  const currentView = getViewInfo();
  const ViewIcon = currentView.icon;

  const hasActiveFilter = 
    selectedDept !== 'all' || 
    selectedStatus !== '' || 
    selectedTimeRange !== 'all' || 
    selectedAssignee !== 'all';

  const handleResetFilters = () => {
    onSelectDept('all');
    onSelectStatus('');
    if (onSelectTimeRange) onSelectTimeRange('all');
    if (onSelectAssignee) onSelectAssignee('all');
  };

  return (
    <div className="bg-white border-b border-slate-200/90 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none sticky top-0 z-10 shadow-2xs whitespace-nowrap">
      
      {/* 1. Left: Current View Indicator & Total Count */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
          <ViewIcon className="w-3.5 h-3.5 text-[#0B2545]" />
          <span>{currentView.label}</span>
        </div>

        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
          {totalFilteredCount} việc
        </span>

        {hasActiveFilter && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* 2. Right: Strictly Single-Row Filter Controls & Sorting */}
      <div className="flex items-center gap-1.5 shrink-0 text-xs">
        
        {/* Department Filter */}
        <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 transition-colors">
          <Building className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => onSelectDept(e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer max-w-[130px] truncate"
            title="Lọc theo đơn vị"
          >
            <option value="all">Đơn vị: Tất cả</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Filter */}
        {onSelectTimeRange && (
          <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
            <select
              value={selectedTimeRange}
              onChange={(e) => onSelectTimeRange(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer"
              title="Lọc theo mốc thời gian"
            >
              <option value="all">Thời hạn: Tất cả</option>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="q1_q2">Quý 1 & 2</option>
              <option value="overdue">Đã quá hạn</option>
            </select>
          </div>
        )}

        {/* Assignee Filter */}
        {onSelectAssignee && assignees.length > 0 && (
          <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 transition-colors">
            <User className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
            <select
              value={selectedAssignee}
              onChange={(e) => onSelectAssignee(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer max-w-[125px] truncate"
              title="Lọc theo người phụ trách"
            >
              <option value="all">Phụ trách: Tất cả</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 transition-colors">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            title="Lọc theo trạng thái"
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="Chưa thực hiện">Chưa thực hiện</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Sắp đến hạn">Sắp đến hạn</option>
            <option value="Quá hạn">Quá hạn</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 transition-colors">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            title="Sắp xếp danh sách"
          >
            <option value="priority">Ưu tiên</option>
            <option value="deadline">Thời hạn</option>
            <option value="progress">Tiến độ %</option>
            <option value="id">Mã NV</option>
          </select>
          <button
            onClick={onToggleSortOrder}
            className="ml-1 text-xs font-mono text-slate-500 hover:text-slate-900 cursor-pointer font-bold px-0.5"
            title="Đảo chiều sắp xếp"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

      </div>

    </div>
  );
};
