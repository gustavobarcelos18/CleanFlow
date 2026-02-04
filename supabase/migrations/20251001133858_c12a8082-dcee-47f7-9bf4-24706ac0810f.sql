-- Add ordem column to agenda table for custom ordering
ALTER TABLE public.agenda 
ADD COLUMN ordem integer;

-- Create index for better performance on ordering queries
CREATE INDEX idx_agenda_ordem ON public.agenda(tenant_id, ordem);

-- Update existing records to have sequential order based on inicio
WITH ordered_agenda AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY inicio) as row_num
  FROM public.agenda
)
UPDATE public.agenda
SET ordem = ordered_agenda.row_num
FROM ordered_agenda
WHERE public.agenda.id = ordered_agenda.id;