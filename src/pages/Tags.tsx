import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTags, TagWithUsage } from "@/hooks/useTags";
import { useCollections } from "@/hooks/useCollections";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { COLLECTION_COLORS, getColorClasses } from "@/lib/collectionColors";
import { PromptCard } from "@/components/PromptCard";
import {
  Tag,
  Plus,
  Trash2,
  Search,
  X,
  Loader2,
  Pencil,
  Check,
  Palette,
  ArrowUpDown,
  FileText,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

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

type SortOption = "name-asc" | "name-desc" | "date" | "usage";

const Tags = () => {
  const { user, loading: authLoading } = useAuth();
  const { tagsWithUsage, loading, createTag, updateTag, deleteTag, refetch } = useTags();
  const { collections } = useCollections();
  const navigate = useNavigate();

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("slate");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingTag, setDeletingTag] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  // States for viewing tag prompts
  const [viewingTag, setViewingTag] = useState<TagWithUsage | null>(null);
  const [tagPrompts, setTagPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const filteredTags = tagsWithUsage
    .filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date":
          return 0;
        case "usage":
          return (b.promptCount + b.chatCount) - (a.promptCount + a.chatCount);
        default:
          return 0;
      }
    });

  const fetchTagPrompts = async (tagId: string) => {
    setLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from("prompt_tags")
        .select("prompt_id, prompts(id, category, prompt_text, created_at, is_favorite, is_public, public_slug, collection_id)")
        .eq("tag_id", tagId);

      if (error) throw error;

      const prompts: Prompt[] = (data || [])
        .map((pt: any) => pt.prompts)
        .filter(Boolean)
        .sort((a: Prompt, b: Prompt) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTagPrompts(prompts);
    } catch (error) {
      console.error("Error fetching tag prompts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los prompts.",
        variant: "destructive",
      });
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleViewTag = (tag: TagWithUsage) => {
    setViewingTag(tag);
    fetchTagPrompts(tag.id);
  };

  const handlePromptUpdate = async (promptId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ prompt_text: newText })
        .eq("id", promptId);

      if (error) throw error;

      setTagPrompts((prev) =>
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

  const toggleFavorite = async (prompt: Prompt) => {
    const newValue = !prompt.is_favorite;
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ is_favorite: newValue })
        .eq("id", prompt.id);

      if (error) throw error;

      setTagPrompts((prev) =>
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

  const handleCollectionUpdateForPrompt = async (promptId: string, collectionId: string | null) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ collection_id: collectionId })
        .eq("id", promptId);

      if (error) throw error;

      setTagPrompts((prev) =>
        prev.map((p) => (p.id === promptId ? { ...p, collection_id: collectionId } : p))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo mover el prompt.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    const result = await createTag(newTagName.trim(), newTagColor);
    setCreating(false);

    if (result) {
      toast({
        title: "¡Etiqueta creada!",
        description: `La etiqueta "${result.name}" se creó correctamente.`,
      });
      setNewTagName("");
      setNewTagColor("slate");
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

  const handleStartEdit = (tag: TagWithUsage) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editName.trim()) return;

    const success = await updateTag(tagId, { name: editName.trim() });
    if (success) {
      toast({ title: "Etiqueta actualizada", description: "El nombre se actualizó correctamente." });
    } else {
      toast({ title: "Error", description: "No se pudo actualizar la etiqueta.", variant: "destructive" });
    }
    setEditingTag(null);
  };

  const handleColorChange = async (tagId: string, color: string) => {
    const success = await updateTag(tagId, { color });
    if (!success) {
      toast({ title: "Error", description: "No se pudo cambiar el color.", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagName.trim()) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, tagId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(tagId);
    }
    if (e.key === "Escape") {
      setEditingTag(null);
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
              {/* Color picker for new tag */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <div className={`w-4 h-4 rounded-full ${getColorClasses(newTagColor).bg}`} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="grid grid-cols-6 gap-2">
                    {COLLECTION_COLORS.map((color) => (
                      <button
                        key={color.name}
                        className={`w-7 h-7 rounded-full ${color.bg} transition-transform hover:scale-110 ${
                          newTagColor === color.name ? "ring-2 ring-offset-2 ring-primary" : ""
                        }`}
                        onClick={() => setNewTagColor(color.name)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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

        {/* Search + Sort */}
        {tagsWithUsage.length > 0 && (
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
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
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px] shrink-0">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                <SelectItem value="usage">Más usadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tags list */}
        {tagsWithUsage.length === 0 ? (
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
              <div className="space-y-1">
                {filteredTags.map((tag, index) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in group cursor-pointer"
                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
                    onClick={() => handleViewTag(tag)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Color dot with picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={`w-3.5 h-3.5 rounded-full shrink-0 ${getColorClasses(tag.color).bg} transition-transform hover:scale-125`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <div className="grid grid-cols-6 gap-2">
                            {COLLECTION_COLORS.map((color) => (
                              <button
                                key={color.name}
                                className={`w-7 h-7 rounded-full ${color.bg} transition-transform hover:scale-110 ${
                                  tag.color === color.name ? "ring-2 ring-offset-2 ring-primary" : ""
                                }`}
                                onClick={(e) => { e.stopPropagation(); handleColorChange(tag.id, color.name); }}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Name (editable) */}
                      {editingTag === tag.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, tag.id)}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={(e) => { e.stopPropagation(); handleSaveEdit(tag.id); }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setEditingTag(null); }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium truncate">{tag.name}</span>
                      )}

                      {/* Usage badges */}
                      {editingTag !== tag.id && (
                        <div className="flex items-center gap-2 shrink-0">
                          {tag.promptCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {tag.promptCount}
                            </span>
                          )}
                          {tag.chatCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {tag.chatCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {editingTag !== tag.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(tag); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); setDeletingTag(tag); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  {tagsWithUsage.length} {tagsWithUsage.length === 1 ? "etiqueta" : "etiquetas"} en total
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Tag Prompts Dialog */}
        <Dialog open={!!viewingTag} onOpenChange={() => setViewingTag(null)}>
          <DialogContent className="bg-background max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewingTag && (
                  <>
                    <div className={`w-3 h-3 rounded-full ${getColorClasses(viewingTag.color).bg}`} />
                    {viewingTag.name}
                    <Badge variant="secondary" className="text-xs ml-1">
                      {viewingTag.promptCount} {viewingTag.promptCount === 1 ? "prompt" : "prompts"}
                    </Badge>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {loadingPrompts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tagPrompts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Esta etiqueta no tiene prompts asignados.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Asigna esta etiqueta a tus prompts desde "Mis Prompts".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tagPrompts.map((prompt) => (
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingTag(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
