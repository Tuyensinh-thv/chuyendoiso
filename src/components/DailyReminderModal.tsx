import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Calendar, 
  Volume2, 
  Settings,
  Mail,
  Info
} from 'lucide-react';
import { TaskNQ57, UserAccount } from '../types';
import { getDaysDifference, formatVietnameseDate, CURRENT_DATE_STRING } from '../utils/dateUtils';
import { ReminderSettings, playReminderChime } from '../utils/storage';

interface DailyReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskNQ57[];
  currentUser: UserAccount;
  onSelectTask: (task: TaskNQ57) => void;
  reminderSettings: ReminderSettings;
  onSaveReminderSettings: (settings: ReminderSettings) => void;
}

export const DailyReminderModal: React.FC<DailyReminderModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  reminderSettings,
  onSaveReminderSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'dondoc' | 'settings'>('today');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [localSettings, setLocalSettings] = useState<ReminderSettings>(reminderSettings);
  const [urgingUnit, setUrgingUnit] = useState<string>('all');
  const [urgingSuccessMsg, setUrgingSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  // Filter tasks
  const overdueTasks = tasks.filter((t) => t.trangThai !== 'Đã hoàn thành' && getDaysDifference(t.thoiHan) < 0);
  
  const todayTasks = tasks.filter((t) => {
    const diff = getDaysDifference(t.thoiHan);
    return t.trangThai !== 'Đã hoàn thành' && diff === 0;
  });

  const next3DaysTasks = tasks.filter((t) => {
    const diff = getDaysDifference(t.thoiHan);
    return t.trangThai !== 'Đã hoàn thành' && diff > 0 && diff <= 3;
  });

  // Calculate unique departments having overdue/upcoming tasks
  const urgentUnits = Array.from(
    new Set([...overdueTasks, ...todayTasks, ...next3DaysTasks].map((t) => t.donViChuTri))
  );

  // Generate Automated Email / Official Dispatch Template for Urging
  const generateEmailText = () => {
    const targetTasks = (urgingUnit === 'all' 
      ? [...overdueTasks, ...todayTasks, ...next3DaysTasks]
      : [...overdueTasks, ...todayTasks, ...next3DaysTasks].filter(t => t.donViChuTri === urgingUnit)
    );

    const taskLines = targetTasks.map((t, idx) => {
      const diff = getDaysDifference(t.thoiHan);
      let statusStr = '';
      if (diff < 0) statusStr = `[QUÁ HẠN ${Math.abs(diff)} NGÀY]`;
      else if (diff === 0) statusStr = `[HẠN CHÓT HÔM NAY 07/09]`;
      else statusStr = `[HẠN CÒN ${diff} NGÀY - ${formatVietnameseDate(t.thoiHan)}]`;

      return `${idx + 1}. [${t.id}] ${t.tenNhiemVu}\n   - Đơn vị chủ trì: ${t.donViChuTri} (Phụ trách: ${t.nguoiPhuTrach})\n   - Thời hạn: ${formatVietnameseDate(t.thoiHan)} ${statusStr}\n   - Sản phẩm minh chứng cần nộp: ${t.sanPhamDauRa}\n   - Link cập nhật: https://ais-dev-rnqalry3ghtu5mjztvz3bp-792494782558.asia-southeast1.run.app\n`;
    }).join('\n');

    return `Kính gửi: Lãnh đạo các Đơn vị thuộc Trường Đại học Hùng Vương,

Thực hiện chỉ đạo của Ban Giám hiệu về việc triển khai các nhiệm vụ trọng tâm theo Nghị quyết số 57-NQ/TW trong tháng 9-10/2026;

Hệ thống HVU TaskMaster ghi nhận đến ngày ${formatVietnameseDate(CURRENT_DATE_STRING)} có danh sách các nhiệm vụ Sắp đến hạn và Quá hạn sau đây cần tập trung hoàn thành và nộp file minh chứng:

${taskLines}

Đề nghị Trưởng các đơn vị chỉ đạo cán bộ đầu mối khẩn trương:
1. Cập nhật tỷ lệ % tiến độ thực hiện trên hệ thống Webapp.
2. Đính kèm hoặc upload file minh chứng (Quyết định, Báo cáo, Kế hoạch) vào thư mục Google Drive của đơn vị.
3. Báo cáo vướng mắc phát sinh (nếu có) về Tổ CNTT & Chuyển đổi số (đồng chí Nguyễn Trung Kiên) để tổng hợp báo cáo Ban Giám hiệu trong phiên giao ban định kỳ.

Trân trọng thông báo./.
--------------------------------------------------
TỔ CÔNG TÁC CHUYỂN ĐỔI SỐ - TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG`;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generateEmailText());
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSendUrgeNotice = () => {
    playReminderChime();
    setUrgingSuccessMsg(`Đã phát lệnh thông báo đôn đốc tự động đến ${urgingUnit === 'all' ? 'toàn bộ các đơn vị' : urgingUnit}!`);
    setTimeout(() => setUrgingSuccessMsg(''), 4000);
  };

  const handleSaveSettings = () => {
    onSaveReminderSettings(localSettings);
    if (localSettings.sound) {
      playReminderChime();
    }
  };

  const handleTestChime = () => {
    playReminderChime();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl shadow-xl border-0 sm:border border-zinc-200 overflow-hidden flex flex-col text-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Trung tâm Nhắc nhở & Đôn đốc Hàng ngày</h2>
              <p className="text-[11px] text-zinc-500">
                Theo dõi các mốc thời hạn Nghị quyết 57-NQ/TW (Mốc: {formatVietnameseDate(CURRENT_DATE_STRING)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-zinc-100 bg-zinc-50/50 px-6 overflow-x-auto gap-1 py-2 shrink-0">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Đến hạn hôm nay</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
              todayTasks.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}>
              {todayTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Sắp đến hạn (1-3 ngày)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
              next3DaysTasks.length > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}>
              {next3DaysTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Quá hạn cần đôn đốc</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
              overdueTasks.length > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }`}>
              {overdueTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dondoc')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dondoc'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-zinc-600" />
            <span>Soạn Email đôn đốc</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-zinc-600" />
            <span>Cài đặt giờ nhắc</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Đến hạn hôm nay */}
          {activeTab === 'today' && (
            <div className="space-y-3">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <p className="font-semibold text-amber-900">Hạn chót ngày hôm nay ({formatVietnameseDate(CURRENT_DATE_STRING)})</p>
                  <p className="mt-0.5 text-amber-800">
                    Cần nộp đầy đủ sản phẩm đầu ra và đính kèm link minh chứng trước 17:00.
                  </p>
                </div>
              </div>

              {todayTasks.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-800">Không có nhiệm vụ nào chạm mốc hạn hôm nay.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        onSelectTask(t);
                        onClose();
                      }}
                      className="bg-white p-3.5 rounded-xl border border-amber-200/80 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-semibold bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200">
                            {t.id}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-50 px-1.5 py-0.2 rounded border border-zinc-200">
                            {t.donViChuTri}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                            Hạn hôm nay
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900">{t.tenNhiemVu}</h4>
                        <p className="text-[11px] text-zinc-500">
                          Sản phẩm: {t.sanPhamDauRa}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-semibold text-zinc-700">{t.tiendo}%</span>
                        <button className="px-3 py-1 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
                          Xem & Nộp file
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Sắp đến hạn */}
          {activeTab === 'upcoming' && (
            <div className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950">
                  <p className="font-semibold text-blue-900">Nhiệm vụ sắp đến hạn trong vòng 1-3 ngày tới</p>
                  <p className="mt-0.5 text-blue-800">
                    Cảnh báo sớm để các đơn vị chủ động rà soát, tránh trễ hạn.
                  </p>
                </div>
              </div>

              {next3DaysTasks.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-800">Không có nhiệm vụ sắp đến hạn trong 3 ngày tới.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {next3DaysTasks.map((t) => {
                    const days = getDaysDifference(t.thoiHan);
                    return (
                      <div 
                        key={t.id}
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="bg-white p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-semibold bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200">
                              {t.id}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-50 px-1.5 py-0.2 rounded border border-zinc-200">
                              {t.donViChuTri}
                            </span>
                            <span className="text-[10px] font-medium text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
                              Còn {days} ngày ({formatVietnameseDate(t.thoiHan)})
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-900">{t.tenNhiemVu}</h4>
                          <p className="text-[11px] text-zinc-500">
                            Phụ trách: {t.nguoiPhuTrach}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          <span className="text-xs font-semibold text-zinc-700">{t.tiendo}%</span>
                          <button className="px-3 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer">
                            Cập nhật
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Quá hạn */}
          {activeTab === 'overdue' && (
            <div className="space-y-3">
              <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950">
                  <p className="font-semibold text-rose-900">Nhiệm vụ đã vượt quá thời hạn ({overdueTasks.length} nhiệm vụ)</p>
                  <p className="mt-0.5 text-rose-800">
                    Cần ý kiến chỉ đạo đôn đốc ngay hoặc đơn vị giải trình nguyên nhân.
                  </p>
                </div>
              </div>

              {overdueTasks.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-800">Không có nhiệm vụ nào bị quá hạn.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueTasks.map((t) => {
                    const days = Math.abs(getDaysDifference(t.thoiHan));
                    return (
                      <div 
                        key={t.id}
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="bg-white p-3.5 rounded-xl border border-rose-200 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                              {t.id}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-50 px-1.5 py-0.2 rounded border border-zinc-200">
                              {t.donViChuTri}
                            </span>
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                              Trễ {days} ngày
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-900">{t.tenNhiemVu}</h4>
                          {t.yKienChiDao ? (
                            <p className="text-[11px] text-zinc-600 italic">
                              Chỉ đạo: "{t.yKienChiDao}"
                            </p>
                          ) : (
                            <p className="text-[11px] text-zinc-400 italic">Chưa có ý kiến chỉ đạo</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          <span className="text-xs font-semibold text-rose-600">{t.tiendo}%</span>
                          <button className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer">
                            Đôn đốc
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Soạn Email đôn đốc */}
          {activeTab === 'dondoc' && (
            <div className="space-y-3">
              <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Mẫu Email Đôn đốc Tự động</h3>
                    <p className="text-[11px] text-zinc-500">
                      Tự động trích xuất các nhiệm vụ chậm tiến độ gửi tới Trưởng đơn vị.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={urgingUnit}
                      onChange={(e) => setUrgingUnit(e.target.value)}
                      className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1 bg-white text-zinc-800 focus:outline-hidden focus:border-zinc-900"
                    >
                      <option value="all">Tất cả đơn vị ({urgentUnits.length})</option>
                      {urgentUnits.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {urgingSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{urgingSuccessMsg}</span>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    readOnly
                    value={generateEmailText()}
                    rows={10}
                    className="w-full text-xs font-mono bg-white text-zinc-800 p-3 rounded-lg border border-zinc-200 focus:outline-hidden leading-relaxed"
                  />
                  
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={handleCopyEmail}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <p className="text-[11px] text-zinc-400">
                    💡 Dán nội dung này vào email trường (@hvu.edu.vn) hoặc Zalo chỉ đạo.
                  </p>
                  <button
                    onClick={handleSendUrgeNotice}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Phát thông báo đôn đốc</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Cài đặt giờ nhắc */}
          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto bg-zinc-50/70 p-5 rounded-xl border border-zinc-200/80 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Cấu hình Thông báo Hàng ngày</h3>
                <p className="text-[11px] text-zinc-500">
                  Tự động thông báo công việc vào đầu mỗi giờ làm việc.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white">
                  <div>
                    <label className="text-xs font-semibold text-zinc-800">Bật nhắc nhở định kỳ</label>
                    <p className="text-[10px] text-zinc-400">Hiển thị popup công việc khi mở hệ thống</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.enabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, enabled: e.target.checked })}
                    className="w-4 h-4 accent-zinc-900 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white">
                  <div>
                    <label className="text-xs font-semibold text-zinc-800">Giờ nhắc mỗi ngày</label>
                    <p className="text-[10px] text-zinc-400">Khung giờ hệ thống cảnh báo</p>
                  </div>
                  <input
                    type="time"
                    value={localSettings.time}
                    onChange={(e) => setLocalSettings({ ...localSettings, time: e.target.value })}
                    className="text-xs border border-zinc-200 rounded-lg px-2 py-1 bg-zinc-50 text-zinc-900"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white">
                  <div>
                    <label className="text-xs font-semibold text-zinc-800">Cảnh báo trước thời hạn</label>
                    <p className="text-[10px] text-zinc-400">Số ngày bắt đầu xếp vào Sắp đến hạn</p>
                  </div>
                  <select
                    value={localSettings.notifyDaysBefore}
                    onChange={(e) => setLocalSettings({ ...localSettings, notifyDaysBefore: Number(e.target.value) })}
                    className="text-xs border border-zinc-200 rounded-lg px-2 py-1 bg-zinc-50 text-zinc-900"
                  >
                    <option value={1}>Trước 1 ngày</option>
                    <option value={2}>Trước 2 ngày</option>
                    <option value={3}>Trước 3 ngày (Khuyến nghị)</option>
                    <option value={5}>Trước 5 ngày</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white">
                  <div>
                    <label className="text-xs font-semibold text-zinc-800">Âm thanh chuông báo</label>
                    <p className="text-[10px] text-zinc-400">Phát chuông nhẹ khi có việc khẩn</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestChime}
                      className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded-md border border-zinc-200 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Thử chuông</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={localSettings.sound}
                      onChange={(e) => setLocalSettings({ ...localSettings, sound: e.target.checked })}
                      className="w-4 h-4 accent-zinc-900 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400">
            Tổng cộng: <strong className="text-zinc-800">{overdueTasks.length + todayTasks.length + next3DaysTasks.length}</strong> nhiệm vụ cần theo dõi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
