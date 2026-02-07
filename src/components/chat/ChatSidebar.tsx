import { useState, useMemo } from "react";
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Filter, Tag as TagIcon, Search, Star, ArrowUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatConversation } from "@/hooks/useChatConversations";
import { ChatTagsInput } from "./ChatTagsInput";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
}

type SortOption = "recent" | "oldest" | "alphabetical" | "favorites";
type ModeFilter = "all" | "chat" | "search";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onToggleFavorite: (id: string) => void;
  loading: boolean;
  // Tags props
  availableTags: Tag[];
  getTagsForChat: (conversationId: string) => Tag[];
  onAddTagToChat: (conversationId: string, tagId: string, tag: Tag) => Promise<boolean>;
  onRemoveTagFromChat: (conversationId: string, tagId: string) => Promise<boolean>;
  onCreateTag: (name: string) => Promise<Tag | null>;
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onToggleFavorite,
  loading,
  availableTags,
  getTagsForChat,
  onAddTagToChat,
  onRemoveTagFromChat,
  onCreateTag,
}: ChatSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let result = [...conversations];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((conv) =>
        conv.title.toLowerCase().includes(query)
      );
    }
    
    // Filter by mode
    if (modeFilter === "search") {
      result = result.filter((conv) => conv.has_search_messages);
    } else if (modeFilter === "chat") {
      result = result.filter((conv) => !conv.has_search_messages);
    }
    
    // Filter by selected tags
    if (selectedFilterTags.length > 0) {
      result = result.filter((conv) => {
        const chatTags = getTagsForChat(conv.id);
        return selectedFilterTags.every((tagId) =>
          chatTags.some((t) => t.id === tagId)
        );
      });
    }
    
    // Sort
    switch (sortOption) {
      case "recent":
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "favorites":
        result.sort((a, b) => {
          if (a.is_favorite === b.is_favorite) {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          return a.is_favorite ? -1 : 1;
        });
        break;
    }
    
    return result;
  }, [conversations, searchQuery, selectedFilterTags, modeFilter, sortOption, getTagsForChat]);

  const toggleFilterTag = (tagId: string) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedFilterTags([]);
    setModeFilter("all");
  };

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
        <div className="p-3 border-b space-y-2">
          <Button onClick={onNew} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Nuevo chat
          </Button>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {/* Results counter */}
          {(searchQuery || selectedFilterTags.length > 0 || modeFilter !== "all") && (
            <p className="text-[11px] text-muted-foreground px-0.5">
              {filteredConversations.length} de {conversations.length} conversación{conversations.length !== 1 ? "es" : ""}
            </p>
          )}
          
          {/* Mode filter */}
          <div className="flex items-center gap-1">
            <Button
              variant={modeFilter === "all" ? "secondary" : "outline"}
              size="sm"
              className="flex-1 h-7 text-[11px] gap-1"
              onClick={() => setModeFilter("all")}
            >
              Todas
            </Button>
            <Button
              variant={modeFilter === "chat" ? "secondary" : "outline"}
              size="sm"
              className="flex-1 h-7 text-[11px] gap-1"
              onClick={() => setModeFilter("chat")}
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </Button>
            <Button
              variant={modeFilter === "search" ? "secondary" : "outline"}
              size="sm"
              className="flex-1 h-7 text-[11px] gap-1"
              onClick={() => setModeFilter("search")}
            >
              <Globe className="h-3 w-3" />
              Búsqueda
            </Button>
          </div>
          
          {/* Tag filter */}
          <div className="flex items-center gap-1">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedFilterTags.length > 0 ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1 justify-start gap-2 h-8"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="truncate text-xs">
                    {selectedFilterTags.length > 0
                      ? `${selectedFilterTags.length} filtro${selectedFilterTags.length > 1 ? "s" : ""}`
                      : "Filtrar"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Filtrar por etiquetas
                </p>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1">
                    {availableTags.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Sin etiquetas
                      </p>
                    ) : (
                      availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleFilterTag(tag.id)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-2",
                            selectedFilterTags.includes(tag.id)
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag.name}
                          {selectedFilterTags.includes(tag.id) && (
                            <Check className="h-3 w-3 ml-auto" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {selectedFilterTags.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {/* Sort selector */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguas</SelectItem>
              <SelectItem value="alphabetical">Alfabético</SelectItem>
              <SelectItem value="favorites">Favoritos primero</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Active filter badges */}
          {selectedFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedFilterTags.map((tagId) => {
                const tag = availableTags.find((t) => t.id === tagId);
                return tag ? (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 gap-0.5 cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleFilterTag(tag.id)}
                  >
                    {tag.name}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {modeFilter === "search"
                  ? "Sin conversaciones de búsqueda"
                  : modeFilter === "chat"
                  ? "Sin conversaciones de chat"
                  : selectedFilterTags.length > 0
                  ? "Sin conversaciones con esas etiquetas"
                  : "Sin conversaciones"}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex flex-col gap-1 px-2 py-2 rounded-md cursor-pointer transition-colors",
                    selectedId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                  onClick={() => !editingId && onSelect(conv.id)}
                >
                  <div className="flex items-center gap-1.5">
                    {conv.has_search_messages ? (
                      <Globe className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    ) : (
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    )}
                    
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
                          className="h-6 w-6 flex-shrink-0"
                          onClick={handleSaveEdit}
                        >
                          <Check className="h-3 w-3 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-1 min-w-0 overflow-hidden">
                        {conv.is_favorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm flex-1">{conv.title}</span>
                        <div className="flex items-center flex-shrink-0 ml-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(conv.id);
                            }}
                            aria-label={conv.is_favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                          >
                            <Star className={cn("h-3 w-3", conv.is_favorite ? "text-yellow-500 fill-yellow-500" : "")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => handleEditClick(e, conv)}
                            aria-label="Editar conversación"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-destructive"
                            onClick={(e) => handleDeleteClick(e, conv.id)}
                            aria-label="Eliminar conversación"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags row */}
                  {editingId !== conv.id && (
                    <div className="pl-5" onClick={(e) => e.stopPropagation()}>
                      <ChatTagsInput
                        conversationId={conv.id}
                        currentTags={getTagsForChat(conv.id)}
                        availableTags={availableTags}
                        onAddTag={onAddTagToChat}
                        onRemoveTag={onRemoveTagFromChat}
                        onCreateTag={onCreateTag}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
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
