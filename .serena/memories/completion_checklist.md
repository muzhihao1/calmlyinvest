# CalmlyInvest Task Completion Checklist

## After Making Code Changes

### 1. Type Checking
```bash
npm run check
```
Ensure no TypeScript errors

### 2. Test Locally
```bash
npm run dev
```
- Test all affected features
- Check error handling
- Verify data persistence
- Test both guest and authenticated modes

### 3. Database Changes
If database schema was modified:
- Update `/shared/schema.ts`
- Create migration in `/migrations/`
- Test migration script
- Update RLS policies if needed

### 4. API Changes
If API endpoints were modified:
- Update types in `/shared/`
- Test with both storage modes
- Verify error responses
- Check authentication flow

### 5. UI Changes
If UI was modified:
- Test responsive design
- Verify bilingual support
- Check loading states
- Test error states

### 6. Documentation
Update relevant documentation:
- CURRENT_STATUS.md for system changes
- TROUBLESHOOTING.md for new issues
- README.md for major features
- Code comments for complex logic

### 7. Environment Variables
If new env vars added:
- Update .env.example
- Document in deployment guides
- Add to Vercel dashboard

### 8. Pre-deployment
- Review DEPLOYMENT_CHECKLIST.md
- Test build: `npm run build`
- Verify all tests pass
- Check for console errors