import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // First check in the usuarios table
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('ativo', true)
        .single();
      
      if (error || !data) {
        throw new Error('Usuário não encontrado ou inativo');
      }
      
      // Verify the password by matching it with the hashed version
      const { data: passwordData, error: passwordError } = await supabase
        .rpc('verify_usuario_password', {
          user_username: username,
          user_password: password
        });
        
      if (passwordError || !passwordData) {
        throw new Error('Senha incorreta');
      }
      
      // If password is correct, use the standard supabase auth for session management
      // Use a deterministic email based on username
      const email = `${username}@sgq.com`;
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        // If the user doesn't exist in auth, create it
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Try login again
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (loginError) throw loginError;
      }
      
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate('/login');
  };

  return { user, loading, login, logout };
}