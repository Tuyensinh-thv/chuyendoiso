import React from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  SlidersHorizontal, 
  Clock, 
  AlertCircle,
  Eye,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AiTaskRecommendation, EthicalAiSettings } from '../utils/ethicalAi';
import { TaskNQ57, UserAccount } from '../types';
import { formatVietnameseDate, getDaysDifference } from '../utils/dateUtils';
import { getPriorityMeta } from '../utils/storage';

interface EthicalAiFocusBarProps {
  recommendations: AiTaskRecommendation[];
  settings: EthicalAiSettings;
  onOpenSettings: () => void;
  onSelectTask: (task: TaskNQ57) => void;
  currentUser: UserAccount;
  isFilterActive: boolean;
  onToggleAiFilter: () => void;
}

export const EthicalAiFocusBar: React.FC<EthicalAiFocusBarProps> = ({
  recommendations,
  settings,
  onOpenSettings,
  onSelectTask,
  currentUser,
  isFilterActive,
  onToggleAiFilter,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!settings.enabled || recommendations.length === 0) {
    return null;
  }

  const topRecommendations = recommendations.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs p-4 mb-6 transition-all">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                Gợi ý trọng tâm hôm nay cho {currentUser.hoTen}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                {recommendations.length} việc cần chú ý
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Phân tích đạo đức từ đơn vị <span className="font-medium text-zinc-700">{currentUser.donVi}</span> & mốc hạn NQ57
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onToggleAiFilter}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isFilterActive
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFilterActive ? 'Đang lọc theo AI' : 'Chỉ xem việc AI đề xuất'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn gợi ý' : 'Xem chi tiết gợi ý'}
            aria-label="Thu gọn hoặc mở rộng gợi ý"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
            title="Tùy chỉnh thuật toán & Quyền kiểm soát dữ liệu"
            aria-label="Cài đặt cá nhân hóa AI"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Quick Cards */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          {topRecommendations.map((rec) => {
            const daysDiff = getDaysDifference(rec.task.thoiHan);
            const pMeta = getPriorityMeta(rec.task.mucDoUuTien);

            return (
              <div
                key={rec.task.id}
                onClick={() => onSelectTask(rec.task)}
                className="group p-3 rounded-xl border border-zinc-200/80 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-bold text-zinc-600 font-mono">
                      {rec.task.id}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${pMeta.badgeClass}`}>
                      {pMeta.shortLabel}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-900 group-hover:text-zinc-950 line-clamp-2">
                    {rec.task.tenNhiemVu}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-200/60 space-y-1.5">
                  {/* Transparent reasoning badge */}
                  {settings.showExplainabilityBadges && (
                    <div className="flex items-start gap-1 text-[10px] text-zinc-500 bg-white/80 p-1.5 rounded-lg border border-zinc-200/60">
                      <Eye className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{rec.explanation}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatVietnameseDate(rec.task.thoiHan)}
                    </span>
                    <span className="font-semibold text-zinc-700">
                      {rec.task.tiendo}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
