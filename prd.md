AI IncredibleBulk - Technical Product Requirements Document (PRD)
1. Overview
AI IncredibleBulk is a Shopify app that automates spreadsheet management using natural language prompts. Users can input commands like "Sort inventory by price descending" via a chat-like UI, and the app leverages AI to interpret these commands, analyze spreadsheets, and execute operations (e.g., sorting, filtering, formula application) without coding. It integrates with Google Sheets and Microsoft Excel Online, embedding seamlessly in Shopify’s admin dashboard via App Bridge. The app is designed for scalability, security, and low-latency responses within Shopify’s ecosystem, using a zero-cost tech stack for development and limited production use. This project uses the Shopify React Router template, adapted for AI IncredibleBulk's requirements.
2. Objectives

Enable users to interact with spreadsheets via a chat-like UI using natural language.
Integrate with Google Sheets and Microsoft Excel Online for real-time data access and updates.
Maintain session context for multi-turn interactions.
Ensure compatibility with Shopify’s admin dashboard and App Store requirements.
Minimize costs using free-tier services and local AI for development and low-volume production.

3. Technical Requirements
3.1 Features

Natural Language Interface: Users input commands (e.g., "Sort inventory by price descending") via a chat UI, processed by AI to generate spreadsheet operations.
Real-Time Integrations: Connect to Google Sheets and Microsoft Graph APIs for seamless data read/write.
AI-Driven Automation: Parse prompts, analyze sheet structure, and generate safe executable code (e.g., Python/Apps Script) for spreadsheet operations.
Stateful Sessions: Persist user context across interactions using Upstash Redis.
Shopify Integration: Embed in Shopify admin via App Bridge; sync store data (e.g., orders, products).
Security: Shopify OAuth, JWT, and AES-256 encryption; sandboxed code execution.
Monitoring: Basic error/request tracking via Vercel Analytics.

3.2 Non-Functional Requirements

Latency: ~5-10s for AI prompt processing (local Ollama); <5s for API calls.
Scalability: Handle up to 100 daily users within free-tier limits (Vercel, Upstash).
Availability: 99.9% uptime via Vercel’s infrastructure.
Compliance: GDPR/CCPA, Shopify App Store security requirements.
Cost: Zero monetary cost for development; free-tier limits for production.

4. Technical Architecture
4.1 Tech Stack



Component
Technology
Free Option
Rationale



Frontend
React.js, Shopify Polaris, App Bridge, React Router
Vercel Hobby Tier
Simple UI with Shopify-native look; Vercel for easy deployment.


Backend
Node.js/Express (serverless)
Vercel Functions
Lightweight, scalable APIs; free-tier supports low traffic.


AI Layer
Ollama (Llama 2/Mixtral), LangChain
Local Ollama
Free, local AI with no API costs; LangChain for prompt chaining.


State Management
Upstash Redis
Free Tier (10K commands/day)
Simple, scalable session caching; easy REST API.


Database
Prisma with SQLite (dev), MongoDB Atlas (prod)
SQLite (local), MongoDB Atlas (512MB free)
SQLite for zero-setup dev; MongoDB for scalable production.


Integrations
Google Sheets API, Microsoft Graph API, Shopify Webhooks
Free APIs
No-cost APIs with generous rate limits (300 reads/min, 60 writes/min).


Monitoring
Vercel Analytics
Free with Hobby Tier
Built-in, no-config analytics for requests/errors.


4.2 System Architecture

Frontend: React.js app with Shopify Polaris components, embedded in Shopify admin via App Bridge. React Router handles navigation (/app/routes/).
Backend: Serverless Node.js/Express APIs on Vercel Functions (/app/backend/), handling /prompt, /session, and /execute endpoints.
AI Layer: Ollama (local Llama 2/Mixtral) processes prompts via LangChain (/app/ai/), generating spreadsheet operations.
State Management: Upstash Redis stores session context for multi-turn interactions.
Database: SQLite (file:./dev.db) for dev; MongoDB Atlas for production user configs and sessions (/prisma/).
Integrations: Google Sheets API for spreadsheet ops; Microsoft Graph for Excel Online; Shopify GraphQL/Webhooks for store data.
Monitoring: Vercel Analytics tracks API usage and errors.

4.3 Data Flow

User inputs prompt (e.g., "Sort inventory by price") in chat UI.
Frontend sends POST /prompt to backend (Vercel).
Backend forwards prompt to Ollama via LangChain (/app/ai/), retrieving session context from Upstash Redis.
Ollama parses prompt, generates operation code (e.g., Python for sorting).
Backend executes code via POST /execute, using Google Sheets/Microsoft Graph APIs.
Results are stored in SQLite/MongoDB and returned to the frontend.
Vercel Analytics logs request performance/errors.

4.4 Folder Structure
ai-incrediblebulk/
├── /app/
│   ├── /routes/                # React Router routes (e.g., app._index.tsx)
│   ├── /shopify.server.ts      # Shopify auth and API setup
│   ├── /backend/               # Serverless Node.js/Express APIs
│   ├── /ai/                    # LLM prompt parsing and code generation
│   ├── /integrations/          # Google Sheets, Microsoft Graph, Shopify APIs
├── /prisma/                    # Prisma schema for SQLite/MongoDB
├── /tests/                     # Unit and integration tests
├── README.md                   # Project documentation
└── package.json

5. Implementation Details
5.1 Frontend

Framework: React.js with Shopify Polaris for UI components.
Navigation: React Router (/app/routes/app._index.tsx for main UI). Use Link from @shopify/polaris or react-router, not <a>. Use shopify.authenticate.admin redirects, not react-router. Use useSubmit for forms.
Shopify Integration: App Bridge for embedding; shopify.server.ts for auth.
Key Component: Chat UI for natural language input, displaying AI responses and spreadsheet previews.

5.2 Backend

Endpoints:
POST /prompt: Accepts user input, sends to Ollama, returns parsed operations.
GET /session: Retrieves session context from Upstash Redis.
POST /execute: Executes AI-generated code on spreadsheets via APIs.


Implementation:
Node.js/Express on Vercel Functions (/app/backend/).
Upstash Redis client:import { createClient } from "@upstash/redis";
const redis = createClient({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });




Auth: Shopify OAuth via shopify.authenticate.admin in shopify.server.ts.

5.3 AI Layer

LLM: Ollama (Llama 2 or Mixtral) running locally (http://localhost:11434). Mixtral recommended for better accuracy.
Prompt Parsing: LangChain with @langchain/ollama in /app/ai/prompt-parsing.js:import { ChatOllama } from "@langchain/ollama";
const llm = new ChatOllama({ model: "llama2", baseUrl: process.env.OLLAMA_BASE_URL });


Functionality: Parse prompts, analyze sheet structure, generate safe Python/Apps Script for operations.
Safety: Sandboxed execution; user confirmation for destructive actions (e.g., deleting rows).

5.4 Database

Development: SQLite (file:./dev.db) via Prisma.
Production: MongoDB Atlas (512MB free tier).datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
model Session {
  session_id  String    @id @default(auto()) @map("_id") @db.ObjectId
  id          String    @unique
  shop        String
  state       String
  isOnline    Boolean
  scope       String?
  expires     DateTime?
  accessToken String
}


Setup: npx prisma db push. For MongoDB, avoid prisma migrate.

5.5 Integrations

Google Sheets API: Free, enabled via Google Cloud Console (console.cloud.google.com). OAuth for user auth. Rate limits: 300 reads/min, 60 writes/min.
Microsoft Graph API: Free with Microsoft account, registered via Azure Portal (portal.azure.com). Rate limits: 300 reads/min, 60 writes/min.
Shopify: Free Partner account; GraphQL queries and webhooks for store data:export async function loader({ request }) {
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


Webhooks: Define in shopify.app.toml for auto-sync. Avoid manual admin webhooks; use app-specific subscriptions.

5.6 Monitoring

Vercel Analytics: Enable in Vercel dashboard for request/error tracking.
Logging: Console logs in development; Vercel logs in production.

6. Setup and Installation
6.1 Prerequisites

Node.js v18+: Download from nodejs.org.
Shopify Partner Account: Sign up at partners.shopify.com (free).
Test Store: Create a free development store via Shopify Partner Dashboard.
Shopify CLI: Install via npm install -g @shopify/cli@latest.
Ollama: Install from ollama.ai for local AI.
Vercel Account: Sign up at vercel.com (free).
Upstash Redis: Sign up at upstash.com (free tier, 10K commands/day).
API Keys:
Shopify: From Partner Dashboard.
Google Sheets: Create a free Google Cloud project at console.cloud.google.com.
Microsoft Graph: Register app at portal.azure.com.
Upstash Redis: From Upstash dashboard.



6.2 Installation

Initialize:shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
cd ai-incrediblebulk


Install Dependencies:npm install
npm install @langchain/ollama @upstash/redis


Configure Environment:
Copy .env.example to .env.
Add keys:SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
REDIS_URL=your-upstash-redis-url
REDIS_TOKEN=your-upstash-redis-token
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=file:./dev.db




Set Up AI:
Install and run Ollama: ollama run llama2 (or mistral for better accuracy).
Update /app/ai/prompt-parsing.js:import { ChatOllama } from "@langchain/ollama";
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



6.3 Configuration

Update shopify.web.toml for MongoDB support:[commands]
predev = "npx prisma generate && npx prisma db push"
dev = "npx prisma migrate deploy && npm exec react-router dev"



7. Testing

Command: npm run test
Coverage:
Unit tests: AI parsing, backend logic (80% coverage).
Integration tests: Mock Google Sheets/Microsoft Graph API calls.
AI tests: Use golden dataset for prompt accuracy.


Tools: Jest for unit tests; mock APIs for integrations.

8. Security and Compliance

Authentication: Shopify OAuth + JWT for backend APIs.
Encryption: AES-256 for data in transit/rest via Vercel SSL.
Compliance: GDPR/CCPA; Shopify App Store requirements.
Safety: Sandboxed code execution; user previews for destructive actions.

9. Performance and Scalability

Latency: ~5-10s for AI prompts (local Ollama); <5s for API calls.
Scalability: Vercel auto-scales (100GB bandwidth/month, 10s timeout); Upstash Redis supports 10K commands/day; MongoDB Atlas for >100 users.
Optimization: Batch API requests, CDN caching via Vercel.

10. Deployment

Application Storage:
Development: SQLite (default, file-based).
Production: MongoDB Atlas (free 512MB tier). Update schema.prisma:datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
model Session {
  session_id  String    @id @default(auto()) @map("_id") @db.ObjectId
  id          String    @unique
  shop        String
  state       String
  isOnline    Boolean
  scope       String?
  expires     DateTime?
  accessToken String
}


Run npx prisma db push.


Build: npm run build
Hosting: Deploy to Vercel (free Hobby tier). Set NODE_ENV=production in Vercel UI. Follow Shopify’s deployment docs for App Store submission.

11. Gotchas / Troubleshooting

Database Errors (e.g., "Table main.Session does not exist"): Run npm run setup.
Navigation Issues:
Use Link from @shopify/polaris or react-router, not <a>.
Use shopify.authenticate.admin redirects, not react-router.
Use useSubmit for forms.


Auth Loops: After scope changes, run shopify app deploy.
Webhooks:
Define in shopify.app.toml for auto-sync.
Avoid manual admin webhooks; use app-specific subscriptions.


MongoDB with Prisma: Use npx prisma db push, not prisma migrate.
JWT "nbf" Error: Sync system clock ("Set time and date automatically").

12. Risks and Mitigations



Risk
Mitigation



LLM inaccuracies
Multi-step verification with user previews.


API rate limits
Caching in Redis, exponential backoff.


Scalability issues
Monitor Vercel/Upstash quotas; switch to MongoDB for production.


Slow local AI
Use Mixtral for better performance; optimize prompts.


13. Roadmap

MVP (Q1 2026): Google Sheets integration, basic prompt parsing.
Beta (Q2 2026): Microsoft Excel support, stateful sessions, code generation.
Production (Q3 2026): Real-time updates, security hardening, enhanced monitoring.

14. Success Metrics

User Adoption: 10 active test stores in MVP; 100 in beta.
Performance: <10s average prompt response; <5s API response.
Reliability: 99.9% uptime; <1% error rate in Vercel Analytics.
Cost: Stay within free-tier limits (Vercel, Upstash, MongoDB Atlas).

15. Dependencies



Dependency
Version
Purpose



Node.js
18+
Backend runtime


React
18.x
Frontend framework


@shopify/polaris
Latest
Shopify UI components


@shopify/app-bridge
Latest
Shopify admin integration


@langchain/ollama
Latest
AI prompt processing


@upstash/redis
Latest
Session caching


prisma
Latest
Database ORM


@vercel/analytics
Latest
Monitoring


16. Contributing

Submit PRs via GitHub with code reviews.
Follow Airbnb JavaScript style guide.
Update tests for new features.

17. Resources

React Router Documentation
Shopify: Apps
Shopify: App React Router
Shopify: App Bridge
Shopify: Polaris
Prisma MongoDB
Shopify Internationalization

18. Contact
For issues, open a GitHub issue or email atulmundakkal1999@gmail.com.