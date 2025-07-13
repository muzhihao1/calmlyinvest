import type { Request, Response, NextFunction } from 'express';
import { authenticateSupabase, optionalAuthSupabase } from './auth-middleware-supabase';
import { authenticateToken, optionalAuth } from './auth';

// 混合认证中间件 - 支持旧的JWT和新的Supabase认证
export async function hybridAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 先尝试Supabase认证
    await optionalAuthSupabase(req, res, (err) => {
      if (err) {
        // 如果Supabase认证失败，尝试旧的JWT认证
        console.log('Supabase auth failed, falling back to JWT auth');
        optionalAuth(req, res, next);
      } else if (req.userId) {
        // Supabase认证成功
        console.log('Supabase auth successful, userId:', req.userId);
        next();
      } else {
        // Supabase认证没有找到用户，尝试旧的JWT认证
        console.log('No Supabase user found, trying JWT auth');
        optionalAuth(req, res, next);
      }
    });
  } catch (error) {
    // 任何错误都回退到JWT认证
    console.error('Hybrid auth error, falling back to JWT:', error);
    optionalAuth(req, res, next);
  }
}