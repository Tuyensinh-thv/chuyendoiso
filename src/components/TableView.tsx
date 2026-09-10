import React, { useState, useEffect } from 'react';
import { 
  Paperclip, 
  ChevronRight, 
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Flag,
  Tag,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Check
} from 'lucide-react';
import { TaskNQ57, TaskStatus, UserAccount, CustomCategory } from '../types';
import { formatVietnameseDate, formatDeadlineBadge, getDaysDifference } from '../utils/dateUtils';
import { getPriorityMeta, getCategoryBadgeClass, normalizePriority } from '../utils/storage';

interface TableViewProps {
  tasks: TaskNQ57[];
  onSelectTask: (task: TaskNQ57) => void;
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTaskProgress?: (taskId: string, newProgress: number) => void;
  onApproveTask?: (taskId: string) => void;
  currentUser: UserAccount;
  categories?: CustomCategory[];
  recommendedTaskIds?: string[];
}

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  onSelectTask,
  onUpdateTaskStatus,
  onUpdateTaskProgress,
  onApproveTask,
  currentUser,
  categories = [],
  recommendedTaskIds = [],
}) => {
  const [sortField, setSortField] = useState<keyof TaskNQ57>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: keyof TaskNQ57) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Special sorting for Priority level (High > Medium > Low)
    if (sortField === 'mucDoUuTien') {
      const pA = normalizePriority(a.mucDoUuTien);
      const pB = normalizePriority(b.mucDoUuTien);
      const score = (p: string) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1);
      const diff = score(pA) - score(pB);
      return sortAsc ? diff : -diff;
    }

    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Reset to page 1 when tasks list changes (e.g. filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  const totalTasks = sortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTasks);
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  const getStatusPill = (task: TaskNQ57) => {
    const isOverdue = task.trangThai === 'Quá hạn' || (task.trangThai !== 'Đã hoàn thành' && getDaysDifference(task.thoiHan) < 0);

    let containerClass = 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100';
    let iconColor = 'text-zinc-400';
    let icon = <Clock className="w-4.5 h-4.5" />;
    let label = 'Chờ';
    let labelColor = 'text-zinc-500';

    if (task.trangThai === 'Đã hoàn thành') {
      containerClass = 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 ring-1 ring-emerald-200/50';
      iconColor = 'text-emerald-600';
      icon = <CheckCircle2 className="w-4.5 h-4.5" />;
      label = 'Xong';
      labelColor = 'text-emerald-700 font-bold';
    } else if (isOverdue) {
      containerClass = 'bg-rose-50 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-200/50';
      iconColor = 'text-rose-600';
      icon = <AlertCircle className="w-4.5 h-4.5" />;
      label = 'Trễ hạn';
      labelColor = 'text-rose-700 font-bold';
    } else if (task.trangThai === 'Sắp đến hạn') {
      containerClass = 'bg-amber-50 border-amber-300 hover:bg-amber-100 ring-1 ring-amber-200/50';
      iconColor = 'text-amber-600';
      icon = <AlertTriangle className="w-4.5 h-4.5" />;
      label = 'Gấp';
      labelColor = 'text-amber-700 font-semibold';
    } else if (task.trangThai === 'Đang thực hiện') {
      containerClass = 'bg-sky-50 border-sky-300 hover:bg-sky-100 ring-1 ring-sky-200/50';
      iconColor = 'text-sky-600';
      icon = <Clock className="w-4.5 h-4.5" />;
      label = 'Đang';
      labelColor = 'text-sky-700 font-semibold';
    }

    const fullLabel = task.trangThai === 'Đã hoàn thành' ? 'Đã hoàn thành' 
      : isOverdue ? 'Quá hạn'
      : task.trangThai;

    return (
      <button
        type="button"
        onClick={(e) => {
          if (!onUpdateTaskStatus) return;
          e.stopPropagation();
          if (task.trangThai === 'Chưa thực hiện') {
            onUpdateTaskStatus(task.id, 'Đang thực hiện');
          } else if (task.trangThai === 'Đang thực hiện') {
            onUpdateTaskStatus(task.id, 'Đã hoàn thành');
          } else if (task.trangThai === 'Đã hoàn thành') {
            onUpdateTaskStatus(task.id, 'Chưa thực hiện');
          }
        }}
        className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg border transition-all cursor-pointer hover:shadow-xs mx-auto ${containerClass}`}
        title={`Trạng thái: ${fullLabel} — Nhấp để đổi nhanh`}
      >
        <span className={iconColor}>{icon}</span>
        <span className={`text-[10px] leading-tight whitespace-nowrap ${labelColor}`}>{label}</span>
      </button>
    );
  };

  const getApprovalBadge = (task: TaskNQ57) => {
    const status = task.approvalStatus || (task.tiendo === 100 ? 'Da_Duyet' : task.filesMinhChung?.length ? 'Cho_Duyet' : 'Chua_Nop');

    if (status === 'Da_Duyet') {
      return (
        <span 
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs mx-auto"
          title="Đã duyệt nghiệm thu hoàn thành"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
        </span>
      );
    }
    if (status === 'Cho_Duyet') {
      return (
        <span 
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs mx-auto animate-pulse"
          title="Đang chờ duyệt nghiệm thu — Nhấp xem chi tiết để phê duyệt"
        >
          <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      );
    }
    if (status === 'Yeu_Cau_Sua') {
      return (
        <span 
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs mx-auto"
          title="Yêu cầu sửa minh chứng"
        >
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      );
    }
    return (
      <span className="text-zinc-300 text-[11px]">-</span>
    );
  };

  const formatFirstSentence = (text?: string) => {
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^([^.?!\n]+[.?!]?)/);
    let sentence = match ? match[1].trim() : trimmed;
    if (sentence.length < trimmed.length && !sentence.endsWith('...')) {
      sentence = sentence.replace(/[.?!]$/, '') + '...';
    }
    return sentence;
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
      {/* Mobile Card List (< md) */}
      <div className="block md:hidden divide-y divide-zinc-200">
        {paginatedTasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Không tìm thấy nhiệm vụ nào phù hợp.
          </div>
        ) : (
          paginatedTasks.map((task) => {
            const pMeta = getPriorityMeta(task.mucDoUuTien);
            const filesCount = task.filesMinhChung?.length || 0;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer space-y-2.5"
              >
                {/* Header: Checkbox + ID + Priority + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.tiendo === 100 || task.trangThai === 'Đã hoàn thành'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (onUpdateTaskProgress) {
                          onUpdateTaskProgress(task.id, checked ? 100 : 0);
                        } else if (onUpdateTaskStatus) {
                          onUpdateTaskStatus(task.id, checked ? 'Đã hoàn thành' : 'Đang thực hiện');
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-xs text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                      {task.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${pMeta.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dotClass}`} />
                      {pMeta.shortLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getStatusPill(task)}
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2">
                    {task.tenNhiemVu}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                    <span className="font-medium text-zinc-700">{task.donViChuTri}</span>
                    {task.nguoiPhuTrach && (
                      <>
                        <span>•</span>
                        <span className="truncate">{task.nguoiPhuTrach}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar & Deadline */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-[11px]">
                  <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                    <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          task.tiendo === 100 ? 'bg-emerald-500' : task.tiendo >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${task.tiendo || 0}%` }}
                      />
                    </div>
                    <span className="font-bold text-[10px] tabular-nums text-zinc-600 shrink-0">
                      {task.tiendo || 0}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {filesCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        <Paperclip className="w-3 h-3" />
                        {filesCount}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-zinc-600 font-medium text-[11px]">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formatVietnameseDate(task.thoiHan)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200/90 bg-zinc-50/80 text-zinc-600 uppercase text-[11px] font-semibold tracking-wider select-none">
              <th className="py-3 px-2 w-9 text-center" title="Đánh dấu hoàn thành nhanh">
                <span className="sr-only">Hoàn thành</span>
                ✓
              </th>
              <th className="py-3 px-1 w-9 text-center" title="Xem chi tiết nhiệm vụ">
                <span className="sr-only">Chi tiết</span>
              </th>
              <th 
                onClick={() => handleSort('id')}
                className="py-3 px-2 cursor-pointer hover:bg-zinc-100/70 w-14 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Mã NV</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('mucDoUuTien')}
                className="py-3 px-2 cursor-pointer hover:bg-zinc-100/70 w-20 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Ưu tiên</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('tenNhiemVu')}
                className="py-3 px-3 cursor-pointer hover:bg-zinc-100/70 min-w-[360px] lg:min-w-[440px]"
              >
                <div className="flex items-center gap-1">
                  <span>Tên nhiệm vụ NQ57</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('donViChuTri')}
                className="py-3 px-3 cursor-pointer hover:bg-zinc-100/70 w-44 min-w-[140px]"
              >
                <div className="flex items-center gap-1">
                  <span>Đơn vị chủ trì</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('thoiHan')}
                className="py-3 px-2 cursor-pointer hover:bg-zinc-100/70 w-28 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Thời hạn</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('trangThai')}
                className="py-3 px-1 cursor-pointer hover:bg-zinc-100/70 w-20 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>T.Thái</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('tiendo')}
                className="py-3 px-1 cursor-pointer hover:bg-zinc-100/70 w-16 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Tiến độ</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                </div>
              </th>
              <th className="py-3 px-1 w-16 text-center">
                Nghiệm thu
              </th>
              <th className="py-3 px-1 w-14 text-center">
                M.Chứng
              </th>
              <th className="py-3 px-2 min-w-[120px]">
                Ý kiến BGH
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {paginatedTasks.map((task) => {
              const filesCount = task.filesMinhChung?.length || 0;
              const deadlineBadge = formatDeadlineBadge(task.thoiHan);
              const pMeta = getPriorityMeta(task.mucDoUuTien);
              const cat = categories.find((c) => c.id === task.category || c.name === task.category);
              const catClass = cat ? getCategoryBadgeClass(cat.color) : null;
              const isAiRecommended = recommendedTaskIds.includes(task.id);
              const checklistCompleted = task.checklist?.filter((c) => c.completed).length || 0;
              const checklistTotal = task.checklist?.length || 0;

              return (
                <tr 
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                >
                  {/* Quick Complete Checkbox */}
                  <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={task.tiendo === 100 || task.trangThai === 'Đã hoàn thành'}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (onUpdateTaskProgress) {
                          onUpdateTaskProgress(task.id, checked ? 100 : 0);
                        } else if (onUpdateTaskStatus) {
                          onUpdateTaskStatus(task.id, checked ? 'Đã hoàn thành' : 'Đang thực hiện');
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                      title={task.tiendo === 100 ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành 100%'}
                    />
                  </td>

                  {/* View Detail Button (2nd column on the left) */}
                  <td className="py-2.5 px-1 text-center">
                    <span 
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 font-bold group-hover:bg-[#0B2545] group-hover:text-white group-hover:border-[#0B2545] transition-all duration-150 shadow-2xs group-hover:shadow-xs cursor-pointer"
                      title="Xem chi tiết nhiệm vụ"
                    >
                      <ChevronRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </td>

                  <td className="py-2.5 px-2 font-semibold text-center text-zinc-600 font-mono">
                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[11px] border border-zinc-200">
                      {task.id}
                    </span>
                  </td>

                  {/* Priority Column Badge */}
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${pMeta.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dotClass}`} />
                      {pMeta.shortLabel}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 min-w-[360px] lg:min-w-[440px]">
                    <div className="flex items-start gap-1.5">
                      <p className="font-semibold text-zinc-900 group-hover:text-zinc-950 transition-colors leading-snug">
                        {task.tenNhiemVu}
                      </p>
                      {isAiRecommended && (
                        <span 
                          className="shrink-0 p-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 mt-0.5"
                          title="Gợi ý trọng tâm AI"
                        >
                          <Sparkles className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-zinc-400">
                        {task.nhomKeHoach}
                      </span>
                      {cat && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border inline-flex items-center gap-1 ${catClass}`}>
                          <Tag className="w-2.5 h-2.5" />
                          {cat.name}
                        </span>
                      )}
                      {checklistTotal > 0 && (
                        <span className="text-[10px] text-zinc-500 font-mono inline-flex items-center gap-0.5 bg-zinc-50 px-1 rounded border border-zinc-200">
                          <CheckSquare className="w-2.5 h-2.5 text-zinc-400" />
                          {checklistCompleted}/{checklistTotal}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <p className="font-medium text-zinc-800 leading-snug">{task.donViChuTri}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{task.nguoiPhuTrach}</p>
                  </td>

                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <p className="font-semibold text-zinc-800">{formatVietnameseDate(task.thoiHan)}</p>
                    <p className="text-[10px] mt-0.5 text-zinc-500">
                      {deadlineBadge.label}
                    </p>
                  </td>

                  <td className="py-2.5 px-1 text-center">
                    {getStatusPill(task)}
                  </td>

                  {/* Compact Progress Column: % only */}
                  <td className="py-2.5 px-1 text-center">
                    <span 
                      className={`inline-block font-bold text-[11px] tabular-nums px-2 py-0.5 rounded-md ${
                        task.tiendo === 100 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : task.tiendo > 0 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-zinc-50 text-zinc-500 border border-zinc-200'
                      }`}
                      title={`Tiến độ hiện tại: ${task.tiendo}%`}
                    >
                      {task.tiendo}%
                    </span>
                  </td>

                  {/* Approval / Completion Status Icon */}
                  <td className="py-2.5 px-1 text-center">
                    {getApprovalBadge(task)}
                  </td>

                  {/* Evidence Column: Icon only for attachment presence */}
                  <td className="py-2.5 px-1 text-center">
                    {filesCount > 0 ? (
                      <span 
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs mx-auto"
                        title={`Đã có ${filesCount} tệp minh chứng đính kèm`}
                      >
                        <Paperclip className="w-3.5 h-3.5 stroke-[2.2]" />
                      </span>
                    ) : (
                      <span 
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-50 text-zinc-300 border border-dashed border-zinc-200 mx-auto"
                        title="Chưa có minh chứng đính kèm"
                      >
                        <Paperclip className="w-3.5 h-3.5 opacity-40" />
                      </span>
                    )}
                  </td>

                  {/* BGH Opinion Column: First sentence + ... */}
                  <td className="py-2.5 px-2">
                    {task.yKienChiDao ? (
                      <p 
                        className="text-zinc-700 font-medium text-[11px] truncate max-w-[180px] xl:max-w-[260px] bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200"
                        title={task.yKienChiDao}
                      >
                        {formatFirstSentence(task.yKienChiDao)}
                      </p>
                    ) : (
                      <span className="text-zinc-300 italic text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar - 10 rows per page */}
      <div className="p-3.5 bg-white border-t border-zinc-200 text-xs text-zinc-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>
            Hiển thị <strong className="text-zinc-900 font-semibold">{totalTasks === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-zinc-900 font-semibold">{endIndex}</strong> trên tổng số <strong className="text-zinc-900 font-semibold">{totalTasks}</strong> nhiệm vụ
          </span>
          <span className="text-zinc-300 hidden sm:inline">|</span>
          <span className="text-zinc-500 hidden sm:inline">
            Trang <strong className="text-zinc-800">{safeCurrentPage}</strong> / {totalPages} (10 dòng/trang)
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-700 cursor-pointer"
              title="Trang đầu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-700 cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - safeCurrentPage) <= 1;
                })
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-zinc-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const pageNum = item as number;
                  const isActive = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-700 cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-700 cursor-pointer"
              title="Trang cuối"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
