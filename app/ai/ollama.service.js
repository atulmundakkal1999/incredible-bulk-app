export default class OllamaService {
  constructor(baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434", model = process.env.OLLAMA_MODEL || "llama2") {
    this.baseUrl = baseUrl;
    this.model = model;
    this.defaultTimeoutMs = 30000; // 30s
  }

  async chat(messages, timeoutMs = this.defaultTimeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("Ollama request timed out")), timeoutMs);

    try {
      const payload = {
        model: this.model,
        messages,
        stream: false,
      };

      const url = `${this.baseUrl}/v1/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama error ${res.status}: ${text}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      return content;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Ollama request aborted/timeout");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

