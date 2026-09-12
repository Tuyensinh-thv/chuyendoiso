import React, { useCallback } from 'react';
import { AuditLogEntry } from '../types';
import { addAuditLog } from '../utils/storage';
import { addAuditLogToSupabase } from '../utils/supabaseService';
import { loadSyncConfig } from '../utils/googleSheets';
import { pushAuditLogToGas } from '../utils/googleSheets';

type AuditLogInput = Omit<AuditLogEntry, 'id' | 'timestamp'>;

export function useAuditLog(
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>
) {
  const recordAuditLog = useCallback(
    (entry: AuditLogInput): AuditLogEntry => {
      const created = addAuditLog(entry);
      setAuditLogs((prev) => [created, ...prev]);

      addAuditLogToSupabase(created).catch((err) =>
        console.warn('Failed to push audit log to Supabase:', err)
      );

      const config = loadSyncConfig();
      if (config.gasWebAppUrl) {
        pushAuditLogToGas(config.gasWebAppUrl, created).catch((err) =>
          console.warn('Failed to push audit log to GAS:', err)
        );
      }

      return created;
    },
    [setAuditLogs]
  );

  return { recordAuditLog };
}
