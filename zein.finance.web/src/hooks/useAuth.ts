import { useEffect, useState, type FormEvent } from 'react';
import type { Member } from '../types';
import { apiFetch, clearAccessToken, getAccessToken, setAccessToken } from '../lib/apiClient';

export type AuthMode = 'login' | 'register';

export interface AuthForm {
  username: string;
  password: string;
  name: string;
}

interface AuthResponse {
  user?: Member;
  accessToken?: string;
  error?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Member | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState<AuthForm>({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setAccessToken(getAccessToken() || '');

        const healthRes = await apiFetch('api/dbhealth');
        console.log('health check ', healthRes.status, await healthRes.text());

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
        console.error('Failed to restore authentication session', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    void restoreSession();
  }, []);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsAuthSubmitting(true);

    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login'
      ? { username: authForm.username, password: authForm.password }
      : authForm;

    try {
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, false);
      const data: AuthResponse | null = await res.json().catch((err: unknown) => {
        console.error('Failed to read authentication response', err);
        return null;
      });

      if (!res.ok) {
        setError(data?.error || 'Login failed! Check Username and Password');
        return;
      }

      if (authMode === 'login') {
        if (!data?.user || !data.accessToken) {
          setError('The server returned an invalid login response.');
          return;
        }

        setUser(data.user);
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);
      } else {
        setAuthMode('login');
        setMessage('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    setIsAuthenticated(false);
    setUser(null);
    setAuthForm({ username: '', password: '', name: '' });
  };

  const handleUnauthorized = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
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
    handleUnauthorized
  };
}
