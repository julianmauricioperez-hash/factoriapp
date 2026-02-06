import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePublicPromptBySlug } from "@/hooks/usePublicPrompts";
import { Copy, BookOpen, Share2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

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
      <AppLayout title="Prompt Compartido">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando prompt...</p>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !prompt) {
    return (
      <AppLayout title="No encontrado">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md border shadow-sm">
            <CardContent className="py-12 text-center">
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Prompt no encontrado
              </h2>
              <p className="mb-4 text-muted-foreground">
                Este prompt no existe o ya no está disponible públicamente.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2">
                <Button variant="outline" onClick={() => navigate("/library")}>
                  <BookOpen className="mr-1 h-4 w-4" />
                  Explorar biblioteca
                </Button>
                <Button onClick={() => navigate("/")}>Ir al inicio</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Prompt Compartido">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">
          Prompt Compartido
        </h1>

        <Card className="border shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <Badge variant="secondary" className="text-sm w-fit">
                {prompt.category}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyShareLink} className="flex-1 sm:flex-none">
                  <Share2 className="mr-1 h-4 w-4" />
                  Compartir
                </Button>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(prompt.prompt_text)}
                  className="flex-1 sm:flex-none"
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-foreground leading-relaxed text-sm md:text-base">
              {prompt.prompt_text}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs md:text-sm text-muted-foreground">
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
    </AppLayout>
  );
};

export default SharedPrompt;
