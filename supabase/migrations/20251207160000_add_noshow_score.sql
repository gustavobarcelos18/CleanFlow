-- Add no_show_score and no_show_risk_level to agenda table
ALTER TABLE public.agenda 
ADD COLUMN IF NOT EXISTS no_show_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_show_risk_level text DEFAULT 'baixo'; -- 'baixo', 'medio', 'alto'

-- Create index for performance on filtering by risk
CREATE INDEX IF NOT EXISTS idx_agenda_no_show_risk ON public.agenda(no_show_risk_level);
