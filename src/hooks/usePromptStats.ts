import { useMemo } from "react";

interface Prompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
  is_favorite: boolean;
}

interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
}

interface DailyStat {
  date: string;
  count: number;
}

interface PromptStats {
  totalPrompts: number;
  totalFavorites: number;
  totalCategories: number;
  avgPromptsPerCategory: number;
  categoryStats: CategoryStat[];
  recentActivity: DailyStat[];
  longestPrompt: number;
  shortestPrompt: number;
  avgPromptLength: number;
}

export const usePromptStats = (prompts: Prompt[]): PromptStats => {
  return useMemo(() => {
    if (prompts.length === 0) {
      return {
        totalPrompts: 0,
        totalFavorites: 0,
        totalCategories: 0,
        avgPromptsPerCategory: 0,
        categoryStats: [],
        recentActivity: [],
        longestPrompt: 0,
        shortestPrompt: 0,
        avgPromptLength: 0,
      };
    }

    // Category stats
    const categoryCount: Record<string, number> = {};
    prompts.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    const categoryStats: CategoryStat[] = Object.entries(categoryCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / prompts.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Recent activity (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyCount: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCount[dateStr] = 0;
    }

    prompts.forEach(p => {
      const date = new Date(p.created_at);
      if (date >= sevenDaysAgo) {
        const dateStr = date.toISOString().split('T')[0];
        if (dailyCount[dateStr] !== undefined) {
          dailyCount[dateStr]++;
        }
      }
    });

    const recentActivity: DailyStat[] = Object.entries(dailyCount)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Prompt length stats
    const lengths = prompts.map(p => p.prompt_text.length);
    const longestPrompt = Math.max(...lengths);
    const shortestPrompt = Math.min(...lengths);
    const avgPromptLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

    const totalCategories = Object.keys(categoryCount).length;

    return {
      totalPrompts: prompts.length,
      totalFavorites: prompts.filter(p => p.is_favorite).length,
      totalCategories,
      avgPromptsPerCategory: totalCategories > 0 ? Math.round(prompts.length / totalCategories * 10) / 10 : 0,
      categoryStats,
      recentActivity,
      longestPrompt,
      shortestPrompt,
      avgPromptLength,
    };
  }, [prompts]);
};
