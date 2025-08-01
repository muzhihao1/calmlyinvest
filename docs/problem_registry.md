# Problem Registry

## Problem: API 404 Errors on Vercel Deployment

**Date Identified**: 2025-08-01
**Priority**: HIGH
**Status**: In Progress

### Description
The Vercel deployment at https://calmlyinvest.vercel.app is returning 404 errors for API endpoints like `/api/user-portfolios-simple`. The issue is caused by a mismatch between the API file locations and Vercel's routing configuration.

### Root Cause Analysis
1. API files are located in `/calmlyinvest/api/`
2. Vercel is configured to look for functions in `/api/` at the repository root
3. The vercel.json configuration specifies `"functions": { "api/**/*.ts": { ... } }` which expects files at the root level

### Impact
- All API endpoints return 404 errors
- Application functionality is broken in production
- Users cannot access portfolio data

### Constraints
- Must maintain existing file structure in `/calmlyinvest/api/`
- Need to preserve Vercel deployment configuration
- Solution must work with Vercel's serverless function architecture