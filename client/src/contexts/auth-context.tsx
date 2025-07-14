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
    // Check for guest mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('guest') === 'true') {
      setIsGuest(true);
      setUser(GUEST_USER);
      setLoading(false);
      // Remove guest parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        // On error, enter guest mode
        setIsGuest(true);
        setUser(GUEST_USER);
        setSession(null);
        setLoading(false);
        return;
      }
      
      // Verify session is still valid if it exists
      if (session?.user) {
        try {
          // Test if the session is actually valid by making a simple API call
          const { data: testUser, error: testError } = await supabase.auth.getUser();
          if (testError || !testUser?.user) {
            throw new Error('Session invalid');
          }
          setSession(session);
          setUser(session.user);
          setIsGuest(false);
        } catch (err) {
          console.error('Session validation failed:', err);
          // Session is invalid, clear it and enter guest mode
          await supabase.auth.signOut();
          setIsGuest(true);
          setUser(GUEST_USER);
          setSession(null);
        }
      } else {
        // No authenticated user, automatically enter guest mode
        setIsGuest(true);
        setUser(GUEST_USER);
      }
      setLoading(false);
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