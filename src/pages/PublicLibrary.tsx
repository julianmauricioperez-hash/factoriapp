import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { usePublicPrompts } from "@/hooks/usePublicPrompts";
import { usePromptLikes } from "@/hooks/usePromptLikes";
import { useAuth } from "@/hooks/useAuth";
import { Search, Copy, X, BookOpen, ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

type SortOption = "date-desc" | "date-asc" | "category-asc" | "category-desc" | "likes-desc";

const ITEMS_PER_PAGE = 10;

const PublicLibrary = () => {
  const { prompts, loading } = usePublicPrompts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Get all prompt IDs for likes hook
  const promptIds = useMemo(() => prompts.map((p) => p.id), [prompts]);
  const { likeCounts, userLikes, toggleLike } = usePromptLikes(promptIds);

  const categories = [...new Set(prompts.map((p) => p.category))].sort();

  const filteredPrompts = prompts
    .filter((prompt) => {
      const matchesSearch = prompt.prompt_text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || prompt.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "category-asc":
          return a.category.localeCompare(b.category);
        case "category-desc":
          return b.category.localeCompare(a.category);
        case "likes-desc":
          return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
        default:
          return 0;
      }
    });

  const hasActiveFilters = searchQuery !== "" || filterCategory !== "all";
  const isFiltered = filteredPrompts.length !== prompts.length;

  // Pagination
  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPrompts = filteredPrompts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setCurrentPage(1);
  };

  const handleLike = async (promptId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para dar like.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    await toggleLike(promptId);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "¡Copiado!",
      description: "El prompt se copió al portapapeles.",
    });
  };

  if (loading) {
    return (
      <AppLayout title="Biblioteca">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando biblioteca...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Biblioteca">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            Biblioteca Pública
          </h1>
        </div>

        <p className="mb-4 text-sm text-muted-foreground md:text-base">
          Explora prompts compartidos por la comunidad.
        </p>

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar prompts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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
          <Select value={filterCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background">
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
          <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="likes-desc">Más populares</SelectItem>
              <SelectItem value="date-desc">Más recientes</SelectItem>
              <SelectItem value="date-asc">Más antiguos</SelectItem>
              <SelectItem value="category-asc">Categoría A-Z</SelectItem>
              <SelectItem value="category-desc">Categoría Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results counter and active filters indicator */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {filteredPrompts.length === 0 ? (
                "Sin resultados"
              ) : filteredPrompts.length === 1 ? (
                "1 prompt encontrado"
              ) : (
                `${filteredPrompts.length} prompts encontrados`
              )}
              {isFiltered && prompts.length > 0 && (
                <span className="text-muted-foreground/70"> de {prompts.length}</span>
              )}
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {filteredPrompts.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {prompts.length === 0
                  ? "Aún no hay prompts públicos."
                  : "No se encontraron prompts con esos filtros."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPrompts.map((prompt) => (
                <Card key={prompt.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge variant="secondary">{prompt.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 gap-1 px-2 ${
                            userLikes[prompt.id]
                              ? "text-red-500 hover:text-red-600"
                              : "text-muted-foreground hover:text-red-500"
                          }`}
                          onClick={() => handleLike(prompt.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${userLikes[prompt.id] ? "fill-current" : ""}`}
                          />
                          <span className="text-xs">{likeCounts[prompt.id] || 0}</span>
                        </Button>
                        <Link to={`/p/${prompt.public_slug}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(prompt.prompt_text)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground line-clamp-4">
                      {prompt.prompt_text}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(prompt.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
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
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first, last, current, and adjacent pages
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <span key={page} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-1 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </span>
                    ))}
                </div>
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
      </div>
    </AppLayout>
  );
};

export default PublicLibrary;
