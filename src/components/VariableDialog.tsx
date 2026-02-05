import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";

interface VariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
}

// Extract variables from prompt text (e.g., {{nombre}}, {{fecha}})
export const extractVariables = (text: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = text.match(regex);
  if (!matches) return [];
  
  // Remove duplicates and extract variable names
  const variables = [...new Set(matches.map(m => m.slice(2, -2).trim()))];
  return variables;
};

// Check if prompt has variables
export const hasVariables = (text: string): boolean => {
  return /\{\{[^}]+\}\}/.test(text);
};

export const VariableDialog = ({ open, onOpenChange, promptText }: VariableDialogProps) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const variableNames = extractVariables(promptText);

  useEffect(() => {
    if (open) {
      // Reset variables when dialog opens
      const initialVars: Record<string, string> = {};
      variableNames.forEach(v => {
        initialVars[v] = "";
      });
      setVariables(initialVars);
      setCopied(false);
    }
  }, [open, promptText]);

  const getProcessedText = (): string => {
    let result = promptText;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value || `{{${key}}}`);
    });
    return result;
  };

  const handleCopy = async () => {
    const processedText = getProcessedText();
    await navigator.clipboard.writeText(processedText);
    setCopied(true);
    toast({
      title: "¡Copiado!",
      description: "El prompt con las variables se copió al portapapeles.",
    });
    setTimeout(() => {
      setCopied(false);
      onOpenChange(false);
    }, 1500);
  };

  const allFilled = variableNames.every(v => variables[v]?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle>Completar Variables</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Este prompt tiene variables. Completa los valores antes de copiar.
          </p>
          
          {variableNames.map((varName) => (
            <div key={varName} className="space-y-2">
              <Label htmlFor={varName} className="text-sm font-medium">
                {varName}
              </Label>
              <Input
                id={varName}
                value={variables[varName] || ""}
                onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                placeholder={`Ingresa ${varName}...`}
                className="bg-background"
              />
            </div>
          ))}

          <div className="mt-4 p-3 rounded-md bg-muted">
            <p className="text-xs text-muted-foreground mb-1">Vista previa:</p>
            <p className="text-sm whitespace-pre-wrap">{getProcessedText()}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCopy} disabled={!allFilled}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
