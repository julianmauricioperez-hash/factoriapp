import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Star, Copy, Check, Braces, Share2, Sparkles, FolderOpen, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VariableDialog, hasVariables } from "./VariableDialog";
import { SharePromptDialog } from "./SharePromptDialog";
import { ImprovePromptDialog } from "./ImprovePromptDialog";
import { CollectionDialog } from "./CollectionDialog";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface Prompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
  is_favorite: boolean;
  is_public?: boolean;
  public_slug?: string | null;
  collection_id?: string | null;
}

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
  onShareUpdate?: (promptId: string, isPublic: boolean, slug: string | null) => void;
  onPromptUpdate?: (promptId: string, newText: string) => void;
  onCollectionUpdate?: (promptId: string, collectionId: string | null) => void;
  collections?: Collection[];
}

export const PromptCard = ({ 
  prompt, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onShareUpdate, 
  onPromptUpdate,
  onCollectionUpdate,
  collections = []
}: PromptCardProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);

  const handleTestWithAI = () => {
    navigate(`/chat?prompt=${encodeURIComponent(prompt.prompt_text)}`);
  };

  const promptHasVars = hasVariables(prompt.prompt_text);
  const currentCollection = collections.find(c => c.id === prompt.collection_id);
  
  const handleShareUpdate = (isPublic: boolean, slug: string | null) => {
    if (onShareUpdate) {
      onShareUpdate(prompt.id, isPublic, slug);
    }
  };

  const handleApplyImprovement = (improvedText: string) => {
    if (onPromptUpdate) {
      onPromptUpdate(prompt.id, improvedText);
    }
  };

  const handleCollectionUpdate = (collectionId: string | null) => {
    if (onCollectionUpdate) {
      onCollectionUpdate(prompt.id, collectionId);
    }
  };

  const handleCopy = async () => {
    if (promptHasVars) {
      setShowVariableDialog(true);
      return;
    }

    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast({
      title: "¡Copiado!",
      description: "El prompt se copió al portapapeles.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Highlight variables in the prompt text
  const renderPromptText = (text: string) => {
    if (!promptHasVars) {
      return <span>{text}</span>;
    }

    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (/^\{\{[^}]+\}\}$/.test(part)) {
        return (
          <span
            key={index}
            className="bg-primary/20 text-primary px-1 rounded font-medium"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {prompt.category}
                </span>
                {currentCollection && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <FolderOpen className="h-3 w-3" />
                    {currentCollection.name}
                  </span>
                )}
                {promptHasVars && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Braces className="h-3 w-3" />
                    Variables
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(prompt.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleTestWithAI}
                title="Probar con IA"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowImproveDialog(true)}
                title="Mejorar con IA"
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCollectionDialog(true)}
                title={currentCollection ? `En: ${currentCollection.name}` : "Mover a colección"}
              >
                <FolderOpen className={`h-4 w-4 ${currentCollection ? "text-primary" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowShareDialog(true)}
                title={prompt.is_public ? "Compartido públicamente" : "Compartir"}
              >
                <Share2 className={`h-4 w-4 ${prompt.is_public ? "text-primary" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onToggleFavorite(prompt)}
              >
                <Star
                  className={`h-4 w-4 ${
                    prompt.is_favorite
                      ? "fill-yellow-400 text-yellow-400"
                      : ""
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                title={promptHasVars ? "Completar variables y copiar" : "Copiar"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(prompt)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(prompt)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {renderPromptText(prompt.prompt_text)}
          </p>
        </CardContent>
      </Card>

      <VariableDialog
        open={showVariableDialog}
        onOpenChange={setShowVariableDialog}
        promptText={prompt.prompt_text}
      />

      <SharePromptDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        promptId={prompt.id}
        isPublic={prompt.is_public || false}
        publicSlug={prompt.public_slug || null}
        onUpdate={handleShareUpdate}
      />

      <ImprovePromptDialog
        open={showImproveDialog}
        onOpenChange={setShowImproveDialog}
        promptText={prompt.prompt_text}
        category={prompt.category}
        onApplyImprovement={onPromptUpdate ? handleApplyImprovement : undefined}
      />

      <CollectionDialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
        promptId={prompt.id}
        currentCollectionId={prompt.collection_id || null}
        collections={collections}
        onUpdate={handleCollectionUpdate}
      />
    </>
  );
};
