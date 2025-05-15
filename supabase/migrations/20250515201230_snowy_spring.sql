/*
  # Fix admin user and ensure correct authentication

  1. Changes
    - Ensure admin user exists with correct credentials
    - Fix any issues with the verify_usuario_password function
    
  2. Security
    - Use secure password hashing
    - Ensure admin user is active
*/

-- Delete existing admin user to avoid duplicates
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