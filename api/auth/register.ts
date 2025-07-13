import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL || 'https://hsfthqchyupkbmazcuis.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzc3OTUsImV4cCI6MjA2NzkxMzc5NX0.Ox6XqMSiU6DDF9klIxLsvPvDAFLSoA1XTXqc8_xoWpI';

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
    const { email, password } = req.body;
    
    console.log('Register attempt:', { email });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // 使用Supabase创建用户
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          // 额外的用户元数据
          created_at: new Date().toISOString()
        }
      }
    });
    
    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({ 
        error: error.message || 'Registration failed'
      });
    }
    
    if (!data.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }
    
    console.log('User created successfully:', data.user.id);
    
    // 如果您的账号，自动导入数据
    if (email === '279838958@qq.com') {
      // 数据会通过触发器自动创建
      console.log('Your account detected, data will be imported via trigger');
    }
    
    return res.status(201).json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
      message: 'User created successfully. Please check your email for verification.',
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}