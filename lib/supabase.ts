import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from '@/utils/platform';
import WebSocket from 'isomorphic-ws';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only enable URL detection on web platform
    detectSessionInUrl: Platform.isWeb,
    flowType: 'pkce',
  },
  // Add global error handler
  global: {
    headers: {
      'X-Client-Info': 'expo-router',
    },
  },
});

// Add custom error handling to any compatible object
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error:', error);
  return Promise.reject(error);
};