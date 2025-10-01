# Security Checklist - Review Before Committing! ⚠️

## 🚨 Critical Security Issues Found

### Hardcoded API Keys Detected
The following files contained hardcoded Supabase API keys and have been fixed or added to .gitignore:

#### ✅ Fixed (removed hardcoded keys):
- `/client/src/lib/supabase.ts` - Now requires environment variables
- `/api/auth/register.ts` - Now requires environment variables

#### ⛔ Added to .gitignore (contain actual keys):
- `setup-env.sh` - Contains all API keys
- `scripts/restore-user-data.ts` - Contains anon key
- `scripts/restore-via-api.ts` - Contains service role key
- `VERCEL_ENV_VARS_GUIDE.md` - Documentation with actual keys
- `SECURITY_KEY_ROTATION_COMPLETE.md` - Documentation with actual keys

## 📋 Pre-Commit Security Checklist

### 1. Environment Variables
- [ ] ✅ Verify `.env` is in .gitignore
- [ ] ✅ Verify `.env.supabase` is in .gitignore
- [ ] ✅ Check no `.env*` files are being committed
- [ ] Remove any hardcoded API keys from source files
- [ ] Use environment variables for all sensitive configuration

### 2. API Keys & Secrets
- [ ] Search for Supabase keys: `grep -r "eyJhbGci" .`
- [ ] Search for passwords: `grep -r "password.*=" .`
- [ ] Search for secret keywords: `grep -ri "secret\|apikey\|api_key" .`
- [ ] Check for hardcoded URLs with credentials

### 3. Files to Never Commit
```
.env
.env.*
*.key
*.pem
secrets.json
setup-env.sh
```

### 4. Code Review
- [ ] No console.log() with sensitive data
- [ ] No hardcoded demo passwords in production code
- [ ] No SQL queries with hardcoded credentials
- [ ] No test files with real user data

### 5. Documentation Files
- [ ] Ensure documentation uses placeholder values, not real keys
- [ ] Example: `SUPABASE_URL=https://your-project.supabase.co`
- [ ] Not: `SUPABASE_URL=https://hsfthqchyupkbmazcuis.supabase.co`

## 🔍 Quick Security Scan Commands

```bash
# Find potential API keys
grep -r "eyJhbGci" . --exclude-dir=node_modules --exclude-dir=.git

# Find hardcoded passwords
grep -r "password\s*[:=]" . --exclude-dir=node_modules --exclude-dir=.git

# Find secret/key references
grep -ri "secret\|apikey\|api_key\|bearer" . --exclude-dir=node_modules --exclude-dir=.git

# Find Supabase URLs
grep -r "supabase\.co" . --exclude-dir=node_modules --exclude-dir=.git

# Check what files will be committed
git status
git diff --cached
```

## 🛡️ Best Practices

1. **Use Environment Variables**
   - All sensitive data should come from environment variables
   - Never commit `.env` files
   - Use `.env.example` with placeholder values

2. **Code Reviews**
   - Always review `git diff` before committing
   - Look for accidentally included sensitive data
   - Check for debug code with credentials

3. **Documentation**
   - Use generic examples in docs
   - Mark sensitive values clearly
   - Provide `.env.example` for setup

4. **Testing**
   - Use separate test credentials
   - Never use production keys in tests
   - Mock external services when possible

## ⚡ If You Find Exposed Keys

1. **Immediately rotate the exposed keys** in Supabase dashboard
2. **Update all environment variables** in:
   - Local `.env` files
   - Vercel dashboard
   - Any other deployments
3. **Audit access logs** in Supabase for unauthorized access
4. **Consider the keys compromised** even if quickly removed

## 📝 Files Modified in This Security Review

1. **Source Code Fixed:**
   - `/client/src/lib/supabase.ts` - Removed hardcoded anon key
   - `/api/auth/register.ts` - Removed hardcoded anon key

2. **Added to .gitignore:**
   - `setup-env.sh`
   - `scripts/restore-user-data.ts`
   - `scripts/restore-via-api.ts`
   - `VERCEL_ENV_VARS_GUIDE.md`
   - `SECURITY_KEY_ROTATION_COMPLETE.md`

3. **Created:**
   - `.env.example` - Safe template for environment variables
   - `SECURITY_CHECKLIST.md` - This file

## ✅ Final Steps Before Committing

1. Run the security scan commands above
2. Review `git status` and `git diff`
3. Ensure no sensitive files are staged
4. Verify application still works with environment variables
5. Commit with confidence!

---

**Remember**: It's better to be overly cautious with security. When in doubt, don't commit it!