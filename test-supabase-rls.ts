#!/usr/bin/env npx tsx

/**
 * Supabase RLS 测试和诊断脚本
 * 用于检查和修复 Row Level Security 配置问题
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.supabase') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create two clients: one with anon key (for user operations) and one with service role (for admin operations)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(test: string, status: TestResult['status'], message: string, details?: any) {
  results.push({ test, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${test}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function testDatabaseConnection() {
  console.log('\n📡 Testing Database Connection...\n');
  
  try {
    const { data, error } = await supabaseAnon.from('portfolios').select('count').single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      addResult('Database Connection', 'FAIL', 'Cannot connect to database', error);
      return false;
    }
    addResult('Database Connection', 'PASS', 'Successfully connected to database');
    return true;
  } catch (error) {
    addResult('Database Connection', 'FAIL', 'Connection failed', error);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...\n');
  
  // Test with demo account
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: 'demo@example.com',
    password: 'demo123'
  });
  
  if (authError) {
    addResult('Demo Authentication', 'FAIL', 'Cannot authenticate demo user', authError);
    return null;
  }
  
  addResult('Demo Authentication', 'PASS', 'Successfully authenticated as demo user', {
    userId: authData.user?.id,
    email: authData.user?.email
  });
  
  return authData.user;
}

async function testRLSPolicies(userId: string) {
  console.log('\n🛡️ Testing RLS Policies...\n');
  
  // Test 1: Can user see their own portfolios?
  const { data: portfolios, error: portfolioError } = await supabaseAnon
    .from('portfolios')
    .select('*')
    .eq('user_id', userId);
    
  if (portfolioError) {
    addResult('RLS: View Own Portfolios', 'FAIL', 'Cannot view own portfolios', portfolioError);
  } else {
    addResult('RLS: View Own Portfolios', 'PASS', `Found ${portfolios?.length || 0} portfolios`);
  }
  
  // Test 2: Can user create a portfolio?
  const testPortfolioName = `Test Portfolio ${Date.now()}`;
  const { data: newPortfolio, error: createError } = await supabaseAnon
    .from('portfolios')
    .insert({
      name: testPortfolioName,
      total_equity: '100000.00',
      cash_balance: '100000.00',
      margin_used: '0.00'
    })
    .select()
    .single();
    
  if (createError) {
    addResult('RLS: Create Portfolio', 'FAIL', 'Cannot create portfolio', createError);
  } else {
    addResult('RLS: Create Portfolio', 'PASS', 'Successfully created portfolio', {
      id: newPortfolio?.id,
      name: newPortfolio?.name
    });
    
    // Test 3: Can user update their portfolio?
    const { error: updateError } = await supabaseAnon
      .from('portfolios')
      .update({ total_equity: '150000.00' })
      .eq('id', newPortfolio.id);
      
    if (updateError) {
      addResult('RLS: Update Portfolio', 'FAIL', 'Cannot update portfolio', updateError);
    } else {
      addResult('RLS: Update Portfolio', 'PASS', 'Successfully updated portfolio');
    }
    
    // Test 4: Can user delete their portfolio?
    const { error: deleteError } = await supabaseAnon
      .from('portfolios')
      .delete()
      .eq('id', newPortfolio.id);
      
    if (deleteError) {
      addResult('RLS: Delete Portfolio', 'FAIL', 'Cannot delete portfolio', deleteError);
    } else {
      addResult('RLS: Delete Portfolio', 'PASS', 'Successfully deleted portfolio');
    }
  }
}

async function testCascadingOperations(userId: string) {
  console.log('\n🔗 Testing Cascading Operations...\n');
  
  // Create a portfolio for testing
  const { data: portfolio, error: portfolioError } = await supabaseAnon
    .from('portfolios')
    .insert({
      name: 'Cascade Test Portfolio',
      total_equity: '50000.00',
      cash_balance: '50000.00',
      margin_used: '0.00'
    })
    .select()
    .single();
    
  if (portfolioError || !portfolio) {
    addResult('Cascade: Create Test Portfolio', 'FAIL', 'Cannot create test portfolio', portfolioError);
    return;
  }
  
  addResult('Cascade: Create Test Portfolio', 'PASS', 'Created test portfolio', { id: portfolio.id });
  
  // Test creating stock holding
  const { data: stockHolding, error: stockError } = await supabaseAnon
    .from('stock_holdings')
    .insert({
      portfolio_id: portfolio.id,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 100,
      cost_price: '150.00'
    })
    .select()
    .single();
    
  if (stockError) {
    addResult('Cascade: Create Stock Holding', 'FAIL', 'Cannot create stock holding', stockError);
  } else {
    addResult('Cascade: Create Stock Holding', 'PASS', 'Successfully created stock holding');
  }
  
  // Clean up
  await supabaseAnon.from('portfolios').delete().eq('id', portfolio.id);
}

async function checkDatabaseSchema() {
  console.log('\n🔍 Checking Database Schema...\n');
  
  if (!supabaseAdmin) {
    addResult('Schema Check', 'SKIP', 'Service role key not provided - skipping admin checks');
    return;
  }
  
  // Check table structures
  const { data: columns, error: columnsError } = await supabaseAdmin
    .rpc('get_table_columns', {
      schema_name: 'public',
      table_name: 'portfolios'
    });
    
  if (columnsError) {
    // Try a different approach
    const { data: portfolioSample, error: sampleError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .limit(1);
      
    if (!sampleError && portfolioSample) {
      const sampleKeys = portfolioSample.length > 0 ? Object.keys(portfolioSample[0]) : [];
      addResult('Schema Check', 'PASS', 'Portfolio table exists with columns', sampleKeys);
    } else {
      addResult('Schema Check', 'FAIL', 'Cannot check schema', sampleError);
    }
  }
}

async function suggestFixes() {
  console.log('\n💡 Suggested Fixes...\n');
  
  const failedTests = results.filter(r => r.status === 'FAIL');
  
  if (failedTests.length === 0) {
    console.log('✨ All tests passed! Your Supabase configuration is working correctly.');
    return;
  }
  
  console.log('Based on the test results, here are the recommended fixes:\n');
  
  for (const test of failedTests) {
    console.log(`❌ ${test.test}`);
    
    switch (test.test) {
      case 'Database Connection':
        console.log('   → Check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
        console.log('   → Ensure your Supabase project is running');
        break;
        
      case 'Demo Authentication':
        console.log('   → Run the following SQL in Supabase to create demo user:');
        console.log(`
-- Create demo user (run in Supabase SQL Editor)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'demo@example.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;
        `);
        break;
        
      case 'RLS: View Own Portfolios':
      case 'RLS: Create Portfolio':
      case 'RLS: Update Portfolio':
      case 'RLS: Delete Portfolio':
        console.log('   → Run migrations/003_fix_uuid_mismatch.sql in Supabase SQL Editor');
        console.log('   → Check that RLS is enabled for the portfolios table');
        console.log('   → Verify auth.uid() returns the correct user ID');
        break;
        
      case 'Cascade: Create Stock Holding':
        console.log('   → Check foreign key constraints on stock_holdings table');
        console.log('   → Verify RLS policies for stock_holdings table');
        break;
    }
    console.log('');
  }
}

async function main() {
  console.log('🧪 Supabase RLS Testing Script');
  console.log('================================\n');
  
  // Run tests
  const canConnect = await testDatabaseConnection();
  if (!canConnect) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  const user = await testAuthentication();
  if (user) {
    await testRLSPolicies(user.id);
    await testCascadingOperations(user.id);
  }
  
  await checkDatabaseSchema();
  
  // Summary
  console.log('\n📊 Test Summary\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  
  await suggestFixes();
  
  // Sign out
  await supabaseAnon.auth.signOut();
}

// Run the tests
main().catch(console.error);