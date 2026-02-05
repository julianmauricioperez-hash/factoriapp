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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, Check, Loader2, Lightbulb, ArrowRight } from "lucide-react";

interface ImprovePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  category: string;
  onApplyImprovement?: (improvedText: string) => void;
}

interface ImprovementResult {
  improved_prompt: string;
  improvements: string[];
  tips: string[];
}

export function ImprovePromptDialog({
  open,
  onOpenChange,
  promptText,
  category,
  onApplyImprovement,
}: ImprovePromptDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImprovementResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImprove = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("improve-prompt", {
        body: { promptText, category },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (error: any) {
      console.error("Error improving prompt:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo mejorar el prompt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.improved_prompt) return;
    
    await navigator.clipboard.writeText(result.improved_prompt);
    setCopied(true);
    toast({
      title: "¡Copiado!",
      description: "El prompt mejorado se copió al portapapeles.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (result?.improved_prompt && onApplyImprovement) {
      onApplyImprovement(result.improved_prompt);
      onOpenChange(false);
      toast({
        title: "¡Aplicado!",
        description: "El prompt se actualizó con la versión mejorada.",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mejorar Prompt con IA
          </DialogTitle>
          <DialogDescription>
            La IA analizará tu prompt y sugerirá mejoras para obtener mejores resultados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Prompt original
            </label>
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-sm whitespace-pre-wrap">{promptText}</p>
            </div>
          </div>

          {/* Improve button */}
          {!result && !loading && (
            <Button onClick={handleImprove} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Analizar y mejorar
            </Button>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analizando y mejorando tu prompt...
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Improved prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Prompt mejorado
                </label>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {result.improved_prompt}
                  </p>
                </div>
              </div>

              {/* Improvements list */}
              {result.improvements && result.improvements.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Mejoras aplicadas
                  </label>
                  <ul className="space-y-1">
                    {result.improvements.map((improvement, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-start gap-2"
                      >
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Consejos adicionales
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {result.tips.map((tip, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tip}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
              {onApplyImprovement && (
                <Button onClick={handleApply}>
                  <Sparkles className="mr-1 h-4 w-4" />
                  Aplicar mejora
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
