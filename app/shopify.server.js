import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Validate required environment variables early to avoid silent auth failures
const requiredEnv = [
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SCOPES",
  "SHOPIFY_APP_URL",
  // Prisma uses DATABASE_URL; warn if missing because session storage will fail
  "DATABASE_URL",
];

const missing = requiredEnv.filter((k) => !process.env[k] || process.env[k] === "");
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(
    `Shopify configuration error: missing env var(s): ${missing.join(", ")}.\n` +
      `Please set them in your .env file. Example:\n` +
      `SHOPIFY_API_KEY=...\nSHOPIFY_API_SECRET=...\nSCOPES=write_products,read_products,write_orders,read_orders\nSHOPIFY_APP_URL=http://localhost:3000\nDATABASE_URL=file:./dev.db\n`
  );
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

// Normalize app URL and do a basic sanity check
const appUrl = (process.env.SHOPIFY_APP_URL || "").trim();
try {
  // Will throw if invalid
  // eslint-disable-next-line no-new
  new URL(appUrl);
} catch {
  // eslint-disable-next-line no-console
  console.error(
    `Invalid SHOPIFY_APP_URL: "${appUrl}". It must be a full URL with http/https, e.g. http://localhost:3000`
  );
  throw new Error("Invalid SHOPIFY_APP_URL");
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July25,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
