import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, ArrowLeft, Copy, Check, Braces } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getColorClasses } from "@/lib/collectionColors";
import { VariableDialog, hasVariables } from "@/components/VariableDialog";

interface SharedPrompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
}

interface SharedCollectionData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

const SharedPromptCard = ({ prompt }: { prompt: SharedPrompt }) => {
  const [copied, setCopied] = useState(false);
  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const promptHasVars = hasVariables(prompt.prompt_text);

  const handleCopy = async () => {
    if (promptHasVars) {
      setShowVariableDialog(true);
      return;
    }
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast({ title: "¡Copiado!", description: "El prompt se copió al portapapeles." });
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPromptText = (text: string) => {
    if (!promptHasVars) return <span>{text}</span>;
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (/^\{\{[^}]+\}\}$/.test(part)) {
        return (
          <span key={index} className="bg-primary/20 text-primary px-1 rounded font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {prompt.category}
              </span>
              {promptHasVars && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Braces className="h-3 w-3" />
                  Variables
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {renderPromptText(prompt.prompt_text)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(prompt.created_at).toLocaleDateString("es-ES", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>
      <VariableDialog
        open={showVariableDialog}
        onOpenChange={setShowVariableDialog}
        promptText={prompt.prompt_text}
      />
    </>
  );
};

const SharedCollection = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<SharedCollectionData | null>(null);
  const [prompts, setPrompts] = useState<SharedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSharedCollection = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: collectionData, error: collectionError } = await supabase
          .from("collections")
          .select("*")
          .eq("public_slug", slug)
          .eq("is_public", true)
          .maybeSingle();

        if (collectionError) throw collectionError;
        if (!collectionData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCollection({
          id: collectionData.id,
          name: collectionData.name,
          description: collectionData.description,
          color: collectionData.color || "slate",
          created_at: collectionData.created_at,
        });

        const { data: promptsData, error: promptsError } = await supabase
          .from("prompts")
          .select("id, category, prompt_text, created_at")
          .eq("collection_id", collectionData.id)
          .order("sort_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (promptsError) throw promptsError;
        setPrompts(promptsData || []);
      } catch (error) {
        console.error("Error fetching shared collection:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCollection();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando colección...</p>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <FolderOpen className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Colección no encontrada</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Esta colección no existe o ya no está disponible públicamente.
        </p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir al inicio
          </Button>
        </Link>
      </div>
    );
  }

  const colorClasses = getColorClasses(collection.color);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Ir al inicio
          </Button>
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 rounded-full ${colorClasses.bg}`} />
            <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
          </div>
          {collection.description && (
            <p className="text-muted-foreground ml-7">{collection.description}</p>
          )}
          <Badge variant="secondary" className="mt-2 ml-7">
            {prompts.length} {prompts.length === 1 ? "prompt" : "prompts"}
          </Badge>
        </div>

        {prompts.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Esta colección está vacía.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <SharedPromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedCollection;
