import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Button, Divider } from "@heroui/react";
import { LoadingOverlay } from './LoadingOverlay';

interface AuthProps {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authForm: any;
  setAuthForm: (form: any) => void;
  handleAuth: (e: React.FormEvent) => void;
  error: string;
  message: string;
  isAuthSubmitting: boolean;
}

export function Auth({ authMode, setAuthMode, authForm, setAuthForm, handleAuth, error, message, isAuthSubmitting }: AuthProps) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="relative w-full max-w-md p-4 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-col gap-1 items-center pb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold">FinanceHub</h1>
          <p className="text-default-500 text-sm">Manage your team finances with ease</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {authMode === 'register' && (
              <>
                <Input 
                  label="Full Name" 
                  placeholder="Enter your name"
                  variant="bordered"
                  value={authForm.name}
                  onValueChange={v => setAuthForm({...authForm, name: v})}
                  isDisabled={isAuthSubmitting}
                />
              </>
            )}
            <Input 
              label="Username" 
              placeholder="Enter your username"
              variant="bordered"
              value={authForm.username}
              onValueChange={v => setAuthForm({...authForm, username: v})}
              isDisabled={isAuthSubmitting}
            />
            <Input 
              label="Password" 
              placeholder="Enter your password"
              type="password"
              variant="bordered"
              value={authForm.password}
              onValueChange={v => setAuthForm({...authForm, password: v})}
              isDisabled={isAuthSubmitting}
            />

            {error && <p className="text-danger text-xs text-center">{error}</p>}
            {message && <p className="text-success text-xs text-center">{message}</p>}

            <Button 
              type="submit"
              color="primary"
              className="font-semibold"
              isLoading={isAuthSubmitting}
              isDisabled={isAuthSubmitting}
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </CardBody>
        <Divider className="my-4" />
        <div className="text-center pb-4">
          <Button 
            variant="light" 
            size="sm"
            onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            isDisabled={isAuthSubmitting}
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </div>

        <LoadingOverlay
          open={isAuthSubmitting}
          title={authMode === 'login' ? 'Signing you in' : 'Creating your account'}
          description="Please wait a moment."
          fullscreen={false}
        />
      </Card>
    </div>
  );
}
