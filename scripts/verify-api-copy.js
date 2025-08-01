#!/usr/bin/env node

/**
 * Verify that API files are correctly copied and accessible
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== API Copy Verification Script ===\n');

// Step 1: Run the copy script
console.log('Step 1: Running copy script...');
try {
  execSync('node scripts/copy-api-files.js', { stdio: 'inherit' });
  console.log('✓ Copy script executed successfully\n');
} catch (error) {
  console.error('✗ Copy script failed:', error.message);
  process.exit(1);
}

// Step 2: Verify key API files exist
console.log('Step 2: Verifying API files...');
const requiredFiles = [
  'api/user-portfolios-simple.ts',
  'api/portfolio-stocks-simple.ts',
  'api/portfolio-risk-simple.ts',
  'api/auth/login.ts',
  'api/auth/register.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - NOT FOUND`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n✗ Some required files are missing!');
  process.exit(1);
}

console.log('\n✓ All required API files are present');

// Step 3: Check file structure
console.log('\nStep 3: Checking directory structure...');
const apiDir = path.join(__dirname, '..', 'api');
function listDir(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      console.log(`${prefix}📁 ${item}/`);
      listDir(itemPath, prefix + '  ');
    } else if (item.endsWith('.ts')) {
      console.log(`${prefix}📄 ${item}`);
    }
  });
}

console.log('API directory structure:');
listDir(apiDir);

console.log('\n=== Verification Complete ===');
console.log('✓ API files are ready for Vercel deployment');
console.log('\nNext steps:');
console.log('1. Commit these changes');
console.log('2. Push to your repository');
console.log('3. Vercel will automatically redeploy');
console.log('4. API endpoints should be accessible at /api/*');