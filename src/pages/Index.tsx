import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { CheckCircle2, Plus, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ImprovePromptDialog } from "@/components/ImprovePromptDialog";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { categories, addCategory } = useCategories();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [showImproveDialog, setShowImproveDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para guardar prompts.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

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
        user_id: user.id,
      });

      if (error) throw error;

      setShowSuccess(true);
      setCategory("");
      setPromptText("");

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error: any) {
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setAddingCategory(true);
    const success = await addCategory(newCategoryName.trim());
    
    if (success) {
      toast({
        title: "¡Categoría creada!",
        description: `Se agregó "${newCategoryName.trim()}" a tus categorías.`,
      });
      setCategory(newCategoryName.trim());
      setNewCategoryName("");
      setShowAddCategory(false);
    } else {
      toast({
        title: "Error",
        description: "La categoría ya existe o no se pudo crear.",
        variant: "destructive",
      });
    }
    setAddingCategory(false);
  };

  return (
    <AppLayout title="Nuevo Prompt">
      <div className="flex items-center justify-center py-4 md:py-8">
        <Card className="w-full max-w-md shadow-sm border">
          <CardHeader className="pb-4">
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
                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="bg-background flex-1">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {user && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAddCategory(true)}
                        title="Agregar categoría"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-foreground">
                      Prompt
                    </Label>
                    {promptText.trim().length > 10 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImproveDialog(true)}
                        className="h-7 text-xs gap-1 text-primary hover:text-primary"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Mejorar con IA
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="prompt"
                    placeholder="Escribe tu prompt aquí..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="min-h-[120px] resize-none bg-background"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>

                {!user && !authLoading && (
                  <p className="text-xs text-center text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => navigate("/auth")}
                      className="underline hover:text-foreground"
                    >
                      Inicia sesión
                    </button>
                    {" "}para guardar y gestionar tus prompts
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-category">Nombre de la categoría</Label>
            <Input
              id="new-category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Negocios"
              className="mt-2 bg-background"
              maxLength={50}
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCategory(false);
                setNewCategoryName("");
              }}
              disabled={addingCategory}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategoryName.trim()}
              className="w-full sm:w-auto"
            >
              {addingCategory ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Improve Prompt Dialog */}
      <ImprovePromptDialog
        open={showImproveDialog}
        onOpenChange={setShowImproveDialog}
        promptText={promptText}
        category={category || "General"}
        onApplyImprovement={(improvedText) => setPromptText(improvedText)}
      />
    </AppLayout>
  );
};

export default Index;
