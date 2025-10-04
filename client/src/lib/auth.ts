import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    }
  });

  if (error) {
    // Handle specific error codes
    if (error.status === 429) {
      throw new Error("注册请求过于频繁，请稍后再试（建议等待1-2分钟）");
    } else if (error.message?.includes("already registered")) {
      throw new Error("该邮箱已经注册过，请直接登录");
    } else if (error.message?.includes("not authorized")) {
      throw new Error("注册功能暂时受限，请联系管理员或使用访客模式");
    }
    throw error;
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}