# Final Deployment Checklist for Serverless Migration

## ✅ Completed Tasks

### 1. Code Migration
- [x] Migrated all 22 API endpoints to Vercel Serverless Functions
- [x] Created shared utilities for auth, storage, and response handling
- [x] Fixed TypeScript errors
- [x] Updated frontend to use correct authentication headers (X-Guest-User)
- [x] Created storage adapter for date type conversion
- [x] Removed old API catch-all redirect

### 2. Documentation
- [x] Created migration summary
- [x] Created deployment steps guide
- [x] Created test scripts (bash and Node.js)

## 📋 Pre-Deployment Tasks

### 1. Verify Local Build
```bash
cd calmlyinvest
npm run check  # Should complete without errors
npm run build  # Should build successfully
```

### 2. Environment Variables
Ensure these are set in Vercel dashboard:
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

## 🚀 Deployment Steps

### 1. Deploy to Vercel
```bash
git add .
git commit -m "feat: Migrate to Vercel Serverless Functions architecture

- Migrated all 22 API endpoints from Express.js to individual serverless functions
- Updated authentication to use X-Guest-User header for guest mode
- Created shared utilities for consistent error handling and auth
- Added comprehensive test scripts for endpoint verification"

git push origin main
```

### 2. Monitor Deployment
- Watch Vercel dashboard for build progress
- Check for any build errors in the logs

## 🧪 Post-Deployment Testing

### 1. Quick Health Check
```bash
# Test production endpoints
curl https://calmlyinvest.vercel.app/api/health
```

### 2. Run Basic Tests
```bash
# Run shell script tests
./test-serverless-endpoints.sh production

# Or run Node.js tests (requires node-fetch)
npm install node-fetch
BASE_URL=https://calmlyinvest.vercel.app node test-endpoints.js
```

### 3. Manual Testing Checklist

#### Guest Mode (no login required)
- [ ] Open site in incognito browser
- [ ] Should see demo portfolio
- [ ] Can view stock holdings
- [ ] Can see risk calculations
- [ ] Cannot create/edit/delete anything

#### Authenticated Mode
- [ ] Login with demo account (username: demo, password: demo123)
- [ ] Create a new portfolio
- [ ] Add stock holdings
- [ ] View risk metrics
- [ ] Get smart suggestions
- [ ] Update portfolio details
- [ ] Delete holdings
- [ ] Refresh market prices

#### Edge Cases
- [ ] Test with invalid portfolio IDs (should get 404)
- [ ] Test without authentication (should get 401)
- [ ] Test with malformed data (should get 400)

## 🔍 Monitoring & Debugging

### 1. Check Function Logs
- Go to Vercel dashboard > Functions tab
- Look for any errors or timeouts
- Check execution times

### 2. Common Issues & Solutions

#### "Module not found" errors
- Ensure all imports use correct paths
- Check that shared modules are properly exported

#### Authentication failures
- Verify Supabase environment variables are set
- Check JWT token format in requests
- Ensure X-Guest-User header is sent for guest mode

#### CORS errors
- All endpoints include CORS headers
- Check browser console for specific CORS issues

#### Database errors
- Check Supabase dashboard for quota limits
- Verify RLS policies are configured
- Check service role key permissions

## 📊 Performance Metrics to Monitor

After deployment, monitor:
- [ ] Function execution times (should be < 1s for most endpoints)
- [ ] Cold start frequency
- [ ] Error rates
- [ ] Database query performance

## 🎯 Success Criteria

Deployment is successful when:
- [ ] All health checks pass
- [ ] Guest mode works without authentication
- [ ] Authenticated users can perform all CRUD operations
- [ ] No 500 errors in function logs
- [ ] Performance is acceptable (< 3s response times)

## 🔄 Rollback Plan

If critical issues arise:

1. **Revert the deployment**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Restore API routing** (if needed)
   - Add back the API rewrite in vercel.json
   - Restore original api/index.ts

## 📝 Next Steps After Successful Deployment

1. Monitor for 24 hours
2. Gather user feedback
3. Optimize cold starts if needed
4. Consider adding:
   - Rate limiting
   - Request logging
   - Performance monitoring
   - Error tracking (Sentry)

---

**Note**: Keep this checklist handy during deployment. Check off items as you complete them.