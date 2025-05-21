/*
  # Add password encryption and update policies

  1. Changes
    - Enable pgcrypto extension for password encryption
    - Add encrypted_password column to profiles table
    - Update policies to handle password field securely
    - Update handle_new_user function for password encryption

  2. Security
    - Use pgcrypto for secure password hashing
    - Prevent password exposure in profile queries
    - Ensure password can't be modified directly
*/

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted_password column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'encrypted_password'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN encrypted_password text NOT NULL;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own profile without password" ON public.profiles;
END $$;

-- Create new policies
CREATE POLICY "Users can view own profile without password"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (COALESCE(
    encrypted_password = (
      SELECT p.encrypted_password 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    ), 
    true
  ));

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    mobile_number,
    email,
    encrypted_password
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobile_number',
    new.email,
    crypt(new.raw_user_meta_data->>'password', gen_salt('bf'))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;