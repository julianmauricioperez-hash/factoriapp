import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useCollections } from "@/hooks/useCollections";
import { Plus, Search, X, ArrowUpDown, Download, ChevronLeft, ChevronRight, Star, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PromptCard } from "@/components/PromptCard";
import { AppLayout } from "@/components/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "date-desc" | "date-asc" | "category-asc" | "category-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Más recientes" },
  { value: "date-asc", label: "Más antiguos" },
  { value: "category-asc", label: "Categoría (A-Z)" },
  { value: "category-desc", label: "Categoría (Z-A)" },
];

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

const MyPrompts = () => {
  const { user, loading: authLoading } = useAuth();
  const { categories } = useCategories();
  const { collections } = useCollections();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredAndSortedPrompts = prompts
    .filter((prompt) => {
      const matchesSearch = prompt.prompt_text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || prompt.category === filterCategory;
      const matchesCollection =
        filterCollection === "all" || 
        (filterCollection === "none" && !prompt.collection_id) ||
        prompt.collection_id === filterCollection;
      const matchesFavorite = !showFavoritesOnly || prompt.is_favorite;
      return matchesSearch && matchesCategory && matchesCollection && matchesFavorite;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "category-asc":
          return a.category.localeCompare(b.category);
        case "category-desc":
          return b.category.localeCompare(a.category);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = filteredAndSortedPrompts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterCollection, sortOption, showFavoritesOnly]);

  const toggleFavorite = async (prompt: Prompt) => {
    const newValue = !prompt.is_favorite;
    try {
      const { error } = await supabase
        .from("prompts")
        .update({ is_favorite: newValue })
        .eq("id", prompt.id);

      if (error) throw error;

      setPrompts(
        prompts.map((p) =>
          p.id === prompt.id ? { ...p, is_favorite: newValue } : p
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el favorito.",
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

      setPrompts(
        prompts.map((p) =>
          p.id === promptId ? { ...p, prompt_text: newText } : p
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el prompt.",
        variant: "destructive",
      });
    }
  };

  const handleShareUpdate = (promptId: string, isPublic: boolean, slug: string | null) => {
    setPrompts(
      prompts.map((p) =>
        p.id === promptId ? { ...p, is_public: isPublic, public_slug: slug } : p
      )
    );
  };

  const handleCollectionUpdate = (promptId: string, collectionId: string | null) => {
    setPrompts(
      prompts.map((p) =>
        p.id === promptId ? { ...p, collection_id: collectionId } : p
      )
    );
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  const fetchPrompts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los prompts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditCategory(prompt.category);
    setEditText(prompt.prompt_text);
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt || !editCategory || !editText.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          category: editCategory,
          prompt_text: editText.trim(),
        })
        .eq("id", editingPrompt.id);

      if (error) throw error;

      setPrompts(
        prompts.map((p) =>
          p.id === editingPrompt.id
            ? { ...p, category: editCategory, prompt_text: editText.trim() }
            : p
        )
      );
      setEditingPrompt(null);
      toast({
        title: "¡Actualizado!",
        description: "El prompt se actualizó correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el prompt.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPrompt) return;

    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", deletingPrompt.id);

      if (error) throw error;

      setPrompts(prompts.filter((p) => p.id !== deletingPrompt.id));
      setDeletingPrompt(null);
      toast({
        title: "Eliminado",
        description: "El prompt se eliminó correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el prompt.",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mis-prompts.json";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exportado",
      description: "Tus prompts se exportaron como JSON.",
    });
  };

  const exportToCSV = () => {
    const headers = ["Categoría", "Prompt", "Fecha"];
    const rows = prompts.map((p) => [
      `"${p.category.replace(/"/g, '""')}"`,
      `"${p.prompt_text.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${new Date(p.created_at).toLocaleDateString("es-ES")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mis-prompts.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exportado",
      description: "Tus prompts se exportaron como CSV.",
    });
  };

  if (authLoading || loading) {
    return (
      <AppLayout title="Mis Prompts">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mis Prompts">
      <div className="mx-auto max-w-2xl">
        {/* Mobile Header with Export */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            Mis Prompts
          </h1>
          {prompts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem onClick={exportToJSON}>
                  Exportar como JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV}>
                  Exportar como CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Search and Filter Controls */}
        {prompts.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Search Row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
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
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="shrink-0"
              >
                <Star className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
              </Button>
            </div>
            
            {/* Filter Row */}
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCollection} onValueChange={setFilterCollection}>
                <SelectTrigger className="flex-1 bg-background">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Colección" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="none">Sin colección</SelectItem>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Row */}
            <div className="flex gap-2">
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="flex-1 bg-background">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {prompts.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tienes prompts guardados.
              </p>
              <Button onClick={() => navigate("/")}>
                <Plus className="mr-1 h-4 w-4" />
                Crear primer prompt
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedPrompts.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No se encontraron prompts con esos filtros.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPrompts.map((prompt, index) => (
                <div 
                  key={prompt.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                >
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  onDelete={setDeletingPrompt}
                  onToggleFavorite={toggleFavorite}
                  onShareUpdate={handleShareUpdate}
                  onPromptUpdate={handlePromptUpdate}
                  onCollectionUpdate={handleCollectionUpdate}
                  onDuplicate={(newPrompt) => setPrompts([newPrompt, ...prompts])}
                  collections={collections}
                />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
          <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="edit-category" className="bg-background">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-text">Prompt</Label>
                <Textarea
                  id="edit-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[120px] bg-background"
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setEditingPrompt(null)} disabled={saving} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingPrompt} onOpenChange={() => setDeletingPrompt(null)}>
          <AlertDialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este prompt?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
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

export default MyPrompts;
