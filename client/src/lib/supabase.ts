import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'portfolio-risk-auth',
    flowType: 'implicit'
  },
  global: {
    headers: {
      'x-client-info': 'portfolio-risk-webapp'
    },
    fetch: (url, options = {}) => {
      // Add timeout to fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// 获取当前用户 with error handling
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Failed to get current user:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// 获取当前会话 with error handling
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Failed to get session:', error.message);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Helper to check if Supabase is available
export const isSupabaseConfigured = () => !!supabase;