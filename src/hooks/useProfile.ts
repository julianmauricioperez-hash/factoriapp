import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  has_completed_onboarding: boolean;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Profile might not exist yet for users created before the trigger
        if (error.code === "PGRST116") {
          // Try to create the profile
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({ id: user.id })
            .select()
            .single();
          setProfile(newProfile);
        }
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const completeOnboarding = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_onboarding: true })
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, has_completed_onboarding: true } : prev);
    }
    return { error };
  };

  return { profile, loading, completeOnboarding };
}
