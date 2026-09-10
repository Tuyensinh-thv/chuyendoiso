import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Check, 
  Shield, 
  Mail, 
  Building, 
  User, 
  RefreshCw,
  Search,
  Save,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  Unlock
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { saveAccountsToStorage, DEFAULT_PASSWORD_HASH } from '../utils/storage';
import { fetchPublicSpreadsheetData, loadSyncConfig, pushChangePasswordToGas } from '../utils/googleSheets';
import { deleteAccountFromSupabase } from '../utils/supabaseService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  onUpdateAccounts: (updated: UserAccount[]) => void;
  currentUser: UserAccount;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUpdateAccounts,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserAccount>({
    email: '',
    hoTen: '',
    donVi: '',
    vaiTro: 'Don_Vi',
    avatar: '👤'
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<UserAccount>({
    email: '',
    hoTen: '',
    donVi: 'Văn phòng',
    vaiTro: 'Don_Vi',
    avatar: '👤'
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredAccounts = accounts.filter(a => 
    a.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.donVi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (acc: UserAccount) => {
    setEditingEmail(acc.email);
    setEditForm({ ...acc });
    setIsAddingNew(false);
  };

  const handleSaveEdit = () => {
    if (!editForm.hoTen.trim()) {
      setStatusMsg({ type: 'error', text: 'Họ và tên không được để trống.' });
      return;
    }
    const updated = accounts.map(a => a.email === editingEmail ? editForm : a);
    onUpdateAccounts(updated);
    saveAccountsToStorage(updated);
    setEditingEmail(null);
    setStatusMsg({ type: 'success', text: `Đã cập nhật tài khoản ${editForm.hoTen}` });
  };

  const handleAddNew = () => {
    if (!newForm.email.trim() || !newForm.email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }
    if (!newForm.hoTen.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập họ và tên.' });
      return;
    }
    if (accounts.some(a => a.email.toLowerCase() === newForm.email.toLowerCase())) {
      setStatusMsg({ type: 'error', text: 'Email này đã tồn tại trong hệ thống.' });
      return;
    }

    const updated = [...accounts, { 
      ...newForm, 
      email: newForm.email.trim(),
      passwordHash: DEFAULT_PASSWORD_HASH,
      trangThai: 'Hoạt động' as const
    }];
    onUpdateAccounts(updated);
    saveAccountsToStorage(updated);
    setIsAddingNew(false);
    setNewForm({ email: '', hoTen: '', donVi: 'Văn phòng', vaiTro: 'Don_Vi', avatar: '👤' });
    setStatusMsg({ type: 'success', text: `Đã thêm tài khoản ${newForm.hoTen} thành công! Mật khẩu mặc định: hvu2026` });
  };

  const handleResetPassword = async (email: string) => {
    const updated = accounts.map(a => 
      a.email === email 
        ? { ...a, passwordHash: DEFAULT_PASSWORD_HASH } 
        : a
    );
    onUpdateAccounts(updated);
    saveAccountsToStorage(updated);
    const config = loadSyncConfig();
    if (config.gasWebAppUrl) {
      await pushChangePasswordToGas(config.gasWebAppUrl, email, DEFAULT_PASSWORD_HASH);
    }
    setStatusMsg({ type: 'success', text: `Đã đặt lại mật khẩu về mặc định (hvu2026) cho ${email}` });
  };

  const handleToggleLock = (email: string) => {
    if (email === 'kiennt@hvu.edu.vn') {
      alert('Không thể khóa tài khoản Quản trị viên chính!');
      return;
    }
    const target = accounts.find(a => a.email === email);
    const newStatus = target?.trangThai === 'Tạm khóa' ? 'Hoạt động' : 'Tạm khóa';
    const updated = accounts.map(a => 
      a.email === email ? { ...a, trangThai: newStatus as any } : a
    );
    onUpdateAccounts(updated);
    saveAccountsToStorage(updated);
    setStatusMsg({ type: 'success', text: `Đã chuyển trạng thái tài khoản ${email} sang "${newStatus}"` });
  };

  const handleDelete = (email: string) => {
    if (email === 'kiennt@hvu.edu.vn') {
      alert('Không thể xóa tài khoản Quản trị viên chính hệ thống!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${email} khỏi danh sách?`)) {
      const updated = accounts.filter(a => a.email !== email);
      onUpdateAccounts(updated);
      saveAccountsToStorage(updated);
      deleteAccountFromSupabase(email).catch((e) => {
        console.warn('Supabase delete account error:', e);
      });
      setStatusMsg({ type: 'success', text: 'Đã xóa tài khoản khỏi hệ thống.' });
    }
  };

  const handleSyncFromSheet = async () => {
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const config = loadSyncConfig();
      const res = await fetchPublicSpreadsheetData(config.spreadsheetId);
      if (res.accounts && res.accounts.length > 0) {
        onUpdateAccounts(res.accounts);
        saveAccountsToStorage(res.accounts);
        setStatusMsg({ 
          type: 'success', 
          text: `Đã đồng bộ nạp thành công ${res.accounts.length} tài khoản chuẩn từ Google Sheet!` 
        });
      } else {
        setStatusMsg({ type: 'error', text: 'Không tìm thấy dữ liệu tài khoản từ Google Sheet.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Lỗi khi đồng bộ tài khoản từ Google Sheet.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'Quản trị viên (Admin)';
      case 'Lanh_Dao': return 'Lãnh đạo trường';
      case 'To_Chuyen_Trach': return 'Tổ CĐS / Thư ký';
      case 'Don_Vi': return 'Đơn vị chủ trì';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">Admin</span>;
      case 'Lanh_Dao':
        return <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200">Lãnh đạo</span>;
      case 'To_Chuyen_Trach':
        return <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">Tổ CĐS</span>;
      case 'Don_Vi':
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Đơn vị</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl max-w-3xl w-full h-full sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B2545] to-[#1E3A8A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Quản lý cán bộ & Tài khoản người dùng</h3>
              <p className="text-xs text-slate-300">
                Đồng bộ hai chiều với Sheet <span className="text-[#FFD700] font-mono">04_Tai_Khoan_Nguoi_Dung</span> ({accounts.length} tài khoản)
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

        {/* Status Message */}
        {statusMsg && (
          <div className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0B2545]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFromSheet}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Kéo danh sách tài khoản mới nhất từ Google Sheets về Web"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Nạp từ Google Sheet</span>
            </button>

            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingEmail(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#BE1E2D] hover:bg-[#990000] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm cán bộ</span>
            </button>
          </div>
        </div>

        {/* Add New Form */}
        {isAddingNew && (
          <div className="p-4 bg-blue-50/60 border-b border-blue-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-700" />
                Thêm tài khoản cán bộ mới
              </span>
              <button 
                onClick={() => setIsAddingNew(false)} 
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Hủy
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Email (*)</label>
                <input
                  type="email"
                  placeholder="canbo@hvu.edu.vn"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Họ và tên (*)</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={newForm.hoTen}
                  onChange={(e) => setNewForm({ ...newForm, hoTen: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Đơn vị công tác</label>
                <input
                  type="text"
                  placeholder="Văn phòng / Phòng Đào tạo..."
                  value={newForm.donVi}
                  onChange={(e) => setNewForm({ ...newForm, donVi: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Vai trò hệ thống</label>
                <select
                  value={newForm.vaiTro}
                  onChange={(e) => setNewForm({ ...newForm, vaiTro: e.target.value as UserRole })}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                >
                  <option value="Don_Vi">Đơn vị chủ trì</option>
                  <option value="To_Chuyen_Trach">Tổ CĐS / Thư ký</option>
                  <option value="Lanh_Dao">Lãnh đạo trường</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-1 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
              >
                Lưu tài khoản
              </button>
            </div>
          </div>
        )}

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
          {filteredAccounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy tài khoản nào phù hợp với từ khóa.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isEditing = editingEmail === acc.email;

              if (isEditing) {
                return (
                  <div key={acc.email} className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2.5 animate-in fade-in duration-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">
                        Chỉnh sửa tài khoản: <span className="font-mono">{acc.email}</span>
                      </span>
                      <button onClick={() => setEditingEmail(null)} className="text-xs text-slate-400 hover:text-slate-700">
                        Đóng
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Họ và tên</label>
                        <input
                          type="text"
                          value={editForm.hoTen}
                          onChange={(e) => setEditForm({ ...editForm, hoTen: e.target.value })}
                          className="w-full text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Đơn vị</label>
                        <input
                          type="text"
                          value={editForm.donVi}
                          onChange={(e) => setEditForm({ ...editForm, donVi: e.target.value })}
                          className="w-full text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Vai trò</label>
                        <select
                          value={editForm.vaiTro}
                          onChange={(e) => setEditForm({ ...editForm, vaiTro: e.target.value as UserRole })}
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        >
                          <option value="Don_Vi">Đơn vị chủ trì</option>
                          <option value="To_Chuyen_Trach">Tổ CĐS / Thư ký</option>
                          <option value="Lanh_Dao">Lãnh đạo trường</option>
                          <option value="Admin">Quản trị viên (Admin)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Trạng thái</label>
                        <select
                          value={editForm.trangThai || 'Hoạt động'}
                          onChange={(e) => setEditForm({ ...editForm, trangThai: e.target.value as any })}
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        >
                          <option value="Hoạt động">Hoạt động</option>
                          <option value="Tạm khóa">Tạm khóa</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingEmail(null)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu thay đổi</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={acc.email}
                  className="p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-base flex items-center justify-center shrink-0">
                      {acc.avatar || '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{acc.hoTen}</p>
                        {getRoleBadge(acc.vaiTro)}
                        {acc.trangThai === 'Tạm khóa' && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Tạm khóa
                          </span>
                        )}
                        {acc.email === currentUser.email && (
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 truncate">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{acc.email}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate hidden sm:flex">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{acc.donVi}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleResetPassword(acc.email)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Đặt lại mật khẩu mặc định (hvu2026)"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    {acc.email !== 'kiennt@hvu.edu.vn' && (
                      <button
                        onClick={() => handleToggleLock(acc.email)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          acc.trangThai === 'Tạm khóa'
                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                        }`}
                        title={acc.trangThai === 'Tạm khóa' ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                      >
                        {acc.trangThai === 'Tạm khóa' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Sửa thông tin"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {acc.email !== 'kiennt@hvu.edu.vn' && (
                      <button
                        onClick={() => handleDelete(acc.email)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số: <strong className="text-slate-800">{accounts.length}</strong> tài khoản cán bộ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-[#0B2545] text-white hover:bg-[#1E3A8A] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
