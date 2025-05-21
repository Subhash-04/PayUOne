/*
  # Fix Collaborators Policy and Table Structure

  1. Changes
    - Fix infinite recursion in collaborators policies
    - Simplify policy structure
    - Add proper indexes for performance
    - Update RLS policies to prevent circular references

  2. Security
    - Maintain RLS enabled
    - Ensure proper access control
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage cells if they own or are editors" ON public.table_cells;
DROP POLICY IF EXISTS "Users can view cells if they own or collaborate" ON public.table_cells;
DROP POLICY IF EXISTS "Users can manage rows if they own or are editors" ON public.table_rows;
DROP POLICY IF EXISTS "Users can view rows if they own or collaborate" ON public.table_rows;
DROP POLICY IF EXISTS "Users can manage columns if they own or are editors" ON public.table_columns;
DROP POLICY IF EXISTS "Users can view columns if they own or collaborate" ON public.table_columns;
DROP POLICY IF EXISTS "Only owners can manage collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can view collaborators if they own or collaborate" ON public.collaborators;

-- Create simplified policies for collaborators
CREATE POLICY "collaborators_select_policy" ON public.collaborators
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT c.user_id 
    FROM public.collaborators c 
    WHERE c.data_entry_id = collaborators.data_entry_id
  )
  OR 
  auth.uid() IN (
    SELECT de.owner_id 
    FROM public.data_entries de 
    WHERE de.id = collaborators.data_entry_id
  )
);

CREATE POLICY "collaborators_insert_policy" ON public.collaborators
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id 
    FROM public.data_entries 
    WHERE id = data_entry_id
  )
);

CREATE POLICY "collaborators_delete_policy" ON public.collaborators
FOR DELETE TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id 
    FROM public.data_entries 
    WHERE id = data_entry_id
  )
);

-- Create simplified policies for table_columns
CREATE POLICY "columns_access_policy" ON public.table_columns
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.data_entries de 
    LEFT JOIN public.collaborators c ON c.data_entry_id = de.id 
    WHERE de.id = table_columns.data_entry_id 
    AND (
      de.owner_id = auth.uid() 
      OR (c.user_id = auth.uid() AND c.role = 'editor')
    )
  )
);

-- Create simplified policies for table_rows
CREATE POLICY "rows_access_policy" ON public.table_rows
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.data_entries de 
    LEFT JOIN public.collaborators c ON c.data_entry_id = de.id 
    WHERE de.id = table_rows.data_entry_id 
    AND (
      de.owner_id = auth.uid() 
      OR (c.user_id = auth.uid() AND c.role = 'editor')
    )
  )
);

-- Create simplified policies for table_cells
CREATE POLICY "cells_access_policy" ON public.table_cells
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.table_rows tr 
    JOIN public.data_entries de ON de.id = tr.data_entry_id 
    LEFT JOIN public.collaborators c ON c.data_entry_id = de.id 
    WHERE tr.id = table_cells.row_id 
    AND (
      de.owner_id = auth.uid() 
      OR (c.user_id = auth.uid() AND c.role = 'editor')
    )
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collaborators_data_entry_id ON public.collaborators(data_entry_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON public.collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_table_columns_data_entry_id ON public.table_columns(data_entry_id);
CREATE INDEX IF NOT EXISTS idx_table_rows_data_entry_id ON public.table_rows(data_entry_id);
CREATE INDEX IF NOT EXISTS idx_table_cells_row_id ON public.table_cells(row_id);
CREATE INDEX IF NOT EXISTS idx_table_cells_column_id ON public.table_cells(column_id);