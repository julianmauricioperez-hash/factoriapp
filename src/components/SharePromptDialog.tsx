import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, Loader2 } from "lucide-react";

interface SharePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string;
  isPublic: boolean;
  publicSlug: string | null;
  onUpdate: (isPublic: boolean, slug: string | null) => void;
}

export function SharePromptDialog({
  open,
  onOpenChange,
  promptId,
  isPublic,
  publicSlug,
  onUpdate,
}: SharePromptDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [currentSlug, setCurrentSlug] = useState(publicSlug);

  const shareUrl = currentSlug
    ? `${window.location.origin}/p/${currentSlug}`
    : null;

  const handleTogglePublic = async (checked: boolean) => {
    setLoading(true);
    try {
      let newSlug = currentSlug;

      if (checked && !currentSlug) {
        // Generate a new slug
        const { data: slugData, error: slugError } = await supabase.rpc(
          "generate_prompt_slug"
        );
        if (slugError) throw slugError;
        newSlug = slugData;
      }

      const { error } = await supabase
        .from("prompts")
        .update({
          is_public: checked,
          public_slug: checked ? newSlug : currentSlug,
        })
        .eq("id", promptId);

      if (error) throw error;

      setCurrentIsPublic(checked);
      if (checked && newSlug) {
        setCurrentSlug(newSlug);
      }
      onUpdate(checked, checked ? newSlug : currentSlug);

      toast({
        title: checked ? "Prompt publicado" : "Prompt privado",
        description: checked
          ? "Ahora cualquiera puede ver este prompt con el enlace."
          : "Este prompt ya no es público.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de compartir.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "¡Link copiado!",
        description: "El enlace para compartir se copió al portapapeles.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Prompt</DialogTitle>
          <DialogDescription>
            Haz público este prompt para que otros puedan verlo y usarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="public-toggle" className="text-sm">
              Hacer público
            </Label>
            <Switch
              id="public-toggle"
              checked={currentIsPublic}
              onCheckedChange={handleTogglePublic}
              disabled={loading}
            />
          </div>

          {currentIsPublic && shareUrl && (
            <div className="space-y-2">
              <Label className="text-sm">Enlace para compartir</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="bg-muted text-sm"
                />
                <Button variant="outline" size="icon" onClick={copyShareLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(shareUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
