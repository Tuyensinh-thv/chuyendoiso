import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { TaskProvider, useTasks } from './TaskContext';
import { UIProvider } from './UIContext';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { useGoogleSync } from '../hooks/useGoogleSync';

function SyncBridge({ children }: { children: React.ReactNode }) {
  const { accounts, handleUpdateAccounts } = useAuth();
  const { tasks, setTasks, categories, setCategories, setAuditLogs, setMenuSettings } = useTasks();

  useSupabaseSync(setTasks, handleUpdateAccounts, setAuditLogs, setCategories, setMenuSettings);
  useGoogleSync(tasks, accounts, categories);

  return <>{children}</>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TaskProvider>
        <UIProvider>
          <SyncBridge>
            {children}
          </SyncBridge>
        </UIProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

export { useAuth } from './AuthContext';
export { useTasks } from './TaskContext';
export { useUI } from './UIContext';
