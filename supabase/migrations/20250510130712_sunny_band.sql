/*
  # Update profiles table to use plain text password
  
  1. Changes
    - Remove encrypted_password column
    - Add password column
    - Update policies to use auth.uid()
    - Update handle_new_user function
  
  2. Security
    - Maintain RLS policies for user data protection
    - Update function security to SECURITY DEFINER
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile without password" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Remove encrypted_password column and add password column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS encrypted_password;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password text NOT NULL;

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
    password = (
      SELECT p.password 
      FROM profiles p 
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
    password
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobile_number',
    new.email,
    new.raw_user_meta_data->>'password'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;