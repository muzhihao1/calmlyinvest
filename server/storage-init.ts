import { SupabaseStorage } from './supabase-storage.js';
import { supabaseConfig } from './config/supabase.js';

// Create storage instance using Supabase
function createStorage(): SupabaseStorage | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseConfig.url || !serviceKey) {
    console.warn('Missing Supabase configuration. Guest mode only will be available.');
    return null;
  }
  
  console.log('Using Supabase storage');
  return new SupabaseStorage(supabaseConfig.url, serviceKey);
}

export const storage = createStorage();