-- Add razao_social and nome_fantasia columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS razao_social text,
ADD COLUMN IF NOT EXISTS nome_fantasia text;

-- Migrate existing 'nome' data to razao_social for existing tenants
UPDATE public.tenants 
SET razao_social = nome 
WHERE razao_social IS NULL AND nome IS NOT NULL;