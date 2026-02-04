import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";

export const ThemeToggle = () => {
  const { theme, updateTheme } = useDashboardPreferences();

  const getIcon = () => {
    switch (theme) {
      case 'escuro':
        return <Moon className="h-5 w-5" />;
      case 'sistema':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {getIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => updateTheme('claro')}>
          <Sun className="h-4 w-4 mr-2" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateTheme('escuro')}>
          <Moon className="h-4 w-4 mr-2" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateTheme('sistema')}>
          <Monitor className="h-4 w-4 mr-2" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
