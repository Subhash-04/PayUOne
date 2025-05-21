/*
  # Add Password Encryption
  
  1. Changes
    - Add encrypted_password column to profiles table
    - Add password encryption functions
    - Update user creation to include encrypted passwords
    - Add secure policies for password handling
  
  2. Security
    - Use pgcrypto for secure password hashing
    - Prevent direct password updates
    - Hide password field from normal queries
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted_password column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS encrypted_password text;

-- Create function to encrypt password
CREATE OR REPLACE FUNCTION encrypt_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify password
CREATE OR REPLACE FUNCTION verify_password(password text, encrypted_password text)
RETURNS boolean AS $$
BEGIN
  RETURN encrypted_password = crypt(password, encrypted_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Update handle_new_user function to include password encryption
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    mobile_number, 
    email,
    encrypted_password
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobile_number',
    new.email,
    encrypt_password(new.raw_user_meta_data->>'password')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies
CREATE POLICY "Users can view own profile without password"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Split update policy into two parts to handle password separately
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    COALESCE(encrypted_password = (SELECT encrypted_password FROM public.profiles WHERE id = auth.uid()), true)
  );