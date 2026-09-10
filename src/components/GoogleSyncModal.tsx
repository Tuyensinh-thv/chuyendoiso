import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  HardDrive, 
  RefreshCw, 
  CloudUpload, 
  CloudDownload, 
  CheckCircle, 
  Settings, 
  Key, 
  AlertTriangle,
  LogOut,
  Link2,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { TaskNQ57, UserAccount, CustomCategory } from '../types';
import { 
  loadSyncConfig, 
  saveSyncConfig, 
  loadAccessToken, 
  clearAccessToken, 
  initGoogleAuthPopup, 
  createNewSpreadsheet, 
  createDriveFolder, 
  exportToGoogleSheets, 
  importFromGoogleSheets,
  fetchTasksFromGas,
  pushTasksToGas
} from '../utils/googleSheets';
import { INITIAL_ACCOUNTS } from '../data/initialData';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  tasks: TaskNQ57[];
  onUpdateTasks: (tasks: TaskNQ57[]) => void;
  categories: CustomCategory[];
  onUpdateCategories: (categories: CustomCategory[]) => void;
  accounts?: UserAccount[];
  onUpdateAccounts?: (accounts: UserAccount[]) => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  tasks,
  onUpdateTasks,
  categories,
  onUpdateCategories,
  accounts,
  onUpdateAccounts,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'gas' | 'oauth'>('gas');
  const [accessToken, setAccessToken] = useState<string>('');
  const [config, setConfig] = useState(() => loadSyncConfig());
  const [gasWebAppUrlInput, setGasWebAppUrlInput] = useState(config.gasWebAppUrl || '');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(config.spreadsheetId);
  const [driveFolderIdInput, setDriveFolderIdInput] = useState(config.driveFolderId);
  const [autoBackupInput, setAutoBackupInput] = useState(config.autoBackup);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = currentUser.email === 'kiennt@hvu.edu.vn' || currentUser.vaiTro === 'To_Chuyen_Trach' || currentUser.vaiTro === 'Lanh_Dao';

  useEffect(() => {
    setAccessToken(loadAccessToken());
  }, []);

  // Sync via Apps Script Web App (Recommended - no OAuth / origin mismatch)
  const handleSyncFromGas = async () => {
    if (!gasWebAppUrlInput.trim()) {
      setErrorMsg('Vui lòng nhập đường dẫn URL Web App của Google Apps Script.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      saveSyncConfig({ gasWebAppUrl: gasWebAppUrlInput.trim() });
      const result = await fetchTasksFromGas(gasWebAppUrlInput);
      if (!result.tasks || result.tasks.length === 0) {
        setErrorMsg('Không tìm thấy nhiệm vụ nào trong sheet 01_Nhiem_Vu_NQ57.');
        return;
      }
      onUpdateTasks(result.tasks);
      if (result.accounts && result.accounts.length > 0 && onUpdateAccounts) {
        onUpdateAccounts(result.accounts);
      }
      const nowString = new Date().toLocaleString('vi-VN');
      saveSyncConfig({ lastSync: nowString });
      setConfig(prev => ({ ...prev, lastSync: nowString, gasWebAppUrl: gasWebAppUrlInput.trim() }));
      const accInfo = result.accounts && result.accounts.length > 0 ? ` và ${result.accounts.length} tài khoản người dùng` : '';
      setSuccessMsg(`Đã đồng bộ thành công ${result.tasks.length} nhiệm vụ${accInfo} từ Google Sheets về Web! (${nowString})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đồng bộ từ Apps Script Web App.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToGas = async () => {
    if (!gasWebAppUrlInput.trim()) {
      setErrorMsg('Vui lòng nhập đường dẫn URL Web App của Google Apps Script.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      saveSyncConfig({ gasWebAppUrl: gasWebAppUrlInput.trim() });
      await pushTasksToGas(gasWebAppUrlInput, tasks);
      const nowString = new Date().toLocaleString('vi-VN');
      saveSyncConfig({ lastSync: nowString });
      setConfig(prev => ({ ...prev, lastSync: nowString, gasWebAppUrl: gasWebAppUrlInput.trim() }));
      setSuccessMsg(`Đã cập nhật dữ liệu tiến độ từ Web lên Google Sheets thành công! (${nowString})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gửi dữ liệu lên Apps Script Web App.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Handlers
  const handleConnectGoogle = () => {
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    initGoogleAuthPopup(
      (token) => {
        setAccessToken(token);
        setIsLoading(false);
        setSuccessMsg('Liên kết tài khoản Google thành công!');
      },
      (err) => {
        setIsLoading(false);
        setErrorMsg(`Không thể kết nối Google: ${err}`);
      }
    );
  };

  const handleDisconnectGoogle = () => {
    clearAccessToken();
    setAccessToken('');
    setSuccessMsg('Đã đăng xuất tài khoản Google.');
  };

  const handleSaveConfig = () => {
    const updated = {
      gasWebAppUrl: gasWebAppUrlInput.trim(),
      spreadsheetId: spreadsheetIdInput.trim(),
      driveFolderId: driveFolderIdInput.trim(),
      autoBackup: autoBackupInput,
    };
    setConfig((prev) => ({ ...prev, ...updated }));
    saveSyncConfig(updated);
    setSuccessMsg('Đã lưu cấu hình Google Workspace.');
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setErrorMsg('Vui lòng liên kết tài khoản Google trước.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const id = await createNewSpreadsheet('HVU TaskMaster - Lưu trữ & Đồng bộ NQ57');
      setSpreadsheetIdInput(id);
      setConfig((prev) => ({ ...prev, spreadsheetId: id }));
      setSuccessMsg('Tạo mới Google Spreadsheet thành công! Đã tự động tạo các Sheet con.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo bảng tính mới.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewFolder = async () => {
    if (!accessToken) {
      setErrorMsg('Vui lòng liên kết tài khoản Google trước.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const id = await createDriveFolder('HVU_NQ57_Evidence_Vault');
      setDriveFolderIdInput(id);
      setConfig((prev) => ({ ...prev, driveFolderId: id }));
      setSuccessMsg('Tạo mới thư mục lưu trữ Google Drive thành công!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo thư mục Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToGoogle = async () => {
    if (!accessToken) {
      setErrorMsg('Vui lòng liên kết tài khoản Google trước.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      handleSaveConfig();
      await exportToGoogleSheets(tasks, accounts && accounts.length > 0 ? accounts : INITIAL_ACCOUNTS, categories);
      const updatedConfig = loadSyncConfig();
      setConfig(updatedConfig);
      setSuccessMsg(`Xuất và đồng bộ dữ liệu lên Google Sheets thành công! (${updatedConfig.lastSync})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đồng bộ lên Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromGoogle = async () => {
    if (!accessToken) {
      setErrorMsg('Vui lòng liên kết tài khoản Google trước.');
      return;
    }
    if (!window.confirm('Cảnh báo: Đồng bộ từ Google Sheets về sẽ ghi đè lên toàn bộ dữ liệu hiện tại trong ứng dụng. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      handleSaveConfig();
      const imported = await importFromGoogleSheets();
      if (!imported.tasks || imported.tasks.length === 0) {
        setErrorMsg('Bảng tính Google Sheets này hiện đang trống hoặc chưa có dữ liệu nhiệm vụ.');
        return;
      }
      onUpdateTasks(imported.tasks);
      onUpdateCategories(imported.categories);
      if (imported.accounts && imported.accounts.length > 0 && onUpdateAccounts) {
        onUpdateAccounts(imported.accounts);
      }
      const updatedConfig = loadSyncConfig();
      setConfig(updatedConfig);
      const accInfo = imported.accounts && imported.accounts.length > 0 ? ` và ${imported.accounts.length} tài khoản người dùng` : '';
      setSuccessMsg(`Nhập và cập nhật dữ liệu từ Google Sheets về thiết bị thành công (${imported.tasks.length} nhiệm vụ${accInfo})! (${updatedConfig.lastSync})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đồng bộ từ Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl shadow-xl border-0 sm:border border-zinc-200 overflow-hidden flex flex-col text-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Liên kết & Đồng bộ Google Sheets / Drive</h2>
              <p className="text-[11px] text-zinc-500">Đồng bộ 2 chiều dữ liệu 57 nhiệm vụ Nghị quyết 57 Trường ĐHHV</p>
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

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('gas'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'gas'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Phương thức 1: Apps Script Web App (Khuyên dùng)</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">1-Click</span>
          </button>

          <button
            onClick={() => { setActiveTab('oauth'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-zinc-400" />
            <span>Phương thức 2: Google OAuth APIs</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          
          {/* Alerts */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-950 p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[11px] font-bold">{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: GAS WEB APP SYNC (RECOMMENDED) */}
          {activeTab === 'gas' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
                    <h3 className="font-bold text-xs text-emerald-950">
                      Đồng bộ trực tiếp không cần Google Cloud OAuth
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Không bao giờ bị lỗi origin_mismatch
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Vì bạn đã dán code vào Google Apps Script trên bảng tính, bạn chỉ cần <strong>Triển khai (Deploy)</strong> dưới dạng <strong>Ứng dụng web (Web app)</strong> và dán URL vào đây để đồng bộ 2 chiều dữ liệu 57 nhiệm vụ.
                </p>

                {/* 3 Steps Guide */}
                <div className="bg-white p-3 rounded-lg border border-emerald-100 text-[11px] text-zinc-700 space-y-1.5">
                  <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> 3 bước lấy URL Web App trong 30 giây:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-600 pl-1 text-[11px]">
                    <li>Trong Apps Script của file Sheets, nhấn nút màu xanh <strong>Triển khai (Deploy)</strong> ➔ chọn <strong>Tệp triển khai mới (New deployment)</strong>.</li>
                    <li>Bấm biểu tượng bánh răng ⚙️ ➔ Chọn <strong>Ứng dụng web (Web app)</strong>. Chọn:
                      <ul className="list-disc list-inside pl-4 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <li>Thực thi dưới tên: <strong>Tôi (Me)</strong></li>
                        <li>Người có quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong></li>
                      </ul>
                    </li>
                    <li>Nhấn <strong>Triển khai</strong> ➔ Copy <strong>URL ứng dụng web</strong> (có đuôi <code className="text-emerald-700">/exec</code>) và dán vào ô bên dưới.</li>
                  </ol>
                </div>
              </div>

              {/* Web App URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800">
                  Đường dẫn Web App URL của Apps Script:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={gasWebAppUrlInput}
                      onChange={(e) => setGasWebAppUrlInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-hidden focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Lần đồng bộ thành công gần nhất: <strong className="text-zinc-700">{config.lastSync || 'Chưa thực hiện'}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSyncFromGas}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CloudDownload className="w-4 h-4 text-white" />
                  <span>📥 Nạp 57 nhiệm vụ từ Sheets về Web</span>
                </button>

                <button
                  onClick={handleSyncToGas}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 border border-emerald-600 text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4 text-emerald-700" />
                  <span>📤 Cập nhật thay đổi từ Web lên Sheets</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE OAUTH APIs */}
          {activeTab === 'oauth' && (
            <div className="space-y-5">
              {/* Origin mismatch banner */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-2 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Hướng dẫn khắc phục "Lỗi 400: origin_mismatch":</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Lỗi này xảy ra khi Google Cloud Console chưa thêm địa chỉ <code>http://localhost:5173</code> vào danh sách tên miền được phép. Để sửa:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-amber-900 space-y-1 pl-1">
                  <li>Mở <strong>Google Cloud Console</strong> ➔ Chọn mục <strong>APIs & Services</strong> ➔ <strong>Credentials</strong>.</li>
                  <li>Nhấp vào <strong>OAuth 2.0 Client ID</strong> bạn đang dùng.</li>
                  <li>Tại mục <strong>Authorized JavaScript origins</strong> (Nguồn gốc JavaScript đã ủy quyền), nhấn <strong>+ ADD URI</strong> và thêm:
                    <div className="bg-white/80 p-1.5 rounded font-mono text-[10px] text-amber-900 my-1">
                      http://localhost:5173
                    </div>
                  </li>
                  <li>Nhấn <strong>Save (Lưu)</strong> và chờ 1-2 phút rồi thử lại nút liên kết bên dưới.</li>
                </ol>
              </div>

              {/* Connection State Panel */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-zinc-500" />
                  Trạng thái liên kết tài khoản Google
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200/60">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${accessToken ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                    <div>
                      <p className="font-bold text-xs text-zinc-800">
                        {accessToken ? 'Đã kết nối tài khoản Google' : 'Chưa kết nối dịch vụ Google'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {accessToken ? 'Sẵn sàng ghi/đọc dữ liệu đám mây qua OAuth.' : 'Yêu cầu ủy quyền Google Identity Services.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {accessToken ? (
                      <button
                        onClick={handleDisconnectGoogle}
                        className="px-3 py-1.5 text-xs font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectGoogle}
                        className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                        <span>Liên kết Google</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Configurations Section */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Mã Google Spreadsheet ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={!isAdmin}
                      placeholder="Ví dụ: 1furcGHFPPe_sIG1h78Y3leJN_eA1GnRipBYQAX6YBSc"
                      value={spreadsheetIdInput}
                      onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-hidden focus:border-zinc-900 font-mono disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                    {isAdmin && (
                      <button
                        onClick={handleCreateNewSheet}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg shrink-0 cursor-pointer"
                      >
                        + Tạo bảng mới
                      </button>
                    )}
                  </div>
                </div>

                {/* Drive Folder ID */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Mã Thư mục Google Drive Folder ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={!isAdmin}
                      placeholder="Ví dụ: 1XyZaBcDeFgHiJkLmNoPqRsTuVw"
                      value={driveFolderIdInput}
                      onChange={(e) => setDriveFolderIdInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-hidden focus:border-zinc-900 font-mono disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                    {isAdmin && (
                      <button
                        onClick={handleCreateNewFolder}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg shrink-0 cursor-pointer"
                      >
                        + Tạo thư mục mới
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleSyncToGoogle}
                    disabled={isLoading || !accessToken}
                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="w-4 h-4 text-white" />
                    <span>Xuất dữ liệu lên Sheets (OAuth)</span>
                  </button>

                  <button
                    onClick={handleSyncFromGoogle}
                    disabled={isLoading || !accessToken}
                    className="w-full py-2.5 px-4 border border-zinc-300 text-zinc-800 hover:bg-zinc-100 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-4 h-4 text-zinc-600" />
                    <span>Nạp dữ liệu từ Sheets (OAuth)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/50">
          <div className="text-[10px] text-zinc-400">
            Cổng điều hành CĐS NQ57 • Trường Đại học Hùng Vương
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={handleSaveConfig}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 border border-zinc-200 bg-white rounded-lg transition-colors cursor-pointer"
              >
                Lưu cấu hình
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
