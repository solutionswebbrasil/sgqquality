import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState({ id: 'auto-login', email: 'auto@sgq.com' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate that we're already logged in
    setLoading(false);
  }, []);

  // These methods are kept for compatibility but won't actually perform any operations
  const login = async (email: string, password: string) => {
    navigate('/');
    return;
  };

  const logout = async () => {
    navigate('/');
    return;
  };

  return { user, loading, login, logout };
}