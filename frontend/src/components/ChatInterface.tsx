import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { type Conversation, type Message } from "@/lib/api";

interface ChatInterfaceProps {
  conversation: Conversation;
  onUpdate: (conversation: Conversation) => void;
}

export function ChatInterface({ conversation, onUpdate }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isStreaming) return;

    // Add user message
    const updatedMessages = [
      ...conversation.messages,
      { role: "user", content: message } as Message,
    ];
    onUpdate({ ...conversation, messages: updatedMessages });
    setMessage("");

    // Start streaming response
    setIsStreaming(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/${conversation.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const stream = response.body;
      if (!stream) {
        throw new Error("Failed to get response stream");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: "assistant", content: "" } as Message;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          const data = JSON.parse(chunk.replace(/^data: /, ""));
          if (data === "[DONE]") break;
          
          assistantMessage.content += data.content;
          onUpdate({
            ...conversation,
            messages: [...updatedMessages, assistantMessage],
          });
        } catch (e) {
          console.error("Error parsing chunk:", e);
          throw new Error("Failed to parse server response");
        }
      }
    } catch (error) {
      console.error("Error streaming chat:", error);
      // Add error message to conversation
      const errorMessage = { 
        role: "assistant", 
        content: "Error: Unable to get response from AI. Please check if the OpenAI API key is configured correctly."
      } as Message;
      // Update conversation with error message
      onUpdate({
        ...conversation,
        messages: [
          ...updatedMessages,
          errorMessage
        ],
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-36">
        <div className="flex flex-col gap-6">
          {conversation.messages.map((msg, index) => (
            <div
              key={index}
              className={`w-full ${msg.role === "assistant" ? "bg-background-secondary" : ""}`}
            >
              <div className="mx-auto max-w-3xl px-4 py-6">
                <Card className={`w-3/4 border-0 shadow-none ${
                  msg.role === "user" ? "ml-auto bg-background-input" : "mr-auto bg-transparent"
                }`}>
                  <CardContent className="flex items-start gap-6 p-6">
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded bg-background-secondary text-sm text-primary">
                      {msg.role === "user" ? "U" : "A"}
                    </div>
                    <div className="flex-1 whitespace-pre-wrap text-primary">
                      {msg.content}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="absolute bottom-0 left-0 w-full border-t border-background-input bg-background p-4">
        <form onSubmit={handleSendMessage} className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2">
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Auto-adjust height
                e.target.style.height = "40px";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isStreaming && message.trim()) {
                    handleSendMessage(e);
                  }
                }
              }}
              placeholder="Send a message..."
              className="min-h-[40px] max-h-[200px] resize-none overflow-y-auto rounded-lg bg-background-input border-background-input text-primary placeholder-secondary focus-visible:ring-0"
              disabled={isStreaming}
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              className="mb-1 bg-background-input hover:bg-background-hover text-primary"
              disabled={isStreaming || !message.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
