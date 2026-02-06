import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  prompt: string;
}

const templates: Template[] = [
  {
    id: "1",
    name: "Resumen de texto",
    category: "Escritura",
    prompt: "Resume el siguiente texto en {{cantidad}} puntos clave, manteniendo la información más importante:\n\n{{texto}}",
  },
  {
    id: "2",
    name: "Corrección de estilo",
    category: "Escritura",
    prompt: "Revisa y mejora el estilo del siguiente texto. Corrige errores gramaticales, mejora la claridad y mantén un tono {{tono}}:\n\n{{texto}}",
  },
  {
    id: "3",
    name: "Generador de ideas",
    category: "Creatividad",
    prompt: "Genera {{cantidad}} ideas creativas para {{tema}}. Las ideas deben ser originales, viables y orientadas a {{objetivo}}.",
  },
  {
    id: "4",
    name: "Análisis de código",
    category: "Programación",
    prompt: "Analiza el siguiente código y proporciona:\n1. Explicación de qué hace\n2. Posibles mejoras\n3. Errores potenciales\n\n```{{lenguaje}}\n{{código}}\n```",
  },
  {
    id: "5",
    name: "Explicación simple",
    category: "Educación",
    prompt: "Explica {{concepto}} de forma simple, como si le explicaras a un niño de {{edad}} años. Usa ejemplos cotidianos y analogías.",
  },
  {
    id: "6",
    name: "Email profesional",
    category: "Comunicación",
    prompt: "Redacta un email profesional para {{destinatario}} sobre {{asunto}}. El tono debe ser {{tono}} y debe incluir:\n- Saludo apropiado\n- Contexto breve\n- Solicitud o información principal\n- Cierre cordial",
  },
  {
    id: "7",
    name: "Plan de estudio",
    category: "Educación",
    prompt: "Crea un plan de estudio de {{duración}} para aprender {{tema}}. Incluye:\n- Objetivos semanales\n- Recursos recomendados\n- Ejercicios prácticos\n- Métricas de progreso",
  },
  {
    id: "8",
    name: "Debate de pros y contras",
    category: "Análisis",
    prompt: "Analiza los pros y contras de {{tema}}. Presenta argumentos equilibrados desde múltiples perspectivas y concluye con una recomendación objetiva.",
  },
];

interface PromptTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (category: string, prompt: string) => void;
}

export function PromptTemplates({
  open,
  onOpenChange,
  onSelectTemplate,
}: PromptTemplatesProps) {
  const handleSelect = (template: Template) => {
    onSelectTemplate(template.category, template.prompt);
    onOpenChange(false);
  };

  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Plantillas de Prompts
          </DialogTitle>
          <DialogDescription>
            Selecciona una plantilla como punto de partida
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-2">
                  {templates
                    .filter((t) => t.category === category)
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template)}
                        className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-sm">
                              {template.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.prompt}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {template.category}
                          </Badge>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
