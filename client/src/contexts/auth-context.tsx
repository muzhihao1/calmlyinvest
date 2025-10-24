import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Guest user object
const GUEST_USER: User = {
  id: 'guest-user',
  email: 'guest@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
} as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [location, setLocation] = useLocation();
  
  // Check if we should force guest mode (e.g., when explicitly logged out)
  const forceGuestMode = false;

  useEffect(() => {
    console.log('🔐 Auth Context: Initializing...');
    console.log('📍 Current domain:', window.location.origin);

    // Check for guest mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('guest') === 'true') {
      console.log('👤 Guest mode requested from URL');
      setIsGuest(true);
      setUser(GUEST_USER);
      setLoading(false);
      // Remove guest parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }


    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('📦 getSession result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message
      });

      if (error) {
        console.error('❌ Error getting session:', error);
        // On error, enter guest mode
        setIsGuest(true);
        setUser(GUEST_USER);
        setSession(null);
        setLoading(false);
        return;
      }

      // If we have a session, trust it first (don't block on validation)
      if (session?.user) {
        console.log('✅ Session found, user:', session.user.email);

        // Immediately set authenticated state (don't wait for validation)
        setSession(session);
        setUser(session.user);
        setIsGuest(false);
        setLoading(false);

        // Validate session in background (non-blocking)
        // Only clear on real auth errors, not network/CORS errors
        supabase.auth.getUser().then(({ data: testUser, error: testError }) => {
          console.log('🔍 Background validation result:', {
            hasUser: !!testUser?.user,
            error: testError?.message,
            errorStatus: testError?.status,
            errorName: testError?.name
          });

          if (testError) {
            // Check if this is a real authentication error
            const isAuthError =
              testError.status === 401 ||
              testError.message?.includes('invalid_grant') ||
              testError.message?.includes('invalid_token') ||
              testError.message?.includes('JWT expired');

            if (isAuthError) {
              // Real auth error - clear session
              console.error('🚫 Session is invalid (auth error), clearing:', testError);
              supabase.auth.signOut();
              setIsGuest(true);
              setUser(GUEST_USER);
              setSession(null);
            } else {
              // Network/CORS/other error - keep session
              console.warn('⚠️ Session validation failed (non-auth error), keeping session:', testError);
            }
          } else if (!testUser?.user) {
            // User doesn't exist - clear session
            console.error('🚫 User not found, clearing session');
            supabase.auth.signOut();
            setIsGuest(true);
            setUser(GUEST_USER);
            setSession(null);
          } else {
            console.log('✅ Session validation successful');
          }
        }).catch(err => {
          // Catch any unexpected errors from validation
          console.warn('⚠️ Unexpected error during background validation, keeping session:', err);
        });
      } else {
        // No authenticated user, automatically enter guest mode
        console.log('👤 No session found, entering guest mode');
        setIsGuest(true);
        setUser(GUEST_USER);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
      } else {
        // User logged out, return to guest mode
        setIsGuest(true);
        setUser(GUEST_USER);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, session } = await supabaseSignIn(email, password);
    
    setUser(user);
    setSession(session);
    setIsGuest(false); // Exit guest mode on sign in
    
    // Redirect to dashboard after successful login
    setLocation('/');
  };

  const signUp = async (email: string, password: string) => {
    await supabaseSignUp(email, password);
    setIsGuest(false); // Exit guest mode on sign up
  };

  const signOut = async () => {
    await supabaseSignOut();
    
    // Enter guest mode immediately
    setIsGuest(true);
    setUser(GUEST_USER);
    setSession(null);
    
    // Stay on dashboard
    setLocation('/');
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    setUser(GUEST_USER);
    setSession(null);
    setLocation('/');
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    setUser(null);
    setSession(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isGuest,
      signIn, 
      signUp, 
      signOut,
      enterGuestMode,
      exitGuestMode 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}