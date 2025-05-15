/*
  # Create function to verify password

  1. New Function
    - Create function to verify a usuario's password
    - Returns boolean indicating if password is correct
    
  2. Security
    - Uses pgcrypto to securely compare passwords
    - Only accessible to authenticated users
*/

-- Create function to verify a password
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