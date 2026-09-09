import { TaskNQ57, TaskStatus } from '../types';

// The baseline date dynamically defaults to current date (ISO YYYY-MM-DD)
export const CURRENT_DATE_STRING = new Date().toISOString().split('T')[0];

export function getDaysDifference(deadlineStr: string, baseDateStr = CURRENT_DATE_STRING): number {
  if (!deadlineStr) return 999;
  const deadline = new Date(deadlineStr);
  const base = new Date(baseDateStr);
  const diffTime = deadline.getTime() - base.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function computeTaskStatus(task: TaskNQ57, baseDateStr = CURRENT_DATE_STRING): TaskStatus {
  if (task.trangThai === 'Đã hoàn thành') {
    return 'Đã hoàn thành';
  }
  const daysDiff = getDaysDifference(task.thoiHan, baseDateStr);
  if (daysDiff < 0) {
    return 'Quá hạn';
  }
  if (daysDiff <= 3) {
    return 'Sắp đến hạn';
  }
  if (task.tiendo > 0 || task.trangThai === 'Đang thực hiện') {
    return 'Đang thực hiện';
  }
  return 'Chưa thực hiện';
}

export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return 'Chưa xác định';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function formatDeadlineBadge(deadlineStr: string, baseDateStr = CURRENT_DATE_STRING): {
  label: string;
  isUrgent: boolean;
  isOverdue: boolean;
  colorClass: string;
} {
  const diff = getDaysDifference(deadlineStr, baseDateStr);
  if (diff < 0) {
    const overdueDays = Math.abs(diff);
    return {
      label: `Quá hạn ${overdueDays} ngày`,
      isUrgent: true,
      isOverdue: true,
      colorClass: 'bg-rose-100 text-rose-700 border border-rose-200 font-medium',
    };
  }
  if (diff === 0) {
    return {
      label: 'Hạn chót: Hôm nay!',
      isUrgent: true,
      isOverdue: false,
      colorClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold animate-pulse',
    };
  }
  if (diff === 1) {
    return {
      label: 'Hạn chót: Ngày mai',
      isUrgent: true,
      isOverdue: false,
      colorClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-medium',
    };
  }
  if (diff <= 3) {
    return {
      label: `Còn ${diff} ngày`,
      isUrgent: true,
      isOverdue: false,
      colorClass: 'bg-orange-100 text-orange-800 border border-orange-200 font-medium',
    };
  }
  return {
    label: `Còn ${diff} ngày`,
    isUrgent: false,
    isOverdue: false,
    colorClass: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
