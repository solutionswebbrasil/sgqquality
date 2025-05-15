/*
  # Create usuarios table and add admin user

  1. New Table
    - `usuarios`: Stores local user information with username and password
  
  2. Changes
    - Create a new table for local user management
    - Add an admin user with username 'admin' and password 'admin123'
    - Set up RLS policies for the new table

  3. Security
    - Enable RLS on the table
    - Add policies for authenticated users
    - Store password hashed for security
*/

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nome_completo text,
  cargo text,
  ativo boolean DEFAULT true,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "usuarios_read" ON usuarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "usuarios_delete" ON usuarios
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Add admin user
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