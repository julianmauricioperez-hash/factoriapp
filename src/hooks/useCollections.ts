import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  prompt_count?: number;
}

export function useCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    if (!user) {
      setCollections([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .order("name");

      if (collectionsError) throw collectionsError;

      // Fetch prompt counts per collection
      const { data: promptsData, error: promptsError } = await supabase
        .from("prompts")
        .select("collection_id")
        .eq("user_id", user.id)
        .not("collection_id", "is", null);

      if (promptsError) throw promptsError;

      // Count prompts per collection
      const countMap: Record<string, number> = {};
      promptsData?.forEach((p) => {
        if (p.collection_id) {
          countMap[p.collection_id] = (countMap[p.collection_id] || 0) + 1;
        }
      });

      // Merge counts into collections
      const collectionsWithCounts = (collectionsData || []).map((c) => ({
        ...c,
        color: c.color || "slate",
        prompt_count: countMap[c.id] || 0,
      }));

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const addCollection = async (name: string, description?: string, color?: string): Promise<Collection | null> => {
    if (!user) return null;

    const trimmedName = name.trim();
    if (!trimmedName) return null;

    if (collections.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("collections")
        .insert({
          name: trimmedName,
          description: description?.trim() || null,
          color: color || "slate",
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newCollection = { ...data, color: data.color || "slate", prompt_count: 0 };
      setCollections((prev) => [...prev, newCollection].sort((a, b) => a.name.localeCompare(b.name)));
      return newCollection;
    } catch (error) {
      console.error("Error adding collection:", error);
      return null;
    }
  };

  const updateCollection = async (id: string, name: string, description?: string, color?: string): Promise<boolean> => {
    try {
      const updateData: { name: string; description: string | null; color?: string } = {
        name: name.trim(),
        description: description?.trim() || null,
      };
      
      if (color) {
        updateData.color = color;
      }

      const { error } = await supabase
        .from("collections")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setCollections((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: name.trim(), description: description?.trim() || null, color: color || c.color } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return true;
    } catch (error) {
      console.error("Error updating collection:", error);
      return false;
    }
  };

  const deleteCollection = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;

      setCollections((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting collection:", error);
      return false;
    }
  };

  return {
    collections,
    loading,
    addCollection,
    updateCollection,
    deleteCollection,
    refetch: fetchCollections,
  };
}
