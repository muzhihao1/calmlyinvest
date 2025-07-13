import type { Request, Response, NextFunction } from 'express';
import { retrySupabaseCall } from './utils/supabase-retry';
import { getSupabaseServiceClient } from './config/supabase';

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
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      // Fallback to memory storage if Supabase not configured
      return next();
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // 验证Supabase token with retry
    const { data: { user }, error } = await retrySupabaseCall(
      () => supabase.auth.getUser(token),
      3,
      1000
    );
    
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
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      // Fallback to memory storage if Supabase not configured
      req.userId = undefined;
      req.user = undefined;
      return next();
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // 游客模式
      req.userId = undefined;
      req.user = undefined;
      return next();
    }
    
    // 尝试验证token with retry logic
    try {
      const { data: { user }, error } = await retrySupabaseCall(
        () => supabase.auth.getUser(token),
        2, // 只重试2次以避免延迟
        500
      );
      
      if (!error && user) {
        req.userId = user.id;
        req.user = user;
      }
    } catch (fetchError: any) {
      // 如果是网络错误，记录但不影响请求
      console.warn('Supabase auth check failed:', fetchError.message);
      // 继续作为游客模式
    }
    
    next();
  } catch (error) {
    // 忽略错误，作为游客继续
    req.userId = undefined;
    req.user = undefined;
    next();
  }
}