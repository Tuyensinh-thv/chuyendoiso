import React, { createContext, useContext, useState, useCallback } from 'react';
import { BaseWeworkPerspective, TaskNQ57 } from '../types';
import { loadCurrentUser } from '../utils/storage';

type ActiveModal =
  | null
  | 'task'
  | 'newTask'
  | 'dailyReminder'
  | 'driveManager'
  | 'categoryManager'
  | 'ethicalAiSettings'
  | 'googleSync'
  | 'userManagement'
  | 'changePassword'
  | 'auditLogs'
  | 'directives';

export type ActiveView = 'kanban' | 'table' | 'gantt' | 'calendar' | 'stats' | 'auditLogs' | 'checklistHub';

interface FilterState {
  searchTerm: string;
  selectedPlanGroup: string;
  selectedDept: string;
  selectedStatus: string;
  selectedPriority: string;
  selectedCategory: string;
  selectedTimeRange: string;
  selectedAssignee: string;
}

interface SortState {
  sortBy: 'priority' | 'deadline' | 'progress' | 'id';
  sortOrder: 'asc' | 'desc';
}

interface UIContextValue {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  selectedPerspective: BaseWeworkPerspective;
  setSelectedPerspective: (p: BaseWeworkPerspective) => void;

  activeModal: ActiveModal;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;

  selectedTask: TaskNQ57 | null;
  setSelectedTask: (task: TaskNQ57 | null) => void;

  newTaskInitialDate: string | undefined;
  setNewTaskInitialDate: (date: string | undefined) => void;

  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetAllFilters: () => void;

  sort: SortState;
  setSortBy: (sortBy: SortState['sortBy']) => void;
  toggleSortOrder: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchTerm: '',
  selectedPlanGroup: 'all',
  selectedDept: 'all',
  selectedStatus: '',
  selectedPriority: 'all',
  selectedCategory: 'all',
  selectedTimeRange: 'all',
  selectedAssignee: 'all',
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768;
    return true;
  });

  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const user = loadCurrentUser();
    return user.vaiTro === 'Lanh_Dao' ? 'stats' : 'table';
  });

  const [selectedPerspective, setSelectedPerspective] = useState<BaseWeworkPerspective>(() => {
    const user = loadCurrentUser();
    if (user.vaiTro === 'Lanh_Dao') return 'pending_approval';
    if (user.vaiTro === 'Don_Vi') return 'my_assigned';
    return 'all';
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedTask, setSelectedTask] = useState<TaskNQ57 | null>(null);
  const [newTaskInitialDate, setNewTaskInitialDate] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ sortBy: 'priority', sortOrder: 'desc' });

  const toggleSidebar = useCallback(() => setIsSidebarOpen((p) => !p), []);
  const setSidebarOpen = useCallback((open: boolean) => setIsSidebarOpen(open), []);

  const openModal = useCallback((modal: ActiveModal) => setActiveModal(modal), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSelectedPerspective('all');
  }, []);

  const setSortBy = useCallback((sortBy: SortState['sortBy']) => {
    setSort((prev) => ({ ...prev, sortBy }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSort((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }));
  }, []);

  return (
    <UIContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        activeView,
        setActiveView,
        selectedPerspective,
        setSelectedPerspective,
        activeModal,
        openModal,
        closeModal,
        selectedTask,
        setSelectedTask,
        newTaskInitialDate,
        setNewTaskInitialDate,
        filters,
        setFilter,
        resetAllFilters,
        sort,
        setSortBy,
        toggleSortOrder,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
