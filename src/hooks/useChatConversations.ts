import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  prompt_id?: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  is_favorite: boolean;
  has_search_messages: boolean;
  created_at: string;
  updated_at: string;
}

export function useChatConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (title?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title: title || "Nueva conversación" })
        .select()
        .single();

      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ title })
        .eq("id", id);

      if (error) throw error;
      
      setConversations(prev => 
        prev.map(c => c.id === id ? { ...c, title } : c)
      );
    } catch (error) {
      console.error("Error updating conversation:", error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    const newValue = !conversation.is_favorite;
    
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ is_favorite: newValue })
        .eq("id", id);

      if (error) throw error;
      
      setConversations(prev => 
        prev.map(c => c.id === id ? { ...c, is_favorite: newValue } : c)
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const getMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const addMessage = async (
    conversationId: string, 
    role: "user" | "assistant", 
    content: string,
    promptId?: string
  ): Promise<ChatMessage | null> => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({ 
          conversation_id: conversationId, 
          role, 
          content,
          prompt_id: promptId || null
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update conversation's updated_at
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data as ChatMessage;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  };

  return {
    conversations,
    loading,
    createConversation,
    updateConversationTitle,
    toggleFavorite,
    deleteConversation,
    getMessages,
    addMessage,
    refetch: fetchConversations,
  };
}
