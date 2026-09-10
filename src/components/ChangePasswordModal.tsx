import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { UserAccount } from '../types';
import { verifyPassword, hashPassword, DEFAULT_PASSWORD_HASH } from '../utils/storage';
import { loadSyncConfig, pushChangePasswordToGas } from '../utils/googleSheets';
import { saveAccountToSupabase } from '../utils/supabaseService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  accounts: UserAccount[];
  onUpdateAccounts: (updated: UserAccount[]) => void;
  onRecordAuditLog?: (action: 'UPDATE', details: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accounts,
  onUpdateAccounts,
  onRecordAuditLog,
}) => {
  if (!isOpen) return null;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    // 1. Basic validation
    if (!trimmedCurrent) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (trimmedNew.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (trimmedNew === trimmedCurrent) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Verify current password
      const targetHash = currentUser.passwordHash || DEFAULT_PASSWORD_HASH;
      const isCurrentValid = await verifyPassword(trimmedCurrent, targetHash);

      if (!isCurrentValid) {
        setErrorMsg('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
        setIsSubmitting(false);
        return;
      }

      // 3. Hash new password
      const newHash = await hashPassword(trimmedNew);

      // 4. Update accounts state and local storage
      const updatedAccount: UserAccount = {
        ...currentUser,
        passwordHash: newHash,
      };

      const updatedAccounts = accounts.map((a) =>
        a.email.toLowerCase() === currentUser.email.toLowerCase() ? updatedAccount : a
      );

      onUpdateAccounts(updatedAccounts);

      // 5. Sync to Google Apps Script / Google Sheets if configured
      const config = loadSyncConfig();
      if (config.gasWebAppUrl) {
        pushChangePasswordToGas(config.gasWebAppUrl, currentUser.email, newHash).catch((err) =>
          console.warn('Lỗi đồng bộ mật khẩu mới sang GAS:', err)
        );
      }

      // 6. Sync to Supabase
      saveAccountToSupabase(updatedAccount).catch((err) =>
        console.warn('Lỗi đồng bộ mật khẩu mới sang Supabase:', err)
      );

      // 7. Record Audit Log
      if (onRecordAuditLog) {
        onRecordAuditLog('UPDATE', `Người dùng [${currentUser.hoTen} - ${currentUser.email}] đã tự đổi mật khẩu thành công`);
      }

      setSuccessMsg('Đổi mật khẩu thành công! Mật khẩu mới đã được lưu an toàn.');
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      setErrorMsg('Có lỗi xảy ra trong quá trình cập nhật mật khẩu. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl max-w-md w-full h-full sm:h-auto flex flex-col shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B2545] to-[#1E3A8A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <KeyRound className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h3 className="text-base font-bold">Đổi mật khẩu tài khoản</h3>
              <p className="text-xs text-slate-300">
                {currentUser.hoTen} ({currentUser.email})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Status Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={isSubmitting || !!successMsg}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  disabled={isSubmitting || !!successMsg}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Khuyến nghị: Sử dụng kết hợp chữ và số để tăng cường bảo mật.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={isSubmitting || !!successMsg}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!successMsg}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#0066FF] active:scale-98 rounded-xl transition-all shadow-md shadow-blue-950/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Lưu mật khẩu mới</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
