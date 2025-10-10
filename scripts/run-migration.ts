#!/usr/bin/env tsx

/**
 * Script to run database migrations
 * Usage: npx tsx scripts/run-migration.ts migrations/005_add_option_rollover_safe.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.supabase' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Usage: npx tsx scripts/run-migration.ts <migration-file>');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔧 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('📖 Reading migration file:', migrationFile);
    const migrationPath = resolve(process.cwd(), migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method - direct SQL execution via REST API
      console.log('⚠️  exec_sql not available, trying direct execution...');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey!,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Migration failed: ${errorText}`);
      }

      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ Migration completed successfully!');
      if (data) {
        console.log('📊 Result:', data);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
