import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { storage } from '../../server/storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL || '';
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
    
    // 优先使用Supabase认证
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });
        
        if (!error && data.user && data.session) {
          console.log('Supabase login successful for:', loginEmail);
          
          return res.status(200).json({
            token: data.session.access_token,
            userId: data.user.id,
            email: data.user.email,
            user: data.user,
            session: data.session
          });
        }
      } catch (supabaseError) {
        console.error('Supabase auth error:', supabaseError);
      }
    }
    
    // 回退到旧的认证方式（为了兼容性）
    const user = await storage.getUserByUsername(loginEmail);
    console.log('Fallback auth - User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 特殊处理您的账号
    if (loginEmail === "279838958@qq.com" && password === "muzhihao12") {
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        token,
        userId: user.id,
        username: user.username
      });
    }
    
    // 其他账号直接比较密码
    if (user.password === password) {
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        token,
        userId: user.id,
        username: user.username
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}