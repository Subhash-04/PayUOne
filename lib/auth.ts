import { supabase } from './supabase';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  mobileNumber: string;
}

interface SignInData {
  email: string;
  password: string;
}

export const auth = {
  signUp: async ({ email, password, fullName, mobileNumber }: SignUpData) => {
    try {
      // First create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            mobile_number: mobileNumber
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      // Return the auth data
      return { data: authData, error: null };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { data: null, error: error.message };
    }
  },

  signIn: async ({ email, password }: SignInData) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.warn('Profile fetch warning:', profileError);
        }
        
        return { data: { ...data, profile: profileData || null }, error: null };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { data: null, error: 'Invalid email or password' };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error: any) {
      return { session: null, error: error.message };
    }
  },

  onAuthStateChange: (callback: (session: any) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};