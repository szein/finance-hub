import React from 'react';
import { Euro, Users, Clock, ReceiptText } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Chip, User } from "@heroui/react";
import { Member, Expense, ExpenseStatus, UserState } from '../types';
import { StatCard } from './common/StatCard';

interface DashboardProps {
  expenses: Expense[];
  members: Member[];
  canAccessMembers: boolean;
  setView: (view: 'dashboard' | 'members' | 'expenses') => void;
}

export function Dashboard({ expenses, members, canAccessMembers, setView }: DashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Expenses" 
          value={`€${expenses.reduce((acc, curr) => acc + curr.payment, 0).toLocaleString()}`} 
          icon={<Euro className="text-emerald-600" />}
          trend="+12% from last month"
        />
        <StatCard 
          label="Active Members" 
          value={members.length.toString()} 
          icon={<Users className="text-indigo-600" />}
          trend="2 new this week"
        />
        <StatCard 
          label="Pending Payments" 
          value={expenses.filter(e => e.status !== ExpenseStatus.CLOSED).length.toString()} 
          icon={<Clock className="text-amber-600" />}
          trend="Requires attention"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-4">
          <CardHeader className="flex justify-between items-center px-4">
            <h3 className="font-bold text-lg">Recent Expenses</h3>
            <Button variant="light" size="sm" onPress={() => setView('expenses')}>View all</Button>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {expenses.slice(0, 5).map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-divider">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-600">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{expense.name}</p>
                    <p className="text-[10px] text-default-400 uppercase font-semibold tracking-wider">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">€{expense.payment}</p>
                  <Chip 
                    size="sm" 
                    variant="flat"
                    color={expense.status === ExpenseStatus.CLOSED ? 'success' : 'warning'}
                  >
                    {expense.status}
                  </Chip>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="p-4">
          <CardHeader className="flex justify-between items-center px-4">
            <h3 className="font-bold text-lg">Active Members</h3>
            {canAccessMembers && (
              <Button variant="light" size="sm" onPress={() => setView('members')}>View all</Button>
            )}
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            {members.slice(0, 5).map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-all border border-transparent hover:border-divider">
                <User
                  name={member.name}
                  description={member.role}
                  avatarProps={{
                    name: member.name.split(' ').map(n => n[0]).join(''),
                    color: "primary",
                    size: "sm"
                  }}
                />
                <Chip 
                  size="sm" 
                  variant="flat"
                  color={member.status === UserState.ACTIVE ? 'success' : 'warning'}
                >
                  {member.status}
                </Chip>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
