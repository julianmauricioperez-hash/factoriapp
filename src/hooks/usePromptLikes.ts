import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface LikeCount {
  [promptId: string]: number;
}

interface UserLikes {
  [promptId: string]: boolean;
}

export function usePromptLikes(promptIds: string[]) {
  const { user } = useAuth();
  const [likeCounts, setLikeCounts] = useState<LikeCount>({});
  const [userLikes, setUserLikes] = useState<UserLikes>({});
  const [loading, setLoading] = useState(true);

  const fetchLikes = useCallback(async () => {
    if (promptIds.length === 0) {
      setLikeCounts({});
      setUserLikes({});
      setLoading(false);
      return;
    }

    try {
      // Fetch like counts using RPC (no user_id exposed)
      const { data: counts, error: countError } = await supabase
        .rpc("get_prompt_like_counts", { prompt_ids: promptIds });

      if (countError) throw countError;

      // Build count map
      const countMap: LikeCount = {};
      promptIds.forEach((id) => {
        countMap[id] = 0;
      });
      (counts as any[])?.forEach((row: { prompt_id: string; like_count: number }) => {
        countMap[row.prompt_id] = row.like_count;
      });
      setLikeCounts(countMap);

      // If user is logged in, check which prompts they've liked
      if (user) {
        const { data: userLikeData, error: userLikeError } = await supabase
          .from("prompt_likes")
          .select("prompt_id")
          .eq("user_id", user.id)
          .in("prompt_id", promptIds);

        if (userLikeError) throw userLikeError;

        const userLikeMap: UserLikes = {};
        userLikeData?.forEach((like) => {
          userLikeMap[like.prompt_id] = true;
        });
        setUserLikes(userLikeMap);
      } else {
        setUserLikes({});
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLoading(false);
    }
  }, [promptIds.join(","), user?.id]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = async (promptId: string): Promise<boolean> => {
    if (!user) return false;

    const isCurrentlyLiked = userLikes[promptId];

    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("prompt_likes")
          .delete()
          .eq("prompt_id", promptId)
          .eq("user_id", user.id);

        if (error) throw error;

        setUserLikes((prev) => ({ ...prev, [promptId]: false }));
        setLikeCounts((prev) => ({
          ...prev,
          [promptId]: Math.max(0, (prev[promptId] || 0) - 1),
        }));
      } else {
        // Like
        const { error } = await supabase.from("prompt_likes").insert({
          prompt_id: promptId,
          user_id: user.id,
        });

        if (error) throw error;

        setUserLikes((prev) => ({ ...prev, [promptId]: true }));
        setLikeCounts((prev) => ({
          ...prev,
          [promptId]: (prev[promptId] || 0) + 1,
        }));
      }
      return true;
    } catch (error) {
      console.error("Error toggling like:", error);
      return false;
    }
  };

  return {
    likeCounts,
    userLikes,
    loading,
    toggleLike,
    refetch: fetchLikes,
  };
}
