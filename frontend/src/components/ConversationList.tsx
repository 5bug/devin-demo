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
      <div className="flex flex-col gap-1 p-2">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`cursor-pointer transition-colors hover:bg-background-hover border-0 shadow-none bg-transparent ${
              activeConversationId === conversation.id
                ? "bg-background-hover"
                : ""
            }`}
            onClick={() => onSelect(conversation)}
          >
            <CardHeader className="flex flex-row items-center justify-between p-3">
              <CardTitle className="text-sm font-normal truncate flex-1 mr-2">
                {conversation.messages[0]?.content || "New conversation"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-background-input text-secondary hover:text-primary"
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
                <div className="mt-2 font-medium text-primary">
                  "{conversationToDelete.messages[0]?.content.slice(0, 50) || "New conversation"}"
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
