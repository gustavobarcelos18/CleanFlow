import React from 'react';
import { Building2, ChevronDown, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { cn } from '@/lib/utils';

interface OrganizationUnitSelectorProps {
  className?: string;
}

export function OrganizationUnitSelector({ className }: OrganizationUnitSelectorProps) {
  const { 
    organization, 
    units, 
    currentUnit, 
    setCurrentUnit, 
    isMultiUnit,
    isLoading 
  } = useOrganizationContext();

  if (isLoading || !organization) {
    return null;
  }

  // Single unit - no selector needed
  if (!isMultiUnit) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "flex items-center gap-2 h-auto py-2 px-3 min-w-[200px] justify-between",
            className
          )}
        >
          <div className="flex items-center gap-2 text-left">
            <div className="p-1.5 bg-primary/10 rounded">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Unidade atual</span>
              <span className="text-sm font-medium truncate max-w-[140px]">
                {currentUnit?.nome_unidade || 'Selecione'}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {organization.nome_fantasia}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {units.map((unit) => (
          <DropdownMenuItem
            key={unit.id}
            onClick={() => setCurrentUnit(unit)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              currentUnit?.id === unit.id && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{unit.nome_unidade}</p>
                {unit.codigo_interno && (
                  <p className="text-xs text-muted-foreground">{unit.codigo_interno}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unit.is_matriz && (
                <Badge variant="secondary" className="text-xs">Matriz</Badge>
              )}
              {currentUnit?.id === unit.id && (
                <Badge variant="default" className="text-xs">Atual</Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
