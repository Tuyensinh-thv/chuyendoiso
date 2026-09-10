import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp,
  BarChart3,
  PieChart,
  Building,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { TaskNQ57 } from '../types';
import { PLAN_GROUPS, DEPARTMENTS } from '../data/initialData';
import { formatVietnameseDate, getDaysDifference } from '../utils/dateUtils';

interface DashboardKPIProps {
  tasks: TaskNQ57[];
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  onSelectPlanGroup?: (group: string) => void;
  onSelectDept?: (dept: string) => void;
  onSelectTask?: (task: TaskNQ57) => void;
}

export const DashboardKPI: React.FC<DashboardKPIProps> = ({
  tasks,
  selectedStatusFilter,
  onSelectStatusFilter,
  onSelectPlanGroup,
  onSelectDept,
  onSelectTask,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plan_groups' | 'departments' | 'deadlines'>('overview');

  const total = tasks.length;
  const completed = tasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
  const inProgress = tasks.filter((t) => t.trangThai === 'Đang thực hiện').length;
  const upcoming = tasks.filter((t) => t.trangThai === 'Sắp đến hạn').length;
  const overdue = tasks.filter((t) => t.trangThai === 'Quá hạn').length;
  const notStarted = tasks.filter((t) => t.trangThai === 'Chưa thực hiện').length;

  const percentCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgProgress = total > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.tiendo || 0), 0) / total) : 0;

  // Donut chart calculations
  const pCompleted = total > 0 ? (completed / total) * 100 : 0;
  const pInProgress = total > 0 ? (inProgress / total) * 100 : 0;
  const pUpcoming = total > 0 ? (upcoming / total) * 100 : 0;
  const pOverdue = total > 0 ? (overdue / total) * 100 : 0;
  const pNotStarted = total > 0 ? (notStarted / total) * 100 : 0;

  // Plan Group statistics
  const planGroupStats = PLAN_GROUPS.map((group) => {
    const groupTasks = tasks.filter((t) => t.nhomKeHoach === group);
    const count = groupTasks.length;
    const groupCompleted = groupTasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
    const groupOverdue = groupTasks.filter((t) => t.trangThai === 'Quá hạn').length;
    const groupAvg = count > 0 ? Math.round(groupTasks.reduce((s, t) => s + (t.tiendo || 0), 0) / count) : 0;

    return {
      group,
      shortName: group.split('(')[0].trim(),
      fullName: group,
      count,
      completed: groupCompleted,
      overdue: groupOverdue,
      avgProgress: groupAvg,
    };
  });

  // Department statistics with heatmap status
  const departmentStats = DEPARTMENTS.map((dept) => {
    const deptTasks = tasks.filter((t) => t.donViChuTri === dept);
    const count = deptTasks.length;
    const deptCompleted = deptTasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
    const deptOverdue = deptTasks.filter((t) => t.trangThai === 'Quá hạn').length;
    const deptAvg = count > 0 ? Math.round(deptTasks.reduce((s, t) => s + (t.tiendo || 0), 0) / count) : 0;

    let statusType: 'green' | 'yellow' | 'red' = 'green';
    if (deptOverdue > 0) statusType = 'red';
    else if (deptAvg < 50) statusType = 'yellow';

    return {
      dept,
      count,
      completed: deptCompleted,
      overdue: deptOverdue,
      avgProgress: deptAvg,
      statusType,
    };
  }).filter((d) => d.count > 0);

  // Critical deadlines (nearest upcoming or overdue)
  const sortedByDeadline = [...tasks]
    .filter((t) => t.trangThai !== 'Đã hoàn thành')
    .sort((a, b) => a.thoiHan.localeCompare(b.thoiHan))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* 1. Main KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* 1. Hero Card: Tổng nhiệm vụ NQ57 */}
        <button
          id="kpi-card-total"
          onClick={() => onSelectStatusFilter('')}
          className={`col-span-2 lg:col-span-1 text-left p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#102A4C] to-[#1E3A8A] text-white shadow-md ${
            selectedStatusFilter === ''
              ? 'ring-2 ring-[#0066FF] shadow-lg'
              : 'hover:opacity-95'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              TỔNG NHIỆM VỤ NQ57
            </span>
            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[#FFD700]">
              ★
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight tabular-nums">{total}</span>
            <span className="text-[10px] font-bold text-[#FFD700] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
              {percentCompleted}% Xong
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300 font-medium truncate">
            6 Kế hoạch trọng tâm toàn trường
          </p>
        </button>

        {/* 2. Đã hoàn thành */}
        <button
          id="kpi-card-completed"
          onClick={() => onSelectStatusFilter(selectedStatusFilter === 'Đã hoàn thành' ? '' : 'Đã hoàn thành')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            selectedStatusFilter === 'Đã hoàn thành'
              ? 'ring-2 ring-emerald-500 border-emerald-300 shadow-sm'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ĐÃ HOÀN THÀNH
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{completed}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              {percentCompleted}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Đã nộp minh chứng</p>
        </button>

        {/* 3. Đang thực hiện */}
        <button
          id="kpi-card-in-progress"
          onClick={() => onSelectStatusFilter(selectedStatusFilter === 'Đang thực hiện' ? '' : 'Đang thực hiện')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            selectedStatusFilter === 'Đang thực hiện'
              ? 'ring-2 ring-[#0066FF] border-blue-300 shadow-sm'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ĐANG THỰC HIỆN
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0066FF] border border-blue-200 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{inProgress}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
              {Math.round((inProgress / (total || 1)) * 100)}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Đúng tiến độ đề ra</p>
        </button>

        {/* 4. Sắp đến hạn */}
        <button
          id="kpi-card-upcoming"
          onClick={() => onSelectStatusFilter(selectedStatusFilter === 'Sắp đến hạn' ? '' : 'Sắp đến hạn')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            selectedStatusFilter === 'Sắp đến hạn'
              ? 'ring-2 ring-amber-500 border-amber-300 shadow-sm'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>SẮP ĐẾN HẠN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{upcoming}</span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              Hạn ≤ 3 ngày
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Khẩn trương hoàn tất</p>
        </button>

        {/* 5. Quá hạn */}
        <button
          id="kpi-card-overdue"
          onClick={() => onSelectStatusFilter(selectedStatusFilter === 'Quá hạn' ? '' : 'Quá hạn')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            selectedStatusFilter === 'Quá hạn'
              ? 'ring-2 ring-[#BE1E2D] border-red-300 shadow-sm'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#BE1E2D] uppercase tracking-wider">
              QUÁ HẠN
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-[#BE1E2D] border border-red-200 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#BE1E2D] tracking-tight tabular-nums">{overdue}</span>
            <span className="text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
              Cần đôn đốc
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Vượt mốc kế hoạch</p>
        </button>
      </div>

      {/* 2. Visual Charts & Performance Insights Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 gap-2 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Biểu đồ Donut tỷ lệ</span>
            </button>
            <button
              onClick={() => setActiveTab('plan_groups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'plan_groups'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Theo Nhóm kế hoạch</span>
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'departments'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Ma trận nhiệt Đơn vị</span>
            </button>
            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'deadlines'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Countdown hạn chót</span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span>Tiến độ trung bình toàn trường:</span>
            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              {avgProgress}%
            </span>
          </div>
        </div>

        {/* Tab 1: Donut Chart Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
            {/* Donut SVG graphic */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="14"
                    fill="transparent"
                  />
                  {/* Completed arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={`${(pCompleted * 251.2) / 100} 251.2`}
                    strokeDashoffset="0"
                    className="transition-all duration-700"
                  />
                  {/* In Progress arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#0284c7"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={`${(pInProgress * 251.2) / 100} 251.2`}
                    strokeDashoffset={`-${(pCompleted * 251.2) / 100}`}
                    className="transition-all duration-700"
                  />
                  {/* Upcoming arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={`${(pUpcoming * 251.2) / 100} 251.2`}
                    strokeDashoffset={`-${((pCompleted + pInProgress) * 251.2) / 100}`}
                    className="transition-all duration-700"
                  />
                  {/* Overdue arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#ef4444"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={`${(pOverdue * 251.2) / 100} 251.2`}
                    strokeDashoffset={`-${((pCompleted + pInProgress + pUpcoming) * 251.2) / 100}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-zinc-900 tracking-tight">{percentCompleted}%</span>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Hoàn tất</span>
                </div>
              </div>
            </div>

            {/* Legend & Breakdown stats */}
            <div className="md:col-span-7 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div 
                  onClick={() => onSelectStatusFilter('Đã hoàn thành')}
                  className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-emerald-900">Đã hoàn thành</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-emerald-950">{completed} NV</span>
                    <span className="text-xs font-medium text-emerald-700">{Math.round(pCompleted)}%</span>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectStatusFilter('Đang thực hiện')}
                  className="p-3 rounded-xl border border-sky-200 bg-sky-50/50 cursor-pointer hover:bg-sky-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                    <span className="text-xs font-semibold text-sky-900">Đang thực hiện</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-sky-950">{inProgress} NV</span>
                    <span className="text-xs font-medium text-sky-700">{Math.round(pInProgress)}%</span>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectStatusFilter('Sắp đến hạn')}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-semibold text-amber-900">Sắp đến hạn (≤ 3 ngày)</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-amber-950">{upcoming} NV</span>
                    <span className="text-xs font-medium text-amber-700">{Math.round(pUpcoming)}%</span>
                  </div>
                </div>

                <div 
                  onClick={() => onSelectStatusFilter('Quá hạn')}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer hover:bg-rose-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-xs font-semibold text-rose-900">Quá hạn kế hoạch</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-rose-950">{overdue} NV</span>
                    <span className="text-xs font-medium text-rose-700">{Math.round(pOverdue)}%</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 italic pt-1">
                * Nhấp vào từng ô để lọc ngay các nhiệm vụ tương ứng trên bảng dữ liệu.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Horizontal Bar Charts for Plan Groups */}
        {activeTab === 'plan_groups' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-zinc-600 font-medium">
              So sánh tiến độ thực hiện giữa 6 Nhóm kế hoạch trọng tâm theo Nghị quyết 57-NQ/TW:
            </p>
            <div className="space-y-2.5">
              {planGroupStats.map((pg) => {
                const completeRatio = pg.count > 0 ? Math.round((pg.completed / pg.count) * 100) : 0;
                return (
                  <div 
                    key={pg.fullName}
                    onClick={() => onSelectPlanGroup?.(pg.fullName)}
                    className="p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 group-hover:text-blue-700 transition-colors">
                          {pg.fullName}
                        </span>
                        {pg.overdue > 0 && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-full">
                            {pg.overdue} quá hạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                        <span className="font-semibold text-zinc-800">{pg.completed}/{pg.count} xong ({completeRatio}%)</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    {/* Multi progress bar */}
                    <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${completeRatio}%` }}
                        title={`Hoàn thành: ${completeRatio}%`}
                      />
                      <div
                        className="bg-blue-400 h-full transition-all duration-500"
                        style={{ width: `${Math.max(0, pg.avgProgress - completeRatio)}%` }}
                        title={`Đang thực hiện: ${pg.avgProgress - completeRatio}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Department Heatmap Matrix */}
        {activeTab === 'departments' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-zinc-600 font-medium">
              Bản đồ nhiệt tiến độ các đơn vị chủ trì (Xanh: Tốt | Vàng: Cần đẩy nhanh | Đỏ: Có nhiệm vụ quá hạn):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {departmentStats.map((d) => {
                const isRed = d.statusType === 'red';
                const isYellow = d.statusType === 'yellow';

                return (
                  <div
                    key={d.dept}
                    onClick={() => onSelectDept?.(d.dept)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isRed 
                        ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50' 
                        : isYellow
                        ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                        : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{d.dept}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{d.count} nhiệm vụ chủ trì</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                        isRed ? 'bg-rose-500 animate-pulse' : isYellow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-200/50 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-600">Xong: <strong className="text-zinc-900">{d.completed}</strong></span>
                      {d.overdue > 0 && (
                        <span className="font-bold text-rose-700">Quá hạn: {d.overdue}</span>
                      )}
                      <span className="font-bold text-zinc-900">{d.avgProgress}% TB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Deadline Countdown */}
        {activeTab === 'deadlines' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-zinc-600 font-medium">
              Các nhiệm vụ có thời hạn gần nhất cần tập trung giải quyết và hoàn thiện minh chứng:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sortedByDeadline.map((t) => {
                const daysDiff = getDaysDifference(t.thoiHan);
                const isOverdue = daysDiff < 0;
                const isToday = daysDiff === 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask?.(t)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isOverdue 
                        ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50' 
                        : isToday 
                        ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50'
                        : 'border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-zinc-700">
                            {t.id}
                          </span>
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {t.tenNhiemVu}
                          </p>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 truncate">
                          Đơn vị: {t.donViChuTri} ({t.nguoiPhuTrach})
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverdue 
                            ? 'bg-rose-600 text-white' 
                            : isToday 
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-200 text-zinc-800'
                        }`}>
                          {isOverdue 
                            ? `Quá hạn ${Math.abs(daysDiff)} ngày` 
                            : isToday 
                            ? 'Hạn hôm nay' 
                            : `Còn ${daysDiff} ngày`}
                        </span>
                        <p className="text-[10px] text-zinc-500 mt-1">{formatVietnameseDate(t.thoiHan)}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Tiến độ hiện tại: <strong className="text-zinc-800">{t.tiendo}%</strong></span>
                      <span className="text-blue-600 font-semibold hover:underline">Mở chi tiết →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
