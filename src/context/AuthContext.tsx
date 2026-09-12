import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserAccount } from '../types';
import {
  loadCurrentUser,
  saveCurrentUser,
  loadAccountsFromStorage,
  saveAccountsToStorage,
} from '../utils/storage';

interface AuthContextValue {
  isLoggedIn: boolean;
  currentUser: UserAccount;
  accounts: UserAccount[];
  handleLogin: (account: UserAccount) => { defaultView: 'table' | 'stats'; defaultPerspective: string };
  handleLogout: () => void;
  handleUpdateAccounts: (newAccounts: UserAccount[]) => void;
  handleSwitchUser: (user: UserAccount) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('hvu_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => loadCurrentUser());
  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadAccountsFromStorage());

  const handleUpdateAccounts = useCallback((newAccounts: UserAccount[]) => {
    setAccounts(newAccounts);
    saveAccountsToStorage(newAccounts);
    const updatedSelf = newAccounts.find(
      (a) => a.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (updatedSelf) {
      setCurrentUser(updatedSelf);
      saveCurrentUser(updatedSelf);
    }
  }, [currentUser.email]);

  const handleLogin = useCallback((account: UserAccount) => {
    setCurrentUser(account);
    saveCurrentUser(account);
    setIsLoggedIn(true);
    sessionStorage.setItem('hvu_is_logged_in', 'true');

    const defaultView = account.vaiTro === 'Lanh_Dao' ? 'stats' as const : 'table' as const;
    const defaultPerspective =
      account.vaiTro === 'Lanh_Dao'
        ? 'pending_approval'
        : account.vaiTro === 'Don_Vi'
          ? 'my_assigned'
          : 'all';

    return { defaultView, defaultPerspective };
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    sessionStorage.setItem('hvu_is_logged_in', 'false');
  }, []);

  const handleSwitchUser = useCallback((user: UserAccount) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        accounts,
        handleLogin,
        handleLogout,
        handleUpdateAccounts,
        handleSwitchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
