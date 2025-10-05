#!/usr/bin/env node

/**
 * Test script to verify Shopify configuration
 * Run: node test-shopify-config.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('\n🔍 Shopify Configuration Test\n');
console.log('='.repeat(50));

// Required environment variables
const requiredVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'SCOPES',
  'SHOPIFY_APP_URL',
  'DATABASE_URL'
];

let allValid = true;

// Check each required variable
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = value && value.trim() !== '' && !value.includes('your-');
  
  if (isSet) {
    console.log(`✅ ${varName}: Set`);
    
    // Additional validation for specific vars
    if (varName === 'SHOPIFY_APP_URL') {
      try {
        new URL(value);
        console.log(`   └─ Valid URL format`);
      } catch {
        console.log(`   └─ ⚠️  Invalid URL format: ${value}`);
        allValid = false;
      }
    }
    
    if (varName === 'SCOPES') {
      const scopes = value.split(',').map(s => s.trim());
      console.log(`   └─ ${scopes.length} scope(s): ${scopes.join(', ')}`);
    }
  } else {
    console.log(`❌ ${varName}: Missing or placeholder value`);
    allValid = false;
  }
});

console.log('='.repeat(50));

// Check optional variables
console.log('\n📋 Optional Configuration:');
const optionalVars = ['SHOP_CUSTOM_DOMAIN', 'NODE_ENV'];
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`ℹ️  ${varName}: Not set (optional)`);
  }
});

// Check database file
console.log('\n💾 Database Check:');
const dbPath = join(__dirname, 'dev.sqlite');
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log(`✅ Database file exists (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
  console.log(`⚠️  Database file not found. Run: npx prisma db push`);
}

// Check shopify.app.toml
console.log('\n📄 Config File Check:');
const tomlPath = join(__dirname, 'shopify.app.toml');
if (fs.existsSync(tomlPath)) {
  const tomlContent = fs.readFileSync(tomlPath, 'utf-8');
  console.log(`✅ shopify.app.toml exists`);
  
  // Check for placeholder URLs
  if (tomlContent.includes('example.com')) {
    console.log(`   └─ ⚠️  Still contains example.com - may need update`);
  } else {
    console.log(`   └─ ✅ No placeholder URLs found`);
  }
  
  // Extract client_id
  const clientIdMatch = tomlContent.match(/client_id\s*=\s*"([^"]+)"/);
  if (clientIdMatch) {
    console.log(`   └─ Client ID: ${clientIdMatch[1]}`);
  }
} else {
  console.log(`❌ shopify.app.toml not found`);
  allValid = false;
}

// Check Prisma client
console.log('\n🔧 Prisma Client Check:');
const prismaClientPath = join(__dirname, 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientPath)) {
  console.log(`✅ Prisma client generated`);
} else {
  console.log(`⚠️  Prisma client not found. Run: npx prisma generate`);
}

// Final verdict
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ Configuration looks good!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Press P to open app in test store');
  console.log('   3. Install and test the connection');
} else {
  console.log('❌ Configuration incomplete');
  console.log('\n📝 Required actions:');
  console.log('   1. Update .env with your Shopify API credentials');
  console.log('   2. Get keys from: https://partners.shopify.com/');
  console.log('   3. Run this test again: node test-shopify-config.js');
}
console.log('='.repeat(50) + '\n');

process.exit(allValid ? 0 : 1);
