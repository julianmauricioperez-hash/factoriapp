import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  "Creatividad",
  "Código / Programación",
  "Escritura",
  "Marketing",
  "Educación",
  "Análisis de datos",
  "Otra",
];

const Index = () => {
  const [category, setCategory] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !promptText.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("prompts").insert({
        category,
        prompt_text: promptText.trim(),
      });

      if (error) throw error;

      setShowSuccess(true);
      setCategory("");
      setPromptText("");

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error al guardar el prompt:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el prompt. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-sm border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-medium text-foreground">
            Registrar Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-300">
              <CheckCircle2 className="h-16 w-16 text-primary" />
              <p className="text-lg font-medium text-foreground text-center">
                ¡Gracias por alimentar la IA!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">
                  Categoría
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="bg-background">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-foreground">
                  Prompt
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Escribe tu prompt aquí..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="min-h-[120px] resize-none bg-background"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
