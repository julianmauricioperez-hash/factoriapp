import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useTags } from "@/hooks/useTags";
import { AppLayout } from "@/components/AppLayout";
import { Tag, Plus, Trash2, Search, X, Loader2 } from "lucide-react";

const Tags = () => {
  const { user, loading: authLoading } = useAuth();
  const { tags, loading, createTag, deleteTag, refetch } = useTags();
  const navigate = useNavigate();
  
  const [newTagName, setNewTagName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingTag, setDeletingTag] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setCreating(true);
    const result = await createTag(newTagName.trim());
    setCreating(false);
    
    if (result) {
      toast({
        title: "¡Etiqueta creada!",
        description: `La etiqueta "${result.name}" se creó correctamente.`,
      });
      setNewTagName("");
    } else {
      toast({
        title: "Error",
        description: "No se pudo crear la etiqueta. Puede que ya exista.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    
    setDeleting(true);
    const success = await deleteTag(deletingTag.id);
    setDeleting(false);
    
    if (success) {
      toast({
        title: "Etiqueta eliminada",
        description: `La etiqueta "${deletingTag.name}" se eliminó correctamente.`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta.",
        variant: "destructive",
      });
    }
    setDeletingTag(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagName.trim()) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout title="Etiquetas">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Etiquetas">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground md:text-2xl flex items-center gap-2">
            <Tag className="h-5 w-5 md:h-6 md:w-6" />
            Gestionar Etiquetas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea y organiza etiquetas para clasificar tus prompts
          </p>
        </div>

        {/* Create new tag */}
        <Card className="mb-6 border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva etiqueta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la etiqueta..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={creating}
                className="flex-1"
              />
              <Button
                onClick={handleCreateTag}
                disabled={creating || !newTagName.trim()}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Crear
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        {tags.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Tags list */}
        {tags.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">
                Aún no tienes etiquetas
              </p>
              <p className="text-sm text-muted-foreground">
                Crea tu primera etiqueta para organizar tus prompts
              </p>
            </CardContent>
          </Card>
        ) : filteredTags.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No se encontraron etiquetas con "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-sm">
            <CardContent className="py-4">
              <div className="space-y-2">
                {filteredTags.map((tag, index) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        {tag.name}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingTag(tag)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  {tags.length} {tags.length === 1 ? "etiqueta" : "etiquetas"} en total
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deletingTag} onOpenChange={() => setDeletingTag(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar etiqueta?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará la etiqueta "{deletingTag?.name}" y se quitará de todos los prompts que la tengan asignada. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTag}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Tags;
