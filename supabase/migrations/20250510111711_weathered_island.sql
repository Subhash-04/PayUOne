/*
  # Add mobile number to profiles table

  1. Changes
    - Add mobile_number column to profiles table
    - Make mobile_number column unique and required
    - Update handle_new_user function to include mobile_number

  2. Security
    - Maintain existing RLS policies
*/

-- Add mobile_number column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'mobile_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN mobile_number text;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_mobile_number_key UNIQUE (mobile_number);
    ALTER TABLE public.profiles ALTER COLUMN mobile_number SET NOT NULL;
  END IF;
END $$;

-- Update handle_new_user function to include mobile_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, mobile_number, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mobile_number',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;