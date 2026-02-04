-- ====================================================================
-- MIGRAÇÃO: CONTROLE GRANULAR DE ACESSO A DADOS DE PACIENTES
-- ====================================================================
-- Esta migração implementa controle de acesso baseado em atribuições
-- para proteger dados sensíveis de pacientes contra acesso não autorizado

-- 1. Criar tabela de atribuições paciente-profissional
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.paciente_atribuicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(paciente_id, profissional_id)
);

COMMENT ON TABLE public.paciente_atribuicoes IS 
'Controla quais profissionais têm acesso a quais pacientes. Atribuições são criadas automaticamente ao agendar consultas.';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_paciente_atribuicoes_paciente 
  ON public.paciente_atribuicoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_paciente_atribuicoes_profissional 
  ON public.paciente_atribuicoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_paciente_atribuicoes_tenant 
  ON public.paciente_atribuicoes(tenant_id);

-- Trigger para updated_at
CREATE TRIGGER update_paciente_atribuicoes_updated_at
  BEFORE UPDATE ON public.paciente_atribuicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Habilitar RLS na tabela de atribuições
-- ====================================================================
ALTER TABLE public.paciente_atribuicoes ENABLE ROW LEVEL SECURITY;

-- Staff pode ver atribuições do seu tenant
CREATE POLICY "Staff can view patient assignments"
ON public.paciente_atribuicoes
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'profissional', 'recepcao')
  )
);

-- Admins e profissionais podem gerenciar atribuições
CREATE POLICY "Admins and professionals can manage assignments"
ON public.paciente_atribuicoes
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'profissional')
  )
);

-- 3. RECRIAR políticas RLS da tabela pacientes com controle granular
-- ====================================================================

-- Remover políticas antigas que davam acesso total
DROP POLICY IF EXISTS "Medical staff can view patients" ON public.pacientes;
DROP POLICY IF EXISTS "Staff can manage patients" ON public.pacientes;

-- 3.1 Políticas para SELECT (visualização)
-- --------------------------------------------------------

-- Admins podem ver todos os pacientes do tenant
CREATE POLICY "Admins can view all patients"
ON public.pacientes
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Recepção pode ver todos os pacientes do tenant (necessário para agendamento)
CREATE POLICY "Reception can view all patients"
ON public.pacientes
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'recepcao'
  )
);

-- Profissionais podem ver APENAS pacientes atribuídos ou com consultas agendadas
CREATE POLICY "Professionals can view assigned patients"
ON public.pacientes
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'profissional'
  )
  AND (
    -- Paciente tem atribuição direta ao profissional
    id IN (
      SELECT paciente_id 
      FROM paciente_atribuicoes 
      WHERE profissional_id = auth.uid()
    )
    OR
    -- Paciente tem consulta agendada com o profissional
    id IN (
      SELECT paciente_id 
      FROM agenda 
      WHERE profissional_id = auth.uid()
    )
  )
);

-- 3.2 Políticas para INSERT/UPDATE/DELETE
-- --------------------------------------------------------

-- Admins e recepção podem gerenciar todos os pacientes do tenant
CREATE POLICY "Admins and reception can manage all patients"
ON public.pacientes
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'recepcao')
  )
);

-- Profissionais podem atualizar APENAS pacientes atribuídos (ex: atualizar notas)
CREATE POLICY "Professionals can update assigned patients"
ON public.pacientes
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'profissional'
  )
  AND (
    id IN (
      SELECT paciente_id 
      FROM paciente_atribuicoes 
      WHERE profissional_id = auth.uid()
    )
    OR
    id IN (
      SELECT paciente_id 
      FROM agenda 
      WHERE profissional_id = auth.uid()
    )
  )
);

-- 4. Função para atribuição automática ao criar consulta
-- ====================================================================
CREATE OR REPLACE FUNCTION public.auto_assign_patient_to_professional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar ou atualizar atribuição quando uma consulta é agendada
  IF NEW.profissional_id IS NOT NULL AND NEW.paciente_id IS NOT NULL THEN
    INSERT INTO public.paciente_atribuicoes (
      tenant_id,
      paciente_id,
      profissional_id,
      created_at,
      updated_at
    )
    VALUES (
      NEW.tenant_id,
      NEW.paciente_id,
      NEW.profissional_id,
      now(),
      now()
    )
    ON CONFLICT (paciente_id, profissional_id) 
    DO UPDATE SET updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_assign_patient_to_professional() IS
'Cria automaticamente uma atribuição paciente-profissional quando uma consulta é agendada';

-- 5. Trigger para atribuição automática
-- ====================================================================
DROP TRIGGER IF EXISTS trigger_auto_assign_patient ON public.agenda;

CREATE TRIGGER trigger_auto_assign_patient
  AFTER INSERT OR UPDATE OF profissional_id, paciente_id
  ON public.agenda
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_patient_to_professional();

-- 6. Popular atribuições existentes baseadas em consultas
-- ====================================================================
INSERT INTO public.paciente_atribuicoes (tenant_id, paciente_id, profissional_id)
SELECT DISTINCT 
  a.tenant_id,
  a.paciente_id,
  a.profissional_id
FROM public.agenda a
WHERE a.profissional_id IS NOT NULL
ON CONFLICT (paciente_id, profissional_id) DO NOTHING;