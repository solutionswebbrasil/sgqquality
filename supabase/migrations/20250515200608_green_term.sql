/*
  # Update Admin User and Authentication System

  1. Changes
    - Reset admin user to username 'admin' with password 'admin123'
    - Update verification functions
    - Set is_admin flag to true for the admin user
    
  2. Security
    - Properly hash the password for secure storage
    - Ensure the admin user has appropriate permissions
*/

-- Delete existing admin users to ensure we create a fresh one
DELETE FROM usuarios WHERE username = 'admin';

-- Create admin user with the correct credentials
INSERT INTO usuarios (
  username,
  password_hash,
  nome_completo,
  is_admin,
  ativo
) VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'Administrador do Sistema',
  true,
  true
);

-- Make sure our password verification function works correctly
CREATE OR REPLACE FUNCTION verify_usuario_password(user_username TEXT, user_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
  result BOOLEAN;
BEGIN
  -- Get the stored password hash for the usuario
  SELECT password_hash INTO stored_hash
  FROM usuarios
  WHERE username = user_username;
  
  -- If user doesn't exist, return false
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the password matches
  RETURN stored_hash = crypt(user_password, stored_hash);
END;
$$;