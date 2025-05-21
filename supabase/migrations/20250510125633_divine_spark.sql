/*
  # Update auth schema and remove username field
  
  1. Changes
    - Remove username column from profiles table
    - Ensure all fields match registration/login screens
    - Update handle_new_user function
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop username column and its constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_username_key,
DROP COLUMN IF EXISTS username;

-- Ensure all required columns exist with correct types
ALTER TABLE public.profiles
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN mobile_number SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN encrypted_password SET NOT NULL;

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