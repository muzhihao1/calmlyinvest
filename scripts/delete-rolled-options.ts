/**
 * Script to delete ROLLED option holdings that are hidden from frontend
 * but still affecting margin calculations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteRolledOptions() {
  const portfolioId = '186ecd89-e268-43c4-b3d5-3441a2082cf5';
  const optionIds = [
    'c01d8cb8-99b2-4c1b-b00a-90d6195fcf08', // QQQ251003P600
    '70331027-593f-4a39-ac77-179ae2767ad1'  // NVDA251017P175
  ];

  console.log('🗑️  Deleting ROLLED option holdings...\n');

  for (const optionId of optionIds) {
    console.log(`\nProcessing option: ${optionId}`);

    // First, check if there are any rollover records
    const { data: rollovers, error: rolloverCheckError } = await supabase
      .from('option_rollovers')
      .select('id, old_option_id, new_option_id')
      .or(`old_option_id.eq.${optionId},new_option_id.eq.${optionId}`);

    if (rolloverCheckError) {
      console.error('  ❌ Error checking rollovers:', rolloverCheckError);
      continue;
    }

    if (rollovers && rollovers.length > 0) {
      console.log(`  📋 Found ${rollovers.length} rollover records, deleting...`);

      const { error: rolloverDeleteError } = await supabase
        .from('option_rollovers')
        .delete()
        .or(`old_option_id.eq.${optionId},new_option_id.eq.${optionId}`);

      if (rolloverDeleteError) {
        console.error('  ❌ Error deleting rollovers:', rolloverDeleteError);
        continue;
      }

      console.log('  ✅ Rollovers deleted');
    }

    // Now delete the option holding
    const { data, error } = await supabase
      .from('option_holdings')
      .delete()
      .eq('id', optionId)
      .select();

    if (error) {
      console.error('  ❌ Error deleting option:', error);
    } else if (data && data.length > 0) {
      console.log('  ✅ Option deleted:', data[0].option_symbol);
    } else {
      console.warn('  ⚠️  No option deleted (may not exist)');
    }
  }

  // Check if portfolio margin should be reset
  console.log('\n🔍 Checking remaining holdings...');

  const { data: remainingOptions } = await supabase
    .from('option_holdings')
    .select('id')
    .eq('portfolio_id', portfolioId)
    .limit(1);

  const { data: remainingStocks } = await supabase
    .from('stock_holdings')
    .select('id')
    .eq('portfolio_id', portfolioId)
    .limit(1);

  const hasHoldings = (remainingOptions && remainingOptions.length > 0) ||
                      (remainingStocks && remainingStocks.length > 0);

  if (!hasHoldings) {
    console.log('\n✨ No holdings remain, resetting margin to $0...');

    const { error: updateError } = await supabase
      .from('portfolios')
      .update({ margin_used: '0.00' })
      .eq('id', portfolioId);

    if (updateError) {
      console.error('❌ Error resetting margin:', updateError);
    } else {
      console.log('✅ Margin reset to $0.00');
    }
  } else {
    console.log('\n📊 Holdings still exist, margin not reset');
  }

  console.log('\n✅ Script completed');
}

deleteRolledOptions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
