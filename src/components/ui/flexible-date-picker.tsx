import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FlexibleDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  disabled?: boolean;
}

export function FlexibleDatePicker({ value, onChange, label, disabled }: FlexibleDatePickerProps) {
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // Sincronizar com o valor externo
  useEffect(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      setDay(value.getDate().toString());
      setMonth((value.getMonth() + 1).toString());
      setYear(value.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  // Atualizar a data quando qualquer campo mudar
  useEffect(() => {
    if (day && month && year) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month) - 1; // JS months são 0-indexed
      const yearNum = parseInt(year);

      // Validar se a data é válida
      const newDate = new Date(yearNum, monthNum, dayNum);
      
      // Verificar se a data construída é válida
      if (
        newDate.getDate() === dayNum &&
        newDate.getMonth() === monthNum &&
        newDate.getFullYear() === yearNum
      ) {
        onChange(newDate);
      }
    } else {
      // Se algum campo estiver vazio, limpar a data
      if (!day && !month && !year) {
        onChange(undefined);
      }
    }
  }, [day, month, year]);

  // Gerar arrays de opções
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="grid grid-cols-3 gap-2">
        <Select value={day} onValueChange={setDay} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Dia" />
          </SelectTrigger>
          <SelectContent>
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={setMonth} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
