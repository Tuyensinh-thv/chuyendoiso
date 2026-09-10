import React, { useState } from 'react';
import { 
  Calendar, 
  Paperclip, 
  MessageSquareQuote, 
  Flag, 
  Tag, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2,
  ShieldCheck,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { TaskNQ57, TaskStatus, UserAccount, CustomCategory } from '../types';
import { formatVietnameseDate, formatDeadlineBadge, getDaysDifference } from '../utils/dateUtils';
import { getPriorityMeta, getCategoryBadgeClass } from '../utils/storage';

interface KanbanBoardProps {
  tasks: TaskNQ57[];
  onSelectTask: (task: TaskNQ57) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  currentUser: UserAccount;
  categories?: CustomCategory[];
  recommendedTaskIds?: string[];
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  headerBorder: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'Chưa thực hiện',
    title: 'CHƯA THỰC HIỆN',
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-600',
    headerBorder: 'border-t-zinc-300',
    dotColor: 'bg-zinc-400',
  },
  {
    id: 'Đang thực hiện',
    title: 'ĐANG THỰC HIỆN',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    headerBorder: 'border-t-sky-400',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'Sắp đến hạn',
    title: 'SẮP ĐẾN HẠN / CẦN GẤP',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    headerBorder: 'border-t-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'Đã hoàn thành',
    title: 'ĐÃ HOÀN THÀNH',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    headerBorder: 'border-t-emerald-400',
    dotColor: 'bg-emerald-500',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onSelectTask,
  onUpdateTaskStatus,
  currentUser,
  categories = [],
  recommendedTaskIds = [],
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const getTasksForColumn = (columnId: TaskStatus) => {
    return tasks.filter((task) => {
      if (columnId === 'Sắp đến hạn') {
        return task.trangThai === 'Sắp đến hạn' || task.trangThai === 'Quá hạn';
      }
      return task.trangThai === columnId;
    });
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: TaskStatus) => {
    if (draggedTaskId) {
      onUpdateTaskStatus(draggedTaskId, columnId);
      setDraggedTaskId(null);
    }
  };

  // 1-Click quick status advance
  const handleQuickAdvanceStatus = (e: React.MouseEvent, task: TaskNQ57) => {
    e.stopPropagation();
    if (task.trangThai === 'Chưa thực hiện') {
      onUpdateTaskStatus(task.id, 'Đang thực hiện');
    } else if (task.trangThai === 'Đang thực hiện' || task.trangThai === 'Sắp đến hạn' || task.trangThai === 'Quá hạn') {
      onUpdateTaskStatus(task.id, 'Đã hoàn thành');
    } else {
      onUpdateTaskStatus(task.id, 'Chưa thực hiện');
    }
  };

  return (
    <div className="flex overflow-x-auto pb-4 gap-3 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 md:overflow-visible items-start scrollbar-thin">
      {COLUMNS.map((column) => {
        const columnTasks = getTasksForColumn(column.id);

        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
            className={`w-[85vw] sm:w-[320px] md:w-auto shrink-0 snap-center md:shrink bg-zinc-100/70 rounded-2xl border border-zinc-200/90 flex flex-col max-h-[calc(100vh-14rem)] overflow-hidden border-t-4 ${column.headerBorder}`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-zinc-200/80 bg-white/70 backdrop-blur-xs flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                <h3 className="font-bold text-xs text-zinc-800 tracking-wide">
                  {column.title}
                </h3>
              </div>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${column.badgeBg} ${column.badgeText} border border-zinc-200/60`}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column Task Cards Container */}
            <div className="p-2 space-y-2.5 overflow-y-auto flex-1 scrollbar-thin">
              {columnTasks.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs italic">
                  Không có nhiệm vụ nào
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isOverdue = task.trangThai === 'Quá hạn' || (task.trangThai !== 'Đã hoàn thành' && getDaysDifference(task.thoiHan) < 0);
                  const filesCount = task.filesMinhChung?.length || 0;
                  const deadlineInfo = formatDeadlineBadge(task.thoiHan);
                  const priorityMeta = getPriorityMeta(task.mucDoUuTien);
                  const isAiRecommended = recommendedTaskIds.includes(task.id);
                  const checklistTotal = task.checklist?.length || 0;
                  const checklistDone = task.checklist?.filter((c) => c.completed).length || 0;
                  const commentsCount = task.comments?.length || 0;
                  const approvalStatus = task.approvalStatus || (task.tiendo === 100 ? 'Da_Duyet' : filesCount > 0 ? 'Cho_Duyet' : 'Chua_Nop');

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onClick={() => onSelectTask(task)}
                      className={`bg-white rounded-xl p-3 border shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none ${
                        isOverdue 
                          ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {/* Top row: ID, AI Rec, Priority, Approval */}
                      <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            {task.id}
                          </span>
                          
                          {/* Priority Badge */}
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityMeta.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dotClass}`} />
                            {priorityMeta.shortLabel}
                          </span>

                          {isAiRecommended && (
                            <span 
                              className="p-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200"
                              title="Gợi ý AI trọng tâm"
                            >
                              <Sparkles className="w-3 h-3" />
                            </span>
                          )}

                          {isOverdue && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-full animate-pulse">
                              Quá hạn
                            </span>
                          )}
                        </div>

                        {/* Base Wework Approval Indicator */}
                        {approvalStatus === 'Cho_Duyet' && (
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Chờ duyệt
                          </span>
                        )}
                        {approvalStatus === 'Da_Duyet' && (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Đã duyệt
                          </span>
                        )}
                      </div>

                      {/* Optional Category Tag */}
                      {(() => {
                        const cat = categories?.find((c) => c.id === task.category || c.name === task.category);
                        if (!cat) return null;
                        const catClass = getCategoryBadgeClass(cat.color);
                        return (
                          <div className="mb-1.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${catClass}`}>
                              <Tag className="w-2.5 h-2.5" />
                              <span>{cat.name}</span>
                            </span>
                          </div>
                        );
                      })()}

                      {/* Task Name */}
                      <h4 className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-snug mb-2 group-hover:text-zinc-950 transition-colors">
                        {task.tenNhiemVu}
                      </h4>

                      {/* Assignee / Department with Avatar */}
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium mb-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {task.nguoiPhuTrach ? task.nguoiPhuTrach.trim().charAt(task.nguoiPhuTrach.trim().lastIndexOf(' ') + 1) || 'N' : '👤'}
                        </div>
                        <span className="truncate">{task.donViChuTri} • {task.nguoiPhuTrach}</span>
                      </div>

                      {/* Deadline */}
                      <div className="mb-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded inline-flex items-center gap-1 border ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : task.trangThai === 'Đã hoàn thành'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : task.trangThai === 'Sắp đến hạn'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>Hạn: {formatVietnameseDate(task.thoiHan)} ({deadlineInfo.label})</span>
                        </span>
                      </div>

                      {/* Leadership Directive Callout if present */}
                      {task.yKienChiDao && (
                        <div className="mb-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200/80 text-[11px] text-zinc-700">
                          <p className="font-semibold flex items-center gap-1 text-zinc-800">
                            <MessageSquareQuote className="w-3 h-3 text-zinc-500" />
                            <span>Chỉ đạo BGH:</span>
                          </p>
                          <p className="line-clamp-2 italic mt-0.5 text-zinc-600">"{task.yKienChiDao}"</p>
                        </div>
                      )}

                      {/* Bottom row: Subtasks count, Comments, Progress & 1-Click Status */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                        {/* Evidence & Checklist badges */}
                        <div className="flex items-center gap-2">
                          <span 
                            className={`inline-flex items-center gap-1 ${
                              filesCount > 0 ? 'text-zinc-800 font-medium' : 'text-zinc-400'
                            }`}
                            title={filesCount > 0 ? `Đã có ${filesCount} file minh chứng Google Drive` : 'Chưa có file minh chứng'}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{filesCount}</span>
                          </span>

                          {checklistTotal > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 text-zinc-600 font-mono text-[10px]"
                              title={`Checklist: ${checklistDone}/${checklistTotal}`}
                            >
                              <CheckSquare className="w-3 h-3 text-zinc-400" />
                              <span>{checklistDone}/{checklistTotal}</span>
                            </span>
                          )}

                          {commentsCount > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 text-zinc-600 font-mono text-[10px]"
                              title={`Thảo luận: ${commentsCount} bình luận`}
                            >
                              <MessageSquare className="w-3 h-3 text-zinc-400" />
                              <span>{commentsCount}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Progress bar */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  task.tiendo === 100
                                    ? 'bg-emerald-500'
                                    : isOverdue
                                    ? 'bg-rose-500'
                                    : 'bg-zinc-800'
                                }`}
                                style={{ width: `${task.tiendo}%` }}
                              />
                            </div>
                            <span className="font-semibold text-zinc-700 text-[11px]">{task.tiendo}%</span>
                          </div>

                          {/* Quick 1-Click Status Cycle Button */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdvanceStatus(e, task)}
                            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                            title="Chuyển nhanh trạng thái tiếp theo"
                            aria-label="Chuyển nhanh trạng thái"
                          >
                            {task.trangThai === 'Đã hoàn thành' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
