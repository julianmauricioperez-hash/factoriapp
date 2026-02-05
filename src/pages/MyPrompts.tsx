import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, Trash2, Plus, LogOut } from "lucide-react";

const CATEGORIES = [
  "Creatividad",
  "Código / Programación",
  "Escritura",
  "Marketing",
  "Educación",
  "Análisis de datos",
  "Otra",
];

interface Prompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
}

const MyPrompts = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPrompts();
    }
  }, [user]);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los prompts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditCategory(prompt.category);
    setEditText(prompt.prompt_text);
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt || !editCategory || !editText.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          category: editCategory,
          prompt_text: editText.trim(),
        })
        .eq("id", editingPrompt.id);

      if (error) throw error;

      setPrompts(
        prompts.map((p) =>
          p.id === editingPrompt.id
            ? { ...p, category: editCategory, prompt_text: editText.trim() }
            : p
        )
      );
      setEditingPrompt(null);
      toast({
        title: "¡Actualizado!",
        description: "El prompt se actualizó correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el prompt.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPrompt) return;

    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", deletingPrompt.id);

      if (error) throw error;

      setPrompts(prompts.filter((p) => p.id !== deletingPrompt.id));
      setDeletingPrompt(null);
      toast({
        title: "Eliminado",
        description: "El prompt se eliminó correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el prompt.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Mis Prompts</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {prompts.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tienes prompts guardados.
              </p>
              <Button onClick={() => navigate("/")}>
                <Plus className="mr-1 h-4 w-4" />
                Crear primer prompt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <Card key={prompt.id} className="border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {prompt.category}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(prompt.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(prompt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingPrompt(prompt)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {prompt.prompt_text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Editar Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="edit-category" className="bg-background">
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
                <Label htmlFor="edit-text">Prompt</Label>
                <Textarea
                  id="edit-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[120px] bg-background"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingPrompt(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deletingPrompt}
          onOpenChange={() => setDeletingPrompt(null)}
        >
          <AlertDialogContent className="bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este prompt?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El prompt será eliminado
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MyPrompts;
