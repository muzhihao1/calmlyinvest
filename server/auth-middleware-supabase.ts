import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

// Supabase认证中间件
export async function authenticateSupabase(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // 验证Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // 将用户信息添加到请求对象
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Authentication failed' });
  }
}

// 可选认证 - 允许游客访问
export async function optionalAuthSupabase(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // 游客模式
      req.userId = undefined;
      req.user = undefined;
      return next();
    }
    
    // 尝试验证token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      req.userId = user.id;
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 忽略错误，作为游客继续
    req.userId = undefined;
    req.user = undefined;
    next();
  }
}