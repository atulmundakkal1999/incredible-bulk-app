# AI IncredibleBulk - Setup Guide

## Quick Start

1. **Run the setup script:**
   ```bash
   node setup.js
   ```

2. **Install Ollama:**
   - Download from [ollama.ai](https://ollama.ai/)
   - Run: `ollama run llama2`

3. **Get API Keys:**
   - Follow the sections below to get all required API keys

4. **Update .env file:**
   - Replace placeholder values with your actual API keys

5. **Start the app:**
   ```bash
   npm run dev
   ```

## Required API Keys

### 1. Shopify API Keys
1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Create a new app
3. Copy the API Key and API Secret Key
4. Add them to your `.env` file

### 2. Google Sheets API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API and Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 3. Microsoft Graph API Keys
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add API permissions for Microsoft Graph (Files.ReadWrite, Sites.ReadWrite.All)
4. Create a client secret
5. Add redirect URI: `http://localhost:3000/auth/microsoft/callback`
6. Copy Application (client) ID and client secret to `.env`

### 4. Upstash Redis Keys
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new database
3. Copy the REST URL and REST Token
4. Add them to your `.env` file

## Environment Variables

Your `.env` file should contain:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SCOPES=write_products,read_products,write_orders,read_orders

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
NODE_ENV=development
```

## Development Commands

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma db push

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Shopify
npm run deploy
```

## Testing the App

1. Start the development server: `npm run dev`
2. Press `P` to open the app in your test store
3. Install the app in your test store
4. Try the chat interface with commands like:
   - "Sort my inventory by price descending"
   - "Filter products with stock less than 10"
   - "Add a formula to calculate total revenue"

## Troubleshooting

### Common Issues

1. **Ollama not running:**
   - Make sure Ollama is installed and running
   - Check if `ollama run llama2` completed successfully
   - Verify OLLAMA_BASE_URL in .env

2. **Database errors:**
   - Run `npx prisma db push` to sync schema
   - Check if DATABASE_URL is correct

3. **API key errors:**
   - Verify all API keys are correct in .env
   - Check if redirect URIs match exactly
   - Ensure APIs are enabled in respective consoles

4. **Redis connection issues:**
   - Verify REDIS_URL and REDIS_TOKEN are correct
   - Check if Upstash database is active

### Getting Help

- Check the main README.md for detailed documentation
- Review the PRD.md for technical requirements
- Open an issue on GitHub for bugs or questions

## Production Deployment

1. **Deploy to Vercel:**
   - Push code to GitHub
   - Import repository in Vercel
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add environment variables

2. **Deploy to Shopify:**
   - Run `npm run deploy`
   - Follow Shopify's deployment guide

3. **Update database for production:**
   - Change DATABASE_URL to MongoDB Atlas
   - Update Prisma schema for MongoDB
   - Run `npx prisma db push`
