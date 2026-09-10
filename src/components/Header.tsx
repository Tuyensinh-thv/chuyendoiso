import React, { useState } from 'react';
import { HVULogo } from './HVULogo';
import { UserAccount } from '../types';
import { getRolePermissions } from '../utils/permissions';
import {
  Bell,
  Search,
  ChevronDown,
  SlidersHorizontal,
  LogOut,
  Users,
  X,
  Menu,
  ArrowLeft,
  Building,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount;
  accounts?: UserAccount[];
  onSwitchUser: (account: UserAccount) => void;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  urgentCount: number;
  onOpenDailyReminder: () => void;
  onOpenDriveManager: () => void;
  onOpenNewTaskModal: () => void;
  onOpenEthicalAiSettings: () => void;
  onOpenGoogleSync?: () => void;
  onOpenUserManagement?: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  totalFilteredCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenChangePassword,
  urgentCount,
  onOpenDailyReminder,
  onOpenEthicalAiSettings,
  onOpenUserManagement,
  searchTerm,
  onSearchChange,
  onToggleSidebar,
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs">
            Quản trị viên (Admin)
          </span>
        );
      case 'Lanh_Dao':
        return (
          <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200">
            Lãnh đạo trường
          </span>
        );
      case 'To_Chuyen_Trach':
        return (
          <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
            Tổ CĐS / Thư ký
          </span>
        );
      case 'Don_Vi':
        return (
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            Đơn vị chủ trì
          </span>
        );
      default: return null;
    }
  };

  const perms = getRolePermissions(currentUser.vaiTro);

  return (
    <header className="h-16 bg-gradient-to-r from-[#0B2545] via-[#102A4C] to-[#1E3A8A] border-b border-slate-700/60 sticky top-0 z-30 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 text-white shadow-md">
      
      {/* Mobile Search Overlay */}
      {showMobileSearch ? (
        <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-150">
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Đóng tìm kiếm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              autoFocus
              placeholder="Tìm kiếm công việc, đơn vị..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-800 text-sm rounded-xl border border-slate-600 focus:outline-none text-white placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 1. Left: Hamburger Menu & HVU Branding */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Menu điều hướng"
              aria-label="Menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Authentic HVU Logo & Branding */}
            <div className="flex items-center gap-2">
              <HVULogo className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-sm shrink-0" />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-white tracking-tight uppercase leading-tight">
                    TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#FFD700] font-bold truncate leading-tight mt-0.5">
                  CỔNG ĐIỀU HÀNH CHUYỂN ĐỔI SỐ
                </div>
              </div>
            </div>
          </div>

          {/* 2. Center: Desktop Search Omnibox */}
          <div className="hidden md:block flex-1 max-w-xl mx-2">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo mã nhiệm vụ, tên việc, đơn vị chủ trì, người phụ trách..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-950 text-xs sm:text-sm rounded-xl border border-slate-700 focus:border-slate-500 focus:shadow-xs focus:outline-hidden transition-all text-slate-100 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Search Button (when search overlay is closed) */}
      {!showMobileSearch && (
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Tìm kiếm"
          aria-label="Mở tìm kiếm"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {/* 3. Right: Notifications & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Daily Reminder Bell with count badge */}
        <button
          onClick={onOpenDailyReminder}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Thông báo đôn đốc tiến độ"
          aria-label="Thông báo nhắc việc hàng ngày"
        >
          <Bell className="w-5 h-5" />
          {urgentCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#BE1E2D] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#0B2545] animate-pulse">
              {urgentCount > 9 ? '9+' : urgentCount}
            </span>
          )}
        </button>

        {/* User Account Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
            aria-expanded={showAccountDropdown}
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-tight">
                {currentUser.hoTen}
              </p>
              <p className="text-[10px] text-slate-300 leading-tight">
                {currentUser.donVi}
              </p>
            </div>
            
            <div className="w-8 h-8 rounded-lg bg-[#BE1E2D] text-white flex items-center justify-center font-black text-xs shadow-xs">
              {currentUser.hoTen.charAt(currentUser.hoTen.lastIndexOf(' ') + 1) || 'H'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-300 mr-1" />
          </button>

          {/* Account Profile Menu */}
          {showAccountDropdown && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800"
              role="menu"
            >
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">{currentUser.hoTen}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">{currentUser.donVi}</span>
                  {getRoleBadge(currentUser.vaiTro)}
                </div>
              </div>

              <div className="pt-1.5 px-2 space-y-0.5">
                {onOpenUserManagement && perms.canManageUsers && (
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onOpenUserManagement();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quản lý cán bộ & người dùng</span>
                  </button>
                )}

                {perms.canConfigureAi && (
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onOpenEthicalAiSettings();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cài đặt AI & Đạo đức</span>
                  </button>
                )}

                {onOpenChangePassword && (
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onOpenChangePassword();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đổi mật khẩu</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer font-semibold border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Đăng xuất hệ thống</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
