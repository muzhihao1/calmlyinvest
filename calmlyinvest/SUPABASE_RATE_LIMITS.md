# Supabase Rate Limits and Solutions

## 429 Error (Too Many Requests)

### Why This Happens
Supabase implements rate limiting to prevent abuse:
- **Free tier**: Limited to 3-5 signup attempts per hour per IP
- **After security incident**: Temporary stricter limits may apply
- **Email verification**: Each signup sends an email, which has costs

### Immediate Solutions

#### 1. Use Guest Mode (Recommended for Testing)
- Click "访客模式（无需登录）" button
- Full functionality without persistence
- No rate limits
- Perfect for testing and demos

#### 2. Use Existing Test Account
- Email: `279838958@qq.com`
- Password: `123456`
- Click "使用测试账号登录"

#### 3. Wait Before Retrying
- Rate limits reset after 1-2 hours
- Clear browser cookies/cache
- Try from different network/device

### Long-term Solutions

#### For Development
1. **Disable Email Confirmations** (Development only):
   ```sql
   -- In Supabase SQL Editor
   UPDATE auth.config 
   SET enable_signup = true,
       enable_email_confirmation = false
   WHERE id = 1;
   ```

2. **Use Auth Providers**:
   - Enable Google/GitHub OAuth
   - No email verification needed
   - Better user experience

#### For Production
1. **Upgrade Supabase Plan**:
   - Pro plan: Higher rate limits
   - Custom limits available

2. **Implement Rate Limiting UI**:
   - Disable signup button after attempts
   - Show countdown timer
   - Guide users to alternatives

3. **Add CAPTCHA**:
   - Reduces bot signups
   - May increase rate limits

### Checking Current Limits
```bash
# Check Supabase dashboard
# Project Settings → Authentication → Rate Limits
```

### Alternative Authentication Options

1. **Magic Links** (No password needed):
   ```typescript
   await supabase.auth.signInWithOtp({
     email: 'user@example.com',
   })
   ```

2. **Social Logins**:
   - Google
   - GitHub  
   - WeChat (for Chinese users)

### Emergency Access
If completely blocked:
1. Use guest mode
2. Deploy your own instance
3. Contact Supabase support
4. Use alternative database (development only)