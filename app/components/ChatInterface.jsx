import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useFetcher } from "react-router";
import { TextField, Button, Card, BlockStack, InlineStack, Text, Badge } from "@shopify/polaris";

const ChatInterface = memo(function ChatInterface({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const fetcher = useFetcher();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Ensure loading state resets when request completes (even on redirects/errors)
    if (fetcher.state === "idle" && isLoading) {
      setIsLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    if (fetcher.data) {
      if (fetcher.data.success) {
        const aiMessage = {
          id: Date.now(),
          type: "ai",
          content: fetcher.data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now(),
          type: "error",
          content: fetcher.data.error || "An error occurred",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!input.trim() && !selectedFile) {
      const errorMessage = {
        id: Date.now(),
        type: "error",
        content: "Please type a message or attach a CSV",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input || (selectedFile ? "[File uploaded]" : ""),
      fileName: selectedFile?.name || null,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("prompt", input);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    fetcher.submit(formData, { method: "POST", action: "/api/chat" });

    // Failsafe: if the request stalls or redirects without data, re-enable after 10s
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      loadingTimeoutRef.current = null;
    }, 10000);

    // Clear attachment after sending
    setSelectedFile(null);
  }, [input, selectedFile, isLoading, fetcher]);

  const handleExecute = useCallback(async (operation) => {
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: operation.operation_type,
          parameters: operation.parameters,
          sessionId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const executionMessage = {
          id: Date.now(),
          type: "execution",
          content: "Operation executed successfully!",
          result: result,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, executionMessage]);
      } else {
        const errorMessage = {
          id: Date.now(),
          type: "error",
          content: result.error || "Execution failed",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now(),
        type: "error",
        content: "Failed to execute operation",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [sessionId]);

  return (
    <Card>
      <BlockStack gap="400">
        {/* Messages Container */}
        <div style={{ 
          height: "500px",
          overflowY: "auto", 
          padding: "16px",
          border: "1px solid var(--p-color-border)",
          borderRadius: "var(--p-border-radius-200)"
        }}>
        {messages.length === 0 && (
          <BlockStack gap="300" inlineAlign="center">
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <Text variant="headingMd" as="h3">Welcome to AI IncredibleBulk! 🚀</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Start by asking me to help with your spreadsheets. Try commands like:
              </Text>
              <ul style={{ textAlign: "left", display: "inline-block", marginTop: "12px" }}>
                <li>"Sort my inventory by price descending"</li>
                <li>"Filter products with stock less than 10"</li>
                <li>"Add a formula to calculate total revenue"</li>
              </ul>
            </div>
          </BlockStack>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: message.type === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor: message.type === "user" 
                  ? "#0070f3" 
                  : message.type === "error"
                  ? "#ff6b6b"
                  : message.type === "execution"
                  ? "#51cf66"
                  : "#f1f3f4",
                color: message.type === "user" ? "white" : "#333",
                wordWrap: "break-word"
              }}
            >
              <div>{message.content}</div>
              {message.fileName && (
                <div style={{ marginTop: "6px", fontSize: "12px", opacity: 0.8 }}>
                  Attachment: {message.fileName}
                </div>
              )}
              
              {message.operation && (
                <div style={{ marginTop: "8px", fontSize: "14px" }}>
                  <strong>Operation:</strong> {message.operation.operation_type}
                  <br />
                  <strong>Parameters:</strong> {JSON.stringify(message.operation.parameters, null, 2)}
                  
                  {message.validation && (
                    <div style={{ marginTop: "8px" }}>
                      <strong>Safety Check:</strong> 
                      <span style={{ 
                        color: message.validation.safe ? "#51cf66" : "#ff6b6b" 
                      }}>
                        {message.validation.safe ? " ✅ Safe" : " ⚠️ Warning"}
                      </span>
                      {message.validation.warnings.length > 0 && (
                        <div style={{ fontSize: "12px", marginTop: "4px" }}>
                          Warnings: {message.validation.warnings.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ marginTop: "8px" }}>
                    <Button
                      onClick={() => handleExecute(message.operation)}
                      size="slim"
                      disabled={message.operation?.parameters?.preview === true}
                    >
                      Execute Operation
                    </Button>
                  </div>
                </div>
              )}
              
              <div style={{ 
                fontSize: "12px", 
                opacity: 0.7, 
                marginTop: "4px" 
              }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 16px",
              borderRadius: "18px",
              backgroundColor: "#f1f3f4",
              color: "#333"
            }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #0070f3",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: "8px"
                }} />
                AI is thinking...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit}>
          <InlineStack gap="200" align="end">
            <div style={{ flex: 1 }}>
              <TextField
                value={input}
                onChange={setInput}
                placeholder="Ask me to help with your spreadsheets..."
                disabled={isLoading}
                autoComplete="off"
                connectedRight={
                  <InlineStack gap="200">
                    <label
                      htmlFor="chat-file"
                      style={{
                        padding: "8px 12px",
                        border: "1px solid var(--p-color-border)",
                        borderRadius: "var(--p-border-radius-100)",
                        background: "var(--p-color-bg-surface-secondary)",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {selectedFile ? selectedFile.name : "📎 CSV"}
                    </label>
                    <input
                      id="chat-file"
                      type="file"
                      accept=".csv,text/csv"
                      style={{ display: "none" }}
                      disabled={isLoading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                  </InlineStack>
                }
              />
            </div>
            <Button
              submit
              primary
              disabled={isLoading}
              loading={isLoading}
            >
              Send
            </Button>
          </InlineStack>
        </form>
      </BlockStack>
    </Card>
  );
});

export default ChatInterface;
