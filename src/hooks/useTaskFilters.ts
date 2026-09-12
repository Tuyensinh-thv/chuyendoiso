import { useMemo } from 'react';
import { TaskNQ57, UserAccount, BaseWeworkPerspective } from '../types';
import { getDaysDifference } from '../utils/dateUtils';
import { normalizePriority } from '../utils/storage';
import { isTaskRelatedToUnit } from '../utils/permissions';

interface FilterParams {
  searchTerm: string;
  selectedPerspective: BaseWeworkPerspective;
  selectedPlanGroup: string;
  selectedDept: string;
  selectedStatus: string;
  selectedPriority: string;
  selectedCategory: string;
  selectedTimeRange: string;
  selectedAssignee: string;
}

interface SortParams {
  sortBy: 'priority' | 'deadline' | 'progress' | 'id';
  sortOrder: 'asc' | 'desc';
}

export function useTaskFilters(
  accessibleTasks: TaskNQ57[],
  currentUser: UserAccount,
  aiRecommendedTaskIds: Set<string>,
  filters: FilterParams,
  sort: SortParams
) {
  const filteredTasks = useMemo(() => {
    return accessibleTasks.filter((t) => {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        !filters.searchTerm ||
        t.id.toLowerCase().includes(searchLower) ||
        t.tenNhiemVu.toLowerCase().includes(searchLower) ||
        t.nguoiPhuTrach.toLowerCase().includes(searchLower) ||
        t.donViChuTri.toLowerCase().includes(searchLower) ||
        t.donViPhoiHop.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (filters.selectedPerspective === 'my_assigned') {
        if (!isTaskRelatedToUnit(t, currentUser.donVi)) return false;
      } else if (filters.selectedPerspective === 'my_delegated') {
        const isDelegated =
          t.nguoiGiaoViec === currentUser.hoTen || (currentUser.vaiTro !== 'Don_Vi' && !!t.yKienChiDao);
        if (!isDelegated && currentUser.vaiTro === 'Don_Vi') return false;
      } else if (filters.selectedPerspective === 'pending_approval') {
        const isPending =
          t.approvalStatus === 'Cho_Duyet' ||
          (t.filesMinhChung &&
            t.filesMinhChung.length > 0 &&
            t.approvalStatus !== 'Da_Duyet' &&
            t.trangThai !== 'Đã hoàn thành');
        if (!isPending) return false;
      } else if (filters.selectedPerspective === 'overdue_urgent') {
        const isOverdue =
          t.trangThai === 'Quá hạn' || (t.trangThai !== 'Đã hoàn thành' && getDaysDifference(t.thoiHan) <= 3);
        if (!isOverdue) return false;
      } else if (filters.selectedPerspective === 'ai_suggested') {
        if (!aiRecommendedTaskIds.has(t.id)) return false;
      }

      if (filters.selectedPlanGroup !== 'all' && t.nhomKeHoach !== filters.selectedPlanGroup) return false;
      if (filters.selectedDept !== 'all' && !isTaskRelatedToUnit(t, filters.selectedDept)) return false;
      if (filters.selectedStatus && t.trangThai !== filters.selectedStatus) return false;

      if (filters.selectedPriority !== 'all') {
        if (normalizePriority(t.mucDoUuTien) !== filters.selectedPriority) return false;
      }

      if (filters.selectedCategory !== 'all') {
        if (filters.selectedCategory === 'uncategorized') {
          if (t.category) return false;
        } else {
          if (t.category !== filters.selectedCategory) return false;
        }
      }

      if (filters.selectedTimeRange !== 'all') {
        const diff = getDaysDifference(t.thoiHan);
        if (filters.selectedTimeRange === 'this_week' && (diff < 0 || diff > 7)) return false;
        if (filters.selectedTimeRange === 'this_month' && (diff < 0 || diff > 30)) return false;
        if (filters.selectedTimeRange === 'q1_q2') {
          const parts = t.thoiHan.split('-');
          const month = parseInt(parts[1], 10);
          if (month > 6) return false;
        }
        if (filters.selectedTimeRange === 'overdue' && diff >= 0) return false;
      }

      if (filters.selectedAssignee !== 'all' && t.nguoiPhuTrach !== filters.selectedAssignee) return false;

      return true;
    });
  }, [accessibleTasks, filters, currentUser, aiRecommendedTaskIds]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sort.sortBy === 'priority') {
        const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        const weightA = priorityWeight[normalizePriority(a.mucDoUuTien)] || 1;
        const weightB = priorityWeight[normalizePriority(b.mucDoUuTien)] || 1;
        const diff = sort.sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
        if (diff !== 0) return diff;
        return a.thoiHan.localeCompare(b.thoiHan);
      }
      if (sort.sortBy === 'deadline') {
        const diff = a.thoiHan.localeCompare(b.thoiHan);
        return sort.sortOrder === 'asc' ? diff : -diff;
      }
      if (sort.sortBy === 'progress') {
        const diff = a.tiendo - b.tiendo;
        return sort.sortOrder === 'desc' ? -diff : diff;
      }
      if (sort.sortBy === 'id') {
        const diff = a.id.localeCompare(b.id);
        return sort.sortOrder === 'asc' ? diff : -diff;
      }
      return 0;
    });
  }, [filteredTasks, sort.sortBy, sort.sortOrder]);

  return { filteredTasks, sortedTasks };
}
