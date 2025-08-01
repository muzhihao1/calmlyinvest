#!/usr/bin/env node

/**
 * Copy API files from calmlyinvest/api to root api directory for Vercel deployment
 * This ensures Vercel can find and deploy the serverless functions correctly
 */

const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceDir = path.join(__dirname, '..', 'calmlyinvest', 'api');
const destDir = path.join(__dirname, '..', 'api');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log('Created api directory at root');
}

/**
 * Recursively copy files from source to destination
 */
function copyFiles(src, dest) {
  // Ensure destination directory exists
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read all items in source directory
  const items = fs.readdirSync(src);

  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      copyFiles(srcPath, destPath);
    } else if (stat.isFile() && item.endsWith('.ts')) {
      // Copy TypeScript files
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${item}`);
    }
  });
}

try {
  console.log('Starting API file copy process...');
  console.log(`Source: ${sourceDir}`);
  console.log(`Destination: ${destDir}`);
  
  // Verify source directory exists
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  // Copy all files
  copyFiles(sourceDir, destDir);
  
  console.log('\nAPI files copied successfully!');
  console.log('Vercel should now be able to find the serverless functions.');
} catch (error) {
  console.error('Error copying API files:', error.message);
  process.exit(1);
}