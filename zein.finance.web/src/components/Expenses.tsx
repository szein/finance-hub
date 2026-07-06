import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, ReceiptText, Edit2, Trash2, Plus, X } from 'lucide-react';
import { Card, CardBody, CardHeader, Chip, Button, Divider, Input, Select, SelectItem } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Member, Expense, ExpenseStatus, PaymentStatus } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  members: Member[];
  openAddExpense: () => void;
  openEditExpense: (expense: Expense) => void;
  handleDeleteExpense: (id: number, name: string) => void;
  handleToggleExpensePaymentStatus: (expenseId: number, paymentIndex: number) => void;
}

//TODO: add pagination or infinite scrolling if there are too many expenses to prevent performance issues and improve user experience.
//TODO: audit the expenses feature so that it's posibble to know who created/edited an expense and when, to improve accountability and provide a clear history of changes for each expense. 
// This will enhance transparency and help users track the evolution of their expenses over time.

//TODO: add a summary section at the top of the expenses page that provides an overview of total expenses, total paid, and total owed.
// This will give users a quick snapshot of their financial situation and help them make informed decisions about their spending and payments.
//TODO: make it possibile to close the expense from the expense card and set all payments to paid
// this will improve user experience by allowing users to quickly close an expense without having to edit each payment individually, especially for expenses with many payments.

//TODO: improve filter an sorting controls and style. try to use heroui standert controls or components if possible to maintain design consistency and reduce custom code. also consider adding more filter options such as filtering by payer or by amount range, and adding the ability to sort by multiple criteria (e.g., first by date, then by amount) for a more flexible and powerful way to organize expenses.
export function Expenses({ expenses, members, openAddExpense, openEditExpense, handleDeleteExpense, handleToggleExpensePaymentStatus }: ExpensesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc' | 'name-desc'>('date-desc');
  const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const getExpenseSortTimestamp = (expense: Expense) => {
    const createdAtTimestamp = expense.createdAt ? Date.parse(expense.createdAt) : NaN;
    if (!Number.isNaN(createdAtTimestamp)) {
      return createdAtTimestamp;
    }

    const dateTimestamp = Date.parse(expense.date);
    if (!Number.isNaN(dateTimestamp)) {
      return dateTimestamp;
    }

    return expense.id;
  };

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = expenses.filter((expense) => {
      const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        expense.name.toLowerCase().includes(normalizedSearch) ||
        (members.find((m) => m.id === expense.payer)?.name || '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return getExpenseSortTimestamp(b) - getExpenseSortTimestamp(a) || b.id - a.id;
      if (sortBy === 'date-asc') return getExpenseSortTimestamp(a) - getExpenseSortTimestamp(b) || a.id - b.id;
      if (sortBy === 'amount-desc') return b.payment - a.payment;
      if (sortBy === 'amount-asc') return a.payment - b.payment;
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return a.name.localeCompare(b.name);
    });
  }, [expenses, members, searchTerm, sortBy, statusFilter]);

  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== 'all' || sortBy !== 'date-desc';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('date-desc');
    setIsFilterPanelOpen(false);
  };

  const deleteExpense = (id: number, name: string) => {
    handleDeleteExpense(id, name);
  };

  const handleExpenseToggle = (expense: Expense) => {
    if (!expense.payments || expense.payments.length === 0) {
      //toast("Not payments to show for this expense");
      addToast({
        title: "No payments!",
        description: "No payments to show for this expense",
        color: "warning",
      });
    }

    setExpandedExpenseId((current) => (current === expense.id ? null : expense.id));
  };

  return (
    <div className="relative flex flex-col gap-4 pb-24">
      {/* Page header and filters */}
      <Card className="sticky top-20 z-20 border border-divider/60 bg-background/20 shadow-sm backdrop-blur">
        <CardHeader className="flex flex-col gap-4 p-5">
          {/* Main header */}
          <div className="flex w-full flex-row items-center justify-between gap-4">
            {/* Title block */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ReceiptText size={14} />
                Expense tracker
              </div>
            </div>

            {/* Filter actions and summary */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                startContent={<Filter size={16} />}
                variant={isFilterPanelOpen ? "solid" : "flat"}
                color={isFilterPanelOpen ? "primary" : "default"}
                aria-label={isFilterPanelOpen ? 'Collapse filter panel' : 'Expand filter panel'}
                aria-pressed={isFilterPanelOpen}
                onPress={() => setIsFilterPanelOpen((current) => !current)}
              >
                Filter
              </Button>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* <Chip variant="flat" color="primary">{`${filteredExpenses.length} shown`}</Chip> */}
                  {/* <Chip variant="flat" color="default">{`${expenses.length} total`}</Chip> */}
                  {/* <Chip variant="flat" color="success">
                    ${filteredExpenses.reduce((sum, expense) => sum + expense.payment, 0).toLocaleString()}
                  </Chip> */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    radius="full"
                    aria-label="Clear filters"
                    onPress={clearFilters}
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <Divider />

        {/* Filter controls */}
        {isFilterPanelOpen && (
          <CardBody className="grid grid-cols-1 gap-3 p-5 pt-4 md:grid-cols-3">
            <Input
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search by expense or payer"
              variant="bordered"
              size="sm"
            />
            <Select
              aria-label="Filter expenses by status"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as 'all' | ExpenseStatus)}
              variant="bordered"
              size="sm"
              classNames={{ trigger: 'min-h-10' }}
            >
              <SelectItem key="all" textValue="All statuses">All statuses</SelectItem>
              <SelectItem key={ExpenseStatus.OPEN} textValue="Open">Open</SelectItem>
              <SelectItem key={ExpenseStatus.WAITING} textValue="Waiting">Waiting</SelectItem>
              <SelectItem key={ExpenseStatus.CLOSED} textValue="Closed">Closed</SelectItem>
            </Select>
            <Select
              aria-label="Sort expenses"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc' | 'name-desc')}
              variant="bordered"
              size="sm"
              classNames={{ trigger: 'min-h-10' }}
            >
              <SelectItem key="date-desc" textValue="Newest date">Newest date</SelectItem>
              <SelectItem key="date-asc" textValue="Oldest date">Oldest date</SelectItem>
              <SelectItem key="amount-desc" textValue="Highest amount">Highest amount</SelectItem>
              <SelectItem key="amount-asc" textValue="Lowest amount">Lowest amount</SelectItem>
              <SelectItem key="name-asc" textValue="Name A-Z">Name A-Z</SelectItem>
              <SelectItem key="name-desc" textValue="Name Z-A">Name Z-A</SelectItem>
            </Select>
          </CardBody>
        )}
      </Card>

      {filteredExpenses.map(expense => (
          <Card
            key={expense.id}
            isPressable
            onPress={() => handleExpenseToggle(expense)}
            className={`p-2  ${expandedExpenseId === expense.id ? 'border border-primary/40 shadow-md shadow-primary/10' : ''}`}
          >
            <CardBody>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
                    <ReceiptText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{expense.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-primary">€{expense.payment}</span>
                      <span className="text-default-300">•</span>
                      <span className="text-xs text-default-500">Payer: {members.find(m => m.id === expense.payer)?.name || 'Unknown'}</span>
                      <span className="text-default-300">•</span>
                      <span className="text-xs text-default-500">{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip
                    variant="flat"
                    color={expense.status === ExpenseStatus.CLOSED ? 'success' : 'warning'}
                  >
                    {expense.status}
                  </Chip>
                  <div className="flex items-center gap-1 ml-4">
                    <Button isIconOnly variant="light" size="sm" onPress={() => openEditExpense(expense)} onClick={(e) => e.stopPropagation()}>
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() => deleteExpense(expense.id, expense.name)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      onPress={() => handleExpenseToggle(expense)}
                      aria-label={expandedExpenseId === expense.id ? 'Collapse expense' : 'Expand expense'}
                    >
                      {expandedExpenseId === expense.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>
              </div>

              {expandedExpenseId === expense.id && expense.payments && expense.payments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-divider">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-default-400 mb-3">Split Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {expense.payments.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-divider" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-bold text-default-600">
                          {members.find(m => m.id === p.userId)?.name || 'User'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">€{p.amountToPay}</span>
                          {/* <Chip
                            size="sm"
                            variant="flat"
                            color={p.status === PaymentStatus.PAID ? "success" : "warning"}
                          >
                            {p.status === PaymentStatus.PAID ? 'Paid' : 'Not paid'}
                          </Chip> */}
                          <Button
                            size="sm"
                            variant="flat"
                            color={p.status === PaymentStatus.PAID ? "success" : "warning"}
                            onClick={(e) => e.stopPropagation()}
                            onPress={() => handleToggleExpensePaymentStatus(expense.id, idx)}
                          >
                            {p.status === PaymentStatus.PAID ? 'Paid' : 'Not paid'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))
      }
      <Button
        color='primary'
        className="fixed bottom-6 right-6 z-50 shadow-xl transition-transform hover:scale-105" 
        startContent={<Plus size={16} />} 
        onPress={openAddExpense}>
        Add expense
      </Button>
    </div>
  );
}
