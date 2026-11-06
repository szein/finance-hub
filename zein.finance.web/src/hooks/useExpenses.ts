import { useState, type Dispatch, type SetStateAction } from 'react';
import { addToast } from '@heroui/toast';
import { useDisclosure } from '@heroui/react';
import type { Expense, Member } from '../types';
import { ExpenseStatus, PaymentStatus } from '../types';
import { apiFetch } from '../lib/apiClient';

export type ExpenseConfirmationAction = {
  type: 'deleteExpense';
  expenseId: number;
  name: string;
};

interface UseExpensesOptions {
  isAuthenticated: boolean;
  members: Member[];
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  showError: (message: string) => void;
  onRequestConfirmation: (message: string, action: ExpenseConfirmationAction) => void;
}

async function getErrorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function useExpenses({
  isAuthenticated,
  members,
  setIsLoading,
  showError,
  onRequestConfirmation
}: UseExpensesOptions) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    name: '',
    payment: 0,
    payer: 0,
    date: new Date().toISOString().split('T')[0],
    status: ExpenseStatus.OPEN,
    payments: []
  });
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const fetchExpenses = async (showLoading = true) => {
    if (!isAuthenticated) return;
    if (showLoading) setIsLoading(true);

    try {
      const res = await apiFetch('/api/finance/expenses');
      if (!res.ok) {
        if (res.status === 401) {
          showError('permission denied!');
          return;
        }

        showError(await getErrorMessage(res, 'Failed to fetch expenses'));
        return;
      }

      const expensesData: Expense[] = await res.json();
      setExpenses(expensesData);
    } catch (err) {
      console.error(err);
      showError('Network error while fetching expenses');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    const method = editingExpense ? 'PUT' : 'POST';
    const url = editingExpense
      ? `/api/finance/expenses/${editingExpense.id}`
      : '/api/finance/expenses';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      if (!res.ok) {
        showError(await getErrorMessage(res, 'Failed to save expense'));
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
        showError(await getErrorMessage(res, 'Failed to delete expense'));
        return;
      }

      addToast({
        title: 'Expense deleted',
        description: `The expense "${name}" has been deleted.`,
        color: 'success'
      });
      void fetchExpenses();
    } catch (err) {
      console.error(err);
      showError('Network error while deleting expense');
    }
  };

  const handleDeleteExpense = (id: number, name: string) => {
    onRequestConfirmation(
      `Delete the expense "${name}"? This action cannot be undone.`,
      { type: 'deleteExpense', expenseId: id, name }
    );
  };

  const handleToggleExpensePaymentStatus = async (expenseId: number, paymentIndex: number) => {
    const targetExpense = expenses.find(expense => expense.id === expenseId);
    if (!targetExpense || !targetExpense.payments?.[paymentIndex]) return;

    const updatedPayments = targetExpense.payments.map((payment, index) => {
      if (index !== paymentIndex) return payment;
      return {
        ...payment,
        status: payment.status === PaymentStatus.PAID
          ? PaymentStatus.NOT_PAID
          : PaymentStatus.PAID
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense)
      });

      if (!res.ok) {
        showError(await getErrorMessage(res, 'Failed to update payment status'));
        void fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      showError('Network error while updating payment status');
      void fetchExpenses();
    }
  };

  const openAddExpense = () => {
    const defaultMemberId = members.find(
      member => member.role.trim().toLowerCase() === 'member'
    )?.id || 0;
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

  const clearExpenses = () => setExpenses([]);

  return {
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
    openEditExpense,
    clearExpenses
  };
}
