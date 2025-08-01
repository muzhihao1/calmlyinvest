#!/usr/bin/env node

/**
 * Alternative fix: Update vercel.json to use rewrites for API routes
 * This approach doesn't require copying files
 */

const fs = require('fs');
const path = require('path');

const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');

const newConfig = {
  "framework": null,
  "installCommand": "cd calmlyinvest && npm install",
  "buildCommand": "cd calmlyinvest && npm run build",
  "devCommand": "cd calmlyinvest && npm run dev",
  "outputDirectory": "calmlyinvest/dist/public",
  "functions": {
    "calmlyinvest/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/calmlyinvest/api/:path*"
    }
  ]
};

console.log('=== Alternative Vercel Configuration Fix ===\n');
console.log('This approach uses rewrites instead of copying files.\n');

try {
  // Backup current config
  const currentConfig = fs.readFileSync(vercelConfigPath, 'utf8');
  fs.writeFileSync(vercelConfigPath + '.backup', currentConfig);
  console.log('✓ Created backup: vercel.json.backup');

  // Write new config
  fs.writeFileSync(vercelConfigPath, JSON.stringify(newConfig, null, 2));
  console.log('✓ Updated vercel.json with rewrites configuration');

  console.log('\nNew configuration:');
  console.log(JSON.stringify(newConfig, null, 2));

  console.log('\n✓ Configuration updated successfully!');
  console.log('\nThis approach:');
  console.log('- Points functions to calmlyinvest/api/');
  console.log('- Uses rewrites to map /api/* to /calmlyinvest/api/*');
  console.log('- No file copying required');
  console.log('\nTo deploy: git add, commit, and push');
} catch (error) {
  console.error('✗ Error updating configuration:', error.message);
  process.exit(1);
}