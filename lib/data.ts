import { supabase } from './supabase';

export interface DataEntry {
  id: string;
  name: string;
  description?: string;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export const data = {
  createEntry: async (entry: Partial<DataEntry>) => {
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  updateEntry: async (id: string, updates: Partial<DataEntry>) => {
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  deleteEntry: async (id: string) => {
    try {
      const { error } = await supabase
        .from('data_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  getEntries: async () => {
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  getEntry: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};