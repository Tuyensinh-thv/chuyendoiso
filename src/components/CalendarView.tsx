import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Tag, 
  Flag,
  CalendarDays,
  CalendarRange,
  Building,
} from 'lucide-react';
import { TaskNQ57, CustomCategory } from '../types';
import { formatVietnameseDate, getDaysDifference, CURRENT_DATE_STRING } from '../utils/dateUtils';
import { getPriorityMeta, getCategoryBadgeClass } from '../utils/storage';

interface CalendarViewProps {
  tasks: TaskNQ57[];
  onSelectTask: (task: TaskNQ57) => void;
  onScheduleTask?: (dateString: string) => void;
  onAddNewTask?: (dateString: string) => void;
  categories: CustomCategory[];
}

type CalendarSubView = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
  onScheduleTask,
  onAddNewTask,
  categories,
}) => {
  const [subView, setSubView] = useState<CalendarSubView>('month');

  const handleTriggerSchedule = (dateStr: string) => {
    if (onAddNewTask) {
      onAddNewTask(dateStr);
    } else if (onScheduleTask) {
      onScheduleTask(dateStr);
    }
  };
  
  // Initialize to 2026-09-07 (the current system date in metadata)
  const [currentDate, setCurrentDate] = useState(() => {
    const [year, month, day] = CURRENT_DATE_STRING.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  // Map category ID to Category Object
  const categoryMap = useMemo(() => {
    const map = new Map<string, CustomCategory>();
    categories.forEach((cat) => {
      map.set(cat.id, cat);
      map.set(cat.name, cat);
    });
    return map;
  }, [categories]);

  // Index tasks by date "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskNQ57[]> = {};
    tasks.forEach((t) => {
      if (!t.thoiHan) return;
      const dateStr = t.thoiHan.slice(0, 10);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(t);
    });
    return map;
  }, [tasks]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (subView === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (subView === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (subView === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (subView === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleGoToday = () => {
    const [year, month, day] = CURRENT_DATE_STRING.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, day));
  };

  // Helper date formatting
  const toDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Generate grid for Month View
  const monthGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const days: Date[] = [];
    // Start from Monday (1) to Sunday (0)
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon
    const leadingPadding = (startDayOfWeek + 6) % 7;

    for (let i = leadingPadding; i > 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, 1 - i);
      days.push(prevDate);
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    const trailingPadding = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= trailingPadding; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i));
    }

    return days;
  }, [currentYear, currentMonth]);

  // Generate days for Week View
  const currentWeekDays = useMemo(() => {
    const current = new Date(currentDate);
    const dayOfWeek = (current.getDay() + 6) % 7; // Monday is 0
    const monday = new Date(current);
    monday.setDate(current.getDate() - dayOfWeek);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  }, [currentDate]);

  const weekDayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-xs text-zinc-900 space-y-4 transition-colors">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        
        {/* Left: Navigation & Current Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors cursor-pointer"
              title="Kỳ trước"
              aria-label="Kỳ trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors cursor-pointer"
              title="Kỳ sau"
              aria-label="Kỳ sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-zinc-900 ml-1">
            {subView === 'month' && `Tháng ${currentMonth + 1}, Năm ${currentYear}`}
            {subView === 'week' && `Tuần: ${toDateString(currentWeekDays[0])} đến ${toDateString(currentWeekDays[6])}`}
            {subView === 'day' && formatVietnameseDate(toDateString(currentDate))}
          </h2>
        </div>

        {/* Right: SubView Switcher & Add Task Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100/70 p-0.5">
            <button
              onClick={() => setSubView('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subView === 'month'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tháng</span>
            </button>

            <button
              onClick={() => setSubView('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subView === 'week'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Tuần</span>
            </button>

            <button
              onClick={() => setSubView('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subView === 'day'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ngày</span>
            </button>
          </div>

          <button
            onClick={() => handleTriggerSchedule(toDateString(currentDate))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lên lịch mới</span>
          </button>
        </div>

      </div>

      {/* 2. Priority & Date Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-500 bg-zinc-50/70 p-2.5 rounded-xl border border-zinc-200/80">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-zinc-700 flex items-center gap-1">
            <Flag className="w-3 h-3 text-zinc-500" />
            Độ ưu tiên:
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="text-zinc-700 font-medium">Cao</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className="text-zinc-700 font-medium">Trung bình</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" />
            <span className="text-zinc-700 font-medium">Thấp</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Mốc hôm nay:</span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold font-mono">
            {formatVietnameseDate(CURRENT_DATE_STRING)}
          </span>
        </div>
      </div>

      {/* 3. CALENDAR CONTENT: MONTH VIEW */}
      {subView === 'month' && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
              {weekDayNames.map((name, i) => (
                <div key={name} className={`py-1.5 text-xs font-semibold uppercase rounded-lg ${i >= 5 ? 'text-amber-700 bg-amber-50/50' : 'text-zinc-500 bg-zinc-50'}`}>
                  {name}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthGridDays.map((dayDate, idx) => {
                const dateStr = toDateString(dayDate);
                const dayTasks = tasksByDate[dateStr] || [];
                const isCurrentMonth = dayDate.getMonth() === currentMonth;
                const isToday = dateStr === CURRENT_DATE_STRING;
                const isSelected = dateStr === toDateString(currentDate);

                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentDate(dayDate)}
                    className={`min-h-[100px] p-2 rounded-xl border transition-all flex flex-col justify-between group relative cursor-pointer ${
                      isToday
                        ? 'bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900 shadow-xs'
                        : isSelected
                        ? 'bg-zinc-100/70 border-zinc-300'
                        : isCurrentMonth
                        ? 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50'
                        : 'bg-zinc-50/40 border-zinc-100 opacity-40 hover:opacity-80'
                    }`}
                  >
                    {/* Day Number and Quick Add Button */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-zinc-900 text-white'
                            : isCurrentMonth
                            ? 'text-zinc-800'
                            : 'text-zinc-400'
                        }`}
                      >
                        {dayDate.getDate()}
                      </span>

                      {/* Quick Schedule Button on this day */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerSchedule(dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200/70 rounded text-zinc-500 hover:text-zinc-900 transition-opacity cursor-pointer"
                        title={`Lên lịch nhiệm vụ vào ngày ${formatVietnameseDate(dateStr)}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Day's Tasks Badges List */}
                    <div className="space-y-1 my-1 overflow-y-auto max-h-[64px] pr-0.5">
                      {dayTasks.map((t) => {
                        const priorityMeta = getPriorityMeta(t.mucDoUuTien);
                        const isOverdue = t.trangThai !== 'Đã hoàn thành' && getDaysDifference(t.thoiHan) < 0;

                        return (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTask(t);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-transform hover:scale-[1.01] cursor-pointer shadow-2xs truncate ${
                              t.trangThai === 'Đã hoàn thành'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : isOverdue
                                ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                            }`}
                            title={`[${t.id}] ${t.tenNhiemVu} (${t.donViChuTri}) - Ưu tiên: ${priorityMeta.fullLabel}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityMeta.dotClass}`} />
                            <span className="font-mono font-bold shrink-0">{t.id}</span>
                            <span className="truncate">{t.tenNhiemVu}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer count tag */}
                    <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-0.5">
                      <span>{dayTasks.length > 0 ? `${dayTasks.length} việc` : ''}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. CALENDAR CONTENT: WEEK VIEW */}
      {subView === 'week' && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] grid grid-cols-7 gap-2.5">
            {currentWeekDays.map((dayDate, idx) => {
              const dateStr = toDateString(dayDate);
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = dateStr === CURRENT_DATE_STRING;

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl p-3 border flex flex-col min-h-[460px] shadow-xs ${
                    isToday ? 'border-zinc-900 ring-1 ring-zinc-900 bg-zinc-50/40' : 'border-zinc-200/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="border-b border-zinc-100 pb-2 mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                        {weekDayNames[idx]}
                      </span>
                      <p className={`text-sm font-bold ${isToday ? 'text-zinc-950' : 'text-zinc-800'}`}>
                        {dayDate.getDate()}/{dayDate.getMonth() + 1}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {dayTasks.length}
                    </span>
                  </div>

                  {/* Task list for this day */}
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {dayTasks.length === 0 ? (
                      <div className="h-24 border border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center p-2 text-center text-zinc-400">
                        <p className="text-xs">Không có hạn việc</p>
                      </div>
                    ) : (
                      dayTasks.map((t) => {
                        const priorityMeta = getPriorityMeta(t.mucDoUuTien);
                        const isOverdue = t.trangThai !== 'Đã hoàn thành' && getDaysDifference(t.thoiHan) < 0;
                        const cat = t.category ? categoryMap.get(t.category) : null;
                        const catBadge = cat ? getCategoryBadgeClass(cat.color) : null;

                        return (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className="bg-zinc-50/80 hover:bg-zinc-100/70 p-2.5 rounded-xl border border-zinc-200/80 transition-all cursor-pointer shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="bg-zinc-200/70 text-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                                {t.id}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${priorityMeta.badgeClass}`}>
                                {priorityMeta.shortLabel}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-snug">
                              {t.tenNhiemVu}
                            </p>

                            <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{t.donViChuTri}</span>
                            </div>

                            {cat && (
                              <div className="pt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${catBadge}`}>
                                  {cat.name}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-zinc-200/60">
                              <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-500'}>
                                {t.trangThai}
                              </span>
                              <span className="font-semibold text-zinc-700">{t.tiendo}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add task button for this specific day */}
                  <button
                    type="button"
                    onClick={() => handleTriggerSchedule(dateStr)}
                    className="w-full mt-2 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm vào ngày này</span>
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. CALENDAR CONTENT: DAY VIEW */}
      {subView === 'day' && (
        <div className="space-y-3">
          {(() => {
            const dateStr = toDateString(currentDate);
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = dateStr === CURRENT_DATE_STRING;

            return (
              <div className="space-y-3">
                
                {/* Day Overview Banner */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Chi tiết ngày
                    </span>
                    <h3 className="text-base font-bold text-zinc-900">
                      {formatVietnameseDate(dateStr)} {isToday && '(Hôm nay)'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Có <strong className="text-zinc-800">{dayTasks.length}</strong> nhiệm vụ cần nghiệm thu hoặc rà soát tiến độ.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTriggerSchedule(dateStr)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lên lịch mới vào ngày {dateStr}</span>
                  </button>
                </div>

                {/* Day Tasks Detailed Cards */}
                {dayTasks.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-zinc-800">Không có nhiệm vụ nào chạm mốc hạn trong ngày này.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Bạn có thể bấm "Lên lịch mới" để giao việc hoặc chuyển sang ngày khác trên thanh điều hướng.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dayTasks.map((task) => {
                      const priorityMeta = getPriorityMeta(task.mucDoUuTien);
                      const isOverdue = task.trangThai !== 'Đã hoàn thành' && getDaysDifference(task.thoiHan) < 0;
                      const cat = task.category ? categoryMap.get(task.category) : null;
                      const catBadge = cat ? getCategoryBadgeClass(cat.color) : null;

                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-zinc-300 space-y-2.5 bg-white ${
                            isOverdue
                              ? 'border-rose-200'
                              : task.trangThai === 'Đã hoàn thành'
                              ? 'border-emerald-200'
                              : 'border-zinc-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-zinc-100 text-zinc-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-zinc-200">
                                {task.id}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border flex items-center gap-1 ${priorityMeta.badgeClass}`}>
                                <Flag className="w-2.5 h-2.5" />
                                <span>Ưu tiên: {priorityMeta.shortLabel}</span>
                              </span>
                            </div>

                            {cat && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border flex items-center gap-1 ${catBadge}`}>
                                <Tag className="w-2.5 h-2.5" />
                                <span>{cat.name}</span>
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 hover:text-zinc-950 transition-colors">
                              {task.tenNhiemVu}
                            </h4>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              <span className="font-medium text-zinc-700">Đơn vị chủ trì:</span> {task.donViChuTri} • Phụ trách: {task.nguoiPhuTrach}
                            </p>
                          </div>

                          <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/70 text-[11px] text-zinc-600">
                            <span className="font-semibold text-zinc-800">Sản phẩm đầu ra:</span> {task.sanPhamDauRa}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-[11px]">Trạng thái:</span>
                              <span className="font-semibold text-zinc-800 text-[11px]">{task.trangThai}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-[11px]">Tiến độ:</span>
                              <span className="font-semibold text-zinc-800 text-[11px] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                                {task.tiendo}%
                              </span>
                              <button className="px-2.5 py-1 text-[11px] font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer">
                                Xem
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
};
