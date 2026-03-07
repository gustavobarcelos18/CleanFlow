import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();

  const handleToggle = async () => {
    const newTheme = theme === "light" ? "dark" : "light";

    // 1. Altera localmente de imediato (sem atraso visual)
    toggleTheme();

    // 2. Persiste no banco de dados
    if (profile?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ theme: newTheme } as any)
        .eq("id", profile.id)
        .select("id, theme")
        .single();

      if (error) {
        console.error(
          "[ThemeToggle] Erro ao salvar tema no banco:",
          error.message,
          error,
        );
      } else {
        console.log("[ThemeToggle] Tema salvo no banco com sucesso:", data);
      }
    } else {
      console.warn(
        "[ThemeToggle] profile.id não encontrado — tema não foi salvo no banco.",
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Sun className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="sr-only">
        Alternar para {theme === "light" ? "modo escuro" : "modo claro"}
      </span>
    </Button>
  );
}
