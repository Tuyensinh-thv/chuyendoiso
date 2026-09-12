import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquareQuote, 
  Send, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { TaskNQ57, UserAccount } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { isTaskRelatedToUnit } from '../utils/permissions';

interface DirectivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskNQ57[];
  currentUser: UserAccount;
  onSelectTask: (task: TaskNQ57) => void;
  onAddDirectiveToTask: (taskId: string, directiveText: string) => void;
}

export const DirectivePanel: React.FC<DirectivePanelProps> = ({
  isOpen,
  onClose,
  tasks,
  currentUser,
  onSelectTask,
  onAddDirectiveToTask,
}) => {
  if (!isOpen) return null;

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [targetTaskId, setTargetTaskId] = useState<string>(tasks[0]?.id || '');
  const [directiveText, setDirectiveText] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const formatToVN = (dStr: string) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Chỉ Admin và Lãnh đạo trường mới có quyền ban hành chỉ đạo
  const isLeader = currentUser.vaiTro === 'Admin' || currentUser.vaiTro === 'Lanh_Dao';

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  // Gather all directives from tasks that currently have directives
  const tasksWithDirectives = tasks.filter((t) => {
    const hasDirective = Boolean(t.yKienChiDao?.trim());
    const matchesDept = selectedDeptFilter === 'all' || t.donViChuTri === selectedDeptFilter;
    const matchesUnit = currentUser.vaiTro !== 'Don_Vi' || isTaskRelatedToUnit(t, currentUser.donVi);
    return hasDirective && matchesDept && matchesUnit;
  });

  const handleSendDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim() || !targetTaskId) return;

    const formattedDeadline = deadlineDate ? formatToVN(deadlineDate) : '';
    const finalDirective = formattedDeadline
      ? `${directiveText.trim()} (Hạn báo cáo: ${formattedDeadline})`
      : directiveText.trim();

    onAddDirectiveToTask(targetTaskId, finalDirective);
    setSuccessMsg(
      `Đã phát hành chỉ đạo tới nhiệm vụ ${targetTaskId}${formattedDeadline ? ` · Hạn báo cáo: ${formattedDeadline}` : ''}`
    );
    setDirectiveText('');
    setDeadlineDate('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-none sm:rounded-2xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[88vh] flex flex-col shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#0B2545] to-[#1E3A8A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FFD700]">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Trung Tâm Chỉ Đạo & Trao Đổi Điều Hành
              </h2>
              <p className="text-xs text-slate-300">
                Ý kiến chỉ đạo của Ban Giám hiệu và phản hồi báo cáo từ các đơn vị thực hiện NQ57
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout - Single Column Vertical Flow */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Section 1: Send New Directive (For Leaders) or Permission Notice */}
          {isLeader ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                Ban hành chỉ đạo trực tiếp
              </h3>
              {successMsg && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {successMsg}
                </div>
              )}
              <form onSubmit={handleSendDirective} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 space-y-3">
                <select
                  value={targetTaskId}
                  onChange={(e) => setTargetTaskId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.donViChuTri} - {t.tenNhiemVu.slice(0, 60)}...
                    </option>
                  ))}
                </select>
                <div className="flex gap-3 items-stretch">
                  <textarea
                    rows={4}
                    value={directiveText}
                    onChange={(e) => setDirectiveText(e.target.value)}
                    placeholder="Nhập nội dung ý kiến chỉ đạo, đôn đốc hoặc lưu ý đặc biệt đối với đơn vị chủ trì..."
                    className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 leading-relaxed resize-none"
                  />
                  <div className="flex flex-col justify-between shrink-0 w-44 sm:w-48">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hạn báo cáo lại:</span>
                      </label>
                      <input
                        type="date"
                        value={deadlineDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium shadow-2xs cursor-pointer"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!directiveText.trim()}
                      className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Phát hành chỉ đạo</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-slate-600 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p>
                Tài khoản của bạn có vai trò <strong>Đơn vị chủ trì</strong>. Bạn có thể xem các ý kiến chỉ đạo của Ban Giám hiệu gửi cho đơn vị mình và gửi báo cáo tiến độ/minh chứng tại chi tiết từng nhiệm vụ.
              </p>
            </div>
          )}

          {/* Section 2: Directives Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Danh sách chỉ đạo đang hiệu lực</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 font-mono text-[11px]">
                  {tasksWithDirectives.length}
                </span>
              </span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả đơn vị</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {tasksWithDirectives.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Không có chỉ đạo nào cho đơn vị đang chọn.
                </div>
              ) : (
                tasksWithDirectives.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 hover:bg-slate-50/70 transition-colors text-xs flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0 flex items-start gap-2">
                      <span className="font-mono font-bold text-[11px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 shrink-0 mt-0.5">
                        {t.id}
                      </span>
                      <div className="text-slate-800 leading-relaxed text-xs">
                        <span className="font-medium text-slate-900 whitespace-pre-wrap">{t.yKienChiDao}</span>
                        <span className="text-slate-400 mx-1.5">—</span>
                        <span className="font-semibold text-slate-700">{t.donViChuTri}</span>
                        {t.nguoiPhuTrach && (
                          <>
                            <span className="text-slate-400 mx-1.5">—</span>
                            <span className="text-slate-500">{t.nguoiPhuTrach}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectTask(t);
                        onClose();
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-0.5 shrink-0 cursor-pointer pt-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Mở chi tiết nhiệm vụ"
                    >
                      <span>Mở</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Directive Guidelines (Compact) */}
          <div className="p-3 rounded-lg bg-blue-50/40 border border-blue-200/60 text-[11px] text-blue-800 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-blue-900">Quy trình:</span>{' '}
              Chỉ đạo hiển thị tức thì trên bảng điều hành đơn vị chủ trì → Đơn vị phản hồi/cập nhật minh chứng trước thời hạn → Ban Giám hiệu nghiệm thu chính thức.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
