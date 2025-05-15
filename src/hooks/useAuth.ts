import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session token in local storage
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // We have a session, check if it corresponds to a valid usuario
        try {
          const { data: userData, error } = await supabase.auth.getUser();
          
          if (!error && userData) {
            // Get the user from the usuarios table
            const { data: usuario, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('username', userData.user.user_metadata.username || 'admin')
              .eq('ativo', true)
              .limit(1)
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
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
            // Get the user from the usuarios table
            const { data: usuario, error: userError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('username', authUser.user_metadata.username || 'admin')
              .eq('ativo', true)
              .limit(1)
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
      } else {
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

      // First check if the username/password is valid
      const { data: isValidUser, error: validationError } = await supabase
        .rpc('verify_usuario_password', {
          user_username: username,
          user_password: password
        });
      
      if (validationError) {
        throw new Error(`Erro de validação: ${validationError.message}`);
      }
      
      if (!isValidUser) {
        throw new Error('Credenciais inválidas. Verifique seu usuário e senha.');
      }
      
      // Retrieve user data - using maybeSingle() and limit(1) to handle multiple rows properly
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .limit(1)
        .maybeSingle();
        
      if (usuarioError) {
        throw new Error(`Erro ao buscar dados do usuário: ${usuarioError.message}`);
      }
      
      if (!usuario) {
        throw new Error('Usuário não encontrado.');
      }
      
      if (!usuario.ativo) {
        throw new Error('Conta de usuário está inativa. Entre em contato com o administrador.');
      }

      // Use auth to maintain session
      const authEmail = `${username}@sgq.com`;

      // Try to sign in with email
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password
      });
      
      // If user doesn't exist in auth, create it
      if (signInError) {
        console.log('Usuário não existe no Auth, criando...');
        
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
          throw new Error(`Erro ao criar novo usuário: ${signUpError.message}`);
        }
        
        // Try login again after signup
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password
        });
        
        if (retryError) {
          throw new Error(`Erro ao fazer login após criar usuário: ${retryError.message}`);
        }
      }
      
      setUser(usuario);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Propagate the error with its message
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(`Erro ao sair: ${error.message}`);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, loading, login, logout };
}