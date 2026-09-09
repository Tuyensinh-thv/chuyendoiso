import React, { useState, useMemo } from 'react';
import { TaskNQ57, CustomCategory } from '../types';
import { getDaysDifference, formatVietnameseDate } from '../utils/dateUtils';
import { getPriorityMeta } from '../utils/storage';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  Layers, 
  Flag, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Info
} from 'lucide-react';

interface GanttViewProps {
  tasks: TaskNQ57[];
  onSelectTask: (task: TaskNQ57) => void;
  categories?: CustomCategory[];
}

export const GanttView: React.FC<GanttViewProps> = ({
  tasks,
  onSelectTask,
}) => {
  // Timeline Zoom Level: 'month' (default), 'quarter'
  const [zoomLevel, setZoomLevel] = useState<'month' | 'quarter'>('month');
  const [groupBy, setGroupBy] = useState<'none' | 'nhomKeHoach' | 'donViChuTri'>('nhomKeHoach');
  const [year, setYear] = useState<number>(2026);

  // Define the timeline bounds
  // Year 2026 timeline: 12 months (Jan 1, 2026 - Dec 31, 2026)
  const months = useMemo(() => [
    { num: 1, name: 'Thg 1', quarter: 'Q1' },
    { num: 2, name: 'Thg 2', quarter: 'Q1' },
    { num: 3, name: 'Thg 3', quarter: 'Q1' },
    { num: 4, name: 'Thg 4', quarter: 'Q2' },
    { num: 5, name: 'Thg 5', quarter: 'Q2' },
    { num: 6, name: 'Thg 6', quarter: 'Q2' },
    { num: 7, name: 'Thg 7', quarter: 'Q3' },
    { num: 8, name: 'Thg 8', quarter: 'Q3' },
    { num: 9, name: 'Thg 9', quarter: 'Q3' },
    { num: 10, name: 'Thg 10', quarter: 'Q4' },
    { num: 11, name: 'Thg 11', quarter: 'Q4' },
    { num: 12, name: 'Thg 12', quarter: 'Q4' },
  ], []);

  const quarters = useMemo(() => [
    { name: 'Quý 1 / 2026', months: 'Tháng 1 - 3', startMonth: 1, endMonth: 3 },
    { name: 'Quý 2 / 2026', months: 'Tháng 4 - 6', startMonth: 4, endMonth: 6 },
    { name: 'Quý 3 / 2026', months: 'Tháng 7 - 9', startMonth: 7, endMonth: 9 },
    { name: 'Quý 4 / 2026', months: 'Tháng 10 - 12', startMonth: 10, endMonth: 12 },
  ], []);

  // Calculate task bar position in percentage (0% to 100%) across the year 2026
  const getTaskCoordinates = (task: TaskNQ57) => {
    // Determine start date: use task.ngayBatDau or default to 30 days before deadline
    let startDateObj: Date;
    let endDateObj: Date;

    const partsEnd = task.thoiHan.split('-').map(Number);
    if (partsEnd.length === 3) {
      endDateObj = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);
    } else {
      endDateObj = new Date(year, 11, 31);
    }

    if (task.ngayBatDau) {
      const partsStart = task.ngayBatDau.split('-').map(Number);
      startDateObj = new Date(partsStart[0], partsStart[1] - 1, partsStart[2]);
    } else {
      // Default start date: 30-45 days prior, but not before Jan 1, 2026
      startDateObj = new Date(endDateObj.getTime() - 35 * 24 * 60 * 60 * 1000);
      if (startDateObj < new Date(year, 0, 1)) {
        startDateObj = new Date(year, 0, 1);
      }
    }

    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();
    const totalYearMs = yearEnd - yearStart;

    let startPct = ((startDateObj.getTime() - yearStart) / totalYearMs) * 100;
    let endPct = ((endDateObj.getTime() - yearStart) / totalYearMs) * 100;

    startPct = Math.max(0, Math.min(98, startPct));
    endPct = Math.max(startPct + 1.5, Math.min(100, endPct));
    const widthPct = Math.max(2, endPct - startPct);

    return { startPct, widthPct, startDateObj, endDateObj };
  };

  // Today marker calculation
  const todayPct = useMemo(() => {
    const today = new Date();
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();
    if (today.getFullYear() !== year) return -1;
    const pct = ((today.getTime() - yearStart) / (yearEnd - yearStart)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [year]);

  // Grouping tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupName: 'Tất cả nhiệm vụ', items: tasks }];
    }

    const map = new Map<string, TaskNQ57[]>();
    for (const t of tasks) {
      const key = groupBy === 'nhomKeHoach' ? t.nhomKeHoach : t.donViChuTri;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    return Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      items,
    }));
  }, [tasks, groupBy]);

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return { bar: 'bg-rose-500', fill: 'bg-rose-600', border: 'border-rose-600', text: 'text-rose-900' };
    switch (status) {
      case 'Đã hoàn thành':
        return { bar: 'bg-emerald-500', fill: 'bg-emerald-600', border: 'border-emerald-600', text: 'text-emerald-900' };
      case 'Hạn hôm nay':
        return { bar: 'bg-amber-500', fill: 'bg-amber-600', border: 'border-amber-600', text: 'text-amber-900' };
      case 'Sắp đến hạn':
        return { bar: 'bg-blue-500', fill: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-900' };
      case 'Đang thực hiện':
        return { bar: 'bg-zinc-700', fill: 'bg-zinc-900', border: 'border-zinc-800', text: 'text-zinc-900' };
      default:
        return { bar: 'bg-zinc-400', fill: 'bg-zinc-500', border: 'border-zinc-500', text: 'text-zinc-800' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col min-h-[600px] overflow-hidden">
      
      {/* 1. Base Wework Gantt Toolbar */}
      <div className="p-3.5 border-b border-zinc-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Năm {year}
            </span>
            <div className="flex items-center bg-white border border-zinc-200 rounded-lg shadow-2xs">
              <button
                onClick={() => setYear(year - 1)}
                className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Năm trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold px-2 text-zinc-800">{year}</span>
              <button
                onClick={() => setYear(year + 1)}
                className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Năm sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

          {/* Group By Selector (Base Wework Signature) */}
          <div className="flex items-center gap-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 font-medium">Nhóm theo:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-800 font-medium focus:outline-hidden focus:border-zinc-900"
            >
              <option value="nhomKeHoach">6 Nhóm Kế hoạch NQ57</option>
              <option value="donViChuTri">Đơn vị chủ trì</option>
              <option value="none">Không phân nhóm</option>
            </select>
          </div>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Hoàn thành
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-700" /> Đang làm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Sắp đến hạn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Quá hạn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" /> Hôm nay
            </span>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              onClick={() => setZoomLevel('month')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                zoomLevel === 'month'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Theo tháng (12T)
            </button>
            <button
              onClick={() => setZoomLevel('quarter')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                zoomLevel === 'quarter'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Theo quý (Q1-Q4)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Gantt Table & Timeline Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[750px] relative">
        <div className="min-w-[1050px]">
          
          {/* Header Row: Task List Columns + Timeline Header */}
          <div className="flex border-b border-zinc-200/90 bg-zinc-100 sticky top-0 z-20 text-xs font-semibold text-zinc-700">
            {/* Left Header: Task Info */}
            <div className="w-[340px] shrink-0 p-2.5 border-r border-zinc-200 flex items-center justify-between">
              <span>Nhiệm vụ NQ57 / Đơn vị</span>
              <span className="text-[11px] text-zinc-400 font-mono">Tiến độ</span>
            </div>

            {/* Right Header: Months or Quarters Grid */}
            <div className="flex-1 flex relative">
              {zoomLevel === 'month' ? (
                months.map((m) => (
                  <div
                    key={m.num}
                    className="flex-1 text-center py-2 border-r border-zinc-200/80 text-[11px] last:border-r-0"
                  >
                    <span className="block font-bold text-zinc-800">{m.name}</span>
                    <span className="text-[9px] text-zinc-400">{m.quarter}</span>
                  </div>
                ))
              ) : (
                quarters.map((q) => (
                  <div
                    key={q.name}
                    className="flex-1 text-center py-2 border-r border-zinc-200/80 text-[11px] last:border-r-0"
                  >
                    <span className="block font-bold text-zinc-800">{q.name}</span>
                    <span className="text-[10px] text-zinc-400">{q.months}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Body: Groups & Tasks */}
          <div className="divide-y divide-zinc-100 relative">
            
            {/* Today vertical line marker across all rows */}
            {todayPct >= 0 && (
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none border-l-2 border-red-500 border-dashed"
                style={{ left: `calc(340px + (100% - 340px) * ${todayPct / 100})` }}
              >
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full absolute -top-2 -translate-x-1/2 shadow-xs">
                  Hôm nay
                </span>
              </div>
            )}

            {groupedTasks.map((group, groupIdx) => (
              <div key={groupIdx} className="relative">
                
                {/* Group Heading Row */}
                {groupBy !== 'none' && (
                  <div className="bg-zinc-50/80 px-3 py-1.5 text-xs font-bold text-zinc-900 flex items-center justify-between border-b border-zinc-200/60 sticky left-0">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      {group.groupName}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono font-normal">
                      {group.items.length} nhiệm vụ
                    </span>
                  </div>
                )}

                {/* Task Rows */}
                {group.items.map((task) => {
                  const { startPct, widthPct } = getTaskCoordinates(task);
                  const isOverdue = task.trangThai === 'Quá hạn';
                  const color = getStatusColor(task.trangThai, isOverdue);
                  const priorityMeta = getPriorityMeta(task.mucDoUuTien);

                  return (
                    <div
                      key={task.id}
                      className="flex hover:bg-zinc-50/70 transition-colors group cursor-pointer text-xs"
                      onClick={() => onSelectTask(task)}
                    >
                      {/* Left: Task Info Cell */}
                      <div className="w-[340px] shrink-0 p-2.5 border-r border-zinc-200 flex items-center justify-between gap-2 overflow-hidden bg-white group-hover:bg-zinc-50/70">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono font-bold text-[10px] text-zinc-800 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                              {task.id}
                            </span>
                            <span className="text-[10px] text-zinc-500 truncate">
                              {task.donViChuTri}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotClass}`} />
                          </div>
                          <p className="font-medium text-zinc-900 truncate text-[11px]" title={task.tenNhiemVu}>
                            {task.tenNhiemVu}
                          </p>
                        </div>

                        {/* Progress Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono font-bold text-zinc-700">
                            {task.tiendo}%
                          </span>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Lane */}
                      <div className="flex-1 flex relative items-center py-2 px-1">
                        
                        {/* Background Grid Columns for alignment */}
                        <div className="absolute inset-0 flex pointer-events-none opacity-40">
                          {months.map((m) => (
                            <div key={m.num} className="flex-1 border-r border-zinc-200/60 last:border-r-0" />
                          ))}
                        </div>

                        {/* Interactive Gantt Bar */}
                        <div
                          className={`relative h-6 rounded-lg ${color.bar} text-white shadow-2xs flex items-center transition-all duration-150 group-hover:brightness-95 group-hover:shadow-xs overflow-hidden`}
                          style={{
                            left: `${startPct}%`,
                            width: `${widthPct}%`,
                            minWidth: '40px',
                          }}
                          title={`${task.id} - ${task.tenNhiemVu}\nHạn chót: ${formatVietnameseDate(task.thoiHan)}\nTiến độ: ${task.tiendo}%\nĐơn vị: ${task.donViChuTri}`}
                        >
                          {/* Completed Inner Progress Bar */}
                          <div
                            className={`h-full ${color.fill} transition-all duration-300 opacity-90`}
                            style={{ width: `${task.tiendo}%` }}
                          />

                          {/* Task Bar Label inside bar */}
                          <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold text-white pointer-events-none truncate drop-shadow-xs">
                            <span className="truncate">{task.id}</span>
                            <span className="text-[9px] font-mono opacity-90">{task.tiendo}%</span>
                          </div>
                        </div>

                        {/* Deadline marker right outside bar if narrow */}
                        <div 
                          className="absolute text-[10px] font-mono text-zinc-400 pointer-events-none hidden xl:block"
                          style={{ left: `calc(${startPct + widthPct}% + 8px)` }}
                        >
                          {formatVietnameseDate(task.thoiHan)}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          </div>

        </div>
      </div>

      {/* 3. Gantt Summary Footer */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Sơ đồ Gantt trực quan hóa tiến độ các nhiệm vụ theo dòng thời gian năm {year}. Bấm vào thanh công việc để xem chi tiết.</span>
        </div>
        <div className="font-semibold text-zinc-700">
          Tổng số: {tasks.length} nhiệm vụ hiển thị
        </div>
      </div>

    </div>
  );
};
