/*
  # Fix Authentication System

  1. Changes
    - Remove password column from profiles table
    - Update RLS policies for better security
    - Add indexes for performance

  2. Security
    - Enable RLS
    - Add policies for user data access
    - Remove sensitive data storage
*/

-- Remove password column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password'
  ) THEN
    ALTER TABLE profiles DROP COLUMN password;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add index for email lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email);

-- Add index for mobile number lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_mobile
  ON profiles(mobile_number);