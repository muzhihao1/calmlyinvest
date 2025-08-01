import 'dotenv/config';
import { getDatabaseConnection, closeDatabaseConnection } from '../server/config/database';
import { eq, and } from 'drizzle-orm';
import * as schema from '../shared/schema';

async function updateUserHoldings() {
  const connection = getDatabaseConnection();
  if (!connection) {
    console.error('Database connection not available');
    console.error('Please ensure DATABASE_URL is set in your .env file');
    process.exit(1);
  }

  const { db } = connection;
  const userEmail = '279838958@qq.com';

  try {
    console.log('='.repeat(60));
    console.log('Portfolio Holdings Update Script');
    console.log('='.repeat(60));
    
    // 1. Find user by username (email)
    console.log(`\n1. Finding user: ${userEmail}`);
    const users = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, userEmail))
      .limit(1);

    if (users.length === 0) {
      console.error(`User not found: ${userEmail}`);
      console.log('\nAvailable users:');
      const allUsers = await db.select().from(schema.users);
      allUsers.forEach(u => console.log(`  - ${u.username} (ID: ${u.id})`));
      process.exit(1);
    }

    const user = users[0];
    console.log(`   ✓ Found user: ID=${user.id}, Username=${user.username}`);

    // 2. Get user's portfolio
    console.log(`\n2. Checking user's portfolio...`);
    const portfolios = await db.select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.userId, user.id))
      .limit(1);

    let portfolio: schema.Portfolio;
    
    if (portfolios.length === 0) {
      // Create portfolio if doesn't exist
      console.log('   ! No portfolio found. Creating new portfolio...');
      const newPortfolio = await db.insert(schema.portfolios)
        .values({
          userId: user.id,
          name: 'Main Portfolio',
          totalEquity: '44338.00',
          cashBalance: '14400.00',
          marginUsed: '0.00'
        })
        .returning();
      portfolio = newPortfolio[0];
      console.log(`   ✓ Created portfolio ID=${portfolio.id}`);
    } else {
      portfolio = portfolios[0];
      console.log(`   ✓ Found existing portfolio ID=${portfolio.id}`);
      console.log(`     Current Total Equity: $${portfolio.totalEquity}`);
      console.log(`     Current Cash Balance: $${portfolio.cashBalance}`);
      
      // Update portfolio values
      console.log(`   → Updating portfolio values...`);
      await db.update(schema.portfolios)
        .set({
          totalEquity: '44338.00',
          cashBalance: '14400.00',
          marginUsed: '0.00',
          updatedAt: new Date()
        })
        .where(eq(schema.portfolios.id, portfolio.id));
    }

    // 3. Show current holdings before clearing
    console.log(`\n3. Current holdings summary:`);
    const currentStocks = await db.select()
      .from(schema.stockHoldings)
      .where(eq(schema.stockHoldings.portfolioId, portfolio.id));
    const currentOptions = await db.select()
      .from(schema.optionHoldings)
      .where(eq(schema.optionHoldings.portfolioId, portfolio.id));
    
    console.log(`   Stock holdings: ${currentStocks.length} positions`);
    if (currentStocks.length > 0) {
      currentStocks.forEach(s => console.log(`     - ${s.symbol}: ${s.quantity} shares`));
    }
    
    console.log(`   Option holdings: ${currentOptions.length} positions`);
    if (currentOptions.length > 0) {
      currentOptions.forEach(o => console.log(`     - ${o.underlyingSymbol} ${o.optionType} ${o.strikePrice}: ${o.contracts} contracts`));
    }
    
    // Clear existing holdings
    console.log(`\n4. Clearing existing holdings...`);
    const deletedStocks = await db.delete(schema.stockHoldings)
      .where(eq(schema.stockHoldings.portfolioId, portfolio.id))
      .returning();
    console.log(`   ✓ Deleted ${deletedStocks.length} stock holdings`);

    const deletedOptions = await db.delete(schema.optionHoldings)
      .where(eq(schema.optionHoldings.portfolioId, portfolio.id))
      .returning();
    console.log(`   ✓ Deleted ${deletedOptions.length} option holdings`);

    // 5. Add new stock holdings
    const stockData = [
      { symbol: 'AMZN', name: 'Amazon.com Inc.', quantity: 30, costPrice: '225.00' },
      { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.', quantity: 10, costPrice: '380.00' },
      { symbol: 'PLTR', name: 'Palantir Technologies Inc.', quantity: 38, costPrice: '85.00' },
      { symbol: 'SHOP', name: 'Shopify Inc.', quantity: 32, costPrice: '115.00' },
      { symbol: 'TSLA', name: 'Tesla Inc.', quantity: 40, costPrice: '410.00' }
    ];

    console.log('\n5. Adding new stock holdings...');
    for (const stock of stockData) {
      const result = await db.insert(schema.stockHoldings)
        .values({
          portfolioId: portfolio.id,
          symbol: stock.symbol,
          name: stock.name,
          quantity: stock.quantity,
          costPrice: stock.costPrice,
          currentPrice: stock.costPrice, // Will be updated by market data service
          beta: '1.0' // Default, will be updated
        })
        .returning();
      console.log(`   ✓ Added ${stock.symbol}: ${stock.quantity} shares @ $${stock.costPrice}`);
    }

    // 6. Add option holdings
    const optionData = [
      {
        optionSymbol: 'MSFT250221P00450000',
        underlyingSymbol: 'MSFT',
        optionType: 'PUT' as const,
        direction: 'BUY' as const,
        contracts: 1,
        strikePrice: '450.00',
        expirationDate: '2025-02-21',
        costPrice: '15.00'
      },
      {
        optionSymbol: 'NVDA250221P00125000',
        underlyingSymbol: 'NVDA',
        optionType: 'PUT' as const,
        direction: 'BUY' as const,
        contracts: 1,
        strikePrice: '125.00',
        expirationDate: '2025-02-21',
        costPrice: '10.00'
      },
      {
        optionSymbol: 'NVDA250221P00130000',
        underlyingSymbol: 'NVDA',
        optionType: 'PUT' as const,
        direction: 'BUY' as const,
        contracts: 1,
        strikePrice: '130.00',
        expirationDate: '2025-02-21',
        costPrice: '12.00'
      },
      {
        optionSymbol: 'QQQ250221P00490000',
        underlyingSymbol: 'QQQ',
        optionType: 'PUT' as const,
        direction: 'BUY' as const,
        contracts: 1,
        strikePrice: '490.00',
        expirationDate: '2025-02-21',
        costPrice: '8.00'
      }
    ];

    console.log('\n6. Adding option holdings...');
    for (const option of optionData) {
      const result = await db.insert(schema.optionHoldings)
        .values({
          portfolioId: portfolio.id,
          ...option,
          currentPrice: option.costPrice, // Will be updated by market data service
          deltaValue: '-0.30' // Default, will be updated
        })
        .returning();
      console.log(`   ✓ Added ${option.underlyingSymbol} ${option.optionType} $${option.strikePrice} exp ${option.expirationDate}`);
    }

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('UPDATE COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\nPortfolio Summary:`);
    console.log(`  User: ${user.username}`);
    console.log(`  Portfolio ID: ${portfolio.id}`);
    console.log(`  Total Equity: $44,338.00`);
    console.log(`  Cash Balance: $14,400.00`);
    console.log(`  Stock Positions: ${stockData.length}`);
    console.log(`  Option Positions: ${optionData.length}`);

  } catch (error) {
    console.error('Error updating holdings:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run the update
updateUserHoldings();