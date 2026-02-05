import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCollections } from "@/hooks/useCollections";
import { Pencil, Trash2, Plus, ArrowLeft, FolderOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Collections = () => {
  const { user, loading: authLoading } = useAuth();
  const { collections, loading, addCollection, updateCollection, deleteCollection } = useCollections();
  const navigate = useNavigate();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    
    setSaving(true);
    const result = await addCollection(newName, newDescription);
    
    if (result) {
      toast({
        title: "¡Colección creada!",
        description: `Se creó la colección "${newName}".`,
      });
      setNewName("");
      setNewDescription("");
      setShowAddDialog(false);
    } else {
      toast({
        title: "Error",
        description: "La colección ya existe o no se pudo crear.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editingCollection || !newName.trim()) return;
    
    setSaving(true);
    const success = await updateCollection(editingCollection.id, newName, newDescription);
    
    if (success) {
      toast({
        title: "¡Actualizado!",
        description: "La colección se actualizó correctamente.",
      });
      setEditingCollection(null);
      setNewName("");
      setNewDescription("");
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la colección.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingCollection) return;
    
    const success = await deleteCollection(deletingCollection.id);
    
    if (success) {
      toast({
        title: "Eliminada",
        description: "La colección se eliminó correctamente.",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar la colección.",
        variant: "destructive",
      });
    }
    setDeletingCollection(null);
  };

  const openEditDialog = (collection: { id: string; name: string; description: string | null }) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || "");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/my-prompts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Mis Colecciones</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nueva
            </Button>
          </div>
        </div>

        {collections.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Aún no tienes colecciones.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Crear primera colección
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <Card key={collection.id} className="border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{collection.name}</h3>
                      {collection.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(collection)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingCollection({ id: collection.id, name: collection.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Nueva Colección</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Prompts de Marketing"
                  className="bg-background"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe esta colección..."
                  className="bg-background"
                  maxLength={200}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={saving || !newName.trim()}>
                {saving ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Editar Colección</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-background"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción (opcional)</Label>
                <Textarea
                  id="edit-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="bg-background"
                  maxLength={200}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCollection(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={saving || !newName.trim()}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingCollection} onOpenChange={() => setDeletingCollection(null)}>
          <AlertDialogContent className="bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar "{deletingCollection?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Los prompts en esta colección no serán eliminados, solo se desasociarán.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Collections;
