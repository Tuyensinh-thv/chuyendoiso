import { useEffect } from 'react';
import { TaskNQ57, UserAccount, CustomCategory } from '../types';
import { INITIAL_ACCOUNTS } from '../data/initialData';
import {
  loadSyncConfig,
  loadAccessToken,
  exportToGoogleSheets,
  pushTasksToGas,
} from '../utils/googleSheets';

export function useGoogleSync(
  tasks: TaskNQ57[],
  accounts: UserAccount[],
  categories: CustomCategory[]
) {
  useEffect(() => {
    const config = loadSyncConfig();
    const token = loadAccessToken();

    if (config.autoBackup && token && config.spreadsheetId) {
      exportToGoogleSheets(
        tasks,
        accounts && accounts.length > 0 ? accounts : INITIAL_ACCOUNTS,
        categories
      ).catch((err) => {
        console.error('Auto backup failed', err);
      });
    }

    if (config.gasWebAppUrl) {
      const timer = setTimeout(() => {
        pushTasksToGas(config.gasWebAppUrl, tasks).catch((e) =>
          console.warn('Background auto-push to GAS failed:', e)
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [tasks, categories, accounts]);
}
