import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TagWithUsage extends Tag {
  promptCount: number;
  chatCount: number;
}

interface PromptTag {
  prompt_id: string;
  tag_id: string;
  tag: Tag;
}

export function useTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagUsage, setTagUsage] = useState<Map<string, { promptCount: number; chatCount: number }>>(new Map());
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
        .select("id, name, color")
        .order("name");

      if (error) throw error;
      setTags((data || []).map((t: any) => ({ ...t, color: t.color || "slate" })));
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTagUsage = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch prompt_tags counts
      const { data: promptTagData, error: ptError } = await supabase
        .from("prompt_tags")
        .select("tag_id");

      if (ptError) throw ptError;

      // Fetch chat_tags counts
      const { data: chatTagData, error: ctError } = await supabase
        .from("chat_tags")
        .select("tag_id");

      if (ctError) throw ctError;

      const usageMap = new Map<string, { promptCount: number; chatCount: number }>();

      (promptTagData || []).forEach((pt: any) => {
        const existing = usageMap.get(pt.tag_id) || { promptCount: 0, chatCount: 0 };
        existing.promptCount++;
        usageMap.set(pt.tag_id, existing);
      });

      (chatTagData || []).forEach((ct: any) => {
        const existing = usageMap.get(ct.tag_id) || { promptCount: 0, chatCount: 0 };
        existing.chatCount++;
        usageMap.set(ct.tag_id, existing);
      });

      setTagUsage(usageMap);
    } catch (error) {
      console.error("Error fetching tag usage:", error);
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
          tag:tags(id, name, color)
        `)
        .in("prompt_id", promptIds);

      if (error) throw error;

      const tagMap = new Map<string, Tag[]>();
      (data || []).forEach((pt: any) => {
        const existing = tagMap.get(pt.prompt_id) || [];
        if (pt.tag) {
          existing.push({ ...pt.tag, color: pt.tag.color || "slate" });
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
    fetchTagUsage();
  }, [fetchTags, fetchTagUsage]);

  const createTag = async (name: string, color: string = "slate"): Promise<Tag | null> => {
    if (!user) return null;

    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return null;

    const existing = tags.find((t) => t.name.toLowerCase() === trimmedName);
    if (existing) return existing;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name: trimmedName, user_id: user.id, color })
        .select("id, name, color")
        .single();

      if (error) throw error;

      const newTag = { ...data, color: data.color || "slate" };
      setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      return newTag;
    } catch (error) {
      console.error("Error creating tag:", error);
      return null;
    }
  };

  const updateTag = async (tagId: string, updates: { name?: string; color?: string }): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name.trim().toLowerCase();
      if (updates.color !== undefined) updateData.color = updates.color;

      const { error } = await supabase.from("tags").update(updateData).eq("id", tagId);
      if (error) throw error;

      setTags((prev) =>
        prev
          .map((t) => (t.id === tagId ? { ...t, ...updateData } : t))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return true;
    } catch (error) {
      console.error("Error updating tag:", error);
      return false;
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

  const getTagUsage = (tagId: string) => {
    return tagUsage.get(tagId) || { promptCount: 0, chatCount: 0 };
  };

  const tagsWithUsage: TagWithUsage[] = tags.map((tag) => ({
    ...tag,
    ...(tagUsage.get(tag.id) || { promptCount: 0, chatCount: 0 }),
  }));

  return {
    tags,
    tagsWithUsage,
    promptTags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    addTagToPrompt,
    removeTagFromPrompt,
    getTagsForPrompt,
    getTagUsage,
    fetchPromptTags,
    refetch: () => { fetchTags(); fetchTagUsage(); },
  };
}
