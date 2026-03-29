import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface ImportPromptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedPrompt {
  category: string;
  prompt_text: string;
}

export const ImportPromptsDialog = ({ open, onOpenChange, onImportComplete }: ImportPromptsDialogProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedPrompts, setParsedPrompts] = useState<ParsedPrompt[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setParsedPrompts([]);
    setFileName("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseJSON = (text: string): ParsedPrompt[] => {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [data];
    return arr
      .filter((item: any) => item.category && item.prompt_text)
      .map((item: any) => ({
        category: String(item.category).trim(),
        prompt_text: String(item.prompt_text).trim(),
      }));
  };

  const parseCSV = (text: string): ParsedPrompt[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];
    
    const results: ParsedPrompt[] = [];
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const match = lines[i].match(/^"?([^",]*)"?\s*,\s*"?([\s\S]*?)"?\s*(?:,|$)/);
      if (match && match[1] && match[2]) {
        results.push({
          category: match[1].trim().replace(/""/g, '"'),
          prompt_text: match[2].trim().replace(/""/g, '"'),
        });
      }
    }
    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();

    try {
      let parsed: ParsedPrompt[];
      if (file.name.endsWith(".json")) {
        parsed = parseJSON(text);
      } else if (file.name.endsWith(".csv")) {
        parsed = parseCSV(text);
      } else {
        setError("Formato no soportado. Usa archivos .json o .csv");
        return;
      }

      if (parsed.length === 0) {
        setError("No se encontraron prompts válidos en el archivo. Asegúrate de que contenga campos 'category' y 'prompt_text'.");
        return;
      }

      setParsedPrompts(parsed);
    } catch (err) {
      setError("Error al leer el archivo. Verifica que el formato sea correcto.");
    }
  };

  const handleImport = async () => {
    if (!user || parsedPrompts.length === 0) return;

    setImporting(true);
    try {
      const rows = parsedPrompts.map((p) => ({
        category: p.category,
        prompt_text: p.prompt_text,
        user_id: user.id,
      }));

      const { error } = await supabase.from("prompts").insert(rows);
      if (error) throw error;

      toast({
        title: "¡Importación exitosa!",
        description: `Se importaron ${parsedPrompts.length} prompts.`,
      });
      reset();
      onOpenChange(false);
      onImportComplete();
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron importar los prompts.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const categories = [...new Set(parsedPrompts.map((p) => p.category))];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Prompts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {fileName || "Haz clic para seleccionar un archivo .json o .csv"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {parsedPrompts.length > 0 && (
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {parsedPrompts.length} prompts encontrados
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <span key={cat} className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {cat} ({parsedPrompts.filter((p) => p.category === cat).length})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={importing} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={importing || parsedPrompts.length === 0} className="w-full sm:w-auto">
            {importing ? "Importando..." : `Importar ${parsedPrompts.length > 0 ? parsedPrompts.length : ""} prompts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
