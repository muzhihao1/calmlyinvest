import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const testResults: any = {
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test 1: Basic Zod import
    testResults.canImportZod = true;
    const { z } = await import('zod');
    testResults.zodImported = !!z;
    
    // Test 2: Drizzle ORM import
    try {
      const drizzle = await import('drizzle-orm/pg-core');
      testResults.canImportDrizzle = true;
      testResults.drizzleImported = !!drizzle;
    } catch (err) {
      testResults.canImportDrizzle = false;
      testResults.drizzleError = err instanceof Error ? err.message : 'Drizzle import failed';
    }
    
    // Test 3: Drizzle Zod import
    try {
      const drizzleZod = await import('drizzle-zod');
      testResults.canImportDrizzleZod = true;
      testResults.drizzleZodImported = !!drizzleZod;
    } catch (err) {
      testResults.canImportDrizzleZod = false;
      testResults.drizzleZodError = err instanceof Error ? err.message : 'Drizzle-zod import failed';
    }
    
    // Test 4: Shared schema import
    try {
      const schema = await import('@shared/schema-supabase');
      testResults.canImportSchema = true;
      testResults.schemaImported = !!schema;
      testResults.hasInsertPortfolioSchema = !!schema.insertPortfolioSchema;
    } catch (err) {
      testResults.canImportSchema = false;
      testResults.schemaError = err instanceof Error ? err.message : 'Schema import failed';
    }
    
    res.status(200).json(testResults);
    
  } catch (error) {
    console.error('Schema test error:', error);
    res.status(500).json({ 
      error: 'Schema test failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      testResults
    });  
  }
}