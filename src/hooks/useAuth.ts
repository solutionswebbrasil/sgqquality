import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current auth state when component mounts
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          // Get auth user data
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
            // Get the user from usuarios table
            const { data: usuario, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('username', authUser.user_metadata.username || 'admin')
              .eq('ativo', true)
              .maybeSingle();
              
            if (usuario) {
              setUser(usuario);
            } else {
              // If no matching usuario, sign out
              await supabase.auth.signOut();
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await supabase.auth.signOut();
          setUser(null);
        }
      }
      
      setLoading(false);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
            const { data: usuario, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('username', authUser.user_metadata.username || 'admin')
              .eq('ativo', true)
              .maybeSingle();
            
            if (usuario) {
              setUser(usuario);
            } else {
              await supabase.auth.signOut();
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Auth change error:', error);
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Validate input
      if (!username.trim() || !password.trim()) {
        throw new Error('Usuário e senha são obrigatórios.');
      }

      // Verify the password using the database function
      const { data: isValidUser, error: validationError } = await supabase
        .rpc('verify_usuario_password', {
          user_username: username,
          user_password: password
        });
      
      if (validationError) {
        throw new Error(`Erro de validação: ${validationError.message}`);
      }
      
      if (!isValidUser) {
        throw new Error('Usuário ou senha inválidos.');
      }
      
      // Get the user from usuarios table
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .limit(1)
        .maybeSingle();
        
      if (userError) {
        throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
      }
      
      if (!usuario) {
        throw new Error('Usuário não encontrado.');
      }
      
      if (!usuario.ativo) {
        throw new Error('Sua conta está desativada. Entre em contato com o administrador.');
      }
      
      // Create auth session via email sign-in
      // Use a consistent email format based on username
      const authEmail = `${username}@sgq.com`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password
      });
      
      // If sign-in fails (user doesn't exist in auth), create the auth user
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              username: username
            }
          }
        });
        
        if (signUpError) {
          throw new Error(`Erro ao criar usuário: ${signUpError.message}`);
        }
        
        // Try login again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password
        });
        
        if (retryError) {
          throw new Error(`Erro ao fazer login: ${retryError.message}`);
        }
      }
      
      setUser(usuario);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, loading, login, logout };
}