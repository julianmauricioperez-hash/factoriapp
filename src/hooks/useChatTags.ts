import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Tag {
  id: string;
  name: string;
}

export function useChatTags() {
  const { user } = useAuth();
  const [chatTags, setChatTags] = useState<Map<string, Tag[]>>(new Map());

  const fetchChatTags = useCallback(async (conversationIds: string[]) => {
    if (!user || conversationIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("chat_tags")
        .select(`
          conversation_id,
          tag_id,
          tag:tags(id, name)
        `)
        .in("conversation_id", conversationIds);

      if (error) throw error;

      const tagMap = new Map<string, Tag[]>();
      (data || []).forEach((ct: any) => {
        const existing = tagMap.get(ct.conversation_id) || [];
        if (ct.tag) {
          existing.push(ct.tag);
        }
        tagMap.set(ct.conversation_id, existing);
      });
      setChatTags(tagMap);
    } catch (error) {
      console.error("Error fetching chat tags:", error);
    }
  }, [user]);

  const addTagToChat = async (conversationId: string, tagId: string, tag: Tag): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chat_tags")
        .insert({ conversation_id: conversationId, tag_id: tagId });

      if (error) throw error;

      setChatTags((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(conversationId) || [];
        newMap.set(conversationId, [...existing, tag]);
        return newMap;
      });
      return true;
    } catch (error) {
      console.error("Error adding tag to chat:", error);
      return false;
    }
  };

  const removeTagFromChat = async (conversationId: string, tagId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chat_tags")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("tag_id", tagId);

      if (error) throw error;

      setChatTags((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(conversationId) || [];
        newMap.set(conversationId, existing.filter((t) => t.id !== tagId));
        return newMap;
      });
      return true;
    } catch (error) {
      console.error("Error removing tag from chat:", error);
      return false;
    }
  };

  const getTagsForChat = (conversationId: string): Tag[] => {
    return chatTags.get(conversationId) || [];
  };

  return {
    chatTags,
    fetchChatTags,
    addTagToChat,
    removeTagFromChat,
    getTagsForChat,
  };
}
