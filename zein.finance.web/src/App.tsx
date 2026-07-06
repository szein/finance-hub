import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { addToast } from "@heroui/toast";
import { Button, useDisclosure } from "@heroui/react";
import { 
  Member, 
  Expense, 
  ExpenseStatus,
  PaymentStatus,
  UserState,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Expenses } from './components/Expenses';
import { ExpenseModal } from './components/ExpenseModal';
import { MemberModal, MemberFormState } from './components/MemberModal';
import { Auth } from './components/Auth';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorModal } from './components/common/ErrorModal';
import { apiFetch, setAccessToken, getAccessToken, clearAccessToken } from './lib/apiClient';
import { ConfirmModal } from './components/common/ConfirmModal';
import loadingGif from '../loading.gif';

export default function App() {
  type AppView = 'dashboard' | 'members' | 'expenses';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Member | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [view, setView] = useState<AppView>('dashboard');
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Error Modal State
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Confirm Modal State
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'deleteExpense' | 'deleteMember' | 'setMemberStatus';
    expenseId?: number;
    name?: string;
    memberId?: number;
    memberStatus?: UserState;
  } | null>(null);

  // Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [memberActionInProgressId, setMemberActionInProgressId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {isOpen: isMemberModalOpen, onOpen: onMemberModalOpen, onOpenChange: onMemberModalOpenChange, onClose: onMemberModalClose} = useDisclosure();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberSaving, setIsMemberSaving] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberFormState>({
    name: '',
    username: '',
    password: '',
    role: 'Member',
    status: UserState.ACTIVE
  });

  // Expense Form Modal
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    name: '',
    payment: 0,
    payer: 0,
    date: new Date().toISOString().split('T')[0],
    status: ExpenseStatus.OPEN,
    payments: []
  });

  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log("restore session");
        var accessToken = getAccessToken();
        setAccessToken(accessToken || '');

        const healthRes = await apiFetch('api/dbhealth');
        console.log("health check ", healthRes.status, await healthRes.text());
        
        const res = await apiFetch('/api/auth/me');
        if (!res.ok) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshInitialData();
    }
  }, [isAuthenticated]);

  const isAdmin = user?.role?.trim().toLowerCase() === 'admin';
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

  const showError = (message: string) => {
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  const handleConfirmed = async () => {
    setConfirmMessage('');
    setIsConfirmModalOpen(false);
    
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'deleteExpense' && pendingAction.expenseId !== undefined) {
        await performDeleteExpense(pendingAction.expenseId, pendingAction.name || '');
      } else if (pendingAction.type === 'deleteMember' && pendingAction.memberId !== undefined) {
        await performDeleteMember(pendingAction.memberId, pendingAction.name || '');
      } else if (pendingAction.type === 'setMemberStatus' && pendingAction.memberId !== undefined && pendingAction.memberStatus !== undefined) {
        await performSetMemberStatus(pendingAction.memberId, pendingAction.memberStatus);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleUnauthorized = () => {
    setIsAuthenticated(false);
    setUser(null);
    setMembers([]);
    setExpenses([]);
  };

  const fetchMembers = async (showLoading = true) => {
    if (!isAuthenticated) return;
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const res = await apiFetch('/api/finance/members');
      if (!res.ok) {
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        let errorMsg = 'Failed to fetch members';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        showError(errorMsg);
        return;
      }

      const membersData = await res.json();
      setMembers(membersData);
    } catch (err) {
      console.error(err);
      showError('Network error while fetching members');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const fetchExpenses = async (showLoading = true) => {
    if (!isAuthenticated) return;
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const res = await apiFetch('/api/finance/expenses');
      if (!res.ok) {
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        let errorMsg = 'Failed to fetch expenses';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        showError(errorMsg);
        return;
      }

      const expensesData = await res.json();
      setExpenses(expensesData);
    } catch (err) {
      console.error(err);
      showError('Network error while fetching expenses');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('')
    setIsAuthSubmitting(true);
    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login'
      ? { username: authForm.username, password: authForm.password }
      : authForm;
    try {
      const apiBaseUrl = import.meta.env.VITE_FINANCE_API_URL?.trim();
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, false);
      const data = await res.json().catch((error) => {
        console.error(error);
      });
      if (res.status === 401 || (data != null && !res.ok)) {
        setError('Login failed! Check Username and Password');
        return;
      }

      if (authMode === 'login') {
        setUser(data.user);
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);
        setMessage('');
      } else {
        setAuthMode('login');
        setMessage('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    setIsAuthenticated(false);
    setUser(null);
    setMembers([]);
    setExpenses([]);
    setAuthForm({ username: '', password: '', name: '' });
  };

  const handleSaveExpense = async () => {
    const method = editingExpense ? 'PUT' : 'POST';
    const url = editingExpense ? `/api/finance/expenses/${editingExpense.id}` : '/api/finance/expenses';
    
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseForm)
      });
      if (!res.ok) {
        let errorMsg = 'Failed to save expense';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        showError(errorMsg);
        return;
      }
      onClose();
      setEditingExpense(null);
      void fetchExpenses();
    } catch (err) {
      console.error(err);
      showError('Network error while saving expense');
    }
  };

  const performDeleteExpense = async (id: number, name: string) => {
    try {
      const res = await apiFetch(`/api/finance/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let errorMsg = 'Failed to delete expense';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        showError(errorMsg);
        return;
      }
      addToast({
        title: "Expense deleted",
        description: `The expense "${name}" has been deleted.`,
        color: "success",
      });
      void fetchExpenses();
    } catch (err) {
      console.error(err);
      showError('Network error while deleting expense');
    }
  };

  const handleDeleteExpense = (id: number, name: string) => {
    setPendingAction({ type: 'deleteExpense', expenseId: id, name: name });
    setConfirmMessage(`Delete the expense "${name}"? This action cannot be undone.`);
    setIsConfirmModalOpen(true);
  };

  const handleToggleExpensePaymentStatus = async (expenseId: number, paymentIndex: number) => {
    const targetExpense = expenses.find(expense => expense.id === expenseId);
    if (!targetExpense || !targetExpense.payments?.[paymentIndex]) return;

    const updatedPayments = targetExpense.payments.map((payment, index) => {
      if (index !== paymentIndex) return payment;
      return {
        ...payment,
        status: payment.status === PaymentStatus.PAID ? PaymentStatus.NOT_PAID : PaymentStatus.PAID
      };
    });

    const nextStatus = updatedPayments.every(payment => payment.status === PaymentStatus.PAID)
      ? ExpenseStatus.CLOSED
      : ExpenseStatus.WAITING;

    const updatedExpense = {
      ...targetExpense,
      payments: updatedPayments,
      status: nextStatus
    };

    setExpenses(prev =>
      prev.map(expense => expense.id === expenseId ? updatedExpense : expense)
    );

    try {
      const res = await apiFetch(`/api/finance/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedExpense)
      });

      if (!res.ok) {
        let errorMsg = 'Failed to update payment status';
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        showError(errorMsg);
        void fetchExpenses(); // Revert optimistic update
        return;
      }
    } catch (err) {
      console.error(err);
      showError('Network error while updating payment status');
      void fetchExpenses(); // Revert optimistic update
    }
  };

  const getErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return data?.error || fallback;
    } catch {
      return fallback;
    }
  };

  const performSetMemberStatus = async (id: number, status: UserState) => {
    setMemberActionInProgressId(id);
    try {
      const res = await apiFetch(`/api/finance/members/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const errorMsg = await getErrorMessage(res, 'Failed to update member status.');
        showError(errorMsg);
        return;
      }
      void fetchMembers();
    } catch (err) {
      console.error(err);
      showError('Network error while updating member status');
    } finally {
      setMemberActionInProgressId(null);
    }
  };

  const performDeleteMember = async (id: number, name: string) => {
    setMemberActionInProgressId(id);
    try {
      const res = await apiFetch(`/api/finance/members/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorMsg = await getErrorMessage(res, 'Failed to delete member.');
        showError(errorMsg);
        return;
      }
      addToast({
        title: "Member deleted",
        description: `The member "${name}" has been deleted.`,
        color: "success",
      });
      void fetchMembers();
    } catch (err) {
      console.error(err);
      showError('Network error while deleting member');
    } finally {
      setMemberActionInProgressId(null);
    }
  };

  const handleSetMemberStatus = (id: number, status: UserState) => {
    if (!isAdmin) return;
    const actionLabel = status === UserState.ACTIVE ? 'activate' : 'deactivate';
    setPendingAction({ type: 'setMemberStatus', memberId: id, memberStatus: status });
    setConfirmMessage(`${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} this member?`);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteMember = (id: number, name: string) => {
    if (!isAdmin) return;
    setPendingAction({ type: 'deleteMember', memberId: id, name: name });
    setConfirmMessage('Delete this member permanently? This cannot be undone.');
    setIsConfirmModalOpen(true);
  };

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      username: '',
      password: '',
      role: 'Member',
      status: UserState.ACTIVE
    });
    onMemberModalOpen();
  };

  const openEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      username: member.username || '',
      password: '',
      role: member.role.trim().toLowerCase() === 'admin' ? 'Admin' : 'Member',
      status: member.status
    });
    onMemberModalOpen();
  };

  const handleSaveMember = async () => {
    if (!isAdmin) return;

    if (!memberForm.name.trim()) {
      showError('Member name is required.');
      return;
    }

    if (!editingMember && (!memberForm.username.trim() || !memberForm.password.trim())) {
      showError('Username and password are required for new members.');
      return;
    }

    setIsMemberSaving(true);
    try {
      if (editingMember) {
        const res = await apiFetch('/api/finance/member/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingMember.id,
            name: memberForm.name.trim(),
            role: memberForm.role,
            status: memberForm.status
          })
        });

        if (!res.ok) {
          const errorMsg = await getErrorMessage(res, 'Failed to update member.');
          showError(errorMsg);
          return;
        }
      } else {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: memberForm.name.trim(),
            username: memberForm.username.trim(),
            password: memberForm.password,
            role: memberForm.role
          })
        }, false);

        if (!res.ok) {
          const errorMsg = await getErrorMessage(res, 'Failed to create member.');
          showError(errorMsg);
          return;
        }
      }

      onMemberModalClose();
      setEditingMember(null);
      setMemberForm({
        name: '',
        username: '',
        password: '',
        role: 'Member',
        status: UserState.ACTIVE
      });
      void fetchMembers();
    } catch (err) {
      console.error(err);
      showError('Network error while saving member');
    } finally {
      setIsMemberSaving(false);
    }
  };

  const openAddExpense = () => {
    const defaultMemberId = members.find(member => member.role.trim().toLowerCase() === 'member')?.id || 0;
    setEditingExpense(null);
    setExpenseForm({
      name: '',
      payment: 0,
      payer: defaultMemberId,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: ExpenseStatus.OPEN,
      payments: []
    });
    onOpen();
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm(expense);
    onOpen();
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
        className={`w-[85vw] max-w-72 lg:hidden transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
        onClose={() => setIsErrorModalOpen(false)}
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
