import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PublicPrompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
  public_slug: string;
}

export function usePublicPrompts() {
  const [prompts, setPrompts] = useState<PublicPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicPrompts();
  }, []);

  const fetchPublicPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("id, category, prompt_text, created_at, public_slug")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts((data as PublicPrompt[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los prompts públicos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { prompts, loading, refetch: fetchPublicPrompts };
}

export function usePublicPromptBySlug(slug: string | undefined) {
  const [prompt, setPrompt] = useState<PublicPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const fetchPrompt = async () => {
      try {
        const { data, error } = await supabase
          .from("prompts")
          .select("id, category, prompt_text, created_at, public_slug")
          .eq("public_slug", slug)
          .eq("is_public", true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setPrompt(data as PublicPrompt);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [slug]);

  return { prompt, loading, notFound };
}
