# Database Migration Guide - User Preferences Table

## Overview
This guide explains how to apply the `user_preferences` table migration to your Supabase database.

## Migration File Location
`/supabase/20251024_create_user_preferences.sql`

## Why Manual Application is Needed
The Supabase MCP connection has read-only permissions and cannot execute DDL operations (CREATE TABLE, CREATE TYPE, etc.). The migration must be applied through the Supabase Dashboard or CLI.

## Method 1: Supabase Dashboard (Recommended)

### Prerequisites
- Access to your Supabase project dashboard
- Project URL and credentials configured in `.env` file

### Steps

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project: CalmlyInvest

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" to create a new SQL editor tab

3. **Copy Migration SQL**
   - Open `/supabase/20251024_create_user_preferences.sql` in your local editor
   - Copy the entire SQL content (557 lines)

4. **Paste and Execute**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for execution to complete

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check the "Tables" section in the dashboard
   - Verify `user_preferences` table appears with 14 columns

### Expected Results

After successful execution, you should have:

✅ **3 Custom Enum Types Created:**
- `investment_goal_type` (4 values)
- `risk_tolerance_type` (3 values)
- `investment_horizon_type` (3 values)

✅ **1 Table Created:**
- `user_preferences` with 14 columns

✅ **4 Indexes Created:**
- `idx_user_preferences_investment_goal`
- `idx_user_preferences_risk_tolerance`
- `idx_user_preferences_onboarding`
- `idx_user_preferences_created_at`

✅ **1 Trigger Function Created:**
- `update_user_preferences_timestamp()`

✅ **1 Trigger Attached:**
- `trigger_update_user_preferences_timestamp`

✅ **RLS Enabled with 4 Policies:**
- "Users can view own preferences" (SELECT)
- "Users can insert own preferences" (INSERT)
- "Users can update own preferences" (UPDATE)
- "Users can delete own preferences" (DELETE)

## Method 2: Supabase CLI (Requires Docker)

### Prerequisites
- Docker Desktop installed and running
- Supabase CLI installed (`npm install -g supabase`)
- Project initialized locally

### Steps

1. **Start Docker Desktop**
   ```bash
   # Ensure Docker is running
   docker ps
   ```

2. **Link to Supabase Project**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. **Push Migration**
   ```bash
   supabase db push
   ```

4. **Verify Status**
   ```bash
   supabase db diff
   ```

## Verification After Migration

### Method 1: SQL Query

Run this query in Supabase SQL Editor to verify table structure:

```sql
-- Check table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'user_preferences';

-- Check columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check enum types
SELECT n.nspname as schema, t.typname as type_name, e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname IN ('investment_goal_type', 'risk_tolerance_type', 'investment_horizon_type')
ORDER BY t.typname, e.enumsortorder;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_preferences';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_preferences';
```

### Method 2: Using Supabase MCP (After Migration)

After the migration is applied, you can verify using:

```typescript
// This will work after migration is complete
mcp__supabase__list_tables({ schemas: ['public'] })
```

Should show `user_preferences` in the list.

## Troubleshooting

### Error: "type already exists"
**Cause:** Migration was partially applied before.

**Solution:** Drop the types first, then re-run:
```sql
DROP TYPE IF EXISTS public.investment_goal_type CASCADE;
DROP TYPE IF EXISTS public.risk_tolerance_type CASCADE;
DROP TYPE IF EXISTS public.investment_horizon_type CASCADE;
```

Then re-run the full migration.

### Error: "table already exists"
**Cause:** Table was created in a previous attempt.

**Solution:** Drop the table first:
```sql
DROP TABLE IF EXISTS public.user_preferences CASCADE;
```

Then re-run the migration.

### Error: "permission denied"
**Cause:** Using connection without sufficient privileges.

**Solution:** Ensure you're logged into Supabase Dashboard with admin privileges, or using service role key for CLI operations.

### RLS Policies Not Working
**Cause:** RLS might not be enabled, or policies are misconfigured.

**Solution:** Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_preferences';
```

Should return `rowsecurity = true`.

## Next Steps After Successful Migration

1. ✅ Verify table structure using verification queries above
2. ✅ Test RLS policies by attempting cross-user access
3. ✅ Test API endpoints (`/api/user/preferences`)
4. ✅ Develop frontend components (Settings Wizard)

## Related Documentation

- Implementation Plan: `/docs/PHASE_2_4_IMPLEMENTATION_PLAN.md`
- Step 1 Progress: `/docs/PHASE_2_PROGRESS_STEP1.md`
- Step 2 Progress: `/docs/PHASE_2_PROGRESS_STEP2.md`
- Migration SQL: `/supabase/20251024_create_user_preferences.sql`
- API Implementation: `/api/user/preferences.ts`
- Schema Definitions: `/shared/schema-supabase.ts`

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Review error messages in SQL Editor
3. Verify environment variables in `.env` file
4. Check PostgreSQL version compatibility (Supabase uses PostgreSQL 15+)
