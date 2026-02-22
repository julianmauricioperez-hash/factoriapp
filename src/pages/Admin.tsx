import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AppLayout } from "@/components/AppLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Users,
  FileText,
  FolderOpen,
  MessageSquare,
  Globe,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  prompt_count: number;
  public_prompt_count: number;
  collection_count: number;
  conversation_count: number;
}

interface RecentActivity {
  prompt_id: string;
  prompt_text: string;
  category: string;
  created_at: string;
  user_email: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (!adminLoading && !isAdmin && !authLoading) {
      navigate("/");
    }
  }, [authLoading, adminLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      const [usersRes, activityRes] = await Promise.all([
        supabase.rpc("admin_list_users_with_stats"),
        supabase.rpc("admin_recent_activity"),
      ]);

      if (!usersRes.error && usersRes.data) {
        setUsers(usersRes.data as AdminUser[]);
      }
      setLoadingUsers(false);

      if (!activityRes.error && activityRes.data) {
        setActivity(activityRes.data as RecentActivity[]);
      }
      setLoadingActivity(false);
    };

    fetchData();
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <AppLayout title="Admin">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  const totalPrompts = users.reduce((sum, u) => sum + u.prompt_count, 0);
  const totalPublic = users.reduce((sum, u) => sum + u.public_prompt_count, 0);
  const totalCollections = users.reduce((sum, u) => sum + u.collection_count, 0);
  const totalConversations = users.reduce((sum, u) => sum + u.conversation_count, 0);

  return (
    <AppLayout title="Administración">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">
              Resumen general de la plataforma
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Usuarios</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{totalPrompts}</p>
                <p className="text-xs text-muted-foreground">Prompts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{totalPublic}</p>
                <p className="text-xs text-muted-foreground">Públicos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{totalCollections}</p>
                <p className="text-xs text-muted-foreground">Colecciones</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{totalConversations}</p>
                <p className="text-xs text-muted-foreground">Chats</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios Registrados
                </CardTitle>
                <CardDescription>
                  {loadingUsers ? "Cargando..." : `${users.length} usuarios en total`}
                </CardDescription>
              </div>
              <Badge variant="secondary">{users.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Prompts</TableHead>
                    <TableHead className="text-center">Públicos</TableHead>
                    <TableHead className="text-center">Colecciones</TableHead>
                    <TableHead className="text-center">Chats</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Último acceso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.prompt_count > 0 ? "default" : "secondary"}>
                          {u.prompt_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.public_prompt_count > 0 ? "outline" : "secondary"}>
                          {u.public_prompt_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.collection_count > 0 ? "outline" : "secondary"}>
                          {u.collection_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.conversation_count > 0 ? "outline" : "secondary"}>
                          {u.conversation_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.last_sign_in_at
                          ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true, locale: es })
                          : <span className="text-muted-foreground italic">Nunca</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimos 20 prompts creados en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad reciente</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Cuándo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.map((a) => (
                    <TableRow key={a.prompt_id}>
                      <TableCell className="max-w-xs truncate text-sm">
                        {a.prompt_text}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.user_email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
