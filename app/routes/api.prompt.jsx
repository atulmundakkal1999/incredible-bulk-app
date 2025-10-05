import { authenticate } from "../shopify.server";
import PromptHandler from "../backend/prompt-handler.js";

const promptHandler = new PromptHandler();

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const contentType = request.headers.get("content-type") || "";
    let prompt;
    let sessionId;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      prompt = body.prompt;
      sessionId = body.sessionId;
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data") || contentType === "") {
      const form = await request.formData();
      prompt = form.get("prompt");
      sessionId = form.get("sessionId");
    }
    
    if (!prompt) {
      return Response.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }
    
    const result = await promptHandler.handlePrompt(
      prompt, 
      sessionId || session.id, 
      session.shop
    );
    
    return Response.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { success: false, error: "Internal server error" }, 
      { status: 500 }
    );
  }
};

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || session.id;
    
    const context = await promptHandler.getSessionContext(sessionId);
    
    return Response.json({ success: true, context });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { success: false, error: "Failed to get session context" }, 
      { status: 500 }
    );
  }
};
