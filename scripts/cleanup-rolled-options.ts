/**
 * Script to cleanup ROLLED option holdings that are invisible in UI
 * but still affecting margin calculations
 */

import * as dotenv from 'dotenv';
import { SupabaseStorage } from '../server/supabase-storage.js';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

async function cleanupRolledOptions() {
  console.log('🧹 Cleaning up ROLLED option holdings...\n');

  const storage = new SupabaseStorage(supabaseUrl, supabaseKey);

  const optionsToDelete = [
    {
      id: 'c01d8cb8-99b2-4c1b-b00a-90d6195fcf08',
      symbol: 'QQQ251003P600',
      description: 'QQQ PUT 600 exp 2025-10-03'
    },
    {
      id: '70331027-593f-4a39-ac77-179ae2767ad1',
      symbol: 'NVDA251017P175',
      description: 'NVDA PUT 175 exp 2025-10-17'
    }
  ];

  for (const option of optionsToDelete) {
    console.log(`\n📍 Deleting option: ${option.description}`);
    console.log(`   ID: ${option.id}`);
    console.log(`   Symbol: ${option.symbol}`);

    try {
      const result = await storage.deleteOptionHolding(option.id);

      if (result) {
        console.log(`   ✅ Successfully deleted`);
      } else {
        console.log(`   ⚠️  Delete returned false (option may not exist)`);
      }
    } catch (error) {
      console.error(`   ❌ Error deleting:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Cleanup completed!');
  console.log('='.repeat(60));
  console.log('\nThe margin_used field should now be automatically reset to $0');
  console.log('since no holdings remain in the portfolio.');
}

// Run the cleanup
cleanupRolledOptions()
  .then(() => {
    console.log('\n✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
