import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  History, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Trash2, 
  PlusCircle,
  FileText
} from 'lucide-react';
import { AuditLogEntry, loadAuditLogsFromStorage } from '../utils/storage';
import { TaskNQ57 } from '../types';

interface AuditLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
  logs?: AuditLogEntry[];
  onRefresh?: () => void;
}

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({
  isOpen,
  onClose,
  onSelectTask,
  logs: externalLogs,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const [localLogs, setLocalLogs] = useState<AuditLogEntry[]>(() => loadAuditLogsFromStorage());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  useEffect(() => {
    setLocalLogs(loadAuditLogsFromStorage());
  }, [isOpen]);

  const logs = (externalLogs && externalLogs.length > 0) ? externalLogs : localLogs;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.taskId && log.taskId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.taskTitle && log.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3 h-3" />
            Tạo mới
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <RefreshCw className="w-3 h-3" />
            Cập nhật
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3" />
            Xóa
          </span>
        );
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3" />
            Nghiệm thu
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Yêu cầu sửa
          </span>
        );
      case 'SYNC':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <RefreshCw className="w-3 h-3" />
            Đồng bộ Sheets
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nhật Ký Hoạt Động Hệ Thống (Audit Log)
              </h2>
              <p className="text-xs text-slate-500">
                Lưu vết toàn bộ thao tác thêm, sửa, xóa, duyệt và đồng bộ dữ liệu NQ57
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Tải lại nhật ký từ Google Sheets"
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo người thực hiện, mã NV hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'CREATE', label: 'Tạo mới' },
              { id: 'UPDATE', label: 'Cập nhật' },
              { id: 'APPROVE', label: 'Nghiệm thu' },
              { id: 'SYNC', label: 'Đồng bộ' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedAction(btn.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedAction === btn.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Không tìm thấy sự kiện nào phù hợp.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-slate-50 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-slate-900">{log.actor}</span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {log.actorRole}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>

                <div className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                  {log.taskId && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {log.taskId}
                      </span>
                      {log.taskTitle && (
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {log.taskTitle}
                        </span>
                      )}
                      {onSelectTask && log.taskId && (
                        <button
                          onClick={() => {
                            onSelectTask(log.taskId!);
                            onClose();
                          }}
                          className="ml-auto text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          Xem NV →
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-slate-600 text-xs leading-relaxed">{log.details}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số: <strong className="text-slate-900">{filteredLogs.length}</strong> nhật ký</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
