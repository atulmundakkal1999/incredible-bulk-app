import { authenticate } from "../shopify.server";
import PromptHandler from "../backend/prompt-handler.js";

const promptHandler = new PromptHandler();

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const { operation, parameters, sessionId } = await request.json();
    
    if (!operation) {
      return Response.json({ success: false, error: "Operation is required" }, { status: 400 });
    }
    
    const result = await promptHandler.executeOperation(
      operation, 
      parameters || {}, 
      sessionId || session.id
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
