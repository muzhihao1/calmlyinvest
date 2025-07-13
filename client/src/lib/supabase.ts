import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsfthqchyupkbmazcuis.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzc3OTUsImV4cCI6MjA2NzkxMzc5NX0.Ox6XqMSiU6DDF9klIxLsvPvDAFLSoA1XTXqc8_xoWpI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 获取当前用户
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// 获取当前会话
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}