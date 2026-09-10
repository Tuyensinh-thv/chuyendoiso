import React from 'react';
import { TaskNQ57 } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity, 
  Layers 
} from 'lucide-react';

interface QuickStatusBarProps {
  tasks: TaskNQ57[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const QuickStatusBar: React.FC<QuickStatusBarProps> = ({
  tasks,
  selectedStatus,
  onSelectStatus,
}) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
  const inProgress = tasks.filter((t) => t.trangThai === 'Đang thực hiện').length;
  const upcoming = tasks.filter((t) => t.trangThai === 'Sắp đến hạn').length;
  const overdue = tasks.filter((t) => t.trangThai === 'Quá hạn').length;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const items = [
    {
      id: '',
      label: 'Tất cả nhiệm vụ',
      count: total,
      sub: `${percent}% hoàn thành`,
      icon: Layers,
      badgeColor: 'bg-slate-100 text-[#0B2545]',
      activeStyle: 'border-[#0B2545] ring-2 ring-[#0B2545]/15 bg-slate-50/90 text-slate-900',
      activeBadgeColor: 'bg-[#0B2545] text-white',
      countColor: 'text-[#0B2545]',
    },
    {
      id: 'Đã hoàn thành',
      label: 'Đã hoàn thành',
      count: completed,
      sub: `${total > 0 ? Math.round((completed / total) * 100) : 0}% tổng số`,
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-100 text-emerald-700',
      activeStyle: 'border-emerald-600 ring-2 ring-emerald-500/15 bg-emerald-50/50 text-emerald-950',
      activeBadgeColor: 'bg-emerald-600 text-white',
      countColor: 'text-emerald-700',
    },
    {
      id: 'Đang thực hiện',
      label: 'Đang thực hiện',
      count: inProgress,
      sub: 'Đang xúc tiến',
      icon: Activity,
      badgeColor: 'bg-sky-100 text-sky-700',
      activeStyle: 'border-sky-600 ring-2 ring-sky-500/15 bg-sky-50/50 text-sky-950',
      activeBadgeColor: 'bg-sky-600 text-white',
      countColor: 'text-sky-700',
    },
    {
      id: 'Sắp đến hạn',
      label: 'Sắp đến hạn',
      count: upcoming,
      sub: 'Cần chú ý',
      icon: Clock,
      badgeColor: 'bg-amber-100 text-amber-700',
      activeStyle: 'border-amber-600 ring-2 ring-amber-500/15 bg-amber-50/50 text-amber-950',
      activeBadgeColor: 'bg-amber-600 text-white',
      countColor: 'text-amber-700',
    },
    {
      id: 'Quá hạn',
      label: 'Quá hạn',
      count: overdue,
      sub: 'Cần đôn đốc ngay',
      icon: AlertTriangle,
      badgeColor: 'bg-rose-100 text-rose-700',
      activeStyle: 'border-rose-600 ring-2 ring-rose-500/15 bg-rose-50/50 text-rose-950',
      activeBadgeColor: 'bg-rose-600 text-white',
      countColor: 'text-rose-700',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = selectedStatus === item.id || (!selectedStatus && item.id === '');
          const spanClass = index === 0 ? 'col-span-2 sm:col-span-1' : 'col-span-1';

          return (
            <button
              key={item.id}
              onClick={() => onSelectStatus(isActive && item.id !== '' ? '' : item.id)}
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
  );
};
