/*
  # Fix Collaborators Policies and Table Creation
  
  1. Changes
    - Simplify collaborators policies to prevent recursion
    - Add numeric_id column to data_entries for non-UUID lookups
    - Update indexes for better performance
    
  2. Security
    - Maintain RLS security while fixing recursion issues
    - Ensure proper access control
*/

-- Add numeric_id to data_entries if it doesn't exist
ALTER TABLE public.data_entries 
ADD COLUMN IF NOT EXISTS numeric_id SERIAL;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "collaborators_select_policy" ON public.collaborators;
DROP POLICY IF EXISTS "collaborators_insert_policy" ON public.collaborators;
DROP POLICY IF EXISTS "collaborators_delete_policy" ON public.collaborators;

-- Create new simplified policies for collaborators
CREATE POLICY "collaborators_select_policy" ON public.collaborators
FOR SELECT TO authenticated
USING (
  -- User is either a collaborator or owner
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT owner_id 
    FROM public.data_entries 
    WHERE id = data_entry_id
  )
);

CREATE POLICY "collaborators_insert_policy" ON public.collaborators
FOR INSERT TO authenticated
WITH CHECK (
  -- Only owners can add collaborators
  auth.uid() IN (
    SELECT owner_id 
    FROM public.data_entries 
    WHERE id = data_entry_id
  )
);

CREATE POLICY "collaborators_delete_policy" ON public.collaborators
FOR DELETE TO authenticated
USING (
  -- Only owners can remove collaborators
  auth.uid() IN (
    SELECT owner_id 
    FROM public.data_entries 
    WHERE id = data_entry_id
  )
);

-- Update indexes for better performance
DROP INDEX IF EXISTS idx_data_entries_numeric_id;
CREATE UNIQUE INDEX idx_data_entries_numeric_id ON public.data_entries(numeric_id);

-- Add trigger to update numeric_id on data_entries
CREATE OR REPLACE FUNCTION update_numeric_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.numeric_id IS NULL THEN
    NEW.numeric_id := nextval('data_entries_numeric_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_numeric_id ON public.data_entries;
CREATE TRIGGER set_numeric_id
  BEFORE INSERT ON public.data_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_numeric_id();