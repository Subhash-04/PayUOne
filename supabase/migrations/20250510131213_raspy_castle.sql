/*
  # Remove password handling from profiles table
  
  1. Changes
    - Drop existing policies
    - Remove password columns
    - Set NOT NULL constraints
    - Create new policies without password checks
    - Clean up trigger and function
  
  2. Security
    - Maintain RLS policies for user data protection
    - Remove password-related functionality
*/

-- Drop existing policies first to remove dependencies
DROP POLICY IF EXISTS "Users can view own profile without password" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Drop the trigger first before dropping the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now we can safely remove the password columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS password,
DROP COLUMN IF EXISTS encrypted_password;

-- Ensure required columns exist with correct types
ALTER TABLE public.profiles
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN mobile_number SET NOT NULL,
ALTER COLUMN email SET NOT NULL;

-- Create new policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);