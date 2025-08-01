const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = { username: 'demo', password: 'demo123' };

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let authToken = null;
let testPortfolioId = null;
let testStockId = null;

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const body = await response.text();
    
    let jsonBody;
    try {
      jsonBody = JSON.parse(body);
    } catch {
      jsonBody = body;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      body: jsonBody
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test function
async function test(name, fn) {
  try {
    await fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

// Assert helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Main test suite
async function runTests() {
  console.log(`\nTesting endpoints at: ${BASE_URL}`);
  console.log('=====================================\n');
  
  // 1. Health Check
  console.log('1. Health & Debug Endpoints');
  console.log('---------------------------');
  
  await test('GET /api/health', async () => {
    const res = await apiRequest('GET', '/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'ok', 'Health check should return ok status');
  });
  
  await test('GET /api/debug/env', async () => {
    const res = await apiRequest('GET', '/api/debug/env');
    // May return 403 in production
    assert(res.status === 200 || res.status === 403, `Expected 200 or 403, got ${res.status}`);
  });
  
  // 2. Guest Mode Tests
  console.log('\n2. Guest Mode Tests');
  console.log('-------------------');
  
  await test('GET /api/portfolios/guest-user (guest mode)', async () => {
    const res = await apiRequest('GET', '/api/portfolios/guest-user', null, {
      'X-Guest-User': 'true'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body), 'Should return array of portfolios');
  });
  
  await test('GET /api/portfolio/demo-portfolio-1 (guest mode)', async () => {
    const res = await apiRequest('GET', '/api/portfolio/demo-portfolio-1', null, {
      'X-Guest-User': 'true'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.id === 'demo-portfolio-1', 'Should return demo portfolio');
  });
  
  // 3. Authentication Tests
  console.log('\n3. Authentication Tests');
  console.log('-----------------------');
  
  await test('POST /api/auth/login', async () => {
    const res = await apiRequest('POST', '/api/auth/login', TEST_USER);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.user, 'Should return user object');
    assert(res.body.token, 'Should return auth token');
    authToken = res.body.token;
  });
  
  await test('Unauthorized access without token', async () => {
    const res = await apiRequest('GET', '/api/portfolios/123');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });
  
  // 4. Portfolio CRUD (with auth)
  console.log('\n4. Portfolio CRUD Operations');
  console.log('----------------------------');
  
  if (authToken) {
    const authHeaders = { 'Authorization': `Bearer ${authToken}` };
    
    await test('POST /api/portfolios', async () => {
      const res = await apiRequest('POST', '/api/portfolios', {
        name: 'Test Portfolio',
        totalEquity: '100000',
        cashBalance: '50000',
        marginUsed: '0'
      }, authHeaders);
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body.id, 'Should return portfolio with ID');
      testPortfolioId = res.body.id;
    });
    
    if (testPortfolioId) {
      await test('GET /api/portfolio/:id', async () => {
        const res = await apiRequest('GET', `/api/portfolio/${testPortfolioId}`, null, authHeaders);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.name === 'Test Portfolio', 'Should return created portfolio');
      });
      
      await test('PUT /api/portfolio/:id', async () => {
        const res = await apiRequest('PUT', `/api/portfolio/${testPortfolioId}`, {
          totalEquity: '150000'
        }, authHeaders);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
      });
      
      // 5. Stock Holdings
      console.log('\n5. Stock Holdings Operations');
      console.log('----------------------------');
      
      await test('POST /api/portfolio/:id/stocks', async () => {
        const res = await apiRequest('POST', `/api/portfolio/${testPortfolioId}/stocks`, {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100,
          costPrice: '150.00',
          currentPrice: '160.00'
        }, authHeaders);
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        if (res.body.id) testStockId = res.body.id;
      });
      
      await test('GET /api/portfolio/:id/stocks', async () => {
        const res = await apiRequest('GET', `/api/portfolio/${testPortfolioId}/stocks`, null, authHeaders);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'Should return array of stocks');
      });
      
      // 6. Risk Calculations
      console.log('\n6. Risk Calculations');
      console.log('--------------------');
      
      await test('GET /api/portfolio/:id/risk', async () => {
        const res = await apiRequest('GET', `/api/portfolio/${testPortfolioId}/risk`, null, authHeaders);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.leverageRatio, 'Should return risk metrics');
      });
      
      await test('GET /api/portfolio/:id/suggestions', async () => {
        const res = await apiRequest('GET', `/api/portfolio/${testPortfolioId}/suggestions`, null, authHeaders);
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'Should return array of suggestions');
      });
      
      // Cleanup
      console.log('\n7. Cleanup');
      console.log('----------');
      
      if (testStockId) {
        await test('DELETE /api/stocks/:id', async () => {
          const res = await apiRequest('DELETE', `/api/stocks/${testStockId}`, null, authHeaders);
          assert(res.status === 204, `Expected 204, got ${res.status}`);
        });
      }
      
      await test('DELETE /api/portfolio/:id', async () => {
        const res = await apiRequest('DELETE', `/api/portfolio/${testPortfolioId}`, null, authHeaders);
        assert(res.status === 204, `Expected 204, got ${res.status}`);
      });
    }
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} Skipping authenticated tests - login failed`);
  }
  
  console.log('\n=====================================');
  console.log('Test run completed');
  console.log('=====================================\n');
}

// Run tests
runTests().catch(console.error);