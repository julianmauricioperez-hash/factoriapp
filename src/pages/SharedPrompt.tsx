import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePublicPromptBySlug } from "@/hooks/usePublicPrompts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Copy, ArrowLeft, BookOpen, Share2 } from "lucide-react";

const SharedPrompt = () => {
  const { slug } = useParams<{ slug: string }>();
  const { prompt, loading, notFound } = usePublicPromptBySlug(slug);
  const navigate = useNavigate();

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "¡Copiado!",
      description: "El prompt se copió al portapapeles.",
    });
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: "¡Link copiado!",
      description: "El enlace para compartir se copió al portapapeles.",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando prompt...</p>
      </div>
    );
  }

  if (notFound || !prompt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border shadow-sm">
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Prompt no encontrado
            </h2>
            <p className="mb-4 text-muted-foreground">
              Este prompt no existe o ya no está disponible públicamente.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => navigate("/library")}>
                <BookOpen className="mr-1 h-4 w-4" />
                Explorar biblioteca
              </Button>
              <Button onClick={() => navigate("/")}>Ir al inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              Prompt Compartido
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between gap-2">
              <Badge variant="secondary" className="text-sm">
                {prompt.category}
              </Badge>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  <Share2 className="mr-1 h-4 w-4" />
                  Compartir
                </Button>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(prompt.prompt_text)}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {prompt.prompt_text}
            </p>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Compartido el{" "}
                {new Date(prompt.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <Link to="/library">
                <Button variant="ghost" size="sm">
                  <BookOpen className="mr-1 h-4 w-4" />
                  Ver más prompts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedPrompt;
