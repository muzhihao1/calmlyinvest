import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, password, username } = req.body;
    
    // 支持email或username登录
    const loginEmail = email || username;
    
    console.log('Login attempt:', { email: loginEmail, password: '***' });
    
    if (!loginEmail || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });
    
    if (error) {
      console.error('Supabase auth error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('Supabase login successful for:', loginEmail);
    
    return res.status(200).json({
      token: data.session.access_token,
      userId: data.user.id,
      email: data.user.email,
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}