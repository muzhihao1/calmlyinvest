import type { Request, Response, NextFunction } from 'express';
import { authenticateSupabase, optionalAuthSupabase } from './auth-middleware-supabase';
import { authenticateToken, optionalAuth } from './auth';

// 混合认证中间件 - 支持旧的JWT和新的Supabase认证
export async function hybridAuth(req: Request, res: Response, next: NextFunction) {
  // 先尝试Supabase认证
  await optionalAuthSupabase(req, res, (err) => {
    if (err) {
      // 如果Supabase认证失败，尝试旧的JWT认证
      optionalAuth(req, res, next);
    } else if (req.userId) {
      // Supabase认证成功
      next();
    } else {
      // Supabase认证没有找到用户，尝试旧的JWT认证
      optionalAuth(req, res, next);
    }
  });
}