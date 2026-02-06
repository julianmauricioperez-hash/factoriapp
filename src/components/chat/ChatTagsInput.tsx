import { useState } from "react";
import { Tag as TagIcon, X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
}

interface ChatTagsInputProps {
  conversationId: string;
  currentTags: Tag[];
  availableTags: Tag[];
  onAddTag: (conversationId: string, tagId: string, tag: Tag) => Promise<boolean>;
  onRemoveTag: (conversationId: string, tagId: string) => Promise<boolean>;
  onCreateTag: (name: string) => Promise<Tag | null>;
}

export function ChatTagsInput({
  conversationId,
  currentTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: ChatTagsInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !currentTags.some((ct) => ct.id === tag.id)
  );

  const handleAddTag = async (tag: Tag) => {
    await onAddTag(conversationId, tag.id, tag);
  };

  const handleRemoveTag = async (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation();
    await onRemoveTag(conversationId, tagId);
  };

  const handleCreateTag = async () => {
    if (!search.trim() || isCreating) return;
    setIsCreating(true);
    const newTag = await onCreateTag(search.trim());
    if (newTag) {
      await onAddTag(conversationId, newTag.id, newTag);
    }
    setSearch("");
    setIsCreating(false);
  };

  const canCreateTag =
    search.trim() &&
    !availableTags.some(
      (t) => t.name.toLowerCase() === search.trim().toLowerCase()
    );

  return (
    <div className="flex flex-wrap items-center gap-1">
      {currentTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-[10px] h-5 px-1.5 gap-0.5"
        >
          {tag.name}
          <button
            onClick={(e) => handleRemoveTag(e, tag.id)}
            className="ml-0.5 hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => e.stopPropagation()}
          >
            <TagIcon className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-2"
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            placeholder="Buscar o crear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreateTag) {
                e.preventDefault();
                handleCreateTag();
              }
            }}
          />
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                >
                  <TagIcon className="h-3 w-3 text-muted-foreground" />
                  {tag.name}
                </button>
              ))}
              {canCreateTag && (
                <button
                  onClick={handleCreateTag}
                  disabled={isCreating}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-primary/10 text-primary flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Crear "{search.trim()}"
                </button>
              )}
              {filteredTags.length === 0 && !canCreateTag && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {currentTags.length === availableTags.length
                    ? "Todas las etiquetas asignadas"
                    : "Sin resultados"}
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
