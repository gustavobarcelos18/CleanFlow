import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminTheme } from "@/hooks/useAdminTheme";

export function AdminThemeToggle() {
    const { theme, toggleTheme, loading } = useAdminTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            disabled={loading}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </Button>
    );
}
