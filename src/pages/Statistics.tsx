import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePromptStats } from "@/hooks/usePromptStats";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, FileText, Star, FolderOpen, TrendingUp, Hash, Calendar } from "lucide-react";

interface Prompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
  is_favorite: boolean;
}

const Statistics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = usePromptStats(prompts);

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
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/my-prompts")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Estadísticas</h1>
          </div>
          <ThemeToggle />
        </div>

        {prompts.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No hay datos para mostrar estadísticas.
              </p>
              <Button onClick={() => navigate("/")}>
                Crear primer prompt
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPrompts}</p>
                      <p className="text-xs text-muted-foreground">Total prompts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-yellow-500/10 p-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalFavorites}</p>
                      <p className="text-xs text-muted-foreground">Favoritos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-500/10 p-2">
                      <FolderOpen className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalCategories}</p>
                      <p className="text-xs text-muted-foreground">Categorías</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <Hash className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.avgPromptLength}</p>
                      <p className="text-xs text-muted-foreground">Caracteres promedio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Distribution */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.categoryStats.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {cat.count} ({cat.percentage}%)
                      </span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                ))}
                {stats.categoryStats.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.categoryStats.length - 5} categorías más
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Actividad (Últimos 7 días)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-24">
                  {stats.recentActivity.map((day) => {
                    const maxCount = Math.max(...stats.recentActivity.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center justify-end h-16">
                          <span className="text-xs font-medium mb-1">{day.count}</span>
                          <div 
                            className="w-full bg-primary rounded-t transition-all"
                            style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Datos Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Prompt más largo</p>
                    <p className="font-medium">{stats.longestPrompt} caracteres</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prompt más corto</p>
                    <p className="font-medium">{stats.shortestPrompt} caracteres</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Promedio por categoría</p>
                    <p className="font-medium">{stats.avgPromptsPerCategory} prompts</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">% Favoritos</p>
                    <p className="font-medium">
                      {stats.totalPrompts > 0 
                        ? Math.round((stats.totalFavorites / stats.totalPrompts) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
