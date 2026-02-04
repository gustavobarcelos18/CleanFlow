-- Migration: Billing Enhancements for Scheduling and Multi-unit
-- Description: Adds columns for scheduled plan changes and updates seat types.

-- 1. Add scheduling columns to assinaturas
ALTER TABLE public.assinaturas
ADD COLUMN IF NOT EXISTS scheduled_change_plan_code TEXT REFERENCES public.planos_precos(codigo_plano),
ADD COLUMN IF NOT EXISTS scheduled_change_date TIMESTAMPTZ;

-- 2. Update check constraint for assinatura_seats type to allow 'unidade'
ALTER TABLE public.assinatura_seats DROP CONSTRAINT IF EXISTS assinatura_seats_tipo_check;
ALTER TABLE public.assinatura_seats ADD CONSTRAINT assinatura_seats_tipo_check CHECK (tipo IN ('profissional', 'secretaria', 'unidade'));
