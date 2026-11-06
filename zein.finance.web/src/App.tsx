import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from "@heroui/react";
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Expenses } from './components/Expenses';
import { ExpenseModal } from './components/ExpenseModal';
import { MemberModal } from './components/MemberModal';
import { Auth } from './components/Auth';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorModal } from './components/common/ErrorModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import loadingGif from '../loading.gif';
import { useAuth } from './hooks/useAuth';
import { useMembers, type MemberConfirmationAction } from './hooks/useMembers';
import { useShowError } from './hooks/useShowError';
import { useExpenses, type ExpenseConfirmationAction } from './hooks/useExpenses';

export default function App() {

  type AppView = 'dashboard' | 'members' | 'expenses';
  const [view, setView] = useState<AppView>('dashboard');

  const { errorMessage, isErrorModalOpen, showError, closeErrorModal } = useShowError();

  // Data State
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    isAuthenticated,
    user,
    isAuthChecking,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    error,
    message,
    isAuthSubmitting,
    handleAuth,
    handleLogout,
    handleUnauthorized: clearUnauthorizedAuth
  } = useAuth();

  const [confirmMessage, setConfirmMessage] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    ExpenseConfirmationAction | MemberConfirmationAction | null
  >(null);

  const isAdmin = user?.role?.trim().toLowerCase() === 'admin';
  const memberFeature = useMembers({
    isAuthenticated,
    isAdmin,
    setIsLoading,
    showError,
    onUnauthorized: () => {
      clearUnauthorizedAuth();
      expenseFeature.clearExpenses();
    },
    onRequestConfirmation: (message, action) => {
      setPendingAction(action);
      setConfirmMessage(message);
      setIsConfirmModalOpen(true);
    }
  });

  const {
    members,
    fetchMembers,
    actionInProgressId: memberActionInProgressId,
    isModalOpen: isMemberModalOpen,
    onModalOpenChange: onMemberModalOpenChange,
    editingMember,
    memberForm,
    setMemberForm,
    isSaving: isMemberSaving,
    handleSaveMember,
    openAddMember,
    openEditMember,
    handleSetMemberStatus,
    handleDeleteMember,
    performSetMemberStatus,
    performDeleteMember
  } = memberFeature;

  const expenseFeature = useExpenses({
    isAuthenticated,
    members,
    setIsLoading,
    showError,
    onRequestConfirmation: (message, action) => {
      setPendingAction(action);
      setConfirmMessage(message);
      setIsConfirmModalOpen(true);
    }
  });
  const {
    expenses,
    fetchExpenses,
    editingExpense,
    expenseForm,
    setExpenseForm,
    isOpen,
    onOpenChange,
    onClose,
    handleSaveExpense,
    performDeleteExpense,
    handleDeleteExpense,
    handleToggleExpensePaymentStatus,
    openAddExpense,
    openEditExpense
  } = expenseFeature;

  useEffect(() => {
    if (isAuthenticated) {
      void refreshInitialData();
    }
  }, [isAuthenticated]);

  const currentView: AppView = !isAdmin && view === 'members' ? 'dashboard' : view;

  useEffect(() => {
    if (isAuthenticated && !isAdmin && view === 'members') {
      setView('dashboard');
    }
  }, [isAuthenticated, isAdmin, view]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  const setViewWithAccess = (nextView: AppView) => {
    if (nextView === 'members' && !isAdmin) {
      setView('dashboard');
      return;
    }

    setView(nextView);
  };

  const handleConfirmed = async () => {
    setConfirmMessage('');
    setIsConfirmModalOpen(false);

    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'deleteExpense') {
        await performDeleteExpense(pendingAction.expenseId, pendingAction.name);
      } else if (pendingAction.type === 'deleteMember' && pendingAction.memberId !== undefined) {
        await performDeleteMember(pendingAction.memberId, pendingAction.name || '');
      } else if (pendingAction.type === 'setMemberStatus' && pendingAction.memberId !== undefined && pendingAction.memberStatus !== undefined) {
        await performSetMemberStatus(pendingAction.memberId, pendingAction.memberStatus);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const refreshInitialData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {

      await Promise.all([
        fetchMembers(false),
        fetchExpenses(false)
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <img src={loadingGif} alt="Loading" className="object-contain" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Auth
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        handleAuth={handleAuth}
        error={error}
        message={message}
        isAuthSubmitting={isAuthSubmitting}
      />
    );
  }

  const viewTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Loading overlay displayed during data refresh */}
      <LoadingOverlay
        open={isLoading}
        title="Loading data"
        description="Refreshing your dashboard..."
      />

      {/* Mobile sidebar overlay backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer - fixed, scrollable, and isolated from page scroll */}
      <Sidebar
        view={currentView}
        setView={setViewWithAccess}
        user={user}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
        className={`w-[85vw] max-w-72 lg:hidden transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onNavigate={() => setIsSidebarOpen(false)}
      />

      {/* Desktop sidebar - always visible on large screens */}
      <Sidebar
        view={currentView}
        setView={setViewWithAccess}
        user={user}
        isAdmin={isAdmin}
        handleLogout={handleLogout}
        className="hidden lg:flex z-20"
      />

      {/* Fixed app header */}
      <header className="fixed left-0 top-0 z-30 h-16 w-full border-b border-divider/60 bg-zinc-50/95 backdrop-blur lg:left-64">
        <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-8">
          {/* Mobile menu toggle */}
          <Button
            isIconOnly
            variant="light"
            className="lg:hidden"
            aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
            onPress={() => setIsSidebarOpen(prev => !prev)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          {/* Current page title */}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-default-400">
              FinanceHub
            </p>
            <h2 className="truncate text-base font-bold text-default-900">{viewTitle}</h2>
          </div>

          {/* User summary on wider screens */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-default-900">{user?.name}</p>
              <p className="text-xs text-default-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="lg:ml-64 flex-grow p-4 pt-20 lg:p-8 lg:pt-24">

        {/* Dashboard view - displays financial overview and analytics */}
        {currentView === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            members={members}
            canAccessMembers={isAdmin}
            setView={setViewWithAccess}
          />
        )}

        {/* Members view - manage team members and permissions */}
        {currentView === 'members' && (
          <Members
            members={members}
            canManageMembers={isAdmin}
            currentUserId={user?.id}
            actionInProgressId={memberActionInProgressId}
            onAddMember={openAddMember}
            onEditMember={openEditMember}
            handleSetMemberStatus={handleSetMemberStatus}
            handleDeleteMember={handleDeleteMember}
          />
        )}

        {/* Expenses view - manage expense cards and split payments */}
        {currentView === 'expenses' && (
          <Expenses
            expenses={expenses}
            members={members}
            openAddExpense={openAddExpense}
            openEditExpense={openEditExpense}
            handleDeleteExpense={handleDeleteExpense}
            handleToggleExpensePaymentStatus={handleToggleExpensePaymentStatus}
          />
        )}
      </main>

      <ExpenseModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
        editingExpense={editingExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        members={members}
        handleSaveExpense={handleSaveExpense}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onOpenChange={onMemberModalOpenChange}
        editingMember={editingMember}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        handleSaveMember={handleSaveMember}
        isSaving={isMemberSaving}
      />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={closeErrorModal}
        errorMessage={errorMessage}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        confirmMsg={confirmMessage}
        onConfirm={handleConfirmed}
      />
    </div>
  );
}
