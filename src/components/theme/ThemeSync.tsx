import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";

export function ThemeSync() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Use a ref to track if we've done the initial sync to prevent feedback loops
  const initialSyncDone = useRef<boolean>(false);

  // Sync DB -> Local Theme on login
  useEffect(() => {
    // Only proceed if we have a profile and we haven't synced yet
    if (profile?.id && !initialSyncDone.current) {
      if (profile.theme === "light" || profile.theme === "dark") {
        if (theme !== profile.theme) {
          setTheme(profile.theme);
        }
      } else {
        // First login or theme not set, save the current local theme to DB
        supabase.from("profiles").update({ theme }).eq("id", profile.id).then();
      }
      initialSyncDone.current = true;
    }
  }, [profile?.id, profile?.theme]); // depend on profile to apply when it loads

  // Sync Local Theme -> DB on user toggle
  useEffect(() => {
    if (!profile?.id || !initialSyncDone.current) return;

    if (profile.theme !== theme) {
      supabase.from("profiles").update({ theme }).eq("id", profile.id).then();
    }
  }, [theme, profile?.id]);

  // Reset sync state on logout
  useEffect(() => {
    if (!user) {
      initialSyncDone.current = false;
    }
  }, [user]);

  return null;
}
