import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NewPatientDialog } from "@/components/schedule/NewPatientDialog";

interface PatientFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  riskFilter: string;
  setRiskFilter: (risk: string) => void;
  onAddSuccess?: () => void;
}

export function PatientFilters({
  searchTerm,
  setSearchTerm,
  riskFilter,
  setRiskFilter,
  onAddSuccess,
}: PatientFiltersProps) {
  const riskOptions = [
    { label: "Todos", value: "all" },
    { label: "Baixo Risco", value: "low" },
    { label: "Médio Risco", value: "medium" },
    { label: "Alto Risco", value: "high" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card/30 border border-border/50 backdrop-blur-sm rounded-xl p-4 md:p-5 w-full min-w-0">
      <div className="flex flex-col md:flex-row items-center gap-3 w-full min-w-0">
        <div className="relative w-full md:flex-1 md:min-w-[240px] md:max-w-[560px] group min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
          <Input
            placeholder="Pesquisar por nome, CPF, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-muted/50 shadow-inner focus:bg-background transition-all rounded-full h-10 min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-1 whitespace-nowrap shrink-0">
            <Filter className="h-4 w-4" />

          <span>Filtrar por Risco:</span>
        </div>
        <div className="flex gap-2 p-1">
          {riskOptions.map((option) => {
            const isSelected = riskFilter === option.value;

            const getSelectedStyles = (val: string) => {
              switch (val) {
                case "low":
                  return "bg-success hover:bg-success/90 text-success-foreground border-success shadow-lg shadow-success/20";
                case "medium":
                  return "bg-warning hover:bg-warning/90 text-warning-foreground border-warning shadow-lg shadow-warning/20";
                case "high":
                  return "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive shadow-lg shadow-destructive/20";
                case "all":
                  return "bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-lg shadow-primary/20";
                default:
                  return "";
              }
            };

            return (
              <Badge
                key={option.value}
                variant="outline"
                className={cn(
                  "cursor-pointer px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border",
                  isSelected
                    ? getSelectedStyles(option.value)
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/50 hover:border-border hover:scale-105",
                )}
                onClick={() => setRiskFilter(option.value)}
              >
                {option.label}
              </Badge>
            );
          })}
        </div>
      </div>
      </div>

      <div className="shrink-0 w-full md:w-auto">
        <div className="w-full md:w-auto">
          <NewPatientDialog onSuccess={onAddSuccess} />
        </div>
      </div>
    </div>
  );
}
