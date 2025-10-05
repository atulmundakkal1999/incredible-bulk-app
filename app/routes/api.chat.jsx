import { authenticate } from "../shopify.server";
import OllamaService from "../ai/ollama.service.js";

const ollama = new OllamaService();

export const action = async ({ request }) => {
  try {
    // Authenticate the request
    await authenticate.admin(request);
    
    const contentType = request.headers.get("content-type") || "";
    let prompt;
    let fileText;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      prompt = body.prompt;
    } else {
      const form = await request.formData();
      prompt = form.get("prompt");
      const file = form.get("file");
      if (file && typeof file.text === "function") {
        const MAX_BYTES = 1024 * 1024; // 1MB safety limit
        const content = await file.text();
        fileText = content.slice(0, MAX_BYTES);
      }
    }

    if (!prompt) {
      return Response.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const messages = [
      { role: "system", content: "You are a helpful assistant. If a CSV is provided, summarize structure and answer based on its contents." },
      { role: "user", content: String(prompt) },
    ];
    if (fileText) {
      messages.push({ role: "user", content: `CSV contents (truncated):\n\n${fileText}` });
    }

    let reply;
    try {
      reply = await ollama.chat(messages);
    } catch (ollamaError) {
      // Fallback if Ollama is not running
      console.warn("Ollama not available, using fallback response:", ollamaError.message);
      reply = `I received your request: "${prompt}". However, the AI service (Ollama) is not currently running. To enable AI features:\n\n1. Install Ollama from https://ollama.ai/\n2. Run: ollama run llama2\n3. Ensure OLLAMA_BASE_URL is set in your .env file\n\nFor now, I can confirm your message was received successfully.`;
    }

    return Response.json({ success: true, reply });
  } catch (error) {
    console.error("/api/chat error", {
      message: error?.message,
      stack: error?.stack,
    });
    return Response.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
};

