# Supabase Migration Guide

This guide explains how to migrate from the hybrid authentication system to a pure Supabase-based system.

## Overview

The migration replaces:
- Numeric user IDs → UUID-based user IDs
- Memory storage → Supabase database
- JWT authentication → Supabase authentication
- Manual user mapping → Automatic RLS policies

## Prerequisites

1. Supabase project access at: https://app.supabase.com/project/hsfthqchyupkbmazcuis
2. Service role key from Supabase dashboard

## Migration Steps

### 1. Get Service Role Key

1. Go to: https://app.supabase.com/project/hsfthqchyupkbmazcuis/settings/api
2. Find "Project API keys" section
3. Copy the `service_role` key (it starts with `eyJ...`)
4. Add it to `.env.supabase` file

### 2. Run Database Migration

1. Go to SQL editor: https://app.supabase.com/project/hsfthqchyupkbmazcuis/sql/new
2. Copy contents of `migrations/001_supabase_schema.sql`
3. Run the SQL to create tables and RLS policies

### 3. Set Up Environment

```bash
# Copy environment variables
cp .env.supabase .env

# Install dependencies
npm install @supabase/supabase-js

# Make setup script executable
chmod +x setup-supabase.sh

# Run setup script
./setup-supabase.sh
```

### 4. Migrate User Data

For user 279838958@qq.com:
```bash
npx tsx migrations/002_migrate_user_data.ts
```

### 5. Update Application Code

Update `server/index.ts`:
```typescript
// Replace
import { registerRoutes } from "./routes";
// With
import { registerRoutes } from "./routes-supabase";
```

### 6. Clean Up Old Files

Remove these files after migration:
- `server/auth-hybrid.ts`
- `server/utils/user-mapping.ts`
- `client/src/lib/auth-hybrid.ts`
- `server/auth.ts` (old JWT auth)
- `server/storage.ts` (memory storage)

## New Architecture

### Database Schema (UUID-based)
- `portfolios` - User portfolios
- `stock_holdings` - Stock positions
- `option_holdings` - Option positions
- `risk_metrics` - Calculated risk data
- `risk_settings` - User preferences
- `risk_history` - Historical tracking

### Authentication Flow
1. User signs in via Supabase Auth
2. Supabase returns JWT token
3. Client includes token in API requests
4. Server validates token with Supabase
5. RLS policies enforce data access

### API Changes
- All user IDs are now UUIDs
- Authentication via Bearer token
- Automatic user isolation via RLS
- No manual user mapping needed

## Testing

1. Sign in with 279838958@qq.com
2. Verify portfolio data loads
3. Test CRUD operations
4. Check risk calculations

## Rollback

If needed, restore from:
1. Git history for code
2. Database backup (if created)
3. Original `.env` file

## Support

For issues:
1. Check Supabase logs
2. Verify RLS policies
3. Confirm service role key
4. Check network connectivity