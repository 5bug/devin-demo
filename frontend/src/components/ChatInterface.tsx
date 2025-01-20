import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {conversation.messages.map((msg, index) => (
            <Card
              key={index}
              className={msg.role === "user" ? "ml-auto w-3/4" : "mr-auto w-3/4"}
            >
              <CardContent className="p-4">
                <div className="text-sm font-semibold text-zinc-500">
                  {msg.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{msg.content}</div>
              </CardContent>
            </Card>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming}
          />
          <Button type="submit" disabled={isStreaming}>
            <Send />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
