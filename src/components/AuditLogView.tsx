import React, { useState, useMemo } from 'react';
import { 
  Search, 
  History, 
  Clock, 
  User, 
  RefreshCw, 
  ShieldCheck, 
  Trash2, 
  PlusCircle, 
  Download,
  ArrowLeft,
  LogIn,
  LogOut,
  KeyRound,
  Shield,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { AuditLogEntry, AuditLogAction, AuditLogCategory } from '../types';
import { exportAuditLogsToCSV } from '../utils/storage';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onRefresh?: () => void;
  onSelectTask?: (taskId: string) => void;
  onBackToTasks?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs = [],
  onRefresh,
  onSelectTask,
  onBackToTasks,
}) => {
  const [activeTab, setActiveTab] = useState<AuditLogCategory>('DATA');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Helper để phân loại log chuẩn xác
  const getLogCategory = (log: AuditLogEntry): AuditLogCategory => {
    if (log.category) return log.category;
    if (
      log.action === 'LOGIN' || 
      log.action === 'LOGOUT' || 
      log.action === 'SECURITY' || 
      log.action === 'SYNC' ||
      log.details.toLowerCase().includes('mật khẩu')
    ) {
      return 'SYSTEM';
    }
    return 'DATA';
  };

  // Thống kê nhanh theo 2 phân loại
  const dataLogsCount = useMemo(
    () => logs.filter((l) => getLogCategory(l) === 'DATA').length,
    [logs]
  );
  const systemLogsCount = useMemo(
    () => logs.filter((l) => getLogCategory(l) === 'SYSTEM').length,
    [logs]
  );

  // Danh sách người thao tác duy nhất
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.actor) set.add(l.actor);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Bộ lọc log theo Tab, Tìm kiếm, Hành động, Người thực hiện
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Phân loại Tab
      const category = getLogCategory(log);
      if (category !== activeTab) return false;

      // 2. Tìm kiếm
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        log.actor.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        (log.taskId && log.taskId.toLowerCase().includes(searchLower)) ||
        (log.taskTitle && log.taskTitle.toLowerCase().includes(searchLower)) ||
        (log.actorRole && log.actorRole.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;

      // 3. Lọc theo hành động
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;

      // 4. Lọc theo người thực hiện
      if (selectedActor !== 'all' && log.actor !== selectedActor) return false;

      return true;
    });
  }, [logs, activeTab, searchTerm, selectedAction, selectedActor]);

  // Phân trang
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset page khi đổi tab hoặc bộ lọc
  const handleTabChange = (tab: AuditLogCategory) => {
    setActiveTab(tab);
    setSelectedAction('all');
    setSelectedActor('all');
    setCurrentPage(1);
  };

  const getActionBadge = (action: AuditLogAction, details: string) => {
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
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <LogIn className="w-3 h-3" />
            Đăng nhập
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <LogOut className="w-3 h-3" />
            Đăng xuất
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <KeyRound className="w-3 h-3" />
            Bảo mật
          </span>
        );
      case 'SYNC':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <FileSpreadsheet className="w-3 h-3" />
            Đồng bộ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Top Bar: Navigation & Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToTasks && (
            <button
              onClick={onBackToTasks}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách nhiệm vụ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Nhật Ký Hoạt Động Hệ Thống</span>
              <span className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                Audit Log
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Lưu vết minh bạch toàn bộ các thao tác nghiệp vụ, thay đổi dữ liệu và truy cập của tài khoản
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportAuditLogsToCSV(filteredLogs)}
            title="Xuất danh sách nhật ký đang lọc ra file Excel (.CSV)"
            className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Tải lại dữ liệu nhật ký mới nhất"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Cards (Phong cách tương đồng màn hình chính) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tổng số ghi vết</div>
            <div className="text-lg font-bold text-slate-900">{logs.length}</div>
          </div>
        </div>

        <div 
          onClick={() => handleTabChange('DATA')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
            activeTab === 'DATA' 
              ? 'bg-sky-50/50 border-sky-300 ring-1 ring-sky-200' 
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Thay đổi dữ liệu</div>
            <div className="text-lg font-bold text-sky-900">{dataLogsCount}</div>
          </div>
        </div>

        <div 
          onClick={() => handleTabChange('SYSTEM')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center gap-3 ${
            activeTab === 'SYSTEM' 
              ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-200' 
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Hệ thống & Bảo mật</div>
            <div className="text-lg font-bold text-purple-900">{systemLogsCount}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Cán bộ đã thao tác</div>
            <div className="text-lg font-bold text-slate-900">{uniqueActors.length}</div>
          </div>
        </div>
      </div>

      {/* Main Container: 2 Tabs & Filter & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        
        {/* Tab Selection Header */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 pt-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('DATA')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'DATA'
                  ? 'border-blue-600 text-blue-800 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>1. Thay đổi Dữ liệu & Nghiệp vụ</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'DATA' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {dataLogsCount}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('SYSTEM')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'SYSTEM'
                  ? 'border-purple-600 text-purple-800 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>2. Nhật ký Hệ thống & Bảo mật</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                activeTab === 'SYSTEM' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {systemLogsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3.5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'DATA'
                  ? 'Tìm theo người thực hiện, mã NV, nội dung thay đổi...'
                  : 'Tìm theo tài khoản, sự kiện đăng nhập, đổi mật khẩu...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          {/* Actor Select Filter */}
          <div className="shrink-0">
            <select
              value={selectedActor}
              onChange={(e) => {
                setSelectedActor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-hidden focus:border-blue-600 font-medium"
            >
              <option value="all">Tất cả cán bộ ({uniqueActors.length})</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </div>

          {/* Action Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {activeTab === 'DATA' ? (
              // Bộ lọc gọn gàng cho dữ liệu (đã bỏ Đồng bộ)
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'CREATE', label: 'Tạo mới' },
                { id: 'UPDATE', label: 'Cập nhật' },
                { id: 'APPROVE', label: 'Nghiệm thu' },
                { id: 'REJECT', label: 'Yêu cầu sửa' },
                { id: 'DELETE', label: 'Xóa' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    setSelectedAction(btn.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedAction === btn.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))
            ) : (
              // Bộ lọc cho hệ thống & bảo mật
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'LOGIN', label: 'Đăng nhập' },
                { id: 'LOGOUT', label: 'Đăng xuất' },
                { id: 'SECURITY', label: 'Bảo mật / Mật khẩu' },
                { id: 'SYNC', label: 'Đồng bộ kỹ thuật' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    setSelectedAction(btn.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedAction === btn.id
                      ? 'bg-purple-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Table View (Spacious Full Workspace Layout) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-36">Thời gian</th>
                <th className="py-2.5 px-4 w-48">Người thực hiện</th>
                <th className="py-2.5 px-4 w-28 text-center">Thao tác</th>
                {activeTab === 'DATA' && <th className="py-2.5 px-4 w-40">Nhiệm vụ liên quan</th>}
                <th className="py-2.5 px-4">Chi tiết hoạt động</th>
                {activeTab === 'DATA' && <th className="py-2.5 px-4 w-24 text-right">Chi tiết</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'DATA' ? 6 : 4} className="py-12 text-center text-slate-400 text-xs">
                    Không tìm thấy bản ghi nhật ký nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr 
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* 1. Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap align-top">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* 2. Actor & Role */}
                    <td className="py-3 px-4 align-top">
                      <div className="font-bold text-slate-900">{log.actor}</div>
                      <div className="text-[11px] text-slate-500">{log.actorRole}</div>
                    </td>

                    {/* 3. Action Badge */}
                    <td className="py-3 px-4 text-center align-top whitespace-nowrap">
                      {getActionBadge(log.action, log.details)}
                    </td>

                    {/* 4. Task Reference (If Data Tab) */}
                    {activeTab === 'DATA' && (
                      <td className="py-3 px-4 align-top">
                        {log.taskId ? (
                          <div>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 inline-block mb-0.5">
                              {log.taskId}
                            </span>
                            {log.taskTitle && (
                              <div className="text-slate-600 line-clamp-1 text-[11px]" title={log.taskTitle}>
                                {log.taskTitle}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                    )}

                    {/* 5. Details */}
                    <td className="py-3 px-4 text-slate-700 leading-relaxed align-top">
                      <div className="font-medium text-slate-900 whitespace-pre-wrap">
                        {log.details}
                      </div>
                    </td>

                    {/* 6. Quick Action (View Task) */}
                    {activeTab === 'DATA' && (
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                        {log.taskId && onSelectTask && (
                          <button
                            onClick={() => onSelectTask(log.taskId!)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                          >
                            Xem NV →
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <div>
            Hiển thị <strong>{paginatedLogs.length}</strong> / <strong>{filteredLogs.length}</strong> nhật ký
            {filteredLogs.length < logs.length && (
              <span className="text-slate-400 ml-1">(tổng số {logs.length} bản ghi)</span>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                Trước
              </button>
              <span className="px-2 font-mono text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
              >
                Sau
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
