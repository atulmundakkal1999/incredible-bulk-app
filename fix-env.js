#!/usr/bin/env node

/**
 * Quick fix script to add SHOPIFY_APP_URL to .env if missing
 * Run: node fix-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('\n🔧 Fixing .env file...\n');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Run: node setup.js');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

// Check if SHOPIFY_APP_URL exists and is valid
const appUrlLine = lines.find(line => line.trim().startsWith('SHOPIFY_APP_URL='));
const hasValidUrl = appUrlLine && 
                    !appUrlLine.includes('your-') && 
                    !appUrlLine.includes('example.com') &&
                    appUrlLine.split('=')[1]?.trim().length > 0;

if (hasValidUrl) {
  console.log('✅ SHOPIFY_APP_URL already set in .env');
  console.log(`   Current value: ${appUrlLine.split('=')[1]?.trim()}`);
  console.log('\n✅ No changes needed!');
  process.exit(0);
}

// Add or fix SHOPIFY_APP_URL
if (appUrlLine) {
  // Replace existing line
  const newContent = envContent.replace(
    /SHOPIFY_APP_URL=.*/,
    'SHOPIFY_APP_URL=http://localhost:3000'
  );
  fs.writeFileSync(envPath, newContent);
  console.log('✅ Updated SHOPIFY_APP_URL in .env');
} else {
  // Add new line after SCOPES
  const scopesIndex = lines.findIndex(line => line.trim().startsWith('SCOPES='));
  if (scopesIndex !== -1) {
    lines.splice(scopesIndex + 1, 0, 'SHOPIFY_APP_URL=http://localhost:3000');
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('✅ Added SHOPIFY_APP_URL to .env');
  } else {
    // Add at the end of Shopify section
    const newContent = envContent.replace(
      /(# Shopify Configuration[\s\S]*?)(# Google|# Microsoft|# Redis|$)/,
      '$1SHOPIFY_APP_URL=http://localhost:3000\n\n$2'
    );
    fs.writeFileSync(envPath, newContent);
    console.log('✅ Added SHOPIFY_APP_URL to .env');
  }
}

console.log('   Value: http://localhost:3000');
console.log('\n📝 Note: When you run "npm run dev", Shopify CLI will provide');
console.log('   a tunnel URL. The CLI will automatically update your Partner');
console.log('   Dashboard with the correct URLs.');

console.log('\n✅ .env file fixed!');
console.log('\n🚀 Next steps:');
console.log('   1. Run: node test-shopify-config.js');
console.log('   2. Run: npm run dev');
console.log('   3. Press P to open app in test store\n');
