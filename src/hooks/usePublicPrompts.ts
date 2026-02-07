import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PublicPromptTag {
  id: string;
  name: string;
  color: string;
}

export interface PublicPrompt {
  id: string;
  category: string;
  prompt_text: string;
  created_at: string;
  public_slug: string;
  tags: PublicPromptTag[];
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
        .select("id, category, prompt_text, created_at, public_slug, prompt_tags(tag_id, tags(id, name, color))")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: PublicPrompt[] = (data || []).map((p: any) => ({
        id: p.id,
        category: p.category,
        prompt_text: p.prompt_text,
        created_at: p.created_at,
        public_slug: p.public_slug,
        tags: (p.prompt_tags || [])
          .map((pt: any) => pt.tags)
          .filter(Boolean)
          .map((t: any) => ({ id: t.id, name: t.name, color: t.color || "slate" })),
      }));

      setPrompts(mapped);
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
          .select("id, category, prompt_text, created_at, public_slug, prompt_tags(tag_id, tags(id, name, color))")
          .eq("public_slug", slug)
          .eq("is_public", true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          const p = data as any;
          setPrompt({
            id: p.id,
            category: p.category,
            prompt_text: p.prompt_text,
            created_at: p.created_at,
            public_slug: p.public_slug,
            tags: (p.prompt_tags || [])
              .map((pt: any) => pt.tags)
              .filter(Boolean)
              .map((t: any) => ({ id: t.id, name: t.name, color: t.color || "slate" })),
          });
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
