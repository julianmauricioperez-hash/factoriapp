import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Heart, ExternalLink, Bookmark } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import type { PublicPrompt } from "@/hooks/usePublicPrompts";

interface PublicPromptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PublicPrompt | null;
  likeCounts: Record<string, number>;
  userLikes: Record<string, boolean>;
  onLike: (promptId: string) => void;
  onSave: (prompt: PublicPrompt) => void;
  saving: boolean;
}

export function PublicPromptPreviewDialog({
  open,
  onOpenChange,
  prompt,
  likeCounts,
  userLikes,
  onLike,
  onSave,
  saving,
}: PublicPromptPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast({ title: "¡Copiado!", description: "El prompt se copió al portapapeles." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{prompt.category}</Badge>
            {prompt.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
          <DialogTitle className="sr-only">Vista previa del prompt</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {new Date(prompt.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
          <p className="whitespace-pre-wrap text-sm text-foreground pr-4">
            {prompt.prompt_text}
          </p>
        </ScrollArea>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onSave(prompt)}
            disabled={saving}
          >
            <Bookmark className="h-4 w-4" />
            Guardar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${
              userLikes[prompt.id]
                ? "text-red-500 hover:text-red-600"
                : "text-muted-foreground hover:text-red-500"
            }`}
            onClick={() => onLike(prompt.id)}
          >
            <Heart className={`h-4 w-4 ${userLikes[prompt.id] ? "fill-current" : ""}`} />
            {likeCounts[prompt.id] || 0}
          </Button>
          <Link to={`/p/${prompt.public_slug}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-4 w-4" />
              Enlace
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
