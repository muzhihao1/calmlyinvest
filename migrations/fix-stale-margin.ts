/**
 * One-time migration to fix stale margin_used values
 *
 * Problem: Portfolios with zero holdings still show non-zero margin_used
 * from before the automatic reset fix was deployed.
 *
 * Solution: Reset margin_used to $0 for all portfolios with no holdings.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStaleMargin() {
  console.log('🔍 Finding portfolios with stale margin_used values...\n');

  // Step 1: Get all portfolios
  const { data: portfolios, error: portfoliosError } = await supabase
    .from('portfolios')
    .select('id, user_id, margin_used');

  if (portfoliosError) {
    console.error('Error fetching portfolios:', portfoliosError);
    process.exit(1);
  }

  console.log(`📊 Found ${portfolios.length} total portfolios\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  // Step 2: Check each portfolio for holdings
  for (const portfolio of portfolios) {
    const marginUsed = parseFloat(portfolio.margin_used || '0');

    // Skip if margin is already zero
    if (marginUsed === 0) {
      skippedCount++;
      continue;
    }

    // Check for stock holdings
    const { data: stocks, error: stockError } = await supabase
      .from('stock_holdings')
      .select('id')
      .eq('portfolio_id', portfolio.id)
      .limit(1);

    // Check for option holdings
    const { data: options, error: optionError } = await supabase
      .from('option_holdings')
      .select('id')
      .eq('portfolio_id', portfolio.id)
      .limit(1);

    const hasStocks = !stockError && stocks && stocks.length > 0;
    const hasOptions = !optionError && options && options.length > 0;

    // If no holdings but has margin, fix it
    if (!hasStocks && !hasOptions && marginUsed > 0) {
      console.log(`\n🔧 Fixing portfolio ${portfolio.id}:`);
      console.log(`   User ID: ${portfolio.user_id}`);
      console.log(`   Current margin_used: $${marginUsed.toFixed(2)}`);
      console.log(`   Holdings: 0 stocks, 0 options`);

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({ margin_used: '0.00' })
        .eq('id', portfolio.id);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`   ✅ Reset margin_used to $0.00`);
        fixedCount++;
      }
    } else {
      // Has holdings or margin is already zero
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 Migration Summary:');
  console.log(`   Total portfolios: ${portfolios.length}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log('='.repeat(60));

  if (fixedCount > 0) {
    console.log('\n✨ Successfully fixed stale margin_used values!');
  } else {
    console.log('\n✅ No portfolios needed fixing.');
  }
}

// Run the migration
fixStaleMargin()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
