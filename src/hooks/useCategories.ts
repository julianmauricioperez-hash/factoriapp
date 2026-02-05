import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { useAuth } from "./useAuth";

interface CustomCategory {
  id: string;
  name: string;
}

export function useCategories() {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map((c) => c.name),
  ];

  const fetchCategories = async () => {
    if (!user) {
      setCustomCategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const addCategory = async (name: string): Promise<boolean> => {
    if (!user) return false;
    
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    
    // Check if already exists
    if (allCategories.some((c) => c.toLowerCase() === trimmedName.toLowerCase())) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: trimmedName, user_id: user.id })
        .select("id, name")
        .single();

      if (error) throw error;
      
      setCustomCategories((prev) => [...prev, data]);
      return true;
    } catch (error) {
      console.error("Error adding category:", error);
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  };

  return {
    categories: allCategories,
    customCategories,
    defaultCategories: DEFAULT_CATEGORIES,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
