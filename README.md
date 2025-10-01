AI IncredibleBulk - Shopify App
Overview
AI IncredibleBulk is a Shopify app that automates spreadsheet management using natural language prompts. Users can input commands like "Sort inventory by price descending" via a chat-like UI, and the app leverages AI to interpret these commands, analyze spreadsheets, and execute operations (e.g., sorting, filtering, formula application) without coding. It integrates with Google Sheets and Microsoft Excel Online, designed for scalability, security, and low-latency within Shopify's ecosystem. This project uses the Shopify React Router template, adapted for AI IncredibleBulk's requirements.
Features

Natural Language Interface: Input commands like "Sort inventory by price descending" in a chat UI.
Real-Time Integrations: Connects to Google Sheets and Microsoft Graph APIs for seamless data access/updates.
AI-Driven Automation: Parses prompts and generates safe code (e.g., Python/Apps Script) for spreadsheet operations.
Stateful Sessions: Maintains context across interactions using Upstash Redis.
Shopify Integration: Embeds in Shopify admin via App Bridge; syncs store data (e.g., orders).

Technical Architecture

Frontend: React.js with Shopify Polaris UI and App Bridge, using React Router for navigation.
Backend: Serverless Node.js/Express on Vercel.
State Management: Upstash Redis (free tier) for session caching; SQLite for user configurations (dev).
AI Layer: Ollama (local Llama 2/Mixtral) with LangChain for prompt parsing and code generation.
Integrations: Google Sheets API, Microsoft Graph API, Shopify Webhooks.
Database: Prisma with SQLite (dev); supports MongoDB Atlas (free tier) for production.
Monitoring: Vercel Analytics for basic request/error tracking.

Setup and Installation
Prerequisites

Node.js v18+: Download.
Shopify Partner Account: Sign up at partners.shopify.com (free).
Test Store: Create a free development store via Shopify Partner Dashboard.
Shopify CLI: Install via npm install -g @shopify/cli@latest.
Ollama: Install from ollama.ai for local AI.
API Keys: Free keys for Google Sheets, Microsoft Graph, Shopify (see below).
Vercel Account: Sign up at vercel.com (free).
Upstash Redis: Sign up at upstash.com (free tier).

Installation

Initialize the Project:
shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
cd ai-incrediblebulk


Install Dependencies:
npm install
npm install @langchain/ollama @upstash/redis


Configure Environment:

Copy .env.example to .env.
Add keys to .env:SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
REDIS_URL=your-upstash-redis-url
REDIS_TOKEN=your-upstash-redis-token
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=file:./dev.db


Get keys:
Shopify: From Partner Dashboard.
Google Sheets: Create a free Google Cloud project at console.cloud.google.com.
Microsoft Graph: Register app at portal.azure.com.
Upstash Redis: From Upstash dashboard.




Set Up AI:

Install and run Ollama: ollama run llama2 (or mistral for better accuracy).
Update /ai/prompt-parsing.js:import { ChatOllama } from "@langchain/ollama";
const llm = new ChatOllama({ model: "llama2", baseUrl: process.env.OLLAMA_BASE_URL });




Set Up Database:

Initialize SQLite: npx prisma db push.


Run Locally:
shopify app dev


Press P to open the app URL and install in your test store.


Deploy:

Push to GitHub: git push origin main.
Import repo in Vercel dashboard; set build command to npm run build, output to dist.
Add .env vars in Vercel UI.
Run shopify app deploy to sync with Shopify.



Development
Folder Structure
ai-incrediblebulk/
├── /app/
│   ├── /routes/                # React Router routes (e.g., app._index.tsx)
│   ├── /shopify.server.ts      # Shopify auth and API setup
│   ├── /backend/               # Serverless Node.js/Express APIs
│   ├── /ai/                    # LLM prompt parsing and code generation
│   ├── /integrations/          # Google Sheets, Microsoft Graph, Shopify APIs
├── /prisma/                    # Prisma schema for SQLite/MongoDB
├── /tests/                     # Unit and integration tests
├── README.md                   # This file
└── package.json

Key Endpoints

POST /prompt: Processes natural language input via Ollama.
GET /session: Retrieves session state from Upstash Redis.
POST /execute: Applies AI-generated changes to spreadsheets.

Authenticating and Querying Data
Use shopify from /app/shopify.server.ts for Shopify auth and GraphQL:
export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);
  const response = await admin.graphql(`
    {
      products(first: 25) {
        nodes { title, description }
      }
    }`);
  const { data: { products: { nodes } } } = await response.json();
  return nodes;
}

Running Tests
npm run test


Unit tests: Cover AI parsing and backend logic (80% coverage).
Integration tests: Mock Google Sheets/Microsoft Graph API calls.
AI tests: Use golden dataset for prompt accuracy.

Security and Compliance

Authentication: Shopify OAuth + JWT for backend.
Encryption: AES-256 for data in transit/rest (via Vercel SSL).
Compliance: GDPR/CCPA, Shopify App Store requirements.
Safety: Sandboxed code execution; user confirmation for destructive actions.

Performance and Scalability

Latency: ~5-10s for AI prompts (local Ollama); <5s for API calls.
Scalability: Vercel auto-scales; Upstash Redis handles 10K daily commands.
Optimization: Batch API requests, CDN caching via Vercel.

Deployment
Application Storage

Development: SQLite (default, file-based).
Production: Use MongoDB Atlas (free 512MB tier). Update schema.prisma:datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
model Session {
  session_id  String    @id @default(auto()) @map("_id") @db.ObjectId
  id          String    @unique
  ...
}


Run npx prisma db push.



Build
npm run build

Hosting

Deploy to Vercel (free Hobby tier). Set NODE_ENV=production in Vercel UI.
Follow Shopify's deployment docs for App Store submission.

Gotchas / Troubleshooting

Database Errors (e.g., "Table main.Session does not exist"):npm run setup


Navigation Issues:
Use Link from @shopify/polaris or react-router, not <a>.
Use shopify.authenticate.admin redirects, not react-router.
Use useSubmit for forms.


Auth Loops: After scope changes, run shopify app deploy.
Webhooks:
Define in shopify.app.toml for auto-sync.
Avoid manual admin webhooks; use app-specific subscriptions.


MongoDB with Prisma: Use npx prisma db push, not prisma migrate.
Update shopify.web.toml:[commands]
predev = "npx prisma generate && npx prisma db push"
dev = "npx prisma migrate deploy && npm exec react-router dev"




JWT "nbf" Error: Sync system clock ("Set time and date automatically").

Free Tier Limitations

Ollama: Local AI is slower (~5-10s/prompt); needs machine running.
Vercel: 100GB bandwidth/month, 10s timeout. Fine for <100 daily users.
Upstash Redis: 10K daily commands.
SQLite: Single-user only; use MongoDB Atlas for multi-user production.
Google Sheets/Microsoft Graph: Rate limits (300 reads/min, 60 writes/min).

Resources

React Router Documentation
Shopify: Apps, App React Router, App Bridge, Polaris
Prisma MongoDB
Shopify Internationalization

Contributing

Submit PRs via GitHub with code reviews.
Follow Airbnb JavaScript style guide.
Update tests for new features.

Risks and Mitigations



Risk
Mitigation



LLM inaccuracies
Multi-step verification with user previews.


API rate limits
Caching, exponential backoff.


Scalability issues
Monitor Vercel/Upstash quotas; switch to MongoDB for production.


Roadmap

MVP: Google Sheets integration, basic prompt parsing.
Beta: Microsoft Excel support, stateful sessions, code generation.
Production: Real-time updates, security hardening, monitoring.

Contact
For issues, open a GitHub issue or email atulmundakkal1999@gmail.com.