-- Add data_nascimento column to pacientes table
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS data_nascimento date;