import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Safe state setter that checks if component is mounted
  const safeSetState = useCallback(<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (isMounted.current) {
      setter(value);
    }
  }, []);

  useEffect(() => {
    let authListener: { data: { subscription: { unsubscribe: () => void } } };

    // Set up cleanup flag
    isMounted.current = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError && isMounted.current) {
          safeSetState(setError, sessionError.message);
        } else if (isMounted.current) {
          safeSetState(setSession, initialSession);
        }

        // Set up auth state listener after initial session check
        if (isMounted.current) {
          authListener = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (isMounted.current) {
              safeSetState(setSession, currentSession);
              safeSetState(setLoading, false);
            }
          });
        }
      } catch (err) {
        if (isMounted.current) {
          safeSetState(setError, err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isMounted.current) {
          safeSetState(setLoading, false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Cleanup function
    return () => {
      isMounted.current = false;
      // Unsubscribe from auth listener if it exists
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, [safeSetState]);

  return {
    session,
    loading,
    error,
    isAuthenticated: !!session,
  };
}