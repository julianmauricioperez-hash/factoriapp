import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useCollections, Collection } from "@/hooks/useCollections";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Plus, FolderOpen, ChevronRight, Download, FileText, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { COLLECTION_COLORS, getColorClasses } from "@/lib/collectionColors";
import { PromptCard } from "@/components/PromptCard";

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

const Collections = () => {
  const { user, loading: authLoading } = useAuth();
  const { collections, loading, addCollection, updateCollection, deleteCollection, refetch } = useCollections();
  const navigate = useNavigate();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<{ id: string; name: string } | null>(null);
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);
  const [collectionPrompts, setCollectionPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("slate");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchCollectionPrompts = async (collectionId: string) => {
    setLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setCollectionPrompts(data || []);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los prompts.",
        variant: "destructive",
      });
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleViewCollection = (collection: Collection) => {
    setViewingCollection(collection);
    fetchCollectionPrompts(collection.id);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    
    setSaving(true);
    const result = await addCollection(newName, newDescription, newColor);
    
    if (result) {
      toast({
        title: "¡Colección creada!",
        description: `Se creó la colección "${newName}".`,
      });
      setNewName("");
      setNewDescription("");
      setNewColor("slate");
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
    const success = await updateCollection(editingCollection.id, newName, newDescription, newColor);
    
    if (success) {
      toast({
        title: "¡Actualizado!",
        description: "La colección se actualizó correctamente.",
      });
      setEditingCollection(null);
      setNewName("");
      setNewDescription("");
      setNewColor("slate");
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

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || "");
    setNewColor(collection.color || "slate");
  };

  const exportCollectionJSON = async (collection: Collection) => {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("category, prompt_text, created_at")
        .eq("collection_id", collection.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const exportData = {
        collection: collection.name,
        description: collection.description,
        exported_at: new Date().toISOString(),
        prompts: data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collection.name.replace(/\s+/g, "-").toLowerCase()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exportado",
        description: `La colección "${collection.name}" se exportó como JSON.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar la colección.",
        variant: "destructive",
      });
    }
  };

  const exportCollectionCSV = async (collection: Collection) => {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("category, prompt_text, created_at")
        .eq("collection_id", collection.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const headers = ["Categoría", "Prompt", "Fecha"];
      const rows = (data || []).map((p) => [
        `"${p.category.replace(/"/g, '""')}"`,
        `"${p.prompt_text.replace(/"/g, '""').replace(/\n/g, " ")}"`,
        `"${new Date(p.created_at).toLocaleDateString("es-ES")}"`,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collection.name.replace(/\s+/g, "-").toLowerCase()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exportado",
        description: `La colección "${collection.name}" se exportó como CSV.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar la colección.",
        variant: "destructive",
      });
    }
  };

  const handlePromptUpdate = async (promptId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ prompt_text: newText })
        .eq("id", promptId);

      if (error) throw error;

      setCollectionPrompts((prev) =>
        prev.map((p) => (p.id === promptId ? { ...p, prompt_text: newText } : p))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el prompt.",
        variant: "destructive",
      });
    }
  };

  const handleCollectionUpdateForPrompt = async (promptId: string, collectionId: string | null) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ collection_id: collectionId })
        .eq("id", promptId);

      if (error) throw error;

      // Remove from current view if moved to different collection
      if (collectionId !== viewingCollection?.id) {
        setCollectionPrompts((prev) => prev.filter((p) => p.id !== promptId));
      }
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo mover el prompt.",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (prompt: Prompt) => {
    const newValue = !prompt.is_favorite;
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ is_favorite: newValue })
        .eq("id", prompt.id);

      if (error) throw error;

      setCollectionPrompts((prev) =>
        prev.map((p) => (p.id === prompt.id ? { ...p, is_favorite: newValue } : p))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el favorito.",
        variant: "destructive",
      });
    }
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
            {collections.map((collection) => {
              const colorClasses = getColorClasses(collection.color);
              return (
                <Card 
                  key={collection.id} 
                  className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 ${colorClasses.border}`}
                  onClick={() => handleViewCollection(collection)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colorClasses.bg}`} />
                          <h3 className="font-medium text-foreground truncate">{collection.name}</h3>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {collection.prompt_count} {collection.prompt_count === 1 ? "prompt" : "prompts"}
                          </Badge>
                        </div>
                        {collection.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 ml-5">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); exportCollectionJSON(collection); }}
                          title="Exportar JSON"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(collection); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingCollection({ id: collection.id, name: collection.name }); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* View Collection Dialog */}
        <Dialog open={!!viewingCollection} onOpenChange={() => setViewingCollection(null)}>
          <DialogContent className="bg-background max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewingCollection && (
                  <>
                    <div className={`w-3 h-3 rounded-full ${getColorClasses(viewingCollection.color).bg}`} />
                    {viewingCollection.name}
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {loadingPrompts ? (
                <p className="text-center text-muted-foreground py-8">Cargando prompts...</p>
              ) : collectionPrompts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Esta colección está vacía.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Añade prompts desde "Mis Prompts".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collectionPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleFavorite={toggleFavorite}
                      onPromptUpdate={handlePromptUpdate}
                      onCollectionUpdate={handleCollectionUpdateForPrompt}
                      collections={collections}
                    />
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => exportCollectionCSV(viewingCollection!)} disabled={collectionPrompts.length === 0}>
                <Download className="mr-1 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => setViewingCollection(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewColor(color.name)}
                      className={`w-6 h-6 rounded-full ${color.bg} transition-transform ${
                        newColor === color.name ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
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
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setNewColor(color.name)}
                      className={`w-6 h-6 rounded-full ${color.bg} transition-transform ${
                        newColor === color.name ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
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
