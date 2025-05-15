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
            const { data: usuario } = await supabase
              .from('usuarios')
              .select('*')
              .eq('username', userData.user.user_metadata.username || 'admin')
              .eq('ativo', true)
              .single();
              
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
            const { data: usuario } = await supabase
              .from('usuarios')
              .select('*')
              .eq('username', authUser.user_metadata.username || 'admin')
              .eq('ativo', true)
              .single();
            
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
      // First check if the username/password is valid
      const { data: isValidUser, error: validationError } = await supabase
        .rpc('verify_usuario_password', {
          user_username: username,
          user_password: password
        });
      
      if (validationError || !isValidUser) {
        throw new Error('Usuário ou senha inválidos');
      }
      
      // Retrieve user data
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('ativo', true)
        .single();
        
      if (usuarioError || !usuario) {
        throw new Error('Usuário não encontrado ou inativo');
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
        const { error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              username: username
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Try login again after signup
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password
        });
        
        if (retryError) throw retryError;
      }
      
      setUser(usuario);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    navigate('/login');
  };

  return { user, loading, login, logout };
}