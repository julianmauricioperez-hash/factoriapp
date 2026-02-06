import { useState, useRef, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagItem {
  id: string;
  name: string;
}

interface TagsInputProps {
  tags: TagItem[];
  availableTags: TagItem[];
  onAddTag: (tagId: string) => Promise<boolean>;
  onRemoveTag: (tagId: string) => Promise<boolean>;
  onCreateTag: (name: string) => Promise<TagItem | null>;
  disabled?: boolean;
}

export function TagsInput({
  tags,
  availableTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  disabled = false,
}: TagsInputProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter available tags that are not already added
  const filteredTags = availableTags.filter(
    (t) => !tags.some((pt) => pt.id === t.id)
  );

  // Further filter by search
  const searchFilteredTags = filteredTags.filter((t) =>
    t.name.toLowerCase().includes(newTagName.toLowerCase())
  );

  const handleAddExisting = async (tagId: string) => {
    setLoading(true);
    await onAddTag(tagId);
    setLoading(false);
    setNewTagName("");
  };

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return;
    setLoading(true);
    const newTag = await onCreateTag(newTagName.trim());
    if (newTag) {
      await onAddTag(newTag.id);
    }
    setLoading(false);
    setNewTagName("");
  };

  const handleRemove = async (tagId: string) => {
    setLoading(true);
    await onRemoveTag(tagId);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagName.trim()) {
      e.preventDefault();
      // If there's an exact match, add it; otherwise create new
      const exactMatch = searchFilteredTags.find(
        (t) => t.name.toLowerCase() === newTagName.toLowerCase()
      );
      if (exactMatch) {
        handleAddExisting(exactMatch.id);
      } else {
        handleCreateAndAdd();
      }
    }
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-0.5 text-xs animate-scale-in"
        >
          {tag.name}
          <button
            type="button"
            onClick={() => handleRemove(tag.id)}
            disabled={disabled || loading}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Tag className="h-3 w-3 mr-1" />
            {tags.length === 0 ? "Añadir etiqueta" : <Plus className="h-3 w-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <Input
            ref={inputRef}
            placeholder="Buscar o crear..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm mb-2"
            disabled={loading}
          />

          <div className="max-h-32 overflow-y-auto space-y-1">
            {searchFilteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddExisting(tag.id)}
                disabled={loading}
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
              >
                {tag.name}
              </button>
            ))}

            {newTagName.trim() &&
              !searchFilteredTags.some(
                (t) => t.name.toLowerCase() === newTagName.toLowerCase()
              ) && (
                <button
                  type="button"
                  onClick={handleCreateAndAdd}
                  disabled={loading}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-primary"
                >
                  <Plus className="h-3 w-3 inline mr-1" />
                  Crear "{newTagName.trim()}"
                </button>
              )}

            {searchFilteredTags.length === 0 && !newTagName.trim() && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                Escribe para crear una etiqueta
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
