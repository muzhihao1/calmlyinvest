import { createClient } from '@supabase/supabase-js';
import { fetchWithTimeout } from '../utils/supabase-retry';

// Supabase configuration with better error handling
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

// Create Supabase client with optimized settings
export function createSupabaseClient(useServiceKey = false) {
  const key = useServiceKey && supabaseConfig.serviceKey 
    ? supabaseConfig.serviceKey 
    : supabaseConfig.anonKey;

  if (!supabaseConfig.url || !key) {
    console.warn('Supabase configuration missing, some features may not work');
    return null;
  }

  return createClient(supabaseConfig.url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: fetchWithTimeout,
      headers: {
        'x-client-info': 'portfolio-risk-app'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
}

// Singleton instances
let anonClient: ReturnType<typeof createSupabaseClient> = null;
let serviceClient: ReturnType<typeof createSupabaseClient> = null;

export function getSupabaseClient() {
  if (!anonClient) {
    anonClient = createSupabaseClient(false);
  }
  return anonClient;
}

export function getSupabaseServiceClient() {
  if (!serviceClient) {
    serviceClient = createSupabaseClient(true);
  }
  return serviceClient;
}