import { useState, useEffect } from "react";
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

interface ShareCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  isPublic: boolean;
  publicSlug: string | null;
  onUpdate: (isPublic: boolean, slug: string | null) => void;
}

export function ShareCollectionDialog({
  open,
  onOpenChange,
  collectionId,
  isPublic,
  publicSlug,
  onUpdate,
}: ShareCollectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [currentSlug, setCurrentSlug] = useState(publicSlug);

  useEffect(() => {
    if (open) {
      setCurrentIsPublic(isPublic);
      setCurrentSlug(publicSlug);
    }
  }, [open, isPublic, publicSlug]);

  const shareUrl = currentSlug
    ? `${window.location.origin}/c/${currentSlug}`
    : null;

  const handleTogglePublic = async (checked: boolean) => {
    setLoading(true);
    try {
      let newSlug = currentSlug;

      if (checked && !currentSlug) {
        const { data: slugData, error: slugError } = await supabase.rpc(
          "generate_collection_slug" as any
        );
        if (slugError) throw slugError;
        newSlug = slugData as string;
      }

      const { error } = await supabase
        .from("collections")
        .update({
          is_public: checked,
          public_slug: checked ? newSlug : currentSlug,
        } as any)
        .eq("id", collectionId);

      if (error) throw error;

      setCurrentIsPublic(checked);
      if (checked && newSlug) {
        setCurrentSlug(newSlug);
      }
      onUpdate(checked, checked ? newSlug : currentSlug);

      toast({
        title: checked ? "Colección publicada" : "Colección privada",
        description: checked
          ? "Ahora cualquiera puede ver esta colección con el enlace."
          : "Esta colección ya no es pública.",
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
          <DialogTitle>Compartir Colección</DialogTitle>
          <DialogDescription>
            Haz pública esta colección para que otros puedan ver todos sus prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="collection-public-toggle" className="text-sm">
              Hacer pública
            </Label>
            <Switch
              id="collection-public-toggle"
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
