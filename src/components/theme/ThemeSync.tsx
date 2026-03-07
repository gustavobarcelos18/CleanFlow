import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme/ThemeProvider";

type Theme = "light" | "dark";

export function ThemeSync() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Só executa uma vez por carregamento, após o perfil estar disponível
    if (!profile?.id || hasSynced.current) return;

    const dbTheme = profile.theme as string | null | undefined;

    // Converte 'system' (valor padrão antigo do banco) para 'dark'
    const resolvedDbTheme: Theme | null =
      dbTheme === "light" ? "light" : dbTheme === "dark" ? "dark" : null; // 'system', null, undefined → não temos preferência no banco ainda

    if (resolvedDbTheme && resolvedDbTheme !== theme) {
      // Verifica se uma mudança local foi feita muito recentemente (ex: usuário mudou e deu F5)
      const lastUpdatedAt = Number(
        localStorage.getItem("cleanflow-ui-theme-updated-at") || "0",
      );
      const isRecentlyUpdatedLocally = Date.now() - lastUpdatedAt < 5000;

      if (!isRecentlyUpdatedLocally) {
        console.log(
          `[ThemeSync] Restaurando tema do banco: ${resolvedDbTheme}`,
        );
        setTheme(resolvedDbTheme);
      } else {
        console.log(
          `[ThemeSync] Mudança local recente detectada, mantendo: ${theme}`,
        );
      }
    }

    hasSynced.current = true;
  }, [profile?.id, profile?.theme, theme, setTheme]);

  return null;
}
