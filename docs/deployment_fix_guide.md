# API 404 Fix Deployment Guide

## Quick Fix Steps (2 minutes)

1. **Run the verification script**:
   ```bash
   node scripts/verify-api-copy.js
   ```

2. **Commit and push changes**:
   ```bash
   git add -A
   git commit -m "Fix API 404 errors: Copy API files to root during Vercel build"
   git push origin main
   ```

3. **Verify deployment**:
   - Wait for Vercel to redeploy (1-2 minutes)
   - Open https://calmlyinvest.vercel.app/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

## What This Fix Does

- Updates `vercel.json` to copy API files before building
- Copies all API files from `/calmlyinvest/api/` to `/api/` during build
- Vercel can now find and deploy the serverless functions
- Original files remain untouched in `/calmlyinvest/api/`

## Testing the Fix

### Option 1: Browser Test
1. Open `repro/test-api-endpoint.html` in a browser
2. Ensure URL is set to `https://calmlyinvest.vercel.app`
3. Click "Run All Tests"
4. All endpoints should return success (green)

### Option 2: Command Line Test
```bash
# Test health endpoint
curl https://calmlyinvest.vercel.app/api/health

# Test user portfolios endpoint
curl "https://calmlyinvest.vercel.app/api/user-portfolios-simple?userId=guest-user"
```

## If Something Goes Wrong

1. **Rollback locally**:
   ```bash
   node scripts/rollback-api-copy.js
   git checkout HEAD -- vercel.json
   ```

2. **Push rollback**:
   ```bash
   git add -A
   git commit -m "Rollback API copy fix"
   git push origin main
   ```

## Why This Works

- Vercel looks for functions in `/api/**/*.ts` from repository root
- Our functions were in `/calmlyinvest/api/`
- The build script now copies them to where Vercel expects them
- No changes needed to application code
- Works automatically on every deployment

## Files Changed

1. `/vercel.json` - Added copy script to buildCommand
2. `/scripts/copy-api-files.js` - Script that does the copying
3. `/scripts/verify-api-copy.js` - Verification script
4. `/scripts/rollback-api-copy.js` - Rollback script
5. `/.gitignore` - Added to prevent tracking copied files locally

## Success Indicators

✅ `/api/health` returns 200 OK  
✅ `/api/user-portfolios-simple` returns data  
✅ No more 404 errors in browser console  
✅ Application functions normally