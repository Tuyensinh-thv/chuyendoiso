import React from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Table, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Building, 
  Flag, 
  Tag, 
  FolderLock, 
  Download, 
  Sliders, 
  RotateCcw,
  Inbox,
  UserCheck,
  Send,
  ShieldCheck,
  GitBranch,
  Layers,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History,
  MessageSquareQuote,
  Users
} from 'lucide-react';
import { CustomCategory, UserAccount, BaseWeworkPerspective } from '../types';
import { PLAN_GROUPS } from '../data/initialData';
import { getRolePermissions } from '../utils/permissions';

interface SidebarProps {
  isOpen: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  activeView: 'kanban' | 'table' | 'gantt' | 'calendar' | 'stats';
  onSelectView: (view: 'kanban' | 'table' | 'gantt' | 'calendar' | 'stats') => void;
  onOpenNewTaskModal: () => void;
  onOpenDailyReminder: () => void;
  onOpenDriveManager: () => void;
  onOpenCategoryManager: () => void;
  onOpenEthicalAiSettings: () => void;
  onOpenGoogleSync: () => void;
  onOpenUserManagement?: () => void;
  onOpenAuditLogs?: () => void;
  onOpenDirectives?: () => void;
  onExportData: () => void;
  onResetData: () => void;
  // Counts
  totalTasksCount: number;
  urgentCount: number;
  overdueCount: number;
  todayCount: number;
  dueSoonCount: number;
  completedCount: number;
  myUnitCount: number;
  myDelegatedCount: number;
  pendingApprovalCount: number;
  aiRecommendedCount: number;
  // Active Filter States
  selectedPerspective: BaseWeworkPerspective;
  onSelectPerspective: (perspective: BaseWeworkPerspective) => void;
  selectedPlanGroup: string;
  onSelectPlanGroup: (plan: string) => void;
  selectedPriority: string;
  onSelectPriority: (priority: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  // User & Categories
  currentUser: UserAccount;
  categories: CustomCategory[];
  taskCountsByCategory: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleCollapse,
  onLogout,
  activeView,
  onSelectView,
  onOpenNewTaskModal,
  onOpenDailyReminder,
  onOpenDriveManager,
  onOpenCategoryManager,
  onOpenEthicalAiSettings,
  onOpenGoogleSync,
  onOpenUserManagement,
  onOpenAuditLogs,
  onOpenDirectives,
  onExportData,
  onResetData,
  totalTasksCount,
  overdueCount,
  todayCount,
  dueSoonCount,
  completedCount,
  myUnitCount,
  myDelegatedCount,
  pendingApprovalCount,
  aiRecommendedCount,
  selectedPerspective,
  onSelectPerspective,
  selectedPlanGroup,
  onSelectPlanGroup,
  selectedPriority,
  onSelectPriority,
  selectedCategory,
  onSelectCategory,
  currentUser,
  categories,
  taskCountsByCategory,
}) => {
  const perms = getRolePermissions(currentUser.vaiTro);
  const isCanCreateTask = perms.canCreateTask;

  const resetAllFilters = () => {
    onSelectPerspective('all');
    onSelectPlanGroup('all');
    onSelectPriority('all');
    onSelectCategory('all');
  };

  const closeOnMobile = () => {
    if (window.innerWidth < 768 && isOpen && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeOnMobile}
          aria-hidden="true"
        />
      )}
      <aside 
        className={`bg-gradient-to-b from-[#0B2545] via-[#0C223E] to-[#0A1128] border-r border-slate-700/60 flex-col shrink-0 transition-all duration-200 select-none h-[calc(100vh-4rem)] text-slate-300 ${
          isOpen
            ? 'fixed md:sticky top-16 left-0 bottom-0 z-40 w-64 flex shadow-2xl md:shadow-none'
            : 'hidden md:flex md:w-16 md:sticky top-16 z-20'
        }`}
        aria-label="Thanh điều hướng Hệ thống HVU"
      >
      {/* 1. HVU "+ Tạo công việc" Button */}
      <div className="p-3.5 pb-2">
        {isCanCreateTask ? (
          <button
            onClick={() => { onOpenNewTaskModal(); closeOnMobile(); }}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#BE1E2D] hover:bg-[#990000] text-white font-bold text-xs transition-all shadow-md shadow-red-950/40 cursor-pointer ${
              !isOpen && 'p-2.5 rounded-xl'
            }`}
            title="Thêm công việc / Giao việc mới"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            {isOpen && <span className="tracking-wide uppercase text-[11px]">Thêm công việc</span>}
          </button>
        ) : (
          <button
            onClick={() => { onOpenDailyReminder(); closeOnMobile(); }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-all border border-white/10 cursor-pointer ${
              !isOpen && 'p-2.5 rounded-xl'
            }`}
            title="Xem đôn đốc hạn chót"
          >
            <Clock className="w-4 h-4 text-[#FFD700] shrink-0" />
            {isOpen && <span>Đôn đốc tiến độ</span>}
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation & Menus */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs py-2 scrollbar-thin">
        
        {/* SECTION 1: Chế độ xem */}
        <div className="space-y-0.5">
          {isOpen && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Chế độ xem dữ liệu
            </p>
          )}

          {/* Table / List View */}
          <button
            onClick={() => { onSelectView('table'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium cursor-pointer ${
              activeView === 'table'
                ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Dạng Danh sách / Bảng dữ liệu"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Table className={`w-4 h-4 shrink-0 ${activeView === 'table' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Danh sách (List)</span>}
            </div>
            {isOpen && (
              <span className={`text-[11px] font-mono ${activeView === 'table' ? 'text-white font-bold' : 'text-slate-400'}`}>
                {totalTasksCount}
              </span>
            )}
          </button>

          {/* Kanban Board */}
          <button
            onClick={() => { onSelectView('kanban'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium cursor-pointer ${
              activeView === 'kanban'
                ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Bảng Kanban theo giai đoạn"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutGrid className={`w-4 h-4 shrink-0 ${activeView === 'kanban' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Bảng Kanban (Board)</span>}
            </div>
          </button>

          {/* Gantt Chart */}
          <button
            onClick={() => { onSelectView('gantt'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium cursor-pointer ${
              activeView === 'gantt'
                ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Sơ đồ tiến độ Gantt Chart"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GitBranch className={`w-4 h-4 shrink-0 ${activeView === 'gantt' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Sơ đồ Gantt (Timeline)</span>}
            </div>
            {isOpen && (
              <span className="text-[9px] bg-white/20 text-[#FFD700] font-bold px-1.5 py-0.2 rounded">
                Tiến độ
              </span>
            )}
          </button>

          {/* Calendar */}
          <button
            onClick={() => { onSelectView('calendar'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Lịch biểu công việc"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CalendarIcon className={`w-4 h-4 shrink-0 ${activeView === 'calendar' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Lịch biểu (Calendar)</span>}
            </div>
          </button>

          {/* Stats & Report */}
          <button
            onClick={() => { onSelectView('stats'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium cursor-pointer ${
              activeView === 'stats'
                ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Báo cáo & Phân tích KPI"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BarChart3 className={`w-4 h-4 shrink-0 ${activeView === 'stats' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Báo cáo & KPI</span>}
            </div>
          </button>
        </div>

        {/* SECTION 2: Base Wework "CÔNG VIỆC CỦA TÔI" (My Tasks Perspectives) */}
        <div className="space-y-0.5 pt-2 border-t border-slate-800">
          {isOpen && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Công việc của tôi</span>
              {selectedPerspective !== 'all' && (
                <button
                  onClick={() => onSelectPerspective('all')}
                  className="text-slate-400 hover:text-white font-normal lowercase tracking-normal cursor-pointer"
                >
                  tất cả
                </button>
              )}
            </p>
          )}

          {/* All Tasks */}
          <button
            onClick={() => { onSelectPerspective('all'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              selectedPerspective === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
            title="Tất cả nhiệm vụ"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Inbox className="w-4 h-4 shrink-0 text-slate-400" />
              {isOpen && <span className="truncate">Tất cả nhiệm vụ</span>}
            </div>
            {isOpen && (
              <span className={`text-[11px] font-semibold font-mono ${selectedPerspective === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
                {totalTasksCount}
              </span>
            )}
          </button>

          {/* Assigned to Me / My Unit */}
          <button
            onClick={() => { onSelectPerspective('my_assigned'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              selectedPerspective === 'my_assigned'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
            title={`Nhiệm vụ đơn vị tôi phụ trách (${currentUser.donVi})`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Building className={`w-4 h-4 shrink-0 ${selectedPerspective === 'my_assigned' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Tôi / Đơn vị tôi phụ trách</span>}
            </div>
            {isOpen && myUnitCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedPerspective === 'my_assigned' ? 'bg-slate-700 text-white' : 'bg-slate-850 text-slate-300 border border-slate-700'
              }`}>
                {myUnitCount}
              </span>
            )}
          </button>

          {/* Delegated / Created by current role */}
          <button
            onClick={() => { onSelectPerspective('my_delegated'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              selectedPerspective === 'my_delegated'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
            title="Nhiệm vụ Lãnh đạo / Ban Giám hiệu giao"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Send className={`w-4 h-4 shrink-0 ${selectedPerspective === 'my_delegated' ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span className="truncate">Tôi giao việc</span>}
            </div>
            {isOpen && (
              <span className={`text-[11px] font-mono ${selectedPerspective === 'my_delegated' ? 'text-slate-200' : 'text-slate-500'}`}>
                {myDelegatedCount}
              </span>
            )}
          </button>

          {/* Pending Deliverables Approval */}
          <button
            onClick={() => { onSelectPerspective('pending_approval'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              selectedPerspective === 'pending_approval'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
            title="Nhiệm vụ đang chờ duyệt minh chứng nghiệm thu"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              {isOpen && <span className="truncate">Chờ duyệt nghiệm thu</span>}
            </div>
            {isOpen && pendingApprovalCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-900/40">
                {pendingApprovalCount}
              </span>
            )}
          </button>

          {/* Overdue & Urgent */}
          <button
            onClick={() => { onSelectPerspective('overdue_urgent'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              selectedPerspective === 'overdue_urgent'
                ? 'bg-rose-950/40 text-rose-300 font-semibold border border-rose-900/50'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
            title="Nhiệm vụ quá hạn và khẩn cấp"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              {isOpen && <span className="truncate">Quá hạn & Khẩn cấp</span>}
            </div>
            {isOpen && overdueCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-900/80 text-rose-100">
                {overdueCount}
              </span>
            )}
          </button>

          {/* AI Recommended Focus */}
          <button
            onClick={() => { onSelectPerspective('ai_suggested'); closeOnMobile(); }}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
              selectedPerspective === 'ai_suggested'
                ? 'bg-amber-950/40 text-amber-300 font-semibold border border-amber-900/50'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
            title="Gợi ý AI ưu tiên"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              {isOpen && <span className="truncate">AI Gợi ý ưu tiên</span>}
            </div>
            {isOpen && aiRecommendedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-900/80 text-amber-100">
                {aiRecommendedCount}
              </span>
            )}
          </button>
        </div>

        {/* SECTION 3: Base Wework Projects / Plan Groups NQ57 */}
        <div className="space-y-0.5 pt-2 border-t border-slate-800">
          {isOpen && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Kế hoạch & Dự án NQ57</span>
              {selectedPlanGroup !== 'all' && (
                <button
                  onClick={() => onSelectPlanGroup('all')}
                  className="text-slate-400 hover:text-white font-normal lowercase tracking-normal cursor-pointer"
                >
                  tất cả
                </button>
              )}
            </p>
          )}

          {PLAN_GROUPS.map((plan) => {
            const isSelected = selectedPlanGroup === plan;
            const shortName = plan.replace('Kế hoạch ', 'KH ');
            return (
              <button
                key={plan}
                onClick={() => { onSelectPlanGroup(isSelected ? 'all' : plan); closeOnMobile(); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-left font-medium cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
                title={plan}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  {isOpen && <span className="truncate text-xs">{shortName}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* SECTION 4: Priority Filters */}
        <div className="space-y-0.5 pt-2 border-t border-slate-800">
          {isOpen && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Mức độ ưu tiên
            </p>
          )}

          <div className={`grid gap-1 px-1 ${isOpen ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <button
              onClick={() => { onSelectPriority(selectedPriority === 'High' ? 'all' : 'High'); closeOnMobile(); }}
              className={`py-1 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                selectedPriority === 'High'
                  ? 'bg-rose-950 border-rose-800 text-rose-300 shadow-2xs'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Ưu tiên Cao"
            >
              {isOpen ? 'Cao' : 'C'}
            </button>

            <button
              onClick={() => { onSelectPriority(selectedPriority === 'Medium' ? 'all' : 'Medium'); closeOnMobile(); }}
              className={`py-1 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                selectedPriority === 'Medium'
                  ? 'bg-amber-950 border-amber-800 text-amber-300 shadow-2xs'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Ưu tiên Vừa"
            >
              {isOpen ? 'Vừa' : 'V'}
            </button>

            <button
              onClick={() => { onSelectPriority(selectedPriority === 'Low' ? 'all' : 'Low'); closeOnMobile(); }}
              className={`py-1 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                selectedPriority === 'Low'
                  ? 'bg-slate-800 border-slate-700 text-slate-300 shadow-2xs'
                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-850'
              }`}
              title="Ưu tiên Thấp"
            >
              {isOpen ? 'Thấp' : 'T'}
            </button>
          </div>
        </div>

        {/* SECTION 5: Labels & Categories */}
        <div className="space-y-0.5 pt-2 border-t border-slate-800">
          {isOpen && (
            <div className="px-3 flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nhãn phân loại
              </span>
              <button
                onClick={onOpenCategoryManager}
                className="text-[10px] text-slate-400 hover:text-white font-semibold cursor-pointer"
                title="Quản lý nhãn"
              >
                + Quản lý
              </button>
            </div>
          )}

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = taskCountsByCategory[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => { onSelectCategory(isSelected ? 'all' : cat.id); closeOnMobile(); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
                title={cat.name}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 border border-slate-700" 
                    style={{ backgroundColor: cat.color }} 
                  />
                  {isOpen && <span className="truncate text-xs">{cat.name}</span>}
                </div>
                {isOpen && count > 0 && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Bottom HVU System Utilities */}
      <div className="p-2 border-t border-slate-700/60 bg-[#071526]/80 space-y-1 shrink-0">
        {perms.canSyncGoogleSheets && (
          <button
            onClick={() => { onOpenGoogleSync(); closeOnMobile(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition-colors text-xs cursor-pointer font-semibold"
            title="Đồng bộ hóa & Sao lưu Google Sheets/Drive"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
            {isOpen && <span className="truncate text-emerald-300">Đồng bộ Google Sheets</span>}
          </button>
        )}

        <button
          onClick={() => { onOpenDriveManager(); closeOnMobile(); }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs cursor-pointer font-medium"
          title="Kho lưu trữ minh chứng Google Drive"
        >
          <FolderLock className="w-4 h-4 shrink-0 text-slate-400" />
          {isOpen && <span className="truncate">Kho minh chứng Drive</span>}
        </button>

        <button
          onClick={() => { onOpenDirectives(); closeOnMobile(); }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-white/10 transition-colors text-xs cursor-pointer font-medium"
          title={perms.canDirectLead ? "Trung tâm ban hành chỉ đạo Ban Giám hiệu" : "Xem ý kiến chỉ đạo của Ban Giám hiệu"}
        >
          <MessageSquareQuote className="w-4 h-4 shrink-0 text-amber-400" />
          {isOpen && (
            <span className="truncate">
              {perms.canDirectLead ? 'Chỉ đạo Ban Giám hiệu' : 'Ý kiến chỉ đạo BGH'}
            </span>
          )}
        </button>

        {perms.canViewAuditLogs && (
          <button
            onClick={() => { onOpenAuditLogs(); closeOnMobile(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs cursor-pointer font-medium"
            title="Xem lịch sử thao tác và nhật ký hoạt động hệ thống"
          >
            <History className="w-4 h-4 shrink-0 text-slate-400" />
            {isOpen && <span className="truncate">Nhật ký hoạt động (Audit)</span>}
          </button>
        )}

        {perms.canExportReports && (
          <button
            onClick={() => { onExportData(); closeOnMobile(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs cursor-pointer font-medium"
            title="Xuất file báo cáo Excel (CSV)"
          >
            <Download className="w-4 h-4 shrink-0 text-slate-400" />
            {isOpen && <span className="truncate">Xuất báo cáo Excel</span>}
          </button>
        )}

        {onOpenUserManagement && perms.canManageUsers && (
          <button
            onClick={() => { onOpenUserManagement(); closeOnMobile(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-blue-300 hover:text-blue-200 hover:bg-white/10 transition-colors text-xs cursor-pointer font-medium"
            title="Quản lý tài khoản cán bộ & phân quyền"
          >
            <Users className="w-4 h-4 shrink-0 text-blue-400" />
            {isOpen && <span className="truncate">Quản lý cán bộ (Tài khoản)</span>}
          </button>
        )}

        {perms.canConfigureAi && (
          <button
            onClick={() => { onOpenEthicalAiSettings(); closeOnMobile(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs cursor-pointer font-medium"
            title="Cài đặt AI & Quy tắc đạo đức"
          >
            <Sliders className="w-4 h-4 shrink-0 text-slate-400" />
            {isOpen && <span className="truncate">Cài đặt AI & Đạo đức</span>}
          </button>
        )}

        {/* Collapse & Logout footer controls */}
        <div className="pt-1 border-t border-slate-700/50 flex flex-col gap-0.5">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors text-xs cursor-pointer"
              title={isOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
            >
              {isOpen ? (
                <>
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="truncate text-[11px]">Thu gọn menu</span>
                </>
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )}
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-xs cursor-pointer font-medium"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
              {isOpen && <span className="truncate">Đăng xuất</span>}
            </button>
          )}
        </div>
      </div>

    </aside>
    </>
  );
};
