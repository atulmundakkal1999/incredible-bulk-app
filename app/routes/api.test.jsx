import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Test basic connectivity
    const tests = {
      shopify: {
        status: "connected",
        shop: session.shop,
        sessionId: session.id
      },
      database: {
        status: "unknown", // Will be tested by Prisma
        message: "Database connection not tested yet"
      },
      redis: {
        status: process.env.REDIS_URL ? "configured" : "not_configured",
        message: process.env.REDIS_URL ? "Redis URL found" : "Redis URL not found in environment"
      },
      ollama: {
        status: process.env.OLLAMA_BASE_URL ? "configured" : "not_configured",
        message: process.env.OLLAMA_BASE_URL ? "Ollama URL found" : "Ollama URL not found in environment"
      },
      google: {
        status: process.env.GOOGLE_CLIENT_ID ? "configured" : "not_configured",
        message: process.env.GOOGLE_CLIENT_ID ? "Google API keys found" : "Google API keys not found"
      },
      microsoft: {
        status: process.env.MS_CLIENT_ID ? "configured" : "not_configured",
        message: process.env.MS_CLIENT_ID ? "Microsoft API keys found" : "Microsoft API keys not found"
      }
    };

    return Response.json({
      success: true,
      message: "API test completed",
      tests: tests,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("API Test Error:", error);
    return Response.json(
      { 
        success: false, 
        error: "API test failed",
        message: error.message 
      }, 
      { status: 500 }
    );
  }
};
