/*
  # Update admin user for username-based authentication
  
  1. Changes:
    - Update admin user to use username-based authentication
    - Remove existing admin user by email
    - Create new admin user with username "admin" and password "admin123"
*/

-- First, remove any existing admin user
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@sgq.com'
);

DELETE FROM auth.users WHERE email = 'admin@sgq.com';

-- Create admin user with username 'admin'
DO $$
DECLARE
  admin_user_id uuid;
  admin_role_id uuid;
BEGIN
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
    'admin@sgq.com',  -- We still use email format in the database
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username": "admin"}',
    false,
    'authenticated'
  ) RETURNING id INTO admin_user_id;

  -- Get the admin role id
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin';

  -- Assign admin role to user
  INSERT INTO user_roles (user_id, role_id)
  VALUES (admin_user_id, admin_role_id);
  
  -- Give the admin user all permissions
  INSERT INTO user_permissions (user_id, permission_id)
  VALUES (admin_user_id, 'menu_/');  -- Dashboard permission
END $$;