import { SupabaseStorage } from './supabase-storage';
import { supabaseConfig } from './config/supabase';

// Create storage instance using Supabase
function createStorage(): SupabaseStorage {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseConfig.url || !serviceKey) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  }
  
  console.log('Using Supabase storage');
  return new SupabaseStorage(supabaseConfig.url, serviceKey);
}

export const storage = createStorage();