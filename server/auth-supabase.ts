import type { Express, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 创建Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export function registerSupabaseAuthRoutes(app: Express) {
  // 使用Supabase Auth登录
  app.post('/api/auth/supabase/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      // 使用Supabase Auth登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      if (!data.user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // 生成自定义JWT token（可选，如果你想保持现有的token系统）
      const token = jwt.sign(
        { 
          userId: data.user.id, 
          email: data.user.email,
          supabaseAccessToken: data.session?.access_token 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        token,
        userId: data.user.id,
        email: data.user.email,
        supabaseSession: data.session
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // 使用Supabase Auth注册
  app.post('/api/auth/supabase/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      // 使用Supabase Auth注册
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // 可以添加额外的用户元数据
            created_at: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        console.error('Supabase signup error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      if (!data.user) {
        return res.status(400).json({ error: 'Failed to create user' });
      }
      
      // 创建用户的默认数据（portfolio等）
      // 这里需要在Supabase中创建相应的表
      
      res.status(201).json({
        success: true,
        userId: data.user.id,
        message: 'User created successfully. Please check your email for verification.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  // 退出登录
  app.post('/api/auth/supabase/logout', async (req, res) => {
    try {
      // 如果传递了Supabase session token，可以在服务端也执行退出
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        // 解析token获取Supabase access token
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded.supabaseAccessToken) {
            await supabase.auth.admin.signOut(decoded.supabaseAccessToken);
          }
        } catch (err) {
          // 忽略token解析错误
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });
  
  // 重置密码请求
  app.post('/api/auth/supabase/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL}/reset-password`,
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.json({ 
        success: true, 
        message: 'Password reset email sent' 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  });
}