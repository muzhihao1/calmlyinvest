# Supabase Pro Rate Limits 配置

## 在 Supabase Dashboard 中设置：

### Authentication > Providers > Email
- Rate limit for signups: **10 per hour**
- Rate limit for password recovery: **5 per hour**
- Rate limit for magic links: **5 per hour**

### Authentication > Settings
- Enable email confirmations: **Yes** (保持启用)
- Double confirm email changes: **No**
- Secure password change: **No**
- JWT expiry limit: **3600** (1小时)
- Refresh token rotation: **Yes**
- Reuse interval: **10** seconds

### Authentication > Providers
启用以下登录方式减轻邮箱注册压力：
- Email (已启用)
- Google OAuth (建议启用)
- GitHub OAuth (建议启用)