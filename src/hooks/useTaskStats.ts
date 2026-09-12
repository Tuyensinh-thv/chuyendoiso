import { useMemo } from 'react';
import { TaskNQ57, UserAccount } from '../types';
import { getDaysDifference } from '../utils/dateUtils';
import { getRolePermissions, isTaskRelatedToUnit } from '../utils/permissions';
import { getEthicalAiRecommendations, EthicalAiSettings } from '../utils/ethicalAi';

export function useTaskStats(
  tasks: TaskNQ57[],
  currentUser: UserAccount,
  ethicalAiSettings: EthicalAiSettings
) {
  const perms = useMemo(() => getRolePermissions(currentUser.vaiTro), [currentUser.vaiTro]);

  const accessibleTasks = useMemo(() => {
    if (perms.canViewAllUnits) return tasks;
    return tasks.filter((t) => isTaskRelatedToUnit(t, currentUser.donVi));
  }, [tasks, perms.canViewAllUnits, currentUser.donVi]);

  const urgentTasks = useMemo(() => {
    return accessibleTasks.filter((t) => {
      if (t.trangThai === 'Đã hoàn thành') return false;
      return getDaysDifference(t.thoiHan) <= 3;
    });
  }, [accessibleTasks]);

  const overdueTasksCount = useMemo(
    () => accessibleTasks.filter((t) => t.trangThai === 'Quá hạn').length,
    [accessibleTasks]
  );

  const todayTasksCount = useMemo(
    () => accessibleTasks.filter((t) => t.trangThai === 'Hạn hôm nay').length,
    [accessibleTasks]
  );

  const dueSoonTasksCount = useMemo(
    () => accessibleTasks.filter((t) => t.trangThai === 'Sắp đến hạn').length,
    [accessibleTasks]
  );

  const completedTasksCount = useMemo(
    () => accessibleTasks.filter((t) => t.trangThai === 'Đã hoàn thành').length,
    [accessibleTasks]
  );

  const myUnitTasksCount = useMemo(
    () => accessibleTasks.filter((t) => isTaskRelatedToUnit(t, currentUser.donVi)).length,
    [accessibleTasks, currentUser.donVi]
  );

  const myDelegatedCount = useMemo(() => {
    return (
      accessibleTasks.filter(
        (t) => t.nguoiGiaoViec === currentUser.hoTen || (currentUser.vaiTro !== 'Don_Vi' && !!t.yKienChiDao)
      ).length || (currentUser.vaiTro !== 'Don_Vi' ? accessibleTasks.length : 0)
    );
  }, [accessibleTasks, currentUser]);

  const pendingApprovalCount = useMemo(() => {
    return accessibleTasks.filter(
      (t) =>
        t.approvalStatus === 'Cho_Duyet' ||
        (t.filesMinhChung &&
          t.filesMinhChung.length > 0 &&
          t.approvalStatus !== 'Da_Duyet' &&
          t.trangThai !== 'Đã hoàn thành')
    ).length;
  }, [accessibleTasks]);

  const aiRecommendations = useMemo(
    () => getEthicalAiRecommendations(accessibleTasks, currentUser, ethicalAiSettings),
    [accessibleTasks, currentUser, ethicalAiSettings]
  );

  const aiRecommendedTaskIds = useMemo(
    () => new Set(aiRecommendations.map((r) => r.task.id)),
    [aiRecommendations]
  );

  const taskCountsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of accessibleTasks) {
      if (t.category) {
        map[t.category] = (map[t.category] || 0) + 1;
      }
    }
    return map;
  }, [accessibleTasks]);

  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.nguoiPhuTrach).filter(Boolean))),
    [tasks]
  );

  return {
    perms,
    accessibleTasks,
    urgentTasks,
    overdueTasksCount,
    todayTasksCount,
    dueSoonTasksCount,
    completedTasksCount,
    myUnitTasksCount,
    myDelegatedCount,
    pendingApprovalCount,
    aiRecommendations,
    aiRecommendedTaskIds,
    taskCountsByCategory,
    assignees,
  };
}
