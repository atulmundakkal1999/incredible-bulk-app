#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up AI IncredibleBulk...\n');

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    // Create basic .env file
    const envContent = `# Shopify Configuration
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SCOPES=write_products,read_products,write_orders,read_orders
SHOPIFY_APP_URL=http://localhost:3000
# Optional: restrict to a single shop domain (e.g., example.myshopify.com)
SHOP_CUSTOM_DOMAIN=

# Google Sheets API Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Microsoft Graph API Configuration
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
MS_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback

# Redis Configuration (Upstash)
REDIS_URL=your-upstash-redis-url
REDIS_TOKEN=your-upstash-redis-token

# AI Configuration (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Database Configuration
DATABASE_URL=file:./dev.db

# Environment
NODE_ENV=development`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default values');
  }
} else {
  console.log('ℹ️  .env file already exists');
}

// Create .env.example file
const envExampleContent = `# Shopify Configuration
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SCOPES=write_products,read_products,write_orders,read_orders
SHOPIFY_APP_URL=http://localhost:3000
# Optional: restrict to a single shop domain (e.g., example.myshopify.com)
SHOP_CUSTOM_DOMAIN=

# Google Sheets API Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Microsoft Graph API Configuration
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
MS_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback

# Redis Configuration (Upstash)
REDIS_URL=your-upstash-redis-url
REDIS_TOKEN=your-upstash-redis-token

# AI Configuration (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Database Configuration
DATABASE_URL=file:./dev.db

# Environment
NODE_ENV=development`;

fs.writeFileSync(envExamplePath, envExampleContent);
console.log('✅ Created .env.example file');

console.log('\n📋 Next Steps:');
console.log('1. Install Ollama: https://ollama.ai/');
console.log('2. Run: ollama run llama2');
console.log('3. Get API keys from:');
console.log('   - Shopify Partner Dashboard');
console.log('   - Google Cloud Console');
console.log('   - Microsoft Azure Portal');
console.log('   - Upstash Redis');
console.log('4. Update your .env file with the actual API keys');
console.log('5. Run: npm run dev');

console.log('\n🎉 Setup complete!');
