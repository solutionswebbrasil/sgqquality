/*
  # Add user_permissions table for menu access control

  1. New Tables
    - `user_permissions`: Maps users to specific permission IDs
    
  2. Security
    - Enable RLS on the table
    - Add policies for admin users to manage permissions
    - Allow users to read their own permissions
*/

-- Create user_permissions table
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, permission_id)
);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "user_permissions_admin_all" ON user_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Allow users to read their own permissions  
CREATE POLICY "user_permissions_read_own" ON user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());