-- Add missing columns to align backend with Professional dialogs
-- 1) Add data_nascimento column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_nascimento date;

-- 2) Add tipo_profissional_id with FK to tipos_profissional
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_profissional_id uuid;

-- Ensure FK exists (create it only if not existing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_tipo_profissional_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tipo_profissional_id_fkey
      FOREIGN KEY (tipo_profissional_id)
      REFERENCES public.tipos_profissional(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Helpful index for filtering by tipo_profissional_id
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_profissional_id ON public.profiles(tipo_profissional_id);
