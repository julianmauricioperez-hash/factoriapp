import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface UserFormUser {
  id: string;
  email: string;
  is_admin: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserFormUser | null;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: Props) {
  const isEdit = !!user;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(user?.email ?? "");
      setPassword("");
      setIsAdmin(user?.is_admin ?? false);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit) {
      if (!email.trim() || password.length < 8) {
        toast({
          title: "Datos inválidos",
          description: "Email válido y contraseña de al menos 8 caracteres.",
          variant: "destructive",
        });
        return;
      }
    } else if (password && password.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description: "Debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const body = isEdit
      ? {
          action: "update" as const,
          user_id: user!.id,
          email: email !== user!.email ? email.trim() : undefined,
          password: password || undefined,
          is_admin: isAdmin,
        }
      : {
          action: "create" as const,
          email: email.trim(),
          password,
          is_admin: isAdmin,
        };

    const { data, error } = await supabase.functions.invoke("admin-users", { body });
    setLoading(false);

    if (error || (data as any)?.error) {
      const msg = (data as any)?.error
        ? typeof (data as any).error === "string"
          ? (data as any).error
          : "Error de validación"
        : error?.message ?? "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return;
    }

    toast({
      title: isEdit ? "Usuario actualizado" : "Usuario creado",
      description: email,
    });
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Actualiza los datos del usuario. Deja la contraseña vacía para no cambiarla."
                : "Crea una nueva cuenta. El email queda confirmado automáticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña {isEdit && <span className="text-muted-foreground">(opcional)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"}
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_admin"
                checked={isAdmin}
                onCheckedChange={(v) => setIsAdmin(!!v)}
              />
              <Label htmlFor="is_admin" className="cursor-pointer">
                Es administrador
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
