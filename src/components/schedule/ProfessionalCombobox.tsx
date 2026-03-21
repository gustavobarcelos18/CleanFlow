import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Professional {
  id: string;
  nome: string;
}

interface ProfessionalComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  professionals: Professional[];
}

export function ProfessionalCombobox({ value, onValueChange, professionals }: ProfessionalComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedProfessional = professionals.find((prof) => prof.id === value);

  const filteredProfessionals = professionals.filter((prof) =>
    prof.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="relative w-full justify-between pr-10 min-w-0 overflow-hidden"
        >
          <span className="flex-1 text-left min-w-0 whitespace-normal lg:whitespace-nowrap lg:truncate">
            {selectedProfessional ? selectedProfessional.nome : "Selecione o profissional..."}
          </span>
          <ChevronsUpDown className="absolute right-3 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-background" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar profissional..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {professionals.length === 0 
                ? "Nenhum profissional cadastrado."
                : "Nenhum profissional encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {filteredProfessionals.map((prof) => (
                <CommandItem
                  key={prof.id}
                  value={prof.id}
                  onSelect={() => {
                    onValueChange(prof.id === value ? "" : prof.id);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === prof.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{prof.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
