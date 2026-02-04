-- Add conselho field to especialidades
ALTER TABLE public.especialidades 
ADD COLUMN IF NOT EXISTS conselho text;

-- Create profissional_especialidades junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.profissional_especialidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  profissional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  especialidade_id uuid NOT NULL REFERENCES public.especialidades(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profissional_id, especialidade_id)
);

-- Enable RLS
ALTER TABLE public.profissional_especialidades ENABLE ROW LEVEL SECURITY;

-- RLS policies for profissional_especialidades
CREATE POLICY "Users can view profissional_especialidades in same tenant"
  ON public.profissional_especialidades FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage profissional_especialidades"
  ON public.profissional_especialidades FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'profissional')
    )
  );

-- Add especialidade_id to agenda for specialty selection per appointment
ALTER TABLE public.agenda 
ADD COLUMN IF NOT EXISTS especialidade_id uuid REFERENCES public.especialidades(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profissional_especialidades_profissional 
  ON public.profissional_especialidades(profissional_id);
CREATE INDEX IF NOT EXISTS idx_profissional_especialidades_especialidade 
  ON public.profissional_especialidades(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_agenda_especialidade 
  ON public.agenda(especialidade_id);