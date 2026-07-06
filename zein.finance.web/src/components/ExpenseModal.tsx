import React, { useMemo } from 'react';
import { Divide, Plus, Trash2 } from 'lucide-react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Select, 
  SelectItem, 
  Divider 
} from "@heroui/react";
import { Member, Expense, ExpenseStatus, PaymentStatus, ExpensePayment } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClose: () => void;
  editingExpense: Expense | null;
  expenseForm: Partial<Expense>;
  setExpenseForm: (form: Partial<Expense>) => void;
  members: Member[];
  handleSaveExpense: () => void;
}

export function ExpenseModal({ 
  isOpen, 
  onOpenChange, 
  onClose, 
  editingExpense, 
  expenseForm, 
  setExpenseForm, 
  members, 
  handleSaveExpense 
}: ExpenseModalProps) {
  const memberUsers = useMemo(
    () => members.filter((member) => member.role.trim().toLowerCase() === 'member'),
    [members]
  );
  //TODO: prove if this function can be used in a scenario
  const hasIncompletePayments = !expenseForm.payments?.length || expenseForm.payments.some(
    (payment) => !Number.isFinite(payment.amountToPay) || payment.amountToPay <= 0
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      backdrop="blur"
      size="full"
      placement="top-center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {editingExpense ? 'Edit Expense' : 'New Expense'}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input 
                    label="Expense Name" 
                    placeholder="What was this for?"
                    variant="bordered"
                    value={expenseForm.name}
                    onValueChange={v => setExpenseForm({...expenseForm, name: v})}
                  />
                </div>
                <Input 
                  label="Amount (€)" 
                  type="number"
                  variant="bordered"
                  value={expenseForm.payment?.toString()}
                  onValueChange={v => setExpenseForm({...expenseForm, payment: Number(v)})}
                />
                <Select 
                  label="Payer" 
                  variant="bordered"
                  selectedKeys={expenseForm.payer ? [expenseForm.payer.toString()] : []}
                  onSelectionChange={keys => setExpenseForm({...expenseForm, payer: Number(Array.from(keys)[0])})}
                >
                  {memberUsers.map(m => (
                    <SelectItem key={m.id.toString()} textValue={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </Select>
                <Input 
                  label="Date" 
                  type="date"
                  variant="bordered"
                  value={expenseForm.date}
                  onValueChange={v => setExpenseForm({...expenseForm, date: v})}
                />
                <Select 
                  label="Status" 
                  variant="bordered"
                  selectedKeys={expenseForm.status ? [expenseForm.status] : []}
                  onSelectionChange={keys => setExpenseForm({...expenseForm, status: Array.from(keys)[0] as ExpenseStatus})}
                >
                  <SelectItem key={ExpenseStatus.OPEN} textValue="Open">Open</SelectItem>
                  <SelectItem key={ExpenseStatus.WAITING} textValue="Waiting">Waiting</SelectItem>
                  <SelectItem key={ExpenseStatus.CLOSED} textValue="Closed">Closed</SelectItem>
                </Select>
              </div>

              <Divider className="my-4" />
              
              <div className="flex flex-wrap items-center justify-end gap-2  mb-3">
                {/* <p className="text-xs font-bold uppercase tracking-wider text-default-500">Split Between</p> */}
                <Button 
                  size="sm" 
                  variant="light" 
                  color="secondary"
                  startContent={<Divide size={14} />}
                  onPress={() => {
                    // Simple even split logic: divide total by number of members in the expenseform and assign to each payment
                    // Only do this if there are payments to split between
                    // add person should add a new payment with 0 amount, so it will be included in the split
                    if (expenseForm.payments && expenseForm.payments.length > 0) {
                      const splitAmount = expenseForm.payment ? expenseForm.payment / expenseForm.payments.length : 0;
                      const newPayments = expenseForm.payments.map(p => ({ ...p, amountToPay: Number(splitAmount.toFixed(2)) }));
                      setExpenseForm({...expenseForm, payments: newPayments});
                    }
                   
                  }}
                >
                  Split
                </Button>
                <Divider orientation="vertical" />
                <Button 
                  size="sm" 
                  variant="light" 
                  color="primary"
                  startContent={<Plus size={14} />}
                  onPress={() => {
                    const newPayment: ExpensePayment = { userId: memberUsers[0]?.id || 0, amountToPay: 0, status: PaymentStatus.NOT_PAID };
                    setExpenseForm({...expenseForm, payments: [...(expenseForm.payments || []), newPayment]});
                  }}
                >
                  Add Person
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {expenseForm.payments?.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-divider">
                    <Select 
                      size="sm"
                      variant="flat"
                      className="w-75"
                      selectedKeys={[p.userId.toString()]}
                      onSelectionChange={keys => {
                        const newPayments = [...(expenseForm.payments || [])];
                        newPayments[idx].userId = Number(Array.from(keys)[0]);
                        setExpenseForm({...expenseForm, payments: newPayments});
                      }}
                    >
                      {memberUsers.map(m => (
                        <SelectItem key={m.id.toString()} textValue={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </Select>
                    <Input 
                      size="sm"
                      type="number"
                      placeholder="Amount"
                      className="w-24"
                      variant="flat"
                      value={p.amountToPay.toString()}
                      onValueChange={v => {
                        const newPayments = [...(expenseForm.payments || [])];
                        newPayments[idx].amountToPay = Number(v);
                        setExpenseForm({...expenseForm, payments: newPayments});
                      }}
                    />
                    <Button
                      size="sm"
                      variant="flat"
                      className="w-32"
                      color={p.status === PaymentStatus.PAID ? "success" : "default"}
                      onPress={() => {
                        const newPayments = [...(expenseForm.payments || [])];
                        newPayments[idx].status = p.status === PaymentStatus.PAID
                          ? PaymentStatus.NOT_PAID
                          : PaymentStatus.PAID;
                        setExpenseForm({...expenseForm, payments: newPayments});
                      }}
                    >
                      {p.status === PaymentStatus.PAID ? "Paid" : "Unpaid"}
                    </Button>
                    <Button 
                      isIconOnly 
                      size="sm" 
                      variant="light" 
                      color="danger"
                      onPress={() => {
                        const newPayments = expenseForm.payments?.filter((_, i) => i !== idx);
                        setExpenseForm({...expenseForm, payments: newPayments});
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSaveExpense} className="font-bold">
                {editingExpense ? 'Update Expense' : 'Create Expense'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
