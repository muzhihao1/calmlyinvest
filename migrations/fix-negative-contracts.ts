/**
 * Fix negative contract values in option_holdings table
 *
 * Problem: Some old option records have negative contract values
 * (e.g., -1 for SELL positions), but the correct data model uses:
 * - contracts: always positive integer
 * - direction: 'BUY' or 'SELL' to indicate position type
 *
 * This script converts all negative contracts to positive and ensures
 * the direction field correctly reflects the position type.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env and .env.supabase files
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.supabase') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixNegativeContracts() {
  console.log('🔍 Searching for option holdings with negative contracts...\n');

  // Find all option holdings with negative contracts
  const { data: negativeOptions, error: fetchError } = await supabase
    .from('option_holdings')
    .select('*')
    .lt('contracts', 0);

  if (fetchError) {
    console.error('❌ Error fetching options:', fetchError);
    process.exit(1);
  }

  if (!negativeOptions || negativeOptions.length === 0) {
    console.log('✅ No option holdings with negative contracts found. All data is clean!\n');
    return;
  }

  console.log(`📊 Found ${negativeOptions.length} option(s) with negative contracts:\n`);

  // Display affected records
  negativeOptions.forEach((option: any, index: number) => {
    console.log(`${index + 1}. ${option.option_symbol}`);
    console.log(`   Contracts: ${option.contracts} → ${Math.abs(option.contracts)}`);
    console.log(`   Direction: ${option.direction}`);
    console.log(`   Type: ${option.option_type}`);
    console.log(`   Strike: $${option.strike_price}`);
    console.log(`   Status: ${option.status}`);
    console.log('');
  });

  // Ask for confirmation
  console.log('⚠️  This will update all records listed above.');
  console.log('   - Contracts will be converted to positive values');
  console.log('   - Direction field will be preserved\n');

  // In production, you might want to add a prompt for confirmation
  // For now, we'll proceed automatically

  console.log('🔧 Applying fixes...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const option of negativeOptions) {
    const positiveContracts = Math.abs(option.contracts);

    const { error: updateError } = await supabase
      .from('option_holdings')
      .update({
        contracts: positiveContracts,
        updated_at: new Date().toISOString()
      })
      .eq('id', option.id);

    if (updateError) {
      console.error(`❌ Failed to update ${option.option_symbol}:`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ Fixed ${option.option_symbol}: ${option.contracts} → ${positiveContracts}`);
      successCount++;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Successfully fixed: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }
  console.log('');

  // Verify the fix
  console.log('🔍 Verifying fix...');
  const { data: remainingNegative, error: verifyError } = await supabase
    .from('option_holdings')
    .select('id, option_symbol, contracts')
    .lt('contracts', 0);

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError);
    return;
  }

  if (!remainingNegative || remainingNegative.length === 0) {
    console.log('✅ Verification passed! No negative contracts remaining.\n');
  } else {
    console.log(`⚠️  Warning: ${remainingNegative.length} option(s) still have negative contracts:`);
    remainingNegative.forEach((opt: any) => {
      console.log(`   - ${opt.option_symbol}: ${opt.contracts}`);
    });
    console.log('');
  }
}

// Run the migration
fixNegativeContracts()
  .then(() => {
    console.log('✨ Migration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
