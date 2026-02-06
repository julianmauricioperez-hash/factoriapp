import { useState } from "react";
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
import { Search, Copy, X, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";

const PublicLibrary = () => {
  const { prompts, loading } = usePublicPrompts();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = [...new Set(prompts.map((p) => p.category))].sort();

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.prompt_text
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || prompt.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
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
          <div className="space-y-3">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Badge variant="secondary">{prompt.category}</Badge>
                    <div className="flex gap-1">
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
        )}
      </div>
    </AppLayout>
  );
};

export default PublicLibrary;
