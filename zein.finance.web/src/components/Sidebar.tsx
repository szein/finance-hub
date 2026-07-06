import React from 'react';
import { 
  Users, 
  DollarSign, 
  LogOut, 
  LayoutDashboard,
  ReceiptText
} from 'lucide-react';
import { Button, Card, CardBody, User } from "@heroui/react";
import { Member } from '../types';

interface SidebarProps {
  view: 'dashboard' | 'members' | 'expenses';
  setView: (view: 'dashboard' | 'members' | 'expenses') => void;
  user: Member | null;
  isAdmin: boolean;
  handleLogout: () => void;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({
  view,
  setView,
  user,
  isAdmin,
  handleLogout,
  className = '',
  onNavigate
}: SidebarProps) {
  const handleViewChange = (nextView: 'dashboard' | 'members' | 'expenses') => {
    setView(nextView);
    onNavigate?.();
  };

  const onLogoutPress = () => {
    onNavigate?.();
    handleLogout();
  };

  return (
    <aside className={`fixed left-0 top-0 z-40 h-dvh w-64 overflow-y-auto border-r border-divider bg-white p-6 flex flex-col ${className}`}>
      {/* Brand block */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <DollarSign className="text-white" size={18} />
        </div>
        <span className="font-bold text-xl">FinanceHub</span>
      </div>

      {/* Navigation block */}
      <nav className="flex flex-col gap-2 flex-grow">
        <Button 
          variant={view === 'dashboard' ? 'solid' : 'light'}
          color={view === 'dashboard' ? 'primary' : 'default'}
          className="justify-start gap-3"
          onPress={() => handleViewChange('dashboard')}
          startContent={<LayoutDashboard size={18} />}
        >
          Dashboard
        </Button>
        {isAdmin && (
          <Button 
            variant={view === 'members' ? 'solid' : 'light'}
            color={view === 'members' ? 'primary' : 'default'}
            className="justify-start gap-3"
            onPress={() => handleViewChange('members')}
            startContent={<Users size={18} />}
          >
            Members
          </Button>
        )}
        <Button 
          variant={view === 'expenses' ? 'solid' : 'light'}
          color={view === 'expenses' ? 'primary' : 'default'}
          className="justify-start gap-3"
          onPress={() => handleViewChange('expenses')}
          startContent={<ReceiptText size={18} />}
        >
          Expenses
        </Button>
      </nav>

      {/* Account block */}
      <div className="mt-auto">
        <Card className="w-full justify-start gap-3 bg-zinc-50 border-none shadow-none">
          <CardBody className="justify-start gap-3">
            <User
              name={user?.name}
              description={user?.role}
              avatarProps={{
                name: user?.name.split(' ').map(n => n[0]).join(''),
                color: "primary"
              }}
            />
          </CardBody>
        </Card>
        <Button 
          variant="flat" 
          color="danger" 
          className="w-full justify-start gap-3"
          onPress={onLogoutPress}
          startContent={<LogOut size={18} />}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
