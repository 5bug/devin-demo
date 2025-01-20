import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "./components/ui/button";
import { ConversationList } from "./components/ConversationList";
import { ChatInterface } from "./components/ChatInterface";
import { api, type Conversation } from "./lib/api";

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>();

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const conversations = await api.listConversations();
    setConversations(conversations);
  }

  async function handleCreateConversation() {
    const conversation = await api.createConversation();
    setConversations((prev) => [...prev, conversation]);
    setActiveConversationId(conversation.id);
  }

  async function handleRemoveConversation(conversation: Conversation) {
    await api.removeConversation(conversation.id);
    setConversations((prev) =>
      prev.filter((c) => c.id !== conversation.id)
    );
    if (activeConversationId === conversation.id) {
      setActiveConversationId(undefined);
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-80 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-4">
          <Button
            className="w-full"
            onClick={handleCreateConversation}
          >
            <MessageSquarePlus />
            New Chat
          </Button>
        </div>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={(conversation) => setActiveConversationId(conversation.id)}
          onRemove={handleRemoveConversation}
        />
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col">
        {activeConversationId ? (
          <ChatInterface
            conversation={conversations.find((c) => c.id === activeConversationId)!}
            onUpdate={(updated) => {
              setConversations((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
            }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-500">
            Select a conversation or create a new one
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
