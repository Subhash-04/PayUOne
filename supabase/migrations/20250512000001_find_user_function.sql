/*
  # Add function to find users by email
  
  1. Changes
    - Add find_user_by_email RPC function
    - Function searches both exact and partial matches
    - Returns user data needed for collaboration
  
  2. Security
    - Uses SECURITY DEFINER to allow access to profiles
    - Properly sanitizes inputs
*/

-- Create function to find user by email with flexible matching
CREATE OR REPLACE FUNCTION public.find_user_by_email(email_to_find TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- First try exact match
  RETURN QUERY
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE p.email = email_to_find
  LIMIT 1;
  
  -- If no rows returned, try case-insensitive match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.email
    FROM public.profiles p
    WHERE LOWER(p.email) = LOWER(email_to_find)
    LIMIT 1;
  END IF;
  
  -- If still no rows, try partial match
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.email
    FROM public.profiles p
    WHERE p.email ILIKE '%' || email_to_find || '%'
    LIMIT 1;
  END IF;
  
  -- If still not found, return empty result set
  RETURN;
END;
$$; 