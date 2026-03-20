import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { isAuthenticated, isLoading, setAuthenticated, setLoading } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (password: string) => {
    const res = await client.post('/api/auth/login', { password });
    setAuthenticated(true);
    return res.data;
  }, [setAuthenticated]);

  const logout = useCallback(async () => {
    await client.post('/api/auth/logout');
    setAuthenticated(false);
    navigate('/login');
  }, [setAuthenticated, navigate]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      await client.get('/api/auth/me');
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [setAuthenticated, setLoading]);

  return { isAuthenticated, isLoading, login, logout, checkAuth };
}
