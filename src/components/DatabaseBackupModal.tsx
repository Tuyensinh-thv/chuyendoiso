import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  RotateCcw,
  Trash2,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileCode,
  FileJson,
  UploadCloud,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Terminal,
} from 'lucide-react';
import { UserAccount } from '../types';

interface BackupItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  format: 'SQL' | 'JSON';
  driveUrl: string | null;
  driveFileId: string | null;
  status: string;
}

interface BackupStats {
  totalBackups: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  driveConnected: boolean;
  lastBackup: string | null;
}

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onDataRestored?: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDataRestored,
}) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSizeBytes: 0,
    totalSizeFormatted: '0 MB',
    driveConnected: true,
    lastBackup: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionLogs, setActionLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [formatChoice, setFormatChoice] = useState<'all' | 'sql' | 'json'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'schedule'>('list');

  // Schedule settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hvu_nq57_db_auto_backup') === 'true';
  });
  const [backupHour, setBackupHour] = useState<string>(() => {
    return localStorage.getItem('hvu_nq57_db_backup_hour') || '1';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getApiUrl = (action: string) => {
    const baseUrl =
      typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? `${window.location.origin}/api/backup_database.php`
        : 'http://localhost/chuyendoiso/api/backup_database.php';
    return `${baseUrl}?action=${action}`;
  };

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('list'));
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách backup:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
    }
  }, [isOpen]);

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    setActionLogs(['[INFO] Bắt đầu tiến trình tạo bản sao lưu CSDL...']);
    setStatusMessage(null);

    try {
      const res = await fetch(`${getApiUrl('create')}&format=${formatChoice}&creator=${encodeURIComponent(currentUser.hoTen)}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setActionLogs(data.logs || ['[SUCCESS] Sao lưu CSDL hoàn tất!']);
        setStatusMessage({ type: 'success', text: 'Tạo bản sao lưu và đồng bộ Google Drive thành công!' });
        await fetchBackups();
      } else {
        setActionLogs((prev) => [...prev, `[ERROR] ${data.error || 'Có lỗi xảy ra'}`]);
        setStatusMessage({ type: 'error', text: data.error || 'Sao lưu thất bại' });
      }
    } catch (err: any) {
      setActionLogs((prev) => [...prev, `[ERROR] Lỗi kết nối: ${err.message}`]);
      setStatusMessage({ type: 'error', text: `Lỗi kết nối: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (filename: string) => {
    const downloadUrl = `${getApiUrl('download')}&file=${encodeURIComponent(filename)}`;
    window.open(downloadUrl, '_blank');
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản sao lưu "${filename}" không?`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiUrl('delete')}&file=${encodeURIComponent(filename)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Đã xóa bản sao lưu ${filename}` });
        fetchBackups();
      } else {
        alert(data.error || 'Không thể xóa file');
      }
    } catch (err: any) {
      alert(`Lỗi khi xóa: ${err.message}`);
    }
  };

  const handleRestore = async (filename: string) => {
    if (
      !window.confirm(
        `⚠️ CẢNH BÁO QUAN TRỌNG:\n\nKhôi phục CSDL từ bản sao lưu "${filename}" sẽ ghi đè dữ liệu hiện tại của hệ thống.\n\nBạn có chắc chắn muốn thực hiện khôi phục không?`
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setActionLogs([`[INFO] Đang chuẩn bị khôi phục từ bản lưu: ${filename}...`]);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', filename);

      const res = await fetch(getApiUrl('restore'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setActionLogs(data.logs || ['[SUCCESS] Khôi phục dữ liệu thành công!']);
        setStatusMessage({ type: 'success', text: 'Khôi phục CSDL thành công! Hệ thống đã cập nhật.' });
        if (onDataRestored) {
          onDataRestored();
        }
      } else {
        setActionLogs((prev) => [...prev, `[ERROR] ${data.error || 'Khôi phục thất bại'}`]);
        setStatusMessage({ type: 'error', text: data.error || 'Lỗi khôi phục' });
      }
    } catch (err: any) {
      setActionLogs((prev) => [...prev, `[ERROR] Lỗi kết nối: ${err.message}`]);
      setStatusMessage({ type: 'error', text: `Lỗi kết nối: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAndRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !window.confirm(
        `⚠️ CẢNH BÁO:\n\nBạn đang khôi phục CSDL từ file tải lên "${file.name}".\nDữ liệu các bảng liên quan sẽ được nạp lại theo file này.\n\nBạn có muốn tiếp tục không?`
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessing(true);
    setActionLogs([`[INFO] Đang tải lên và phân tích file: ${file.name}...`]);

    try {
      const formData = new FormData();
      formData.append('backup_file', file);

      const res = await fetch(getApiUrl('restore'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setActionLogs(data.logs || ['[SUCCESS] Khôi phục từ file tải lên thành công!']);
        setStatusMessage({ type: 'success', text: 'Đã nạp dữ liệu từ file thành công!' });
        if (onDataRestored) {
          onDataRestored();
        }
        fetchBackups();
      } else {
        setActionLogs((prev) => [...prev, `[ERROR] ${data.error || 'Lỗi xử lý file'}`]);
        setStatusMessage({ type: 'error', text: data.error || 'Lỗi xử lý file' });
      }
    } catch (err: any) {
      setActionLogs((prev) => [...prev, `[ERROR] Lỗi: ${err.message}`]);
      setStatusMessage({ type: 'error', text: `Lỗi: ${err.message}` });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveSchedule = () => {
    localStorage.setItem('hvu_nq57_db_auto_backup', String(autoBackupEnabled));
    localStorage.setItem('hvu_nq57_db_backup_hour', backupHour);
    setStatusMessage({ type: 'success', text: 'Đã lưu cấu hình tự động sao lưu thành công!' });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B2545] via-[#102A4C] to-[#1E3A8A] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Database className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Quản Lý Sao Lưu & Khôi Phục CSDL
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  PostgreSQL Supabase
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Hệ thống sao lưu đa tầng (Local Server + Google Drive Kho Dữ Liệu)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Số bản sao lưu</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-lg font-bold text-slate-900">{stats.totalBackups} <span className="text-xs font-normal text-slate-500">tệp</span></p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Tổng dung lượng</span>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-slate-900">{stats.totalSizeFormatted}</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Google Drive</span>
              <Cloud className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã kết nối</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Lần sao lưu gần nhất</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs font-bold text-slate-900 truncate mt-1">
              {stats.lastBackup ? formatDate(stats.lastBackup) : 'Chưa có'}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh sách bản sao lưu ({backups.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lên lịch tự động
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <select
              value={formatChoice}
              onChange={(e) => setFormatChoice(e.target.value as any)}
              className="text-xs font-medium bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Định dạng: Cả SQL & JSON</option>
              <option value="sql">Chỉ file SQL (.sql)</option>
              <option value="json">Chỉ file JSON (.json)</option>
            </select>

            <button
              onClick={handleCreateBackup}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>Sao lưu ngay</span>
            </button>

            {/* Input upload file */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadAndRestore}
              accept=".sql,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Khôi phục từ file trên máy tính"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Khôi phục từ file</span>
            </button>

            <button
              onClick={fetchBackups}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Progress / Logs Panel */}
        {actionLogs.length > 0 && (
          <div className="bg-slate-900 text-emerald-400 px-6 py-3 text-xs font-mono max-h-36 overflow-y-auto border-b border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3" /> Nhật ký xử lý thời gian thực:
              </span>
              <button onClick={() => setActionLogs([])} className="hover:text-slate-200">
                Xóa log
              </button>
            </div>
            {actionLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[ERROR]')
                    ? 'text-rose-400 font-bold'
                    : log.includes('[SUCCESS]')
                    ? 'text-emerald-300 font-semibold'
                    : log.includes('[WARNING]')
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              {isLoading && backups.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  <p className="text-xs">Đang tải danh sách bản sao lưu...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Chưa có bản sao lưu nào</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Hãy nhấn nút <strong>"Sao lưu ngay"</strong> để tạo bản lưu đầu tiên cho 7 bảng dữ liệu Supabase và tự động đồng bộ lên Google Drive.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4">Tên bản sao lưu</th>
                        <th className="py-3 px-3">Định dạng</th>
                        <th className="py-3 px-3">Kích thước</th>
                        <th className="py-3 px-3">Ngày tạo</th>
                        <th className="py-3 px-3">Lưu trữ đám mây</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {backups.map((b) => (
                        <tr key={b.filename} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              {b.format === 'SQL' ? (
                                <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <FileJson className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <span className="truncate max-w-xs">{b.filename}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                b.format === 'SQL'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.format}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">{b.sizeFormatted}</td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDate(b.createdAt)}</td>
                          <td className="py-3 px-3">
                            {b.driveUrl ? (
                              <a
                                href={b.driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg hover:bg-emerald-100 transition-colors"
                              >
                                <Cloud className="w-3 h-3" />
                                <span>Google Drive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Chỉ lưu cục bộ</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDownload(b.filename)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Tải về máy tính"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {b.format === 'JSON' && (
                                <button
                                  onClick={() => handleRestore(b.filename)}
                                  disabled={isProcessing}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Khôi phục CSDL từ bản này"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(b.filename)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa bản lưu này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="max-w-xl space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Tự động sao lưu định kỳ hàng ngày
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hệ thống tự động xuất dữ liệu và đồng bộ lên Google Drive mỗi ngày
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 items-center">
                  <label className="text-xs font-semibold text-slate-700">Khung giờ thực thi:</label>
                  <select
                    value={backupHour}
                    onChange={(e) => setBackupHour(e.target.value)}
                    disabled={!autoBackupEnabled}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 disabled:opacity-50"
                  >
                    <option value="0">00:00 (Nửa đêm)</option>
                    <option value="1">01:00 (1 giờ sáng - Khuyến nghị)</option>
                    <option value="2">02:00 (2 giờ sáng)</option>
                    <option value="12">12:00 (Buổi trưa)</option>
                    <option value="22">22:00 (10 giờ đêm)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveSchedule}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Lưu cấu hình lịch trình
                  </button>
                </div>
              </div>

              {/* Cron info */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Đường dẫn gọi Cron tự động hóa (Server / Task Scheduler):
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-indigo-200 font-mono text-[11px] text-slate-800 select-all break-all">
                  {getApiUrl('create')}&format=all
                </div>
                <p className="text-[11px] text-indigo-700">
                  Bạn có thể thiết lập lệnh này trong <strong>Windows Task Scheduler</strong> hoặc <strong>Crontab</strong> để tự động chạy ngầm mà không cần mở trình duyệt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Bảo vệ toàn diện 7 bảng CSDL Nghị quyết 57</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
