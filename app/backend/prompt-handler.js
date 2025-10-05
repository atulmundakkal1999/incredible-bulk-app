import PromptParser from "../ai/prompt-parsing.js";
import { Redis } from "@upstash/redis";

class PromptHandler {
  constructor() {
    this.parser = new PromptParser();
    this.redis = process.env.REDIS_URL && process.env.REDIS_TOKEN
      ? new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN })
      : null;
    this.memoryStore = new Map();
  }

  async handlePrompt(prompt, sessionId, shop) {
    try {
      // Get session context from Redis
      const context = await this.getSessionContext(sessionId);
      
      // Parse the prompt using AI
      const parsedOperation = await this.parser.parsePrompt(prompt, context);
      
      // Validate the operation for safety
      const validation = await this.parser.validateOperation(
        parsedOperation.operation_type,
        parsedOperation.parameters
      );
      
      // Update session context
      await this.updateSessionContext(sessionId, {
        lastPrompt: prompt,
        lastOperation: parsedOperation,
        timestamp: new Date().toISOString(),
        shop: shop
      });
      
      return {
        success: true,
        operation: parsedOperation,
        validation: validation,
        sessionId: sessionId
      };
    } catch (error) {
      console.error("Error handling prompt:", error);
      return {
        success: false,
        error: error.message,
        sessionId: sessionId
      };
    }
  }

  async getSessionContext(sessionId) {
    try {
      if (this.redis) {
        const context = await this.redis.get(`session:${sessionId}`);
        return context ?? {};
      }
      return this.memoryStore.get(sessionId) ?? {};
    } catch (error) {
      console.error("Error getting session context:", error);
      return {};
    }
  }

  async updateSessionContext(sessionId, context) {
    try {
      if (this.redis) {
        await this.redis.set(`session:${sessionId}`, context, { ex: 3600 });
      } else {
        this.memoryStore.set(sessionId, context);
      }
    } catch (error) {
      console.error("Error updating session context:", error);
    }
  }

  async executeOperation(operation, parameters, sessionId) {
    try {
      // Generate code for the operation
      const code = await this.parser.generateCode(operation, parameters);
      
      // Store execution in session
      await this.updateSessionContext(sessionId, {
        lastExecution: {
          operation,
          parameters,
          code,
          timestamp: new Date().toISOString()
        }
      });
      
      return {
        success: true,
        code: code,
        message: "Operation ready for execution"
      };
    } catch (error) {
      console.error("Error executing operation:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default PromptHandler;
