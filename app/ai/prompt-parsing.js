import { ChatOllama } from "@langchain/ollama";

class PromptParser {
  constructor() {
    this.llm = new ChatOllama({
      model: process.env.OLLAMA_MODEL || "llama2",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });
  }

  async parsePrompt(prompt, context = {}) {
    try {
      const systemPrompt = `You are an AI assistant that helps users manage spreadsheets using natural language commands. 
      
      Your job is to:
      1. Parse the user's natural language command
      2. Identify the type of operation (sort, filter, formula, etc.)
      3. Generate safe, executable code for the operation
      4. Provide a human-readable description of what will be done
      
      Available operations:
      - Sort data by column (ascending/descending)
      - Filter data based on conditions
      - Apply formulas to cells
      - Add/remove columns
      - Format cells
      - Export/import data
      
      Always provide:
      - operation_type: The type of operation
      - description: What the operation will do
      - code: Safe executable code (Python/JavaScript)
      - parameters: Any parameters needed
      - preview: A preview of the changes
      
      Current context: ${JSON.stringify(context)}
      
      User command: "${prompt}"`;

      const response = await this.llm.invoke(systemPrompt);
      return this.parseResponse(response.content ?? "");
    } catch (error) {
      console.warn("Ollama unreachable, returning safe fallback:", error?.message || error);
      return {
        operation_type: "analyze",
        description: `Received: "${prompt}". AI service is unavailable right now. This is a dry-run preview.`,
        code: "",
        parameters: { preview: true, contextSummary: Object.keys(context) },
        preview: "No changes will be applied."
      };
    }
  }

  parseResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        operation_type: "unknown",
        description: response,
        code: "",
        parameters: {},
        preview: "Unable to generate preview"
      };
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return {
        operation_type: "error",
        description: "Failed to parse AI response",
        code: "",
        parameters: {},
        preview: "Error occurred"
      };
    }
  }

  async generateCode(operation, parameters) {
    const codeGenerationPrompt = `Generate safe, executable code for the following spreadsheet operation:
    
    Operation: ${operation}
    Parameters: ${JSON.stringify(parameters)}
    
    Requirements:
    - Use Python for Google Sheets operations
    - Use JavaScript for Microsoft Excel operations
    - Include error handling
    - Validate inputs
    - Return only the code, no explanations`;

    try {
      const response = await this.llm.invoke(codeGenerationPrompt);
      return response.content;
    } catch (error) {
      console.error("Error generating code:", error);
      throw new Error("Failed to generate code");
    }
  }

  async validateOperation(operation, parameters) {
    const validationPrompt = `Validate this spreadsheet operation for safety:
    
    Operation: ${operation}
    Parameters: ${JSON.stringify(parameters)}
    
    Check for:
    - Destructive operations (deletions, overwrites)
    - Data integrity issues
    - Security concerns
    - Input validation
    
    Return: {"safe": true/false, "warnings": [], "recommendations": []}`;

    try {
      const response = await this.llm.invoke(validationPrompt);
      const validation = JSON.parse(response.content);
      return validation;
    } catch (error) {
      console.warn("Validation skipped due to AI unavailability:", error?.message || error);
      return { safe: true, warnings: ["Validation skipped: AI unavailable"], recommendations: [] };
    }
  }
}

export default PromptParser;
