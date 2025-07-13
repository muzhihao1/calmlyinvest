import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { hybridSignIn } from '@/lib/auth-hybrid';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLegacy?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLegacy, setIsLegacy] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for legacy auth first
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      // Create a mock user for legacy auth
      setUser({
        id: userId,
        email: '279838958@qq.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any);
      setIsLegacy(true);
      setLoading(false);
    } else {
      // 获取初始会话
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // 如果登出，清理本地存储
      if (!session) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('numericUserId');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await hybridSignIn(email, password);
    
    setUser(result.user);
    setSession(result.session);
    setIsLegacy(result.isLegacy);
    
    // 登录成功后跳转到主页
    setLocation('/');
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // 登出后跳转到登录页
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, isLegacy }}>
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