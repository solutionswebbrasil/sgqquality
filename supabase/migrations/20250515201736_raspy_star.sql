/*
  # Ensure Admin User Exists

  1. Changes
    - Delete any existing admin user to avoid duplicates
    - Create a fresh admin user with username 'admin' and password 'admin123'
    - Ensure the admin user has appropriate permissions
    
  2. Security
    - Password is properly hashed using bcrypt via crypt function
    - Admin flag is explicitly set to true
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

-- Create or replace the password verification function
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

-- Check if we need to create auth user for admin
-- We'll use plpgsql to handle this conditionally
DO $$
DECLARE
  admin_usuario_id uuid;
  admin_auth_id uuid;
  admin_email text := 'admin@sgq.com';
  auth_user_exists boolean;
BEGIN
  -- Get the admin user id from usuarios table
  SELECT id INTO admin_usuario_id
  FROM usuarios
  WHERE username = 'admin';

  -- Check if auth user with admin email exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = admin_email
  ) INTO auth_user_exists;

  -- If auth user doesn't exist, create it
  IF NOT auth_user_exists THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username": "admin"}',
      false,
      'authenticated'
    ) RETURNING id INTO admin_auth_id;
  END IF;
END $$;