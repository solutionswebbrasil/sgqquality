/*
  # Create password hashing function

  1. New Function
    - Creates a function that hashes a password using pgcrypto
    - Used for secure password storage
  
  2. Security
    - Uses pgcrypto for secure bcrypt hashing
    - Function is available to authenticated users
*/

-- Create a function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(password, gen_salt('bf'));
$$;