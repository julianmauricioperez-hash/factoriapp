import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wand2, Copy, Check, Loader2, Lightbulb } from "lucide-react";

interface GeneratePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUsePrompt?: (promptText: string, category: string) => void;
}

interface GenerationResult {
  generated_prompt: string;
  suggested_category: string;
  explanation: string;
}

export function GeneratePromptDialog({
  open,
  onOpenChange,
  onUsePrompt,
}: GeneratePromptDialogProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Descripción requerida",
        description: "Escribe qué tipo de prompt necesitas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: { description: description.trim() },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el prompt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.generated_prompt) return;

    await navigator.clipboard.writeText(result.generated_prompt);
    setCopied(true);
    toast({
      title: "¡Copiado!",
      description: "El prompt se copió al portapapeles.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (result?.generated_prompt && onUsePrompt) {
      onUsePrompt(result.generated_prompt, result.suggested_category);
      handleClose();
      toast({
        title: "¡Listo!",
        description: "El prompt se cargó en el formulario.",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setDescription("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Generar Prompt con IA
          </DialogTitle>
          <DialogDescription>
            Describe en pocas palabras qué necesitas y la IA creará un prompt profesional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="description">¿Qué necesitas?</Label>
            <Textarea
              id="description"
              placeholder="Ej: Un prompt para escribir emails de ventas persuasivos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] bg-background"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Sé específico sobre el objetivo y el contexto para mejores resultados.
            </p>
          </div>

          {/* Generate button */}
          {!result && !loading && (
            <Button
              onClick={handleGenerate}
              className="w-full"
              disabled={!description.trim()}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generar prompt
            </Button>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generando tu prompt personalizado...
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Category badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Categoría sugerida:</span>
                <Badge variant="secondary">{result.suggested_category}</Badge>
              </div>

              {/* Generated prompt */}
              <div className="space-y-2">
                <Label>Prompt generado</Label>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {result.generated_prompt}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              {result.explanation && (
                <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {result.explanation}
                  </p>
                </div>
              )}

              {/* Regenerate option */}
              <Button
                variant="outline"
                onClick={handleGenerate}
                className="w-full"
                disabled={loading}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Regenerar
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
          {result && (
            <>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1 h-4 w-4" />
                ) : (
                  <Copy className="mr-1 h-4 w-4" />
                )}
                Copiar
              </Button>
              {onUsePrompt && (
                <Button onClick={handleUse}>
                  <Wand2 className="mr-1 h-4 w-4" />
                  Usar este prompt
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
