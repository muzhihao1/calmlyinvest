# Deployment Steps for Serverless Migration

## Pre-deployment Checklist

1. **Verify Environment Variables in Vercel Dashboard**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Test Locally First**
   ```bash
   cd calmlyinvest
   npm run dev
   ```
   - Test guest mode (logout and use the app)
   - Test authenticated mode (login with demo/demo123)
   - Create a portfolio
   - Add stock holdings
   - Check risk calculations

## Deploy to Vercel

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "Migrate to Vercel Serverless Functions architecture"
   git push
   ```

2. **Monitor Deployment**
   - Watch Vercel dashboard for build status
   - Check for any build errors

3. **Post-deployment Testing**

   a. **Test Health Endpoint**
   ```bash
   curl https://calmlyinvest.vercel.app/api/health
   ```

   b. **Test Debug Endpoint** (if not production)
   ```bash
   curl https://calmlyinvest.vercel.app/api/debug/env
   ```

   c. **Test Guest Mode**
   - Open browser in incognito mode
   - Navigate to https://calmlyinvest.vercel.app
   - Should be able to use app without login

   d. **Test Authenticated Mode**
   - Login with demo account (demo/demo123)
   - Create portfolio
   - Add holdings
   - Check risk metrics

## Troubleshooting

### If API calls fail with 404:
1. Check Vercel Functions tab for deployed functions
2. Verify function file names match expected patterns
3. Check function logs for errors

### If authentication fails:
1. Verify Supabase environment variables
2. Check browser network tab for auth headers
3. Ensure X-Guest-User header is sent for guest mode

### If database operations fail:
1. Check Supabase dashboard for errors
2. Verify RLS policies are configured
3. Check service role key is set correctly

## Rollback Instructions

If critical issues arise:

1. **Quick Fix**: Restore old api/index.ts:
   ```bash
   git revert HEAD
   git push
   ```

2. **Full Rollback**: 
   - Revert to previous commit before migration
   - Restore vercel.json API rewrite rule
   - Redeploy

## Success Criteria

- [ ] All API endpoints respond without 500 errors
- [ ] Guest mode works without authentication
- [ ] Authenticated users can perform all CRUD operations
- [ ] Risk calculations update in real-time
- [ ] Market price refresh works correctly
- [ ] No console errors in browser
- [ ] Performance is acceptable (< 3s for API calls)