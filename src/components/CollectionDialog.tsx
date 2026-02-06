import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FolderOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string;
  currentCollectionId: string | null;
  collections: Collection[];
  onUpdate: (collectionId: string | null) => void;
}

export function CollectionDialog({
  open,
  onOpenChange,
  promptId,
  currentCollectionId,
  collections,
  onUpdate,
}: CollectionDialogProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>(
    currentCollectionId || "none"
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newCollectionId = selectedCollection === "none" ? null : selectedCollection;
      
      const { error } = await supabase
        .from("prompts")
        .update({ collection_id: newCollectionId })
        .eq("id", promptId);

      if (error) throw error;

      onUpdate(newCollectionId);
      
      const collectionName = collections.find(c => c.id === newCollectionId)?.name;
      toast({
        title: newCollectionId ? "¡Movido!" : "¡Removido!",
        description: newCollectionId 
          ? `El prompt se movió a "${collectionName}".`
          : "El prompt se removió de la colección.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating collection:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la colección.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentCollection = collections.find(c => c.id === currentCollectionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Mover a Colección
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {currentCollectionId && currentCollection && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="text-xs text-muted-foreground">Colección actual</p>
                <p className="font-medium">{currentCollection.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCollection("none")}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Quitar
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="collection">Seleccionar colección</Label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger id="collection" className="bg-background">
                <SelectValue placeholder="Selecciona una colección" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">
                  <span className="text-muted-foreground">Sin colección</span>
                </SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {collections.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No tienes colecciones. Crea una desde el menú de Colecciones.
              </p>
            )}
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
            disabled={saving || selectedCollection === (currentCollectionId || "none")}
            className="w-full sm:w-auto"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
