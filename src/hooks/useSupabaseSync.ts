import React, { useEffect } from 'react';
import { TaskNQ57, UserAccount, CustomCategory, AuditLogEntry, MenuSettings } from '../types';
import { loadTasksFromStorage, saveTasksToStorage, saveMenuSettingsToStorage } from '../utils/storage';
import {
  fetchTasksFromSupabase,
  fetchAccountsFromSupabase,
  fetchAuditLogsFromSupabase,
  fetchCategoriesFromSupabase,
  fetchMenuSettingsFromSupabase,
  saveTaskToSupabase,
  subscribeToTasks,
  subscribeToAuditLogs,
} from '../utils/supabaseService';

/**
 * Merge remote tasks with local tasks safely based on ngayCapNhat timestamp.
 * Prevents remote stale tasks from overriding fresh local edits.
 */
function mergeTasks(
  localTasks: TaskNQ57[],
  remoteTasks: TaskNQ57[]
): { merged: TaskNQ57[]; needsPush: TaskNQ57[] } {
  if (!remoteTasks || remoteTasks.length === 0) {
    return { merged: localTasks, needsPush: localTasks };
  }
  if (!localTasks || localTasks.length === 0) {
    return { merged: remoteTasks, needsPush: [] };
  }

  const remoteMap = new Map(remoteTasks.map((t) => [t.id, t]));
  const needsPush: TaskNQ57[] = [];
  const mergedMap = new Map<string, TaskNQ57>();

  // Start with all remote tasks
  for (const remote of remoteTasks) {
    mergedMap.set(remote.id, remote);
  }

  // Compare with local tasks
  for (const local of localTasks) {
    const remote = remoteMap.get(local.id);
    if (!remote) {
      // New task exists only locally
      mergedMap.set(local.id, local);
      needsPush.push(local);
    } else {
      const localTime = new Date(local.ngayCapNhat || 0).getTime();
      const remoteTime = new Date(remote.ngayCapNhat || 0).getTime();

      // If local is strictly newer, preserve local and sync up to Supabase
      if (localTime > remoteTime) {
        mergedMap.set(local.id, local);
        needsPush.push(local);
      }
    }
  }

  return { merged: Array.from(mergedMap.values()), needsPush };
}

export function useSupabaseSync(
  setTasks: React.Dispatch<React.SetStateAction<TaskNQ57[]>>,
  handleUpdateAccounts: (accounts: UserAccount[]) => void,
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>,
  setCategories: React.Dispatch<React.SetStateAction<CustomCategory[]>>,
  setMenuSettings?: React.Dispatch<React.SetStateAction<MenuSettings>>
) {
  useEffect(() => {
    let isMounted = true;

    const syncTasksSafely = (remoteTasks: TaskNQ57[]) => {
      if (!isMounted || !remoteTasks || remoteTasks.length === 0) return;
      const currentLocal = loadTasksFromStorage();
      const { merged, needsPush } = mergeTasks(currentLocal, remoteTasks);
      setTasks(merged);
      saveTasksToStorage(merged);

      // Background push any fresher local tasks to Supabase
      if (needsPush.length > 0) {
        Promise.all(needsPush.map((t) => saveTaskToSupabase(t))).catch((e) =>
          console.warn('Auto sync fresher local tasks to Supabase error:', e)
        );
      }
    };

    const initSupabase = async () => {
      try {
        const [sbTasks, sbAccounts, sbLogs, sbCategories, sbMenuSettings] = await Promise.all([
          fetchTasksFromSupabase(),
          fetchAccountsFromSupabase(),
          fetchAuditLogsFromSupabase(),
          fetchCategoriesFromSupabase(),
          fetchMenuSettingsFromSupabase(),
        ]);

        if (isMounted) {
          if (sbTasks && sbTasks.length > 0) {
            syncTasksSafely(sbTasks);
          }
          if (sbAccounts && sbAccounts.length > 0) {
            handleUpdateAccounts(sbAccounts);
          }
          if (sbLogs && sbLogs.length > 0) {
            setAuditLogs(sbLogs);
          }
          if (sbCategories && sbCategories.length > 0) {
            setCategories(sbCategories);
          }
          if (sbMenuSettings && setMenuSettings) {
            setMenuSettings(sbMenuSettings);
            saveMenuSettingsToStorage(sbMenuSettings);
          }
        }
      } catch (err) {
        console.warn('Supabase initial fetch failed, relying on local storage cache:', err);
      }
    };

    initSupabase();

    const tasksSubscription = subscribeToTasks(async () => {
      try {
        const freshTasks = await fetchTasksFromSupabase();
        if (freshTasks && freshTasks.length > 0 && isMounted) {
          syncTasksSafely(freshTasks);
        }
      } catch (e) {
        console.warn('Realtime task fetch error:', e);
      }
    });

    const auditSubscription = subscribeToAuditLogs(async () => {
      try {
        const freshLogs = await fetchAuditLogsFromSupabase();
        if (freshLogs && freshLogs.length > 0 && isMounted) {
          setAuditLogs(freshLogs);
        }
      } catch (e) {
        console.warn('Realtime audit fetch error:', e);
      }
    });

    const handleFocus = async () => {
      try {
        const freshTasks = await fetchTasksFromSupabase();
        if (freshTasks && freshTasks.length > 0 && isMounted) {
          syncTasksSafely(freshTasks);
        }
      } catch {
        // silent
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      tasksSubscription?.unsubscribe();
      auditSubscription?.unsubscribe();
    };
  }, [setTasks, handleUpdateAccounts, setAuditLogs, setCategories]);
}
