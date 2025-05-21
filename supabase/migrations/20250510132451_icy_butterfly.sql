/*
  # Simplify password storage
  
  1. Changes
    - Add plain text password column
    - Remove encryption/hashing
    - Remove RLS policies
    - Update handle_new_user function
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS verify_password(text,text);
DROP FUNCTION IF EXISTS hash_password(text);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Remove password_hash column if it exists
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS password_hash;

-- Add plain text password column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password text;

-- Update handle_new_user function for plain text password
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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();