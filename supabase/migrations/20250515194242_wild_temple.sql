/*
  # Create Default Admin User

  1. Changes
    - Add a default admin user with username 'admin' and password 'admin123'
    - Grant admin role to this user
    
  2. Security
    - Password is securely hashed
    - Admin user has full system access
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
  admin_role_id uuid;
BEGIN
  -- Only create admin user if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@sgq.com'
  ) THEN
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
      'admin@sgq.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username": "admin"}',
      false,
      'authenticated'
    ) RETURNING id INTO admin_user_id;
  ELSE
    -- If admin user exists, get its ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@sgq.com';
  END IF;

  -- Get the admin role id
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin';

  -- Only assign role if not already assigned
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = admin_user_id 
    AND role_id = admin_role_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (admin_user_id, admin_role_id);
  END IF;
END $$;