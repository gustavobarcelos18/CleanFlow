-- ============================================================================
-- CLINFLOW - CHECKUP PART 1: ENUMS
-- Data: 2025-12-07
-- Descrição: Ajusta os ENUMs necessários. Deve ser executado separadamente.
-- ============================================================================

DO $$
BEGIN
    -- STATUS
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_status') THEN
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'aberto';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'em_andamento';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'aguardando_cliente';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'resolvido';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'fechado';
    END IF;

    -- PRIORIDADE
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_priority') THEN
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'baixa';
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'media';
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'alta';
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'urgente';
    END IF;

    -- CATEGORIA
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_category') THEN
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'tecnico';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'financeiro';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'duvida';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'sugestao';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'bug';
    END IF;
END $$;
