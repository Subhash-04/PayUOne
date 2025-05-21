/*
  # Add missing tables for data management

  1. New Tables
    - `table_columns`: Stores column definitions for each data entry
      - `id` (uuid, primary key)
      - `data_entry_id` (uuid, references data_entries)
      - `name` (text)
      - `type` (text)
      - `order` (integer)
    
    - `table_rows`: Stores row data
      - `id` (uuid, primary key)
      - `data_entry_id` (uuid, references data_entries)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `table_cells`: Stores cell values
      - `row_id` (uuid, references table_rows)
      - `column_id` (uuid, references table_columns)
      - `value` (text)
    
    - `collaborators`: Manages data entry collaborators
      - `data_entry_id` (uuid, references data_entries)
      - `user_id` (uuid, references profiles)
      - `role` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for data access control
*/

-- Create enum for column types
CREATE TYPE column_type AS ENUM ('text', 'number', 'amount', 'date');

-- Create table_columns table
CREATE TABLE IF NOT EXISTS public.table_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_entry_id uuid REFERENCES public.data_entries(id) ON DELETE CASCADE,
  name text NOT NULL,
  type column_type NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(data_entry_id, "order")
);

-- Create table_rows table
CREATE TABLE IF NOT EXISTS public.table_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_entry_id uuid REFERENCES public.data_entries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table_cells table
CREATE TABLE IF NOT EXISTS public.table_cells (
  row_id uuid REFERENCES public.table_rows(id) ON DELETE CASCADE,
  column_id uuid REFERENCES public.table_columns(id) ON DELETE CASCADE,
  value text,
  PRIMARY KEY (row_id, column_id)
);

-- Create collaborators table
CREATE TABLE IF NOT EXISTS public.collaborators (
  data_entry_id uuid REFERENCES public.data_entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (data_entry_id, user_id)
);

-- Enable RLS
ALTER TABLE public.table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for table_columns
CREATE POLICY "Users can view columns if they own or collaborate"
  ON public.table_columns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_entries de
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE de.id = table_columns.data_entry_id
      AND (de.owner_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage columns if they own or are editors"
  ON public.table_columns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_entries de
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE de.id = table_columns.data_entry_id
      AND (de.owner_id = auth.uid() OR (c.user_id = auth.uid() AND c.role = 'editor'))
    )
  );

-- Policies for table_rows
CREATE POLICY "Users can view rows if they own or collaborate"
  ON public.table_rows
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_entries de
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE de.id = table_rows.data_entry_id
      AND (de.owner_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage rows if they own or are editors"
  ON public.table_rows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_entries de
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE de.id = table_rows.data_entry_id
      AND (de.owner_id = auth.uid() OR (c.user_id = auth.uid() AND c.role = 'editor'))
    )
  );

-- Policies for table_cells
CREATE POLICY "Users can view cells if they own or collaborate"
  ON public.table_cells
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.table_rows tr
      JOIN public.data_entries de ON de.id = tr.data_entry_id
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE tr.id = table_cells.row_id
      AND (de.owner_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage cells if they own or are editors"
  ON public.table_cells
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.table_rows tr
      JOIN public.data_entries de ON de.id = tr.data_entry_id
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE tr.id = table_cells.row_id
      AND (de.owner_id = auth.uid() OR (c.user_id = auth.uid() AND c.role = 'editor'))
    )
  );

-- Policies for collaborators
CREATE POLICY "Users can view collaborators if they own or collaborate"
  ON public.collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_entries de
      LEFT JOIN public.collaborators c ON c.data_entry_id = de.id
      WHERE de.id = collaborators.data_entry_id
      AND (de.owner_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Only owners can manage collaborators"
  ON public.collaborators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.data_entries de
      WHERE de.id = collaborators.data_entry_id
      AND de.owner_id = auth.uid()
    )
  );

-- Function to update data_entry total_amount
CREATE OR REPLACE FUNCTION update_data_entry_total()
RETURNS trigger AS $$
BEGIN
  -- Update total_amount in data_entries
  UPDATE public.data_entries
  SET total_amount = (
    SELECT COALESCE(SUM(NULLIF(value, '')::numeric), 0)
    FROM public.table_cells tc
    JOIN public.table_columns col ON col.id = tc.column_id
    WHERE col.type = 'amount'
    AND col.data_entry_id = (
      SELECT data_entry_id 
      FROM public.table_rows 
      WHERE id = NEW.row_id
    )
  )
  WHERE id = (
    SELECT data_entry_id 
    FROM public.table_rows 
    WHERE id = NEW.row_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update total_amount
CREATE TRIGGER update_total_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.table_cells
  FOR EACH ROW
  EXECUTE FUNCTION update_data_entry_total();