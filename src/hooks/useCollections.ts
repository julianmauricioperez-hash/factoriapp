import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
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
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("name");

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const addCollection = async (name: string, description?: string): Promise<Collection | null> => {
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
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCollections((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (error) {
      console.error("Error adding collection:", error);
      return null;
    }
  };

  const updateCollection = async (id: string, name: string, description?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("collections")
        .update({
          name: name.trim(),
          description: description?.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;

      setCollections((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: name.trim(), description: description?.trim() || null } : c))
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
