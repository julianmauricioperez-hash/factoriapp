import { useMemo } from "react";
import { Star, FileText, Calendar, Tag } from "lucide-react";

interface Prompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
  is_favorite: boolean;
}

interface CollectionStatsProps {
  prompts: Prompt[];
}

export function CollectionStats({ prompts }: CollectionStatsProps) {
  const stats = useMemo(() => {
    if (prompts.length === 0) return null;

    const favorites = prompts.filter((p) => p.is_favorite).length;

    const categoryCount: Record<string, number> = {};
    prompts.forEach((p) => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const lastPrompt = prompts.reduce((latest, p) =>
      new Date(p.created_at) > new Date(latest.created_at) ? p : latest
    );

    return { favorites, topCategories, lastDate: lastPrompt.created_at };
  }, [prompts]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold text-foreground">{prompts.length}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
        <Star className="h-4 w-4 text-yellow-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Favoritos</p>
          <p className="text-sm font-semibold text-foreground">{stats.favorites}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Categorías</p>
          <p className="text-sm font-semibold text-foreground truncate" title={stats.topCategories.map(([name, count]) => `${name} (${count})`).join(", ")}>
            {stats.topCategories.map(([name]) => name).join(", ")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Último</p>
          <p className="text-sm font-semibold text-foreground">
            {new Date(stats.lastDate).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
