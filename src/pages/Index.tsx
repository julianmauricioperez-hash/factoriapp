import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { CheckCircle2, Plus, Sparkles, FileText, Download, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ImprovePromptDialog } from "@/components/ImprovePromptDialog";
import { PromptTemplates } from "@/components/PromptTemplates";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("install-banner-dismissed");
    if (!isStandalone && !dismissed) {
      setShowInstallBanner(true);
    }
  }, []);

  const handleSelectTemplate = (templateCategory: string, templatePrompt: string) => {
    const categoryExists = categories.includes(templateCategory);
    if (categoryExists) {
      setCategory(templateCategory);
    }
    setPromptText(templatePrompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Inicia sesión", description: "Necesitas iniciar sesión para guardar prompts.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!category || !promptText.trim()) {
      toast({ title: "Campos requeridos", description: "Por favor completa todos los campos.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("prompts").insert({ category, prompt_text: promptText.trim(), user_id: user.id });
      if (error) throw error;
      setShowSuccess(true);
      setCategory("");
      setPromptText("");
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error al guardar el prompt:", error);
      toast({ title: "Error", description: "No se pudo guardar el prompt. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    const success = await addCategory(newCategoryName.trim());
    if (success) {
      toast({ title: "¡Categoría creada!", description: `Se agregó "${newCategoryName.trim()}" a tus categorías.` });
      setCategory(newCategoryName.trim());
      setNewCategoryName("");
      setShowAddCategory(false);
    } else {
      toast({ title: "Error", description: "La categoría ya existe o no se pudo crear.", variant: "destructive" });
    }
    setAddingCategory(false);
  };

  // Show landing page for unauthenticated users
  if (!authLoading && !user) {
    return (
      <AppLayout title="Factoría - Optimiza tus prompts con IA">
        <HeroSection />
        <HowItWorksSection />
        <UseCasesSection />
        <TestimonialsSection />
        <CTASection />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Nuevo Prompt">
      <div className="flex flex-col items-center justify-center py-4 md:py-8">
        {showInstallBanner && (
          <div className="w-full max-w-md mb-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Download className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Instala Factoría</p>
                <p className="text-xs text-muted-foreground truncate">Acceso rápido desde tu pantalla de inicio</p>
              </div>
              <Link to="/install">
                <Button size="sm" variant="default" className="text-xs h-8 px-3">Instalar</Button>
              </Link>
              <button
                onClick={() => { setShowInstallBanner(false); sessionStorage.setItem("install-banner-dismissed", "true"); }}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <h1 className="text-lg md:text-xl text-foreground text-center mb-4 max-w-md">
          Con Factoría puedes transformar un prompt en una versión más clara, potente y orientada a resultados
        </h1>
        <Card className="w-full max-w-md shadow-sm border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-medium text-foreground flex items-center justify-between">
              Optimiza tu prompt
              <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="text-xs gap-1">
                <FileText className="h-3.5 w-3.5" />
                Plantillas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-300">
                <CheckCircle2 className="h-16 w-16 text-primary" />
                <p className="text-lg font-medium text-foreground text-center">¡Gracias por alimentar la Factoría!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground">Categoría</Label>
                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="bg-background flex-1">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {user && (
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowAddCategory(true)} title="Agregar categoría">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-foreground">Prompt</Label>
                    {promptText.trim().length > 10 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowImproveDialog(true)} className="h-7 text-xs gap-1 text-primary hover:text-primary">
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={promptText.length > 2000 ? "text-destructive" : ""}>{promptText.length} caracteres</span>
                    {promptText.length > 0 && promptText.length < 20 && <span>💡 Sé más específico para mejores resultados</span>}
                    {promptText.length >= 20 && promptText.length < 50 && <span>💡 Añade contexto o ejemplos</span>}
                    {promptText.length >= 50 && !promptText.includes("{{") && <span>💡 Usa {"{{variable}}"} para partes dinámicas</span>}
                    {promptText.includes("{{") && <span className="text-primary">✓ Variables detectadas</span>}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Enviando..." : "Enviar"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="bg-background mx-4 max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Nueva Categoría</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-category">Nombre de la categoría</Label>
            <Input id="new-category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ej: Negocios" className="mt-2 bg-background" maxLength={50} />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }} disabled={addingCategory} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()} className="w-full sm:w-auto">{addingCategory ? "Creando..." : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImprovePromptDialog open={showImproveDialog} onOpenChange={setShowImproveDialog} promptText={promptText} category={category || "General"} onApplyImprovement={(improvedText) => setPromptText(improvedText)} />
      <PromptTemplates open={showTemplates} onOpenChange={setShowTemplates} onSelectTemplate={handleSelectTemplate} />
    </AppLayout>
  );
};

export default Index;
