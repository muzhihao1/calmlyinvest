/**
 * API endpoint for rolling over option positions
 *
 * This endpoint handles the rollover of an option position by:
 * 1. Creating a new option position with the rolled parameters
 * 2. Marking the old option position as 'ROLLED'
 * 3. Recording the rollover transaction with realized P&L
 *
 * The realized P&L from the old position is locked in, while the new position
 * starts fresh unrealized P&L tracking from its opening price.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RolloverRequest {
  portfolioId: string;

  // Old position details
  oldOptionId: string;
  closePrice: number; // Price at which old position was closed
  closeContracts: number; // Number of contracts closed (can be partial)

  // New position details
  newOptionSymbol: string;
  newStrikePrice: number;
  newExpirationDate: string; // ISO date format
  openPrice: number; // Price at which new position was opened
  openContracts: number;

  // Optional metadata
  fees?: number; // Total transaction fees
  notes?: string;
  rolloverDate?: string; // ISO timestamp, defaults to now
}

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rolloverData: RolloverRequest = req.body;

    console.log('📊 Processing option rollover:', {
      portfolioId: rolloverData.portfolioId,
      oldOptionId: rolloverData.oldOptionId,
      closePrice: rolloverData.closePrice,
      openPrice: rolloverData.openPrice,
    });

    // 1. Fetch the old option position details
    const { data: oldOption, error: fetchError } = await supabase
      .from('option_holdings')
      .select('*')
      .eq('id', rolloverData.oldOptionId)
      .single();

    if (fetchError || !oldOption) {
      console.error('❌ Failed to fetch old option:', fetchError);
      return res.status(404).json({ error: 'Old option position not found' });
    }

    // Verify the option belongs to the specified portfolio
    if (oldOption.portfolio_id !== rolloverData.portfolioId) {
      console.error('❌ Portfolio ID mismatch');
      return res.status(403).json({ error: 'Option does not belong to this portfolio' });
    }

    // Verify the option is not already closed or rolled
    if (oldOption.status !== 'ACTIVE') {
      console.error('❌ Option is not active:', oldOption.status);
      return res.status(400).json({ error: `Cannot rollover ${oldOption.status} option` });
    }

    // 2. Calculate realized P&L from closing the old position
    // For SELL options: P&L = (cost_price - close_price) × contracts × 100
    // For BUY options: P&L = (close_price - cost_price) × contracts × 100
    const costPrice = parseFloat(oldOption.cost_price);
    const closePrice = rolloverData.closePrice;
    const contracts = rolloverData.closeContracts;

    let realizedPnl: number;
    if (oldOption.direction === 'SELL') {
      // Short option: profit when closing at lower price
      realizedPnl = (costPrice - closePrice) * contracts * 100;
    } else {
      // Long option: profit when closing at higher price
      realizedPnl = (closePrice - costPrice) * contracts * 100;
    }

    // Subtract fees from realized P&L
    if (rolloverData.fees) {
      realizedPnl -= rolloverData.fees;
    }

    console.log('💰 Calculated realized P&L:', {
      direction: oldOption.direction,
      costPrice,
      closePrice,
      contracts,
      realizedPnl: realizedPnl.toFixed(2),
      fees: rolloverData.fees || 0,
    });

    // 3. Create the new option position
    const newOption = {
      portfolio_id: rolloverData.portfolioId,
      option_symbol: rolloverData.newOptionSymbol,
      underlying_symbol: oldOption.underlying_symbol, // Same underlying
      option_type: oldOption.option_type, // Same type (PUT/CALL)
      direction: oldOption.direction, // Same direction (BUY/SELL)
      contracts: rolloverData.openContracts,
      strike_price: rolloverData.newStrikePrice,
      expiration_date: rolloverData.newExpirationDate,
      cost_price: rolloverData.openPrice, // New cost basis
      current_price: rolloverData.openPrice, // Initially same as cost
      status: 'ACTIVE',
    };

    const { data: createdOption, error: createError } = await supabase
      .from('option_holdings')
      .insert(newOption)
      .select()
      .single();

    if (createError || !createdOption) {
      console.error('❌ Failed to create new option position:', createError);
      return res.status(500).json({ error: 'Failed to create new option position' });
    }

    console.log('✅ Created new option position:', createdOption.id);

    // 4. Update old option status to 'ROLLED' and set closed_at timestamp
    const { error: updateError } = await supabase
      .from('option_holdings')
      .update({
        status: 'ROLLED',
        closed_at: rolloverData.rolloverDate || new Date().toISOString(),
      })
      .eq('id', rolloverData.oldOptionId);

    if (updateError) {
      console.error('❌ Failed to update old option status:', updateError);
      // Rollback: delete the created option
      await supabase.from('option_holdings').delete().eq('id', createdOption.id);
      return res.status(500).json({ error: 'Failed to update old option status' });
    }

    console.log('✅ Marked old option as ROLLED');

    // 5. Create rollover transaction record
    const rolloverRecord = {
      portfolio_id: rolloverData.portfolioId,
      old_option_id: rolloverData.oldOptionId,
      old_option_symbol: oldOption.option_symbol,
      old_strike_price: oldOption.strike_price,
      old_expiration_date: oldOption.expiration_date,
      close_price: rolloverData.closePrice,
      close_contracts: rolloverData.closeContracts,
      new_option_id: createdOption.id,
      new_option_symbol: rolloverData.newOptionSymbol,
      new_strike_price: rolloverData.newStrikePrice,
      new_expiration_date: rolloverData.newExpirationDate,
      open_price: rolloverData.openPrice,
      open_contracts: rolloverData.openContracts,
      realized_pnl: realizedPnl,
      fees: rolloverData.fees || null,
      rollover_date: rolloverData.rolloverDate || new Date().toISOString(),
      notes: rolloverData.notes || null,
    };

    const { data: rollover, error: rolloverError } = await supabase
      .from('option_rollovers')
      .insert(rolloverRecord)
      .select()
      .single();

    if (rolloverError || !rollover) {
      console.error('❌ Failed to create rollover record:', rolloverError);
      // Rollback: restore old option and delete new option
      await supabase.from('option_holdings').update({ status: 'ACTIVE', closed_at: null }).eq('id', rolloverData.oldOptionId);
      await supabase.from('option_holdings').delete().eq('id', createdOption.id);
      return res.status(500).json({ error: 'Failed to create rollover record' });
    }

    console.log('✅ Created rollover record:', rollover.id);

    // 6. Return success response with all details
    return res.status(200).json({
      success: true,
      message: 'Option rolled over successfully',
      rollover: {
        id: rollover.id,
        oldOptionId: rolloverData.oldOptionId,
        newOptionId: createdOption.id,
        realizedPnl: realizedPnl.toFixed(2),
        rolloverDate: rollover.rollover_date,
      },
      oldOption: {
        id: oldOption.id,
        symbol: oldOption.option_symbol,
        strike: oldOption.strike_price,
        expiration: oldOption.expiration_date,
        status: 'ROLLED',
      },
      newOption: {
        id: createdOption.id,
        symbol: createdOption.option_symbol,
        strike: createdOption.strike_price,
        expiration: createdOption.expiration_date,
        costPrice: createdOption.cost_price,
        status: 'ACTIVE',
      },
    });

  } catch (error: any) {
    console.error('❌ Rollover error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
