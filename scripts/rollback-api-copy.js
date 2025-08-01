#!/usr/bin/env node

/**
 * Rollback script to remove copied API files from root directory
 * Use this if the API copy approach causes issues
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'api');

console.log('=== API Copy Rollback Script ===\n');

// Check if api directory exists at root
if (!fs.existsSync(apiDir)) {
  console.log('No api directory found at root. Nothing to rollback.');
  process.exit(0);
}

console.log('This will remove the /api directory from the repository root.');
console.log('The original files in /calmlyinvest/api will remain untouched.\n');

// Remove the api directory
try {
  console.log('Removing api directory...');
  fs.rmSync(apiDir, { recursive: true, force: true });
  console.log('✓ Successfully removed /api directory');
  
  console.log('\nRollback complete!');
  console.log('To fully rollback:');
  console.log('1. Revert the vercel.json changes');
  console.log('2. Commit and push the changes');
} catch (error) {
  console.error('✗ Error during rollback:', error.message);
  process.exit(1);
}