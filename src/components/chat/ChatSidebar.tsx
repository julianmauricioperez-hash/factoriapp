import { useState } from "react";
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChatConversation } from "@/hooks/useChatConversations";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  loading: boolean;
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  loading,
}: ChatSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onDelete(conversationToDelete);
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleEditClick = (e: React.MouseEvent, conv: ChatConversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <>
      <div className="flex flex-col h-full border-r bg-muted/30">
        <div className="p-3 border-b">
          <Button onClick={onNew} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Nuevo chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sin conversaciones
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-start gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors min-h-[40px]",
                    selectedId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                  onClick={() => !editingId && onSelect(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                  
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="h-7 text-sm flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(e as any);
                          if (e.key === "Escape") handleCancelEdit(e as any);
                        }}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={handleSaveEdit}
                      >
                        <Check className="h-3 w-3 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm leading-tight">{conv.title}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleEditClick(e, conv)}
                          aria-label="Editar conversación"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleDeleteClick(e, conv.id)}
                          aria-label="Eliminar conversación"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md mx-4 max-w-[calc(100%-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
