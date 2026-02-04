
-- Função para pré-visualizar configuração do segmento (sem aplicar)
CREATE OR REPLACE FUNCTION public.preview_segment_config(p_segmento text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'segmento', p_segmento,
    'features', (
      SELECT jsonb_agg(jsonb_build_object(
        'recurso', cm.recurso,
        'descricao', cm.descricao,
        'categoria', cm.categoria,
        'habilitado', cm.flag_default
      ) ORDER BY cm.categoria, cm.recurso)
      FROM capability_matrix cm
      WHERE cm.codigo_segmento = p_segmento
    ),
    'menu', (
      SELECT nb.itens_menu
      FROM navigation_blueprints nb
      WHERE nb.codigo_segmento = p_segmento
      LIMIT 1
    ),
    'total_features', (
      SELECT COUNT(*) 
      FROM capability_matrix cm 
      WHERE cm.codigo_segmento = p_segmento AND cm.flag_default = true
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Função para trocar segmento de um tenant (reconfigura sem quebrar dados)
CREATE OR REPLACE FUNCTION public.change_tenant_segment(
  p_tenant_id uuid, 
  p_novo_segmento text,
  p_preservar_customizacoes boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_segmento_anterior text;
  v_flags_removidas integer := 0;
  v_flags_adicionadas integer := 0;
  v_flags_mantidas integer := 0;
BEGIN
  -- Buscar segmento anterior
  SELECT (segmentos->0->>'codigo')::text INTO v_segmento_anterior
  FROM tenant_profile
  WHERE tenant_id = p_tenant_id;

  -- Se preservar customizações, só atualizar flags com origem 'segmento'
  IF p_preservar_customizacoes THEN
    -- Desativar flags do segmento anterior que não existem no novo
    UPDATE tenant_feature_flags tff
    SET enabled = false, atualizado_em = now()
    WHERE tff.tenant_id = p_tenant_id
      AND tff.origem = 'segmento'
      AND tff.recurso NOT IN (
        SELECT cm.recurso FROM capability_matrix cm WHERE cm.codigo_segmento = p_novo_segmento
      );
    GET DIAGNOSTICS v_flags_removidas = ROW_COUNT;
    
    -- Aplicar novas flags do segmento
    INSERT INTO tenant_feature_flags (tenant_id, recurso, enabled, origem)
    SELECT p_tenant_id, cm.recurso, cm.flag_default, 'segmento'
    FROM capability_matrix cm
    WHERE cm.codigo_segmento = p_novo_segmento
    ON CONFLICT (tenant_id, recurso) 
    DO UPDATE SET 
      enabled = EXCLUDED.enabled,
      atualizado_em = now()
    WHERE tenant_feature_flags.origem = 'segmento';
    GET DIAGNOSTICS v_flags_adicionadas = ROW_COUNT;
  ELSE
    -- Remover todas as flags e reaplicar
    DELETE FROM tenant_feature_flags WHERE tenant_id = p_tenant_id;
    
    -- Aplicar flags do novo segmento
    INSERT INTO tenant_feature_flags (tenant_id, recurso, enabled, origem)
    SELECT p_tenant_id, cm.recurso, cm.flag_default, 'segmento'
    FROM capability_matrix cm
    WHERE cm.codigo_segmento = p_novo_segmento;
    GET DIAGNOSTICS v_flags_adicionadas = ROW_COUNT;
  END IF;

  -- Contar flags mantidas (customizações manuais)
  SELECT COUNT(*) INTO v_flags_mantidas
  FROM tenant_feature_flags
  WHERE tenant_id = p_tenant_id AND origem = 'manual';

  -- Atualizar tenant_profile
  UPDATE tenant_profile
  SET 
    segmentos = jsonb_build_array(jsonb_build_object('codigo', p_novo_segmento)),
    updated_at = now()
  WHERE tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'sucesso', true,
    'segmento_anterior', v_segmento_anterior,
    'segmento_novo', p_novo_segmento,
    'flags_removidas', v_flags_removidas,
    'flags_adicionadas', v_flags_adicionadas,
    'flags_customizadas_mantidas', v_flags_mantidas
  );
END;
$$;

-- Função para obter menu do tenant baseado nas flags ativas
CREATE OR REPLACE FUNCTION public.get_tenant_menu(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_segmento text;
  v_menu jsonb;
  v_flags_ativas text[];
BEGIN
  -- Buscar segmento do tenant
  SELECT (segmentos->0->>'codigo')::text INTO v_segmento
  FROM tenant_profile
  WHERE tenant_id = p_tenant_id;

  IF v_segmento IS NULL THEN
    v_segmento := 'saude'; -- Default
  END IF;

  -- Buscar flags ativas
  SELECT array_agg(recurso) INTO v_flags_ativas
  FROM tenant_feature_flags
  WHERE tenant_id = p_tenant_id AND enabled = true;

  -- Buscar menu do segmento e filtrar por flags
  SELECT jsonb_agg(item ORDER BY idx)
  INTO v_menu
  FROM (
    SELECT item, idx
    FROM navigation_blueprints nb,
         jsonb_array_elements(nb.itens_menu) WITH ORDINALITY AS t(item, idx)
    WHERE nb.codigo_segmento = v_segmento
      AND (
        jsonb_array_length(item->'visibilidade_por_flag') = 0
        OR EXISTS (
          SELECT 1 
          FROM jsonb_array_elements_text(item->'visibilidade_por_flag') AS flag
          WHERE flag = ANY(v_flags_ativas)
        )
      )
  ) filtered;

  RETURN COALESCE(v_menu, '[]'::jsonb);
END;
$$;

-- Função para verificar se tenant tem feature ativa
CREATE OR REPLACE FUNCTION public.tenant_has_feature(p_tenant_id uuid, p_recurso text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM tenant_feature_flags WHERE tenant_id = p_tenant_id AND recurso = p_recurso),
    false
  );
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.preview_segment_config(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_tenant_segment(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_menu(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_has_feature(uuid, text) TO authenticated;
