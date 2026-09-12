import React from 'react';
import { UserAccount } from './types';
import { exportTasksToCSV } from './utils/storage';
import { useAuth } from './context/AuthContext';
import { useTasks } from './context/TaskContext';
import { useUI } from './context/UIContext';
import { useTaskStats } from './hooks/useTaskStats';
import { useTaskFilters } from './hooks/useTaskFilters';
import { loadSyncConfig, fetchTasksFromGas, fetchPublicSpreadsheetData } from './utils/googleSheets';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProjectSubBar } from './components/ProjectSubBar';
import { DashboardKPI } from './components/DashboardKPI';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { GanttView } from './components/GanttView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';

import { TaskModal } from './components/TaskModal';
import { DailyReminderModal } from './components/DailyReminderModal';
import { DriveFileManagerModal } from './components/DriveFileManagerModal';
import { NewTaskModal } from './components/NewTaskModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { EthicalAiSettingsModal } from './components/EthicalAiSettingsModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LoginPage } from './components/LoginPage';
import { QuickStatusBar } from './components/QuickStatusBar';
import { AuditLogPanel } from './components/AuditLogPanel';
import { AuditLogView } from './components/AuditLogView';
import { DirectivePanel } from './components/DirectivePanel';
import { getActorRole } from './utils/permissions';
import { X } from 'lucide-react';

export default function App() {
  const {
    isLoggedIn,
    currentUser,
    accounts,
    handleLogin,
    handleLogout,
    handleSwitchUser,
    handleUpdateAccounts,
  } = useAuth();

  const {
    tasks,
    setTasks,
    categories,
    setCategories,
    ethicalAiSettings,
    setEthicalAiSettings,
    reminderSettings,
    menuSettings,
    handleSaveMenuSettings,
    auditLogs,
    setAuditLogs,
    recordAuditLog,
    handleSaveTask,
    handleUpdateTaskStatus,
    handleUpdateTaskProgress,
    handleDeleteTask,
    handleApproveTask,
    handleAddDirectiveToTask,
    handleAddTask,
    handleResetData,
    handleSaveReminderSettings,
  } = useTasks();

  const {
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
  } = useUI();

  const {
    accessibleTasks,
    urgentTasks,
    overdueTasksCount,
    todayTasksCount,
    dueSoonTasksCount,
    completedTasksCount,
    myUnitTasksCount,
    myDelegatedCount,
    pendingApprovalCount,
    aiRecommendations,
    aiRecommendedTaskIds,
    taskCountsByCategory,
    assignees,
  } = useTaskStats(tasks, currentUser, ethicalAiSettings);

  const { sortedTasks } = useTaskFilters(
    accessibleTasks,
    currentUser,
    aiRecommendedTaskIds,
    { ...filters, selectedPerspective },
    sort
  );

  const handleLoginSuccess = (account: UserAccount) => {
    const { defaultView, defaultPerspective } = handleLogin(account);
    recordAuditLog({
      actor: account.hoTen,
      actorRole: getActorRole(account.vaiTro, account.donVi),
      action: 'LOGIN',
      category: 'SYSTEM',
      details: `Đăng nhập vào hệ thống thành công (${account.email})`,
    });
    resetAllFilters();
    setActiveView(defaultView);
    setSelectedPerspective(defaultPerspective as any);
    closeModal();
    setSelectedTask(null);
  };

  const handleLogoutAction = () => {
    if (currentUser) {
      recordAuditLog({
        actor: currentUser.hoTen,
        actorRole: getActorRole(currentUser.vaiTro, currentUser.donVi),
        action: 'LOGOUT',
        category: 'SYSTEM',
        details: 'Đăng xuất khỏi hệ thống',
      });
    }
    handleLogout();
    resetAllFilters();
    closeModal();
    setSelectedTask(null);
  };

  const handleSwitchUserAction = (user: UserAccount) => {
    handleSwitchUser(user);
    resetAllFilters();
    closeModal();
    setSelectedTask(null);
    if (user.vaiTro === 'Lanh_Dao') {
      setActiveView('stats');
      setSelectedPerspective('pending_approval');
    } else if (user.vaiTro === 'Don_Vi') {
      setActiveView('table');
      setSelectedPerspective('my_assigned');
    } else {
      setActiveView('table');
      setSelectedPerspective('all');
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLoginSuccess} accounts={accounts} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden selection:bg-red-100 selection:text-red-900">
      {/* 1. Official HVU Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        accounts={accounts}
        onSwitchUser={handleSwitchUserAction}
        onLogout={handleLogoutAction}
        urgentCount={urgentTasks.length}
        onOpenDailyReminder={() => openModal('dailyReminder')}
        onOpenDriveManager={() => openModal('driveManager')}
        onOpenNewTaskModal={() => {
          setNewTaskInitialDate(undefined);
          openModal('newTask');
        }}
        onOpenEthicalAiSettings={() => openModal('ethicalAiSettings')}
        onOpenGoogleSync={() => openModal('googleSync')}
        onOpenUserManagement={() => openModal('userManagement')}
        onOpenChangePassword={() => openModal('changePassword')}
        searchTerm={filters.searchTerm}
        onSearchChange={(val) => setFilter('searchTerm', val)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        totalFilteredCount={sortedTasks.length}
      />

      {/* 2. Single Web Page Body: Left Sidebar + Right Base Wework Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Backdrop Overlay for Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 top-16 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggleCollapse={toggleSidebar}
          onLogout={handleLogoutAction}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenNewTaskModal={() => {
            setNewTaskInitialDate(undefined);
            openModal('newTask');
          }}
          onOpenDailyReminder={() => openModal('dailyReminder')}
          onOpenDriveManager={() => openModal('driveManager')}
          onOpenCategoryManager={() => openModal('categoryManager')}
          onOpenEthicalAiSettings={() => openModal('ethicalAiSettings')}
          onOpenGoogleSync={() => openModal('googleSync')}
          onOpenUserManagement={() => openModal('userManagement')}
          onOpenAuditLogs={() => setActiveView('auditLogs')}
          onOpenDirectives={() => openModal('directives')}
          onExportData={() => exportTasksToCSV(tasks)}
          onResetData={handleResetData}
          totalTasksCount={accessibleTasks.length}
          urgentCount={urgentTasks.length}
          overdueCount={overdueTasksCount}
          todayCount={todayTasksCount}
          dueSoonCount={dueSoonTasksCount}
          completedCount={completedTasksCount}
          myUnitCount={myUnitTasksCount}
          pendingApprovalCount={pendingApprovalCount}
          myDelegatedCount={myDelegatedCount}
          aiRecommendedCount={aiRecommendations.length}
          menuSettings={menuSettings}
          selectedPerspective={selectedPerspective}
          onSelectPerspective={setSelectedPerspective}
          selectedPlanGroup={filters.selectedPlanGroup}
          onSelectPlanGroup={(group) => setFilter('selectedPlanGroup', group)}
          selectedPriority={filters.selectedPriority}
          onSelectPriority={(p) => setFilter('selectedPriority', p)}
          selectedCategory={filters.selectedCategory}
          onSelectCategory={(c) => setFilter('selectedCategory', c)}
          currentUser={currentUser}
          categories={categories}
          taskCountsByCategory={taskCountsByCategory}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#fafafb] overflow-y-auto">
          {/* Top KPI Cards right below Header */}
          {activeView !== 'auditLogs' && (
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-1.5 shadow-2xs">
              <div className="max-w-[1600px] mx-auto">
                <QuickStatusBar
                  tasks={accessibleTasks}
                  selectedStatus={filters.selectedStatus}
                  onSelectStatus={(status) => setFilter('selectedStatus', status)}
                />
              </div>
            </div>
          )}

          {/* Main Content Workspace Container */}
          <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
            {/* Filter Bar (ProjectSubBar) */}
            {activeView !== 'auditLogs' && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
                <ProjectSubBar
                  activeView={activeView}
                  onSelectView={setActiveView}
                selectedDept={filters.selectedDept}
                onSelectDept={(d) => setFilter('selectedDept', d)}
                selectedStatus={filters.selectedStatus}
                onSelectStatus={(s) => setFilter('selectedStatus', s)}
                selectedTimeRange={filters.selectedTimeRange}
                onSelectTimeRange={(tr) => setFilter('selectedTimeRange', tr)}
                selectedAssignee={filters.selectedAssignee}
                onSelectAssignee={(a) => setFilter('selectedAssignee', a)}
                assignees={assignees}
                sortBy={sort.sortBy}
                onSortByChange={setSortBy}
                sortOrder={sort.sortOrder}
                onToggleSortOrder={toggleSortOrder}
                totalFilteredCount={sortedTasks.length}
              />
            </div>
          )}

          {/* Active Perspective Indicator & Reset Filter Chips */}
          {activeView !== 'auditLogs' &&
            (selectedPerspective !== 'all' ||
              filters.selectedPlanGroup !== 'all' ||
              filters.selectedDept !== 'all' ||
              filters.selectedStatus ||
              filters.selectedPriority !== 'all' ||
              filters.selectedCategory !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap text-xs bg-white p-2.5 px-3.5 rounded-xl border border-zinc-200/90 shadow-2xs">
                <span className="text-zinc-500 font-medium">Bộ lọc đang chọn:</span>

                {selectedPerspective !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                    <span>
                      {selectedPerspective === 'my_assigned' && `Đơn vị: ${currentUser.donVi}`}
                      {selectedPerspective === 'my_delegated' && 'Tôi giao việc'}
                      {selectedPerspective === 'pending_approval' && 'Chờ duyệt nghiệm thu'}
                      {selectedPerspective === 'overdue_urgent' && 'Quá hạn & Khẩn cấp'}
                      {selectedPerspective === 'ai_suggested' && 'Gợi ý AI ưu tiên'}
                    </span>
                    <button
                      onClick={() => setSelectedPerspective('all')}
                      className="hover:text-zinc-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.selectedPlanGroup !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>{filters.selectedPlanGroup}</span>
                    <button
                      onClick={() => setFilter('selectedPlanGroup', 'all')}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.selectedDept !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>Đơn vị: {filters.selectedDept}</span>
                    <button
                      onClick={() => setFilter('selectedDept', 'all')}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.selectedStatus && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>Trạng thái: {filters.selectedStatus}</span>
                    <button
                      onClick={() => setFilter('selectedStatus', '')}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.selectedPriority !== 'all' && (
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                    <span>Ưu tiên: {filters.selectedPriority}</span>
                    <button
                      onClick={() => setFilter('selectedPriority', 'all')}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetAllFilters}
                  className="text-zinc-500 hover:text-zinc-900 underline ml-auto text-[11px] cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {/* View Component Display */}
            <div className="flex-1">
              {activeView === 'table' && (
                <TableView
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onUpdateTaskProgress={handleUpdateTaskProgress}
                  onApproveTask={(id) => handleApproveTask(id, 'Da_Duyet')}
                  currentUser={currentUser}
                  categories={categories}
                  recommendedTaskIds={Array.from(aiRecommendedTaskIds)}
                />
              )}

              {activeView === 'kanban' && (
                <KanbanBoard
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  currentUser={currentUser}
                  categories={categories}
                  recommendedTaskIds={Array.from(aiRecommendedTaskIds)}
                />
              )}

              {activeView === 'gantt' && (
                <GanttView
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                />
              )}

              {activeView === 'calendar' && (
                <CalendarView
                  tasks={sortedTasks}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onAddNewTask={(date) => {
                    setNewTaskInitialDate(date);
                    openModal('newTask');
                  }}
                  categories={categories}
                />
              )}

              {activeView === 'stats' && (
                <div className="space-y-4">
                  <DashboardKPI
                    tasks={accessibleTasks}
                    selectedStatusFilter={filters.selectedStatus}
                    onSelectStatusFilter={(status) => setFilter('selectedStatus', status)}
                    onSelectPlanGroup={(group) => {
                      setFilter('selectedPlanGroup', group);
                      setActiveView('table');
                    }}
                    onSelectDept={(dept) => {
                      setFilter('selectedDept', dept);
                      setActiveView('table');
                    }}
                    onSelectTask={(task) => setSelectedTask(task)}
                  />
                  <StatsView
                    tasks={accessibleTasks}
                    onFilterStatus={(status) => {
                      setFilter('selectedStatus', status);
                      setActiveView('table');
                    }}
                    onFilterDept={(dept) => {
                      setFilter('selectedDept', dept);
                      setActiveView('table');
                    }}
                  />
                </div>
              )}

              {activeView === 'auditLogs' && (
                <AuditLogView
                  logs={auditLogs}
                  onRefresh={async () => {
                    const config = loadSyncConfig();
                    if (config.gasWebAppUrl) {
                      try {
                        const res = await fetchTasksFromGas(config.gasWebAppUrl);
                        if (res.auditLogs && res.auditLogs.length > 0) setAuditLogs(res.auditLogs);
                      } catch (e) {
                        console.warn('Failed to refresh audit logs from GAS:', e);
                      }
                    } else if (config.spreadsheetId) {
                      try {
                        const res = await fetchPublicSpreadsheetData(config.spreadsheetId);
                        if (res.auditLogs && res.auditLogs.length > 0) setAuditLogs(res.auditLogs);
                      } catch (e) {
                        console.warn('Failed to refresh audit logs from Sheets:', e);
                      }
                    }
                  }}
                  onSelectTask={(id) => {
                    const t = tasks.find((item) => item.id === id);
                    if (t) setSelectedTask(t);
                  }}
                  onBackToTasks={() => setActiveView('table')}
                />
              )}
            </div>

            {/* HVU Official System Footer */}
            <footer className="mt-8 sm:mt-12 py-4 sm:py-5 px-4 sm:px-6 border-t border-slate-200 bg-white text-slate-600 text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 rounded-2xl shadow-xs text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="font-bold text-[#0B2545]">TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="text-slate-500 font-medium text-[11px] sm:text-xs">
                  Cổng Điều Hành Chuyển Đổi Số (NQ57)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                © 2026 HVU. Phát triển bởi Tổ Chuyển đổi số.
              </span>
            </footer>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
          onApproveTask={handleApproveTask}
          categories={categories}
          accounts={accounts}
        />
      )}

      {/* 2. New Task Modal */}
      {activeModal === 'newTask' && (
        <NewTaskModal
          isOpen={true}
          onClose={closeModal}
          onAddTask={handleAddTask}
          currentUser={currentUser}
          initialDate={newTaskInitialDate}
          categories={categories}
          tasks={tasks}
          existingCount={tasks.length}
        />
      )}

      {/* 3. Daily Reminder Modal */}
      {activeModal === 'dailyReminder' && (
        <DailyReminderModal
          isOpen={true}
          onClose={closeModal}
          tasks={tasks}
          settings={reminderSettings}
          onSaveSettings={handleSaveReminderSettings}
          onSelectTask={(task) => {
            closeModal();
            setSelectedTask(task);
          }}
          currentUser={currentUser}
        />
      )}

      {/* 4. Google Drive Evidence Manager */}
      {activeModal === 'driveManager' && (
        <DriveFileManagerModal
          isOpen={true}
          onClose={closeModal}
          tasks={tasks}
          onSelectTask={(task) => {
            closeModal();
            setSelectedTask(task);
          }}
        />
      )}

      {/* 5. Category Manager Modal */}
      {activeModal === 'categoryManager' && (
        <CategoryManagerModal
          isOpen={true}
          onClose={closeModal}
          categories={categories}
          onSaveCategories={setCategories}
          tasks={tasks}
        />
      )}

      {/* 6. System & Ethical AI Settings Modal */}
      {activeModal === 'ethicalAiSettings' && (
        <EthicalAiSettingsModal
          isOpen={true}
          onClose={closeModal}
          settings={ethicalAiSettings}
          onSaveSettings={setEthicalAiSettings}
          menuSettings={menuSettings}
          onSaveMenuSettings={handleSaveMenuSettings}
          currentUser={currentUser}
        />
      )}

      {/* 7. Google Workspace Sync and Backup Manager */}
      {activeModal === 'googleSync' && (
        <GoogleSyncModal
          isOpen={true}
          onClose={closeModal}
          currentUser={currentUser}
          tasks={tasks}
          onUpdateTasks={setTasks}
          categories={categories}
          onUpdateCategories={setCategories}
          accounts={accounts}
          onUpdateAccounts={handleUpdateAccounts}
        />
      )}

      {/* 7b. User & Account Management Modal */}
      {activeModal === 'userManagement' && (
        <UserManagementModal
          isOpen={true}
          onClose={closeModal}
          accounts={accounts}
          onUpdateAccounts={handleUpdateAccounts}
          currentUser={currentUser}
        />
      )}

      {/* 7c. Change Password Modal */}
      {activeModal === 'changePassword' && (
        <ChangePasswordModal
          isOpen={true}
          onClose={closeModal}
          currentUser={currentUser}
          accounts={accounts}
          onUpdateAccounts={handleUpdateAccounts}
          onRecordAuditLog={(action, details) => {
            recordAuditLog({
              actor: currentUser.hoTen,
              actorRole: currentUser.vaiTro,
              action,
              details,
            });
          }}
        />
      )}

      {/* 8. System Audit Log Panel */}
      <AuditLogPanel
        isOpen={activeModal === 'auditLogs'}
        onClose={closeModal}
        logs={auditLogs}
        onRefresh={async () => {
          const config = loadSyncConfig();
          if (config.gasWebAppUrl) {
            try {
              const res = await fetchTasksFromGas(config.gasWebAppUrl);
              if (res.auditLogs && res.auditLogs.length > 0) setAuditLogs(res.auditLogs);
            } catch (e) {
              console.warn('Failed to refresh audit logs from GAS:', e);
            }
          } else if (config.spreadsheetId) {
            try {
              const res = await fetchPublicSpreadsheetData(config.spreadsheetId);
              if (res.auditLogs && res.auditLogs.length > 0) setAuditLogs(res.auditLogs);
            } catch (e) {
              console.warn('Failed to refresh audit logs from Sheets:', e);
            }
          }
        }}
        onSelectTask={(id) => {
          const t = tasks.find((item) => item.id === id);
          if (t) setSelectedTask(t);
        }}
      />

      {/* 9. Leadership Directives & Communication Center */}
      <DirectivePanel
        isOpen={activeModal === 'directives'}
        onClose={closeModal}
        tasks={tasks}
        currentUser={currentUser}
        onSelectTask={(t) => setSelectedTask(t)}
        onAddDirectiveToTask={handleAddDirectiveToTask}
      />
    </div>
  );
}
