-- Migration: Enforce Plan Limits and Flags
-- Description: Adds triggers to enforce seat and client limits, and updates plan flags.

-- 1. Update Plan Flags and Limits
UPDATE public.planos_limites
SET flags = '{"whatsapp_automation": false, "schedule_automation": false}'::jsonb
WHERE codigo_plano = 'free_solo';

UPDATE public.planos_limites
SET flags = '{"whatsapp_automation": true, "schedule_automation": true}'::jsonb
WHERE codigo_plano IN ('pro_solo', 'company_base', 'pro_unit');

-- 2. Function to Check Seat Limits (RBAC)
CREATE OR REPLACE FUNCTION public.check_seat_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_role TEXT;
    v_max_seats INT;
    v_current_seats INT;
    v_plan_code TEXT;
    v_unlimited BOOLEAN;
BEGIN
    v_tenant_id := NEW.tenant_id;
    v_role := NEW.papel;

    -- Only check for 'profissional' and 'secretaria'
    IF v_role NOT IN ('profissional', 'secretaria') THEN
        RETURN NEW;
    END IF;

    -- Get authorized seat count from subscription
    -- We join assinaturas and assinatura_seats
    SELECT 
        s.quantidade,
        p.codigo_plano
    INTO 
        v_max_seats,
        v_plan_code
    FROM public.assinaturas a
    JOIN public.assinatura_seats s ON s.assinatura_id = a.id
    JOIN public.planos_precos p ON p.codigo_plano = a.codigo_plano
    WHERE a.tenant_id = v_tenant_id
      AND a.status IN ('active', 'trialing', 'past_due')
      AND s.tipo = v_role;

    -- If no active subscription or seat record found, maybe allow or block?
    -- Let's assume block if no subscription is active (or default to 0)
    IF v_max_seats IS NULL THEN
        -- Fallback: check if it's a new tenant without sub yet? 
        -- Or maybe we should allow 1 for free plans if sub not fully set up?
        -- For safety, let's assume strict enforcement.
        RAISE EXCEPTION 'No active subscription or seat configuration found for role %', v_role;
    END IF;

    -- Count current users with this role
    SELECT COUNT(*) INTO v_current_seats
    FROM public.rbac_usuarios
    WHERE tenant_id = v_tenant_id
      AND papel = v_role
      AND ativo = true; -- Only count active users

    -- Check limit
    -- Note: NEW record is not yet in the table for BEFORE INSERT
    -- For UPDATE, we should handle if we are changing role or activating
    
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.ativo = false AND NEW.ativo = true) THEN
        IF v_current_seats >= v_max_seats THEN
            RAISE EXCEPTION 'Limit of % seats reached for role %. Upgrade required.', v_max_seats, v_role;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger for RBAC
DROP TRIGGER IF EXISTS enforce_seat_limits ON public.rbac_usuarios;
CREATE TRIGGER enforce_seat_limits
    BEFORE INSERT OR UPDATE ON public.rbac_usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.check_seat_limits();

-- 4. Function to Check Client Limits (Pacientes)
CREATE OR REPLACE FUNCTION public.check_client_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_max_clients INT;
    v_current_clients INT;
BEGIN
    v_tenant_id := NEW.tenant_id;

    -- Get max clients from plan limits
    SELECT l.max_clientes
    INTO v_max_clients
    FROM public.assinaturas a
    JOIN public.planos_limites l ON l.codigo_plano = a.codigo_plano
    WHERE a.tenant_id = v_tenant_id
      AND a.status IN ('active', 'trialing', 'past_due');

    -- If max_clients is NULL, it's unlimited
    IF v_max_clients IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count current patients
    SELECT COUNT(*) INTO v_current_clients
    FROM public.pacientes
    WHERE tenant_id = v_tenant_id;

    IF v_current_clients >= v_max_clients THEN
        RAISE EXCEPTION 'Limit of % clients reached for your plan. Upgrade required.', v_max_clients;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for Pacientes
DROP TRIGGER IF EXISTS enforce_client_limits ON public.pacientes;
CREATE TRIGGER enforce_client_limits
    BEFORE INSERT ON public.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_client_limits();
