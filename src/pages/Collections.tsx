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
import { Pencil, Trash2, Plus, FolderOpen } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

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
      <AppLayout title="Colecciones">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Colecciones">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            Mis Colecciones
          </h1>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Nueva</span>
          </Button>
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">{collection.name}</h3>
                      {collection.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
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
          <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
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
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={saving || !newName.trim()} className="w-full sm:w-auto">
                {saving ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
          <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
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
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setEditingCollection(null)} disabled={saving} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={saving || !newName.trim()} className="w-full sm:w-auto">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingCollection} onOpenChange={() => setDeletingCollection(null)}>
          <AlertDialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar "{deletingCollection?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Los prompts en esta colección no serán eliminados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Collections;
