import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Tag {
  id: string;
  name: string;
}

interface PromptTag {
  prompt_id: string;
  tag_id: string;
  tag: Tag;
}

export function useTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [promptTags, setPromptTags] = useState<Map<string, Tag[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!user) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPromptTags = useCallback(async (promptIds: string[]) => {
    if (!user || promptIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("prompt_tags")
        .select(`
          prompt_id,
          tag_id,
          tag:tags(id, name)
        `)
        .in("prompt_id", promptIds);

      if (error) throw error;

      const tagMap = new Map<string, Tag[]>();
      (data || []).forEach((pt: any) => {
        const existing = tagMap.get(pt.prompt_id) || [];
        if (pt.tag) {
          existing.push(pt.tag);
        }
        tagMap.set(pt.prompt_id, existing);
      });
      setPromptTags(tagMap);
    } catch (error) {
      console.error("Error fetching prompt tags:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = async (name: string): Promise<Tag | null> => {
    if (!user) return null;

    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return null;

    // Check if tag already exists
    const existing = tags.find((t) => t.name.toLowerCase() === trimmedName);
    if (existing) return existing;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: trimmedName, user_id: user.id })
        .select("id, name")
        .single();

      if (error) throw error;

      setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (error) {
      console.error("Error creating tag:", error);
      return null;
    }
  };

  const deleteTag = async (tagId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("tags").delete().eq("id", tagId);
      if (error) throw error;

      setTags((prev) => prev.filter((t) => t.id !== tagId));
      return true;
    } catch (error) {
      console.error("Error deleting tag:", error);
      return false;
    }
  };

  const addTagToPrompt = async (promptId: string, tagId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("prompt_tags")
        .insert({ prompt_id: promptId, tag_id: tagId });

      if (error) throw error;

      // Update local state
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        setPromptTags((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(promptId) || [];
          newMap.set(promptId, [...existing, tag]);
          return newMap;
        });
      }
      return true;
    } catch (error) {
      console.error("Error adding tag to prompt:", error);
      return false;
    }
  };

  const removeTagFromPrompt = async (promptId: string, tagId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("prompt_tags")
        .delete()
        .eq("prompt_id", promptId)
        .eq("tag_id", tagId);

      if (error) throw error;

      // Update local state
      setPromptTags((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(promptId) || [];
        newMap.set(promptId, existing.filter((t) => t.id !== tagId));
        return newMap;
      });
      return true;
    } catch (error) {
      console.error("Error removing tag from prompt:", error);
      return false;
    }
  };

  const getTagsForPrompt = (promptId: string): Tag[] => {
    return promptTags.get(promptId) || [];
  };

  return {
    tags,
    promptTags,
    loading,
    createTag,
    deleteTag,
    addTagToPrompt,
    removeTagFromPrompt,
    getTagsForPrompt,
    fetchPromptTags,
    refetch: fetchTags,
  };
}
