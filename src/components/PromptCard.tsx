import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Star, Copy, Check, Braces, Share2, Sparkles, FolderOpen, MessageSquare, Files } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VariableDialog, hasVariables } from "./VariableDialog";
import { SharePromptDialog } from "./SharePromptDialog";
import { ImprovePromptDialog } from "./ImprovePromptDialog";
import { CollectionDialog } from "./CollectionDialog";
import { TagsInput } from "./TagsInput";
import { supabase } from "@/integrations/supabase/client";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface Tag {
  id: string;
  name: string;
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
  onDuplicate?: (newPrompt: Prompt) => void;
  collections?: Collection[];
  // Tags props
  promptTags?: Tag[];
  availableTags?: Tag[];
  onAddTag?: (promptId: string, tagId: string) => Promise<boolean>;
  onRemoveTag?: (promptId: string, tagId: string) => Promise<boolean>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
}

export const PromptCard = ({ 
  prompt, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onShareUpdate, 
  onPromptUpdate,
  onCollectionUpdate,
  onDuplicate,
  collections = [],
  promptTags = [],
  availableTags = [],
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: PromptCardProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
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

  const handleDuplicate = async () => {
    if (duplicating) return;
    setDuplicating(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para duplicar prompts.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("prompts")
        .insert({
          category: prompt.category,
          prompt_text: prompt.prompt_text,
          is_favorite: false,
          is_public: false,
          user_id: userData.user.id,
          collection_id: prompt.collection_id,
        })
        .select()
        .single();

      if (error) throw error;

      if (onDuplicate && data) {
        onDuplicate(data);
      }

      toast({
        title: "¡Duplicado!",
        description: "El prompt se duplicó correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo duplicar el prompt.",
        variant: "destructive",
      });
    } finally {
      setDuplicating(false);
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
        <CardHeader className="pb-2 space-y-3">
          {/* Top row: Category badges */}
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
          
          {/* Bottom row: Date and Actions */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground shrink-0">
              {new Date(prompt.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleTestWithAI}
                title="Probar con IA"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => setShowImproveDialog(true)}
                title="Mejorar con IA"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => setShowCollectionDialog(true)}
                title={currentCollection ? `En: ${currentCollection.name}` : "Mover a colección"}
              >
                <FolderOpen className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${currentCollection ? "text-primary" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => setShowShareDialog(true)}
                title={prompt.is_public ? "Compartido públicamente" : "Compartir"}
              >
                <Share2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${prompt.is_public ? "text-primary" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => onToggleFavorite(prompt)}
              >
                <Star
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                    prompt.is_favorite
                      ? "fill-yellow-400 text-yellow-400"
                      : ""
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleCopy}
                title={promptHasVars ? "Completar variables y copiar" : "Copiar"}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleDuplicate}
                disabled={duplicating}
                title="Duplicar prompt"
              >
                <Files className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => onEdit(prompt)}
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(prompt)}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {renderPromptText(prompt.prompt_text)}
          </p>
          
          {/* Tags section */}
          {onAddTag && onRemoveTag && onCreateTag && (
            <TagsInput
              tags={promptTags}
              availableTags={availableTags}
              onAddTag={(tagId) => onAddTag(prompt.id, tagId)}
              onRemoveTag={(tagId) => onRemoveTag(prompt.id, tagId)}
              onCreateTag={onCreateTag}
            />
          )}
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
