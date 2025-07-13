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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsGuest(false); // Exit guest mode on auth state change
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
    setIsGuest(false);
    
    // Redirect to login page after logout
    setLocation('/login');
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