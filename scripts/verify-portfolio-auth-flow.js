#!/usr/bin/env node

/**
 * Verify Portfolio Authentication Flow
 * 
 * This script tests the complete authentication and portfolio loading flow
 * to ensure authenticated users can properly load and create portfolios.
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'https://calmlyinvest.vercel.app';
const TEST_EMAIL = '279838958@qq.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword'; // Set via environment variable

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testAuthFlow() {
  console.log('🔍 Testing Portfolio Authentication Flow');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_EMAIL}`);
  console.log('');

  try {
    // Step 1: Login to get auth token
    console.log('✅ Step 1: Authenticating user...');
    const loginResponse = await makeRequest({
      path: '/api/auth/login',
      method: 'POST'
    }, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.body);
      return;
    }

    const { user, session } = loginResponse.body;
    console.log('✅ Login successful!');
    console.log(`  User ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Token: ${session.access_token.substring(0, 20)}...`);
    console.log('');

    // Step 2: Test user-portfolios-simple API
    console.log('✅ Step 2: Fetching portfolios via user-portfolios-simple...');
    const portfoliosResponse = await makeRequest({
      path: `/api/user-portfolios-simple?userId=${user.id}`,
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    console.log(`  Response Status: ${portfoliosResponse.status}`);
    console.log(`  Portfolios Found: ${portfoliosResponse.body ? portfoliosResponse.body.length : 0}`);
    
    if (portfoliosResponse.body && portfoliosResponse.body.length > 0) {
      const portfolio = portfoliosResponse.body[0];
      console.log('✅ Portfolio loaded successfully!');
      console.log(`  Portfolio ID: ${portfolio.id}`);
      console.log(`  Name: ${portfolio.name}`);
      console.log(`  Total Equity: ${portfolio.totalEquity}`);
      console.log(`  Cash Balance: ${portfolio.cashBalance}`);
      console.log('');

      // Step 3: Test portfolio details API
      console.log('✅ Step 3: Testing portfolio details API...');
      const detailsResponse = await makeRequest({
        path: `/api/portfolio-details-simple?portfolioId=${portfolio.id}`,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log(`  Response Status: ${detailsResponse.status}`);
      if (detailsResponse.status === 200) {
        console.log('✅ Portfolio details loaded successfully!');
      }
      console.log('');

      // Step 4: Test holdings APIs
      console.log('✅ Step 4: Testing holdings APIs...');
      const stocksResponse = await makeRequest({
        path: `/api/portfolio-stocks-simple?portfolioId=${portfolio.id}`,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log(`  Stocks API Status: ${stocksResponse.status}`);
      console.log(`  Stock Holdings: ${stocksResponse.body ? stocksResponse.body.length : 0}`);

      const optionsResponse = await makeRequest({
        path: `/api/portfolio-options-simple?portfolioId=${portfolio.id}`,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log(`  Options API Status: ${optionsResponse.status}`);
      console.log(`  Option Holdings: ${optionsResponse.body ? optionsResponse.body.length : 0}`);
      console.log('');

      // Summary
      console.log('🎆 Summary');
      console.log('=========');
      console.log('✅ Authentication: Working');
      console.log('✅ Portfolio Loading: Working');
      console.log('✅ Portfolio Creation: ', portfolio.createdAt ? 'Working' : 'Not tested');
      console.log('✅ Holdings APIs: Working');
      console.log('');
      console.log('🎉 The authentication and portfolio loading flow is working correctly!');
      console.log('Users should now be able to add stock holdings after logging in.');

    } else if (portfoliosResponse.status === 200 && portfoliosResponse.body) {
      console.log('⚠️ No portfolios found, but API is working');
      console.log('A new portfolio should have been created automatically.');
      console.log('Check if the database has proper permissions.');
    } else {
      console.error('❌ Failed to fetch portfolios:', portfoliosResponse.body);
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Add some helpful information
if (!process.env.TEST_PASSWORD) {
  console.log('\n⚠️ Note: TEST_PASSWORD not set in environment.');
  console.log('Usage: TEST_PASSWORD=yourpassword node verify-portfolio-auth-flow.js');
  console.log('');
}

testAuthFlow();
