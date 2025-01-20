import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { type Conversation } from "@/lib/api";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  onRemove: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onRemove,
}: ConversationListProps) {
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const handleDelete = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      onRemove(conversationToDelete);
      setConversationToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 p-4">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              activeConversationId === conversation.id
                ? "border-zinc-400 dark:border-zinc-600"
                : ""
            }`}
            onClick={() => onSelect(conversation)}
          >
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm">
                {conversation.messages[0]?.content.slice(0, 30) || "New Conversation"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(e, conversation)}
              >
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!conversationToDelete} onOpenChange={() => setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation?
              {conversationToDelete && (
                <div className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">
                  "{conversationToDelete.messages[0]?.content.slice(0, 50) || "New Conversation"}"
                </div>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
