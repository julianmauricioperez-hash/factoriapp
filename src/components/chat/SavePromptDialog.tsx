import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SavePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText: string;
}

export function SavePromptDialog({ open, onOpenChange, initialText }: SavePromptDialogProps) {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [category, setCategory] = useState("");
  const [promptText, setPromptText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !category || !promptText.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona una categoría y escribe el prompt.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("prompts").insert({
        category,
        prompt_text: promptText.trim(),
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "¡Prompt guardado!",
        description: "El prompt se ha añadido a tu biblioteca.",
      });
      onOpenChange(false);
      setCategory("");
      setPromptText("");
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el prompt.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update promptText when initialText changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPromptText(initialText);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Guardar en biblioteca</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="save-category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="save-category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="save-prompt-text">Prompt</Label>
            <Textarea
              id="save-prompt-text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="min-h-[120px] resize-none"
              placeholder="Texto del prompt..."
            />
            <p className="text-xs text-muted-foreground">
              {promptText.length} caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !category || !promptText.trim()}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
