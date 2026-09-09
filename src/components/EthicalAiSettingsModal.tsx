import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Eye, 
  RotateCcw, 
  X, 
  Check, 
  Info,
  Lock,
  Cpu
} from 'lucide-react';
import { EthicalAiSettings, DEFAULT_ETHICAL_AI_SETTINGS } from '../utils/ethicalAi';
import { UserAccount } from '../types';

interface EthicalAiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EthicalAiSettings;
  onSaveSettings: (newSettings: EthicalAiSettings) => void;
  currentUser: UserAccount;
}

export const EthicalAiSettingsModal: React.FC<EthicalAiSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentUser,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof EthicalAiSettings) => {
    onSaveSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleReset = () => {
    onSaveSettings(DEFAULT_ETHICAL_AI_SETTINGS);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white text-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ethical-ai-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 id="ethical-ai-title" className="text-base font-semibold text-zinc-900 tracking-tight">
                Cá nhân hóa bằng AI có đạo đức
              </h2>
              <p className="text-xs text-zinc-500">
                Minh bạch thuật toán & Quyền kiểm soát dữ liệu cá nhân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-zinc-700" />
                <span className="text-sm font-semibold text-zinc-900">
                  Bật Trợ lý Cá nhân hóa AI
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Tự động đề xuất việc cần làm dựa trên vai trò và ngữ cảnh của bạn
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              onClick={() => handleToggle('enabled')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                settings.enabled ? 'bg-zinc-900' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Granular Control Options */}
          <div className={`space-y-3 transition-opacity duration-200 ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Các yếu tố AI được phép sử dụng
              </span>
              <span className="text-[11px] text-zinc-400">Tự do bật/tắt</span>
            </div>

            {/* Option 1: Department Match */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 hover:bg-zinc-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.prioritizeMyDepartment}
                onChange={() => handleToggle('prioritizeMyDepartment')}
                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-800 block">
                  Ưu tiên theo Đơn vị của bạn: <span className="font-bold text-zinc-900">{currentUser.donVi}</span>
                </span>
                <p className="text-[11px] text-zinc-500">
                  Tập trung nhiệm vụ do đơn vị của bạn chủ trì hoặc phối hợp thực hiện.
                </p>
              </div>
            </label>

            {/* Option 2: Urgent Deadlines */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 hover:bg-zinc-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.prioritizeUrgentDeadlines}
                onChange={() => handleToggle('prioritizeUrgentDeadlines')}
                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-800 block">
                  Đẩy việc cận hạn và quá hạn lên đầu (3-7 ngày tới)
                </span>
                <p className="text-[11px] text-zinc-500">
                  Giúp bạn không bỏ lỡ mốc kiểm tra tiến độ của Ban Giám hiệu Nhà trường.
                </p>
              </div>
            </label>

            {/* Option 3: Priority High */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 hover:bg-zinc-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.prioritizeHighPriority}
                onChange={() => handleToggle('prioritizeHighPriority')}
                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-800 block">
                  Ưu tiên theo mức độ Cao (High Priority)
                </span>
                <p className="text-[11px] text-zinc-500">
                  Tập trung giải quyết các khâu then chốt trong các kế hoạch NQ57.
                </p>
              </div>
            </label>

            {/* Option 4: Near Completion */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 hover:bg-zinc-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.prioritizeNearCompletion}
                onChange={() => handleToggle('prioritizeNearCompletion')}
                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-800 block">
                  Đôn đốc công việc đã đạt ≥ 60% tiến độ
                </span>
                <p className="text-[11px] text-zinc-500">
                  Thúc đẩy nhanh chóng hoàn thiện sản phẩm minh chứng để nghiệm thu.
                </p>
              </div>
            </label>

            {/* Option 5: Explainability */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 hover:bg-zinc-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showExplainabilityBadges}
                onChange={() => handleToggle('showExplainabilityBadges')}
                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-800 block flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-zinc-600" />
                  Hiển thị nhãn giải trình minh bạch (Lý do AI đề xuất)
                </span>
                <p className="text-[11px] text-zinc-500">
                  Luôn giải thích rõ vì sao một nhiệm vụ được xếp vào danh sách ưu tiên.
                </p>
              </div>
            </label>
          </div>

          {/* Privacy & Ethical Guarantee Notice */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="flex items-center gap-2 text-zinc-800 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cam kết đạo đức & Quyền riêng tư tuyệt đối</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Mọi thuật toán tính toán và phân tích cá nhân hóa diễn ra hoàn toàn trong trình duyệt cục bộ (Local Edge Device). Không có dữ liệu công việc hoặc hồ sơ cá nhân nào bị truyền tải ra ngoài máy chủ trường Đại học Hùng Vương.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-200/50 transition-colors cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại mặc định</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Áp dụng & Lưu cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
