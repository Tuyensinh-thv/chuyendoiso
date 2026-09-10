import React, { useState } from 'react';
import { 
  X, 
  MessageSquareQuote, 
  Send, 
  Building, 
  User, 
  Calendar, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Filter
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

  // Chỉ Admin và Lãnh đạo trường mới có quyền ban hành chỉ đạo
  const isLeader = currentUser.vaiTro === 'Admin' || currentUser.vaiTro === 'Lanh_Dao';

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
    onAddDirectiveToTask(targetTaskId, directiveText.trim());
    setDirectiveText('');
    alert('Đã gửi ý kiến chỉ đạo tới nhiệm vụ ' + targetTaskId);
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

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Directives Feed */}
          <div className="lg:col-span-7 space-y-4">
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

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {tasksWithDirectives.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  Không có chỉ đạo nào cho đơn vị đang chọn.
                </div>
              ) : (
                tasksWithDirectives.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border-2 border-red-200 bg-red-50/20 hover:bg-red-50/40 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-300">
                          {t.id}
                        </span>
                        <span className="font-bold text-slate-900">{t.donViChuTri}</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Mở nhiệm vụ</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="font-semibold text-slate-800 line-clamp-1">{t.tenNhiemVu}</p>

                    <div className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs">
                      <p className="text-[11px] font-bold text-red-900 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        Ý kiến chỉ đạo từ Ban Giám hiệu:
                      </p>
                      <p className="text-slate-800 italic leading-relaxed whitespace-pre-wrap">
                        "{t.yKienChiDao}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Người phụ trách: <strong>{t.nguoiPhuTrach}</strong></span>
                      <span>Tiến độ: <strong>{t.tiendo}%</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Send New Directive (For Leaders) or Guidance */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                Ban hành chỉ đạo trực tiếp
              </h3>

              {isLeader ? (
                <form onSubmit={handleSendDirective} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Chọn nhiệm vụ tiếp nhận chỉ đạo:
                    </label>
                    <select
                      value={targetTaskId}
                      onChange={(e) => setTargetTaskId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
                    >
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.id}] {t.donViChuTri} - {t.tenNhiemVu.slice(0, 45)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nội dung ý kiến chỉ đạo, đôn đốc:
                    </label>
                    <textarea
                      rows={5}
                      value={directiveText}
                      onChange={(e) => setDirectiveText(e.target.value)}
                      placeholder="Nhập nội dung chỉ đạo, thời hạn yêu cầu hoàn thành, hoặc lưu ý đặc biệt đối với đơn vị chủ trì..."
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!directiveText.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Phát hành chỉ đạo ngay</span>
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-900">Thông báo phân quyền:</p>
                  <p>
                    Tài khoản của bạn có vai trò <strong>Đơn vị chủ trì</strong>. Bạn có thể xem các ý kiến chỉ đạo của Ban Giám hiệu gửi cho đơn vị mình và gửi báo cáo tiến độ/minh chứng tại chi tiết từng nhiệm vụ.
                  </p>
                </div>
              )}
            </div>

            {/* Directive Guidelines Box */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Quy trình xử lý chỉ đạo NQ57:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800">
                <li>Chỉ đạo sẽ hiển thị tức thì trên bảng điều hành của đơn vị chủ trì.</li>
                <li>Đơn vị cần phản hồi hoặc cập nhật minh chứng trước thời hạn quy định.</li>
                <li>Khi nhiệm vụ hoàn tất, Ban Giám hiệu sẽ tiến hành nghiệm thu chính thức.</li>
              </ul>
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
