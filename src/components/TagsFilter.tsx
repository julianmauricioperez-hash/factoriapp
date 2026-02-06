import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
}

interface TagsFilterProps {
  tags: TagItem[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
}

export function TagsFilter({ tags, selectedTags, onToggleTag }: TagsFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className="cursor-pointer text-xs transition-all hover:scale-105"
            onClick={() => onToggleTag(tag.id)}
          >
            {tag.name}
          </Badge>
        );
      })}
    </div>
  );
}
