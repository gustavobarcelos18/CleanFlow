-- Migration to seed global automations
-- Created at 2025-12-07 22:00:00

DO $$
DECLARE
    v_flow_id uuid;
    v_trigger_node_id uuid;
    v_action_node_id uuid;
    v_condition_node_id uuid;
BEGIN
    -- 1. GERAL: Happy Birthday
    INSERT INTO automations_flows (tenant_id, nome, descricao, ativo, is_global, segmento)
    VALUES (NULL, 'Feliz Aniversário', 'Envia uma mensagem de parabéns no dia do aniversário do paciente.', TRUE, TRUE, 'geral')
    RETURNING id INTO v_flow_id;

    -- Trigger: Birthday
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'trigger', '{"event": "onBirthday"}'::jsonb, 0)
    RETURNING id INTO v_trigger_node_id;

    -- Action: Send WhatsApp
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'action', '{"action_type": "send_whatsapp", "message_type": "marketing", "template": "Parabéns {{paciente_nome}}! Desejamos muitas felicidades."}'::jsonb, 1)
    RETURNING id INTO v_action_node_id;

    -- Edge
    INSERT INTO automations_edges (flow_id, from_node_id, to_node_id)
    VALUES (v_flow_id, v_trigger_node_id, v_action_node_id);


    -- 2. SAÚDE: Lembrete de Retorno (6 meses)
    INSERT INTO automations_flows (tenant_id, nome, descricao, ativo, is_global, segmento)
    VALUES (NULL, 'Lembrete de Retorno Semestral', 'Lembra o paciente de marcar um checkup após 6 meses da última consulta.', TRUE, TRUE, 'saude')
    RETURNING id INTO v_flow_id;

    -- Trigger: Appointment Finished
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'trigger', '{"event": "onAppointmentFinished"}'::jsonb, 0)
    RETURNING id INTO v_trigger_node_id;

    -- Condition: Wait 6 months (Simulated via condition for now, or we need a 'delay' node type later)
    -- For now, let's just add an action that schedules a message
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'action', '{"action_type": "schedule_message", "delay_days": 180, "message_template": "Olá {{paciente_nome}}, já faz 6 meses da sua última consulta. Que tal agendar um checkup?"}'::jsonb, 1)
    RETURNING id INTO v_action_node_id;

    -- Edge
    INSERT INTO automations_edges (flow_id, from_node_id, to_node_id)
    VALUES (v_flow_id, v_trigger_node_id, v_action_node_id);


    -- 3. BELEZA: Confirmação de Agendamento
    INSERT INTO automations_flows (tenant_id, nome, descricao, ativo, is_global, segmento)
    VALUES (NULL, 'Confirmação de Agendamento', 'Envia solicitação de confirmação 24h antes.', TRUE, TRUE, 'beleza')
    RETURNING id INTO v_flow_id;

    -- Trigger: Appointment Created
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'trigger', '{"event": "onAppointmentCreated"}'::jsonb, 0)
    RETURNING id INTO v_trigger_node_id;

    -- Action: Send WhatsApp Confirmation
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'action', '{"action_type": "send_whatsapp", "message_type": "utility", "template": "Olá {{paciente_nome}}, confirme seu horário de amanhã respondendo SIM."}'::jsonb, 1)
    RETURNING id INTO v_action_node_id;

    -- Edge
    INSERT INTO automations_edges (flow_id, from_node_id, to_node_id)
    VALUES (v_flow_id, v_trigger_node_id, v_action_node_id);


    -- 4. JURÍDICO: Solicitação de Documentos
    INSERT INTO automations_flows (tenant_id, nome, descricao, ativo, is_global, segmento)
    VALUES (NULL, 'Solicitação de Documentos', 'Envia lista de documentos necessários após abertura de processo.', TRUE, TRUE, 'juridico')
    RETURNING id INTO v_flow_id;

    -- Trigger: Case Opened (Simulated as Appointment Created for now)
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'trigger', '{"event": "onCaseOpened"}'::jsonb, 0)
    RETURNING id INTO v_trigger_node_id;

    -- Action: Email
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'action', '{"action_type": "send_email", "template": "Lista de documentos para seu processo."}'::jsonb, 1)
    RETURNING id INTO v_action_node_id;

    -- Edge
    INSERT INTO automations_edges (flow_id, from_node_id, to_node_id)
    VALUES (v_flow_id, v_trigger_node_id, v_action_node_id);


    -- 5. AUTOMOTIVO: Lembrete de Troca de Óleo
    INSERT INTO automations_flows (tenant_id, nome, descricao, ativo, is_global, segmento)
    VALUES (NULL, 'Lembrete de Troca de Óleo', 'Avisa o cliente para trocar o óleo após 6 meses ou km estimado.', TRUE, TRUE, 'automotivo')
    RETURNING id INTO v_flow_id;

    -- Trigger: Service Finished
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'trigger', '{"event": "onServiceFinished"}'::jsonb, 0)
    RETURNING id INTO v_trigger_node_id;

    -- Action: SMS
    INSERT INTO automations_nodes (flow_id, tipo, config_json, ordem)
    VALUES (v_flow_id, 'action', '{"action_type": "send_sms", "template": "Hora de trocar o óleo do seu veículo!"}'::jsonb, 1)
    RETURNING id INTO v_action_node_id;

    -- Edge
    INSERT INTO automations_edges (flow_id, from_node_id, to_node_id)
    VALUES (v_flow_id, v_trigger_node_id, v_action_node_id);

END $$;
