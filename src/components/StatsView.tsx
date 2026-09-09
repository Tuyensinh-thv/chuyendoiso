import React from 'react';
import { TaskNQ57 } from '../types';
import { PLAN_GROUPS, DEPARTMENTS } from '../data/initialData';
import { 
  TrendingUp, 
  Award, 
  AlertCircle,
  Building,
  Layers
} from 'lucide-react';

interface StatsViewProps {
  tasks: TaskNQ57[];
}

export const StatsView: React.FC<StatsViewProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
  const inProgress = tasks.filter((t) => t.trangThai === 'Đang thực hiện').length;
  const upcoming = tasks.filter((t) => t.trangThai === 'Sắp đến hạn').length;
  const overdue = tasks.filter((t) => t.trangThai === 'Quá hạn').length;

  const percentCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgProgress = total > 0 ? Math.round(tasks.reduce((s, t) => s + t.tiendo, 0) / total) : 0;

  // Stats by Department
  const departmentStats = DEPARTMENTS.map((dept) => {
    const deptTasks = tasks.filter((t) => t.donViChuTri === dept);
    const count = deptTasks.length;
    const deptCompleted = deptTasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
    const deptOverdue = deptTasks.filter((t) => t.trangThai === 'Quá hạn').length;
    const deptRate = count > 0 ? Math.round((deptCompleted / count) * 100) : 0;
    const totalProgress = count > 0 ? Math.round(deptTasks.reduce((s, t) => s + t.tiendo, 0) / count) : 0;

    return {
      dept,
      count,
      completed: deptCompleted,
      overdue: deptOverdue,
      rate: deptRate,
      avgProgress: totalProgress,
    };
  }).filter((d) => d.count > 0);

  // Stats by Plan Group
  const planGroupStats = PLAN_GROUPS.map((group) => {
    const groupTasks = tasks.filter((t) => t.nhomKeHoach === group);
    const count = groupTasks.length;
    const groupCompleted = groupTasks.filter((t) => t.trangThai === 'Đã hoàn thành').length;
    const groupOverdue = groupTasks.filter((t) => t.trangThai === 'Quá hạn').length;
    const groupAvg = count > 0 ? Math.round(groupTasks.reduce((s, t) => s + t.tiendo, 0) / count) : 0;

    return {
      group,
      count,
      completed: groupCompleted,
      overdue: groupOverdue,
      avgProgress: groupAvg,
    };
  });

  // Calculate circumference for circular gauge (radius 50)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentCompleted / 100) * circumference;

  return (
    <div className="space-y-4 text-zinc-900">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Completion Rate */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Tỷ lệ hoàn thành toàn trường
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 my-1">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={32}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-zinc-100"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={32}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={(2 * Math.PI * 32) - (percentCompleted / 100) * (2 * Math.PI * 32)}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-bold text-zinc-900">{percentCompleted}%</span>
              </div>
            </div>

            <div>
              <p className="text-xl font-bold text-zinc-900">{completed} / {total}</p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">Nhiệm vụ xong 100%</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Mục tiêu HVU: ≥ 85%</p>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
            Còn <strong className="text-zinc-800">{total - completed}</strong> nhiệm vụ đang triển khai.
          </div>
        </div>

        {/* Card 2: Average Progress */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Tiến độ bình quân
            </span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">
                {avgProgress}%
              </span>
              <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                Khối lượng công việc
              </span>
            </div>
            
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
            Tính trên khối lượng cập nhật thường xuyên bởi các đơn vị.
          </p>
        </div>

        {/* Card 3: Risk Warning */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Cần rà soát / đôn đốc
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">{overdue + upcoming}</span>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                {overdue} quá hạn • {upcoming} cận hạn
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs">
              <div className="flex-1 bg-zinc-50 p-2 rounded-xl border border-zinc-200/80 text-center">
                <span className="text-rose-600 font-bold block text-sm">{overdue}</span>
                <span className="text-[10px] text-zinc-500">Quá hạn</span>
              </div>
              <div className="flex-1 bg-zinc-50 p-2 rounded-xl border border-zinc-200/80 text-center">
                <span className="text-amber-600 font-bold block text-sm">{upcoming}</span>
                <span className="text-[10px] text-zinc-500">Cận hạn</span>
              </div>
              <div className="flex-1 bg-zinc-50 p-2 rounded-xl border border-zinc-200/80 text-center">
                <span className="text-zinc-800 font-bold block text-sm">{inProgress}</span>
                <span className="text-[10px] text-zinc-500">Bình thường</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
            Cần lãnh đạo trường và đơn vị tháo gỡ khó khăn kịp thời.
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Department Progress Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-600" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Tiến độ theo Đơn vị chủ trì
              </h3>
            </div>
            <span className="text-xs text-zinc-400">{departmentStats.length} đơn vị</span>
          </div>

          <div className="space-y-2.5">
            {departmentStats.map((item) => (
              <div key={item.dept} className="space-y-1.5 bg-zinc-50/60 p-2.5 rounded-xl border border-zinc-200/70">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{item.dept}</span>
                    <span className="text-zinc-400 text-[11px]">({item.count} nhiệm vụ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.overdue > 0 && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                        {item.overdue} quá hạn
                      </span>
                    )}
                    <span className="font-semibold text-zinc-800">{item.avgProgress}%</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-200/80 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.avgProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Plan Groups Progress */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-600" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Tiến độ 6 Nhóm Kế hoạch NQ57
              </h3>
            </div>
            <span className="text-xs text-zinc-400">48 nhiệm vụ</span>
          </div>

          <div className="space-y-2.5">
            {planGroupStats.map((group) => (
              <div key={group.group} className="p-2.5 bg-zinc-50/60 rounded-xl border border-zinc-200/70 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900">{group.group}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Đã hoàn thành {group.completed}/{group.count} nhiệm vụ
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded-full shrink-0">
                    {group.avgProgress}%
                  </span>
                </div>

                <div className="w-full bg-zinc-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-800 h-full rounded-full transition-all"
                    style={{ width: `${group.avgProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
