import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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

interface Patient {
  id: string;
  nome: string;
  telefone: string;
}

interface PatientComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  patients: Patient[];
}

export function PatientCombobox({
  value,
  onValueChange,
  patients,
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedPatient = patients.find((patient) => patient.id === value);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
      patient.telefone.includes(searchValue),
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
            {selectedPatient ? (
              `${selectedPatient.nome} - ${selectedPatient.telefone}`
            ) : (
              "Selecione o paciente..."
            )}
          </span>
          <ChevronsUpDown className="absolute right-3 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-background" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar paciente..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {patients.length === 0
                ? "Nenhum paciente cadastrado."
                : "Nenhum paciente encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {filteredPatients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => {
                    onValueChange(patient.id === value ? "" : patient.id);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === patient.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{patient.nome}</span>
                    <span className="text-xs opacity-70">
                      {patient.telefone}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
