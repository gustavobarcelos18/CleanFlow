export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_locks: {
        Row: {
          alert_sent: boolean | null
          created_at: string | null
          email: string
          failed_attempts: number | null
          id: string
          locked_at: string
          locked_until: string
          reason: string
          updated_at: string | null
        }
        Insert: {
          alert_sent?: boolean | null
          created_at?: string | null
          email: string
          failed_attempts?: number | null
          id?: string
          locked_at?: string
          locked_until: string
          reason: string
          updated_at?: string | null
        }
        Update: {
          alert_sent?: boolean | null
          created_at?: string | null
          email?: string
          failed_attempts?: number | null
          id?: string
          locked_at?: string
          locked_until?: string
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agenda: {
        Row: {
          confirmado: boolean | null
          confirmado_em: string | null
          conta_pix_id: string | null
          created_at: string | null
          especialidade_id: string | null
          fim: string
          forma_pagamento_id: string | null
          id: string
          inicio: string
          notas: string | null
          ordem: number | null
          organization_id: string | null
          origem: string | null
          paciente_id: string
          paciente_pacote_id: string | null
          plano_saude_id: string | null
          profissional_id: string | null
          sala: string | null
          servico_id: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string
          tipo_atendimento: string | null
          unit_id: string | null
          updated_at: string | null
          valor_consulta: number | null
        }
        Insert: {
          confirmado?: boolean | null
          confirmado_em?: string | null
          conta_pix_id?: string | null
          created_at?: string | null
          especialidade_id?: string | null
          fim: string
          forma_pagamento_id?: string | null
          id?: string
          inicio: string
          notas?: string | null
          ordem?: number | null
          organization_id?: string | null
          origem?: string | null
          paciente_id: string
          paciente_pacote_id?: string | null
          plano_saude_id?: string | null
          profissional_id?: string | null
          sala?: string | null
          servico_id: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string
          tipo_atendimento?: string | null
          unit_id?: string | null
          updated_at?: string | null
          valor_consulta?: number | null
        }
        Update: {
          confirmado?: boolean | null
          confirmado_em?: string | null
          conta_pix_id?: string | null
          created_at?: string | null
          especialidade_id?: string | null
          fim?: string
          forma_pagamento_id?: string | null
          id?: string
          inicio?: string
          notas?: string | null
          ordem?: number | null
          organization_id?: string | null
          origem?: string | null
          paciente_id?: string
          paciente_pacote_id?: string | null
          plano_saude_id?: string | null
          profissional_id?: string | null
          sala?: string | null
          servico_id?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id?: string
          tipo_atendimento?: string | null
          unit_id?: string | null
          updated_at?: string | null
          valor_consulta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_plano_saude_id_fkey"
            columns: ["plano_saude_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agenda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agenda_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      alarmes_lembretes: {
        Row: {
          ativo: boolean | null
          canal_notificacao: string | null
          concluido: boolean | null
          concluido_em: string | null
          concluido_por: string | null
          created_at: string | null
          data_hora: string
          descricao: string | null
          dias_semana: number[] | null
          id: string
          notificacao_enviada: boolean | null
          notificacao_enviada_em: string | null
          prioridade: string | null
          recorrencia: string | null
          support_user_id: string | null
          tenant_id: string | null
          tipo: string
          titulo: string
          updated_at: string | null
          usuario_id: string | null
          vinculo_id: string | null
          vinculo_tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          canal_notificacao?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string | null
          data_hora: string
          descricao?: string | null
          dias_semana?: number[] | null
          id?: string
          notificacao_enviada?: boolean | null
          notificacao_enviada_em?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          support_user_id?: string | null
          tenant_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
          usuario_id?: string | null
          vinculo_id?: string | null
          vinculo_tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          canal_notificacao?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string | null
          data_hora?: string
          descricao?: string | null
          dias_semana?: number[] | null
          id?: string
          notificacao_enviada?: boolean | null
          notificacao_enviada_em?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          support_user_id?: string | null
          tenant_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          usuario_id?: string | null
          vinculo_id?: string | null
          vinculo_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarmes_lembretes_concluido_por_fkey"
            columns: ["concluido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarmes_lembretes_support_user_id_fkey"
            columns: ["support_user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_suporte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarmes_lembretes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarmes_lembretes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "alarmes_lembretes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "alarmes_lembretes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alarmes_notificacoes_historico: {
        Row: {
          alarme_id: string
          canal: string
          enviado_em: string | null
          erro_mensagem: string | null
          id: string
          status: string
        }
        Insert: {
          alarme_id: string
          canal: string
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          status: string
        }
        Update: {
          alarme_id?: string
          canal?: string
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alarmes_notificacoes_historico_alarme_id_fkey"
            columns: ["alarme_id"]
            isOneToOne: false
            referencedRelation: "alarmes_lembretes"
            referencedColumns: ["id"]
          },
        ]
      }
      alarmes_templates: {
        Row: {
          antecedencia_minutos: number | null
          ativo: boolean | null
          canal_padrao: string | null
          created_at: string | null
          descricao: string | null
          id: string
          is_global: boolean | null
          nome: string
          template_descricao: string
          template_titulo: string
          tenant_id: string | null
          tipo: string
        }
        Insert: {
          antecedencia_minutos?: number | null
          ativo?: boolean | null
          canal_padrao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_global?: boolean | null
          nome: string
          template_descricao: string
          template_titulo: string
          tenant_id?: string | null
          tipo: string
        }
        Update: {
          antecedencia_minutos?: number | null
          ativo?: boolean | null
          canal_padrao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_global?: boolean | null
          nome?: string
          template_descricao?: string
          template_titulo?: string
          tenant_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alarmes_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarmes_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "alarmes_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      alertas_risco: {
        Row: {
          agendamento_id: string | null
          created_at: string | null
          descricao: string | null
          id: string
          lido: boolean | null
          lido_em: string | null
          lido_por: string | null
          paciente_id: string | null
          prioridade: string
          resolvido: boolean | null
          resolvido_em: string | null
          resolvido_por: string | null
          tenant_id: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          lido_por?: string | null
          paciente_id?: string | null
          prioridade?: string
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tenant_id: string
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          lido_por?: string | null
          paciente_id?: string | null
          prioridade?: string
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tenant_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_risco_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_risco_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_risco_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_risco_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "alertas_risco_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      anonymization_requests: {
        Row: {
          contact_id: string
          contact_type: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          requested_by: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          contact_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          requested_by: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          contact_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          requested_by?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymization_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymization_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "anonymization_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      appointment_transfers: {
        Row: {
          appointment_id: string
          created_at: string | null
          from_unit_id: string
          id: string
          metadata: Json | null
          motivo: string | null
          to_unit_id: string
          transferred_by: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          from_unit_id: string
          id?: string
          metadata?: Json | null
          motivo?: string | null
          to_unit_id: string
          transferred_by?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          from_unit_id?: string
          id?: string
          metadata?: Json | null
          motivo?: string | null
          to_unit_id?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_transfers_from_unit_id_fkey"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_transfers_to_unit_id_fkey"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_historico: {
        Row: {
          assinatura_id: string
          criado_em: string
          evento: string
          id: string
          payload: Json | null
        }
        Insert: {
          assinatura_id: string
          criado_em?: string
          evento: string
          id?: string
          payload?: Json | null
        }
        Update: {
          assinatura_id?: string
          criado_em?: string
          evento?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_historico_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinatura_seats: {
        Row: {
          assinatura_id: string
          atualizado_em: string
          criado_em: string
          id: string
          preco_unitario: number
          quantidade: number
          quantidade_cobrada: number | null
          quantidade_incluida: number
          tipo: string
        }
        Insert: {
          assinatura_id: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          preco_unitario?: number
          quantidade?: number
          quantidade_cobrada?: number | null
          quantidade_incluida?: number
          tipo: string
        }
        Update: {
          assinatura_id?: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          preco_unitario?: number
          quantidade?: number
          quantidade_cobrada?: number | null
          quantidade_incluida?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinatura_seats_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          atualizado_em: string
          ciclo_fim: string | null
          ciclo_inicio: string | null
          codigo_plano: string
          criado_em: string
          edition: string
          id: string
          provider: string
          provider_subscription_id: string | null
          proximo_cobranca: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          atualizado_em?: string
          ciclo_fim?: string | null
          ciclo_inicio?: string | null
          codigo_plano: string
          criado_em?: string
          edition: string
          id?: string
          provider?: string
          provider_subscription_id?: string | null
          proximo_cobranca?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          atualizado_em?: string
          ciclo_fim?: string | null
          ciclo_inicio?: string | null
          codigo_plano?: string
          criado_em?: string
          edition?: string
          id?: string
          provider?: string
          provider_subscription_id?: string | null
          proximo_cobranca?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_codigo_plano_fkey"
            columns: ["codigo_plano"]
            isOneToOne: false
            referencedRelation: "planos_precos"
            referencedColumns: ["codigo_plano"]
          },
          {
            foreignKeyName: "assinaturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "assinaturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          registro_id: string | null
          tabela: string | null
          tenant_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string | null
          tenant_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string | null
          tenant_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "auditoria_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_admin: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          tipo_evento: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tipo_evento: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tipo_evento?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action_type: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          flow_id: string | null
          id: string
          node_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          flow_id?: string | null
          id?: string
          node_id?: string | null
          status: string
          tenant_id: string
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          flow_id?: string | null
          id?: string
          node_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automations_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "automations_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "automation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      automations_edges: {
        Row: {
          condicao_json: Json | null
          created_at: string | null
          flow_id: string
          from_node_id: string
          id: string
          to_node_id: string
        }
        Insert: {
          condicao_json?: Json | null
          created_at?: string | null
          flow_id: string
          from_node_id: string
          id?: string
          to_node_id: string
        }
        Update: {
          condicao_json?: Json | null
          created_at?: string | null
          flow_id?: string
          from_node_id?: string
          id?: string
          to_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_edges_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automations_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "automations_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "automations_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      automations_flows: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          is_global: boolean | null
          nome: string
          segmento: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_global?: boolean | null
          nome: string
          segmento?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_global?: boolean | null
          nome?: string
          segmento?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "automations_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      automations_nodes: {
        Row: {
          config_json: Json | null
          created_at: string | null
          flow_id: string
          id: string
          ordem: number | null
          tipo: string
        }
        Insert: {
          config_json?: Json | null
          created_at?: string | null
          flow_id: string
          id?: string
          ordem?: number | null
          tipo: string
        }
        Update: {
          config_json?: Json | null
          created_at?: string | null
          flow_id?: string
          id?: string
          ordem?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automations_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_faturas: {
        Row: {
          assinatura_id: string
          atualizado_em: string
          criado_em: string
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          provider_invoice_id: string | null
          status: string
          total: number
        }
        Insert: {
          assinatura_id: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          provider_invoice_id?: string | null
          status?: string
          total?: number
        }
        Update: {
          assinatura_id?: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          provider_invoice_id?: string | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_faturas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_itens: {
        Row: {
          assinatura_id: string
          criado_em: string
          descricao: string
          id: string
          meta: Json | null
          quantidade: number
          referencia_mes: string
          tipo: string
          total: number
          valor_unitario: number
        }
        Insert: {
          assinatura_id: string
          criado_em?: string
          descricao: string
          id?: string
          meta?: Json | null
          quantidade?: number
          referencia_mes: string
          tipo: string
          total: number
          valor_unitario: number
        }
        Update: {
          assinatura_id?: string
          criado_em?: string
          descricao?: string
          id?: string
          meta?: Json | null
          quantidade?: number
          referencia_mes?: string
          tipo?: string
          total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_itens_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_diario: {
        Row: {
          agendamento_id: string | null
          conta_pix_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          organization_id: string | null
          paciente_id: string | null
          profissional_id: string | null
          tenant_id: string
          tipo_lancamento: string
          unit_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          conta_pix_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          paciente_id?: string | null
          profissional_id?: string | null
          tenant_id: string
          tipo_lancamento: string
          unit_id?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          conta_pix_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          paciente_id?: string | null
          profissional_id?: string | null
          tenant_id?: string
          tipo_lancamento?: string
          unit_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_diario_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_conta_pix_id_fkey"
            columns: ["conta_pix_id"]
            isOneToOne: false
            referencedRelation: "contas_pix"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixa_diario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "caixa_diario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "caixa_diario_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_matrix: {
        Row: {
          categoria: string | null
          codigo_segmento: string
          created_at: string | null
          descricao: string | null
          flag: boolean | null
          flag_default: boolean | null
          id: string
          recurso: string
        }
        Insert: {
          categoria?: string | null
          codigo_segmento: string
          created_at?: string | null
          descricao?: string | null
          flag?: boolean | null
          flag_default?: boolean | null
          id?: string
          recurso: string
        }
        Update: {
          categoria?: string | null
          codigo_segmento?: string
          created_at?: string | null
          descricao?: string | null
          flag?: boolean | null
          flag_default?: boolean | null
          id?: string
          recurso?: string
        }
        Relationships: []
      }
      categorias_despesa: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_despesa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_despesa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "categorias_despesa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          contact_id: string
          contact_type: string | null
          created_at: string
          expires_at: string | null
          given_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          origin: string
          revoked_at: string | null
          status: string
          tenant_id: string
          term_url: string | null
          term_version: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          consent_type: string
          contact_id: string
          contact_type?: string | null
          created_at?: string
          expires_at?: string | null
          given_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          origin: string
          revoked_at?: string | null
          status: string
          tenant_id: string
          term_url?: string | null
          term_version: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          consent_type?: string
          contact_id?: string
          contact_type?: string | null
          created_at?: string
          expires_at?: string | null
          given_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          origin?: string
          revoked_at?: string | null
          status?: string
          tenant_id?: string
          term_url?: string | null
          term_version?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "consent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      consumo_mensal: {
        Row: {
          categoria: string
          created_at: string
          excedente: number | null
          franquia: number | null
          id: string
          mes_referencia: string
          preco_unitario: number
          quantidade: number | null
          tenant_id: string
          total: number | null
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          excedente?: number | null
          franquia?: number | null
          id?: string
          mes_referencia: string
          preco_unitario: number
          quantidade?: number | null
          tenant_id: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          excedente?: number | null
          franquia?: number | null
          id?: string
          mes_referencia?: string
          preco_unitario?: number
          quantidade?: number | null
          tenant_id?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumo_mensal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_mensal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "consumo_mensal_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      contas_pix: {
        Row: {
          ativo: boolean | null
          banco: string | null
          chave_pix: string
          created_at: string | null
          id: string
          nome: string
          padrao: boolean | null
          tenant_id: string
          tipo_chave: string
          titular: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          banco?: string | null
          chave_pix: string
          created_at?: string | null
          id?: string
          nome: string
          padrao?: boolean | null
          tenant_id: string
          tipo_chave: string
          titular?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          banco?: string | null
          chave_pix?: string
          created_at?: string | null
          id?: string
          nome?: string
          padrao?: boolean | null
          tenant_id?: string
          tipo_chave?: string
          titular?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_pix_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pix_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "contas_pix_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          agendamento_id: string | null
          conta_pix_id: string | null
          created_at: string | null
          created_by: string | null
          data_recebimento: string | null
          data_vencimento: string
          forma_recebimento_id: string | null
          id: string
          numero_guia: string | null
          observacoes: string | null
          organization_id: string | null
          paciente_id: string
          plano_saude_id: string | null
          status: string
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
          valor: number
          valor_recebido: number | null
        }
        Insert: {
          agendamento_id?: string | null
          conta_pix_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          forma_recebimento_id?: string | null
          id?: string
          numero_guia?: string | null
          observacoes?: string | null
          organization_id?: string | null
          paciente_id: string
          plano_saude_id?: string | null
          status?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
          valor: number
          valor_recebido?: number | null
        }
        Update: {
          agendamento_id?: string | null
          conta_pix_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          forma_recebimento_id?: string | null
          id?: string
          numero_guia?: string | null
          observacoes?: string | null
          organization_id?: string | null
          paciente_id?: string
          plano_saude_id?: string | null
          status?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
          valor?: number
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_conta_pix_id_fkey"
            columns: ["conta_pix_id"]
            isOneToOne: false
            referencedRelation: "contas_pix"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_forma_recebimento_id_fkey"
            columns: ["forma_recebimento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_plano_saude_id_fkey"
            columns: ["plano_saude_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "contas_receber_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "contas_receber_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_type: string
          end_date: string | null
          id: string
          start_date: string | null
          stripe_coupon_id: string | null
          stripe_promo_code_id: string | null
          times_redeemed: number | null
          updated_at: string | null
          usage_limit: number | null
          value: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_type: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          stripe_coupon_id?: string | null
          stripe_promo_code_id?: string | null
          times_redeemed?: number | null
          updated_at?: string | null
          usage_limit?: number | null
          value: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_type?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          stripe_coupon_id?: string | null
          stripe_promo_code_id?: string | null
          times_redeemed?: number | null
          updated_at?: string | null
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          id: string
          markup_percentual: number
          nome: string
          preco_base: number
          preco_venda: number
          quantidade_creditos: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          markup_percentual: number
          nome: string
          preco_base: number
          preco_venda: number
          quantidade_creditos: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          markup_percentual?: number
          nome?: string
          preco_base?: number
          preco_venda?: number
          quantidade_creditos?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_assets: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          identifier: string | null
          metadata: Json | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          identifier?: string | null
          metadata?: Json | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          identifier?: string | null
          metadata?: Json | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      dashboard_prefs: {
        Row: {
          card_order: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          visible_cards: Json | null
        }
        Insert: {
          card_order?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          visible_cards?: Json | null
        }
        Update: {
          card_order?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          visible_cards?: Json | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          last_cleanup_at: string | null
          retention_months: number
          table_name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_cleanup_at?: string | null
          retention_months: number
          table_name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_cleanup_at?: string | null
          retention_months?: number
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dunning_configs: {
        Row: {
          acao: string
          ativo: boolean | null
          canal_notificacao: string[] | null
          created_at: string
          dias_atraso: number
          id: string
          template_mensagem: string | null
          updated_at: string
        }
        Insert: {
          acao: string
          ativo?: boolean | null
          canal_notificacao?: string[] | null
          created_at?: string
          dias_atraso: number
          id?: string
          template_mensagem?: string | null
          updated_at?: string
        }
        Update: {
          acao?: string
          ativo?: boolean | null
          canal_notificacao?: string[] | null
          created_at?: string
          dias_atraso?: number
          id?: string
          template_mensagem?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      error_metrics: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          method: string
          request_id: string | null
          stack_trace: string | null
          status_code: number
          tenant_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          request_id?: string | null
          stack_trace?: string | null
          status_code: number
          tenant_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          request_id?: string | null
          stack_trace?: string | null
          status_code?: number
          tenant_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          ativo: boolean | null
          codigo_cfm: string | null
          conselho: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_cfm?: string | null
          conselho?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_cfm?: string | null
          conselho?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especialidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "especialidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      exames: {
        Row: {
          ativo: boolean | null
          codigo_tuss: string | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number | null
          id: string
          instrucoes: string | null
          nome: string
          preco: number | null
          requisitos: string | null
          tempo_jejum_horas: number | null
          tempo_preparo_minutos: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          instrucoes?: string | null
          nome: string
          preco?: number | null
          requisitos?: string | null
          tempo_jejum_horas?: number | null
          tempo_preparo_minutos?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          instrucoes?: string | null
          nome?: string
          preco?: number | null
          requisitos?: string | null
          tempo_jejum_horas?: number | null
          tempo_preparo_minutos?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exames_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exames_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      exames_procedimentos: {
        Row: {
          ativo: boolean | null
          codigo_tuss: string | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number | null
          id: string
          instrucoes: string | null
          nome: string
          requisitos: string | null
          tempo_jejum_horas: number | null
          tempo_preparo_minutos: number | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["tipo_exame_procedimento"]
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          instrucoes?: string | null
          nome: string
          requisitos?: string | null
          tempo_jejum_horas?: number | null
          tempo_preparo_minutos?: number | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["tipo_exame_procedimento"]
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          instrucoes?: string | null
          nome?: string
          requisitos?: string | null
          tempo_jejum_horas?: number | null
          tempo_preparo_minutos?: number | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["tipo_exame_procedimento"]
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exames_procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exames_procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string | null
          currency_from: string
          currency_to: string
          id: string
          rate: number
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          currency_from: string
          currency_to: string
          id?: string
          rate: number
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          currency_from?: string
          currency_to?: string
          id?: string
          rate?: number
          timestamp?: string | null
        }
        Relationships: []
      }
      export_audit: {
        Row: {
          created_at: string | null
          export_type: string
          file_format: string | null
          file_size_bytes: number | null
          filters: Json | null
          id: string
          ip_address: string | null
          record_count: number | null
          table_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          export_type: string
          file_format?: string | null
          file_size_bytes?: number | null
          filters?: Json | null
          id?: string
          ip_address?: string | null
          record_count?: number | null
          table_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          export_type?: string
          file_format?: string | null
          file_size_bytes?: number | null
          filters?: Json | null
          id?: string
          ip_address?: string | null
          record_count?: number | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      faturas: {
        Row: {
          created_at: string
          data_emissao: string
          data_vencimento: string
          id: string
          link_pagamento: string | null
          mes_referencia: string
          moeda: string
          notas_fiscais: Json | null
          numero_fatura: string
          observacoes: string | null
          pago_em: string | null
          status: string
          tenant_id: string
          updated_at: string
          valor_excedente: number
          valor_plano: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          data_vencimento: string
          id?: string
          link_pagamento?: string | null
          mes_referencia: string
          moeda?: string
          notas_fiscais?: Json | null
          numero_fatura: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valor_excedente?: number
          valor_plano?: number
          valor_total: number
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_vencimento?: string
          id?: string
          link_pagamento?: string | null
          mes_referencia?: string
          moeda?: string
          notas_fiscais?: Json | null
          numero_fatura?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valor_excedente?: number
          valor_plano?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "faturas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      features: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_core: boolean | null
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_core?: boolean | null
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_core?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      financial_commissions: {
        Row: {
          appointment_id: string | null
          base_value: number
          commission_value: number
          created_at: string | null
          id: string
          paid_at: string | null
          professional_id: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          appointment_id?: string | null
          base_value: number
          commission_value: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          professional_id: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          appointment_id?: string | null
          base_value?: number
          commission_value?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          professional_id?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "financial_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      form_schema_registry: {
        Row: {
          ativo: boolean | null
          codigo_segmento: string
          created_at: string | null
          id: string
          ordem: number | null
          schema_json: Json | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_segmento: string
          created_at?: string | null
          id?: string
          ordem?: number | null
          schema_json?: Json | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_segmento?: string
          created_at?: string | null
          id?: string
          ordem?: number | null
          schema_json?: Json | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      formas_pagamento: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
          tenant_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
          tenant_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          tenant_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formas_pagamento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "formas_pagamento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          created_at: string
          documento: string | null
          email: string | null
          endereco: Json | null
          id: string
          nome_fantasia: string
          razao_social: string | null
          status: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome_fantasia: string
          razao_social?: string | null
          status?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome_fantasia?: string
          razao_social?: string | null
          status?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "fornecedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          ativo: boolean
          created_at: string
          data_cotacao: string
          fonte: string
          id: string
          moeda_destino: string
          moeda_origem: string
          override_manual: boolean
          taxa: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_cotacao?: string
          fonte?: string
          id?: string
          moeda_destino?: string
          moeda_origem?: string
          override_manual?: boolean
          taxa: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_cotacao?: string
          fonte?: string
          id?: string
          moeda_destino?: string
          moeda_origem?: string
          override_manual?: boolean
          taxa?: number
        }
        Relationships: []
      }
      historico_dunning: {
        Row: {
          acao_tomada: string
          canal: string
          created_at: string
          dias_atraso: number
          erro_mensagem: string | null
          fatura_id: string
          id: string
          mensagem_enviada: string | null
          sucesso: boolean | null
          tenant_id: string
        }
        Insert: {
          acao_tomada: string
          canal: string
          created_at?: string
          dias_atraso: number
          erro_mensagem?: string | null
          fatura_id: string
          id?: string
          mensagem_enviada?: string | null
          sucesso?: boolean | null
          tenant_id: string
        }
        Update: {
          acao_tomada?: string
          canal?: string
          created_at?: string
          dias_atraso?: number
          erro_mensagem?: string | null
          fatura_id?: string
          id?: string
          mensagem_enviada?: string | null
          sucesso?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_dunning_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_dunning_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_dunning_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "historico_dunning_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      historico_precos: {
        Row: {
          alterado_por: string | null
          categoria: string
          created_at: string
          erros_validacao: Json | null
          id: string
          motivo: string | null
          preco_anterior: number | null
          preco_id: string | null
          preco_novo: number
          validacao_ok: boolean | null
        }
        Insert: {
          alterado_por?: string | null
          categoria: string
          created_at?: string
          erros_validacao?: Json | null
          id?: string
          motivo?: string | null
          preco_anterior?: number | null
          preco_id?: string | null
          preco_novo: number
          validacao_ok?: boolean | null
        }
        Update: {
          alterado_por?: string | null
          categoria?: string
          created_at?: string
          erros_validacao?: Json | null
          id?: string
          motivo?: string | null
          preco_anterior?: number | null
          preco_id?: string | null
          preco_novo?: number
          validacao_ok?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_precos_preco_id_fkey"
            columns: ["preco_id"]
            isOneToOne: false
            referencedRelation: "precos_atual"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_uso_pacotes: {
        Row: {
          agendamento_id: string | null
          created_at: string | null
          data_uso: string
          id: string
          observacoes: string | null
          paciente_pacote_id: string
          sessoes_antes: number
          sessoes_depois: number
          tenant_id: string
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string | null
          data_uso?: string
          id?: string
          observacoes?: string | null
          paciente_pacote_id: string
          sessoes_antes: number
          sessoes_depois: number
          tenant_id: string
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string | null
          data_uso?: string
          id?: string
          observacoes?: string | null
          paciente_pacote_id?: string
          sessoes_antes?: number
          sessoes_depois?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_uso_pacotes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_uso_pacotes_paciente_pacote_id_fkey"
            columns: ["paciente_pacote_id"]
            isOneToOne: false
            referencedRelation: "pacientes_pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_uso_pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_uso_pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "historico_uso_pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      itens_fatura: {
        Row: {
          categoria: string
          created_at: string
          descricao: string
          fatura_id: string
          id: string
          preco_unitario: number
          quantidade: number
          total: number
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao: string
          fatura_id: string
          id?: string
          preco_unitario: number
          quantidade: number
          total: number
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string
          fatura_id?: string
          id?: string
          preco_unitario?: number
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_fatura_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      lembrete_configs: {
        Row: {
          ab_testing_ativo: boolean | null
          created_at: string
          id: string
          janelas_padrao: number[] | null
          nivel_risco: string | null
          template_ids: Json | null
          tenant_id: string
          tipo_servico: string
          updated_at: string
        }
        Insert: {
          ab_testing_ativo?: boolean | null
          created_at?: string
          id?: string
          janelas_padrao?: number[] | null
          nivel_risco?: string | null
          template_ids?: Json | null
          tenant_id: string
          tipo_servico: string
          updated_at?: string
        }
        Update: {
          ab_testing_ativo?: boolean | null
          created_at?: string
          id?: string
          janelas_padrao?: number[] | null
          nivel_risco?: string | null
          template_ids?: Json | null
          tenant_id?: string
          tipo_servico?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembrete_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembrete_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lembrete_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lembrete_historico: {
        Row: {
          agendamento_id: string
          confirmado: boolean | null
          confirmado_em: string | null
          created_at: string
          enviado_em: string | null
          id: string
          janela_horas: number
          metadata: Json | null
          template_id: string
          tempo_resposta_minutos: number | null
          tenant_id: string
          variante: string
        }
        Insert: {
          agendamento_id: string
          confirmado?: boolean | null
          confirmado_em?: string | null
          created_at?: string
          enviado_em?: string | null
          id?: string
          janela_horas: number
          metadata?: Json | null
          template_id: string
          tempo_resposta_minutos?: number | null
          tenant_id: string
          variante: string
        }
        Update: {
          agendamento_id?: string
          confirmado?: boolean | null
          confirmado_em?: string | null
          created_at?: string
          enviado_em?: string | null
          id?: string
          janela_horas?: number
          metadata?: Json | null
          template_id?: string
          tempo_resposta_minutos?: number | null
          tenant_id?: string
          variante?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembrete_historico_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembrete_historico_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lembrete_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembrete_historico_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembrete_historico_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lembrete_historico_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lembrete_templates: {
        Row: {
          assunto: string | null
          ativo: boolean | null
          corpo_mensagem: string
          created_at: string
          criado_por: string | null
          formato: string
          id: string
          janela_horas: number
          nome: string
          recomendacao: string | null
          score: number | null
          taxa_confirmacao: number | null
          tenant_id: string
          tipo_servico: string | null
          total_confirmacoes: number | null
          total_envios: number | null
          updated_at: string
          variante: string
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean | null
          corpo_mensagem: string
          created_at?: string
          criado_por?: string | null
          formato?: string
          id?: string
          janela_horas: number
          nome: string
          recomendacao?: string | null
          score?: number | null
          taxa_confirmacao?: number | null
          tenant_id: string
          tipo_servico?: string | null
          total_confirmacoes?: number | null
          total_envios?: number | null
          updated_at?: string
          variante?: string
        }
        Update: {
          assunto?: string | null
          ativo?: boolean | null
          corpo_mensagem?: string
          created_at?: string
          criado_por?: string | null
          formato?: string
          id?: string
          janela_horas?: number
          nome?: string
          recomendacao?: string | null
          score?: number | null
          taxa_confirmacao?: number | null
          tenant_id?: string
          tipo_servico?: string | null
          total_confirmacoes?: number | null
          total_envios?: number | null
          updated_at?: string
          variante?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembrete_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lembrete_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lembrete_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          paciente_id: string
          preferencia_data_fim: string | null
          preferencia_data_inicio: string | null
          preferencia_hora_fim: string | null
          preferencia_hora_inicio: string | null
          prioridade: number | null
          profissional_id: string | null
          servico_id: string | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          paciente_id: string
          preferencia_data_fim?: string | null
          preferencia_data_inicio?: string | null
          preferencia_hora_fim?: string | null
          preferencia_hora_inicio?: string | null
          prioridade?: number | null
          profissional_id?: string | null
          servico_id?: string | null
          tenant_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          paciente_id?: string
          preferencia_data_fim?: string | null
          preferencia_data_inicio?: string | null
          preferencia_hora_fim?: string | null
          preferencia_hora_inicio?: string | null
          prioridade?: number | null
          profissional_id?: string | null
          servico_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      log_mensagens: {
        Row: {
          canal: Database["public"]["Enums"]["message_channel"]
          created_at: string | null
          destinatario: string
          erro_mensagem: string | null
          id: string
          paciente_id: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          template_usado: string | null
          tenant_id: string
          usuario_id: string | null
        }
        Insert: {
          canal: Database["public"]["Enums"]["message_channel"]
          created_at?: string | null
          destinatario: string
          erro_mensagem?: string | null
          id?: string
          paciente_id?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          template_usado?: string | null
          tenant_id: string
          usuario_id?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["message_channel"]
          created_at?: string | null
          destinatario?: string
          erro_mensagem?: string | null
          id?: string
          paciente_id?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          template_usado?: string | null
          tenant_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_mensagens_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "log_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "log_mensagens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      markup_configs: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string
          id: string
          margem_pct: number | null
          plan_id: string | null
          tenant_id: string | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string
          id?: string
          margem_pct?: number | null
          plan_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string
          id?: string
          margem_pct?: number | null
          plan_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "markup_configs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markup_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markup_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "markup_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      message_audit: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          message_id: string | null
          payload_hash: string
          payload_preview: Json | null
          rota: string
          status: string | null
          tenant_id: string
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          message_id?: string | null
          payload_hash: string
          payload_preview?: Json | null
          rota: string
          status?: string | null
          tenant_id: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          message_id?: string | null
          payload_hash?: string
          payload_preview?: Json | null
          rota?: string
          status?: string | null
          tenant_id?: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_audit_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "log_mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "message_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      messaging_catalog: {
        Row: {
          ativo: boolean | null
          canal: string
          categoria: string
          codigo_segmento: string
          created_at: string | null
          id: string
          placeholders: Json | null
          template_body: string
          template_nome: string
        }
        Insert: {
          ativo?: boolean | null
          canal: string
          categoria: string
          codigo_segmento: string
          created_at?: string | null
          id?: string
          placeholders?: Json | null
          template_body: string
          template_nome: string
        }
        Update: {
          ativo?: boolean | null
          canal?: string
          categoria?: string
          codigo_segmento?: string
          created_at?: string | null
          id?: string
          placeholders?: Json | null
          template_body?: string
          template_nome?: string
        }
        Relationships: []
      }
      metricas_lista_espera: {
        Row: {
          created_at: string | null
          data: string
          id: string
          ofertas_aceitas: number | null
          ofertas_enviadas: number | null
          ofertas_expiradas: number | null
          ofertas_recusadas: number | null
          tempo_medio_resposta_minutos: number | null
          tenant_id: string
          total_lista: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string
          id?: string
          ofertas_aceitas?: number | null
          ofertas_enviadas?: number | null
          ofertas_expiradas?: number | null
          ofertas_recusadas?: number | null
          tempo_medio_resposta_minutos?: number | null
          tenant_id: string
          total_lista?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          ofertas_aceitas?: number | null
          ofertas_enviadas?: number | null
          ofertas_expiradas?: number | null
          ofertas_recusadas?: number | null
          tempo_medio_resposta_minutos?: number | null
          tenant_id?: string
          total_lista?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metricas_lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "metricas_lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      metricas_remarcacao: {
        Row: {
          created_at: string | null
          data: string
          id: string
          remarcacoes_automaticas: number | null
          remarcacoes_manuais: number | null
          remarcacoes_solicitadas: number | null
          taxa_automacao: number | null
          tempo_medio_remarcacao_minutos: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string
          id?: string
          remarcacoes_automaticas?: number | null
          remarcacoes_manuais?: number | null
          remarcacoes_solicitadas?: number | null
          taxa_automacao?: number | null
          tempo_medio_remarcacao_minutos?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          remarcacoes_automaticas?: number | null
          remarcacoes_manuais?: number | null
          remarcacoes_solicitadas?: number | null
          taxa_automacao?: number | null
          tempo_medio_remarcacao_minutos?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_remarcacao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metricas_remarcacao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "metricas_remarcacao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      navigation_blueprints: {
        Row: {
          ativo: boolean | null
          codigo_segmento: string
          created_at: string | null
          icone: string | null
          id: string
          menu_item: string
          ordem: number | null
          parent_menu: string | null
          path: string
          recurso_requerido: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_segmento: string
          created_at?: string | null
          icone?: string | null
          id?: string
          menu_item: string
          ordem?: number | null
          parent_menu?: string | null
          path: string
          recurso_requerido?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_segmento?: string
          created_at?: string | null
          icone?: string | null
          id?: string
          menu_item?: string
          ordem?: number | null
          parent_menu?: string | null
          path?: string
          recurso_requerido?: string | null
        }
        Relationships: []
      }
      ofertas_vaga: {
        Row: {
          agendamento_id: string | null
          created_at: string | null
          expira_em: string
          horario_ofertado: string
          id: string
          lista_espera_id: string
          respondido_em: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string | null
          expira_em: string
          horario_ofertado: string
          id?: string
          lista_espera_id: string
          respondido_em?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string | null
          expira_em?: string
          horario_ofertado?: string
          id?: string
          lista_espera_id?: string
          respondido_em?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_vaga_lista_espera_id_fkey"
            columns: ["lista_espera_id"]
            isOneToOne: false
            referencedRelation: "lista_espera"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_vaga_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_vaga_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ofertas_vaga_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      organizations: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string | null
          documento: string | null
          email: string | null
          estado: string | null
          id: string
          logo_url: string | null
          logradouro: string | null
          moeda: string | null
          nome_fantasia: string
          numero: string | null
          pais: string | null
          plano_base: string | null
          razao_social: string | null
          status: string | null
          telefone: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          logradouro?: string | null
          moeda?: string | null
          nome_fantasia: string
          numero?: string | null
          pais?: string | null
          plano_base?: string | null
          razao_social?: string | null
          status?: string | null
          telefone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          logradouro?: string | null
          moeda?: string | null
          nome_fantasia?: string
          numero?: string | null
          pais?: string | null
          plano_base?: string | null
          razao_social?: string | null
          status?: string | null
          telefone?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      paciente_atribuicoes: {
        Row: {
          created_at: string
          id: string
          paciente_id: string
          profissional_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          paciente_id: string
          profissional_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          paciente_id?: string
          profissional_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paciente_atribuicoes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_atribuicoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_atribuicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_atribuicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "paciente_atribuicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      paciente_preferencias_horario: {
        Row: {
          created_at: string | null
          dias_semana_preferidos: number[] | null
          historico_agendamentos: Json | null
          horario_max: string | null
          horario_min: string | null
          id: string
          paciente_id: string
          periodo_preferido: string | null
          taxa_comparecimento: number | null
          tenant_id: string
          ultima_atualizacao: string | null
        }
        Insert: {
          created_at?: string | null
          dias_semana_preferidos?: number[] | null
          historico_agendamentos?: Json | null
          horario_max?: string | null
          horario_min?: string | null
          id?: string
          paciente_id: string
          periodo_preferido?: string | null
          taxa_comparecimento?: number | null
          tenant_id: string
          ultima_atualizacao?: string | null
        }
        Update: {
          created_at?: string | null
          dias_semana_preferidos?: number[] | null
          historico_agendamentos?: Json | null
          horario_max?: string | null
          horario_min?: string | null
          id?: string
          paciente_id?: string
          periodo_preferido?: string | null
          taxa_comparecimento?: number | null
          tenant_id?: string
          ultima_atualizacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paciente_preferencias_horario_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_preferencias_horario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_preferencias_horario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "paciente_preferencias_horario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      paciente_usuarios: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          paciente_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          paciente_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          paciente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paciente_usuarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          ativo: boolean | null
          consentimento_data: string | null
          consentimento_lgpd: boolean | null
          cpf: string | null
          created_at: string | null
          custom_data: Json | null
          data_nascimento: string | null
          email: string | null
          endereco: Json | null
          estado_civil: string | null
          historico_faltas: number | null
          id: string
          nome: string
          notas_internas: string | null
          numero_carteirinha: string | null
          organization_id: string | null
          plano_saude_id: string | null
          preferencia_contato: string | null
          profissao: string | null
          responsavel_nome: string | null
          responsavel_parentesco: string | null
          responsavel_telefone: string | null
          risco_no_show: number | null
          sexo: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          consentimento_data?: string | null
          consentimento_lgpd?: boolean | null
          cpf?: string | null
          created_at?: string | null
          custom_data?: Json | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: Json | null
          estado_civil?: string | null
          historico_faltas?: number | null
          id?: string
          nome: string
          notas_internas?: string | null
          numero_carteirinha?: string | null
          organization_id?: string | null
          plano_saude_id?: string | null
          preferencia_contato?: string | null
          profissao?: string | null
          responsavel_nome?: string | null
          responsavel_parentesco?: string | null
          responsavel_telefone?: string | null
          risco_no_show?: number | null
          sexo?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          consentimento_data?: string | null
          consentimento_lgpd?: boolean | null
          cpf?: string | null
          created_at?: string | null
          custom_data?: Json | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: Json | null
          estado_civil?: string | null
          historico_faltas?: number | null
          id?: string
          nome?: string
          notas_internas?: string | null
          numero_carteirinha?: string | null
          organization_id?: string | null
          plano_saude_id?: string | null
          preferencia_contato?: string | null
          profissao?: string | null
          responsavel_nome?: string | null
          responsavel_parentesco?: string | null
          responsavel_telefone?: string | null
          risco_no_show?: number | null
          sexo?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      pacientes_pacotes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_inicio: string
          data_validade: string | null
          forma_pagamento_id: string | null
          id: string
          notificacao_renovacao_enviada: boolean | null
          oferta_renovacao_enviada: boolean | null
          paciente_id: string
          pacote_id: string
          renovacao_automatica: boolean | null
          sessoes_restantes: number | null
          sessoes_totais: number
          sessoes_utilizadas: number | null
          status: string | null
          tenant_id: string
          ultima_notificacao: string | null
          ultimo_uso_em: string | null
          updated_at: string | null
          valor_pago: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string
          data_validade?: string | null
          forma_pagamento_id?: string | null
          id?: string
          notificacao_renovacao_enviada?: boolean | null
          oferta_renovacao_enviada?: boolean | null
          paciente_id: string
          pacote_id: string
          renovacao_automatica?: boolean | null
          sessoes_restantes?: number | null
          sessoes_totais: number
          sessoes_utilizadas?: number | null
          status?: string | null
          tenant_id: string
          ultima_notificacao?: string | null
          ultimo_uso_em?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string
          data_validade?: string | null
          forma_pagamento_id?: string | null
          id?: string
          notificacao_renovacao_enviada?: boolean | null
          oferta_renovacao_enviada?: boolean | null
          paciente_id?: string
          pacote_id?: string
          renovacao_automatica?: boolean | null
          sessoes_restantes?: number | null
          sessoes_totais?: number
          sessoes_utilizadas?: number | null
          status?: string | null
          tenant_id?: string
          ultima_notificacao?: string | null
          ultimo_uso_em?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_pacotes_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_pacotes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_pacotes_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "pacientes_pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      pacotes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          desconto_renovacao: number | null
          descricao: string | null
          id: string
          limiar_renovacao: number | null
          nome: string
          numero_sessoes: number
          oferta_renovacao_ativa: boolean | null
          preco: number
          renovacao_automatica: boolean | null
          servico_id: string | null
          tenant_id: string
          updated_at: string | null
          validade_dias: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          desconto_renovacao?: number | null
          descricao?: string | null
          id?: string
          limiar_renovacao?: number | null
          nome: string
          numero_sessoes: number
          oferta_renovacao_ativa?: boolean | null
          preco: number
          renovacao_automatica?: boolean | null
          servico_id?: string | null
          tenant_id: string
          updated_at?: string | null
          validade_dias?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          desconto_renovacao?: number | null
          descricao?: string | null
          id?: string
          limiar_renovacao?: number | null
          nome?: string
          numero_sessoes?: number
          oferta_renovacao_ativa?: boolean | null
          preco?: number
          renovacao_automatica?: boolean | null
          servico_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          validade_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      phone_number_packages: {
        Row: {
          ativo: boolean
          created_at: string | null
          custo_provedor: number | null
          descricao: string | null
          destaque: boolean
          id: string
          inclui_creditos: number
          markup_percentual: number | null
          moeda: string
          nome: string
          periodo_minimo_dias: number | null
          permite_cancelamento_imediato: boolean | null
          planos_permitidos: string[]
          preco_mensal: number
          quantidade_numeros: number
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          custo_provedor?: number | null
          descricao?: string | null
          destaque?: boolean
          id?: string
          inclui_creditos?: number
          markup_percentual?: number | null
          moeda?: string
          nome: string
          periodo_minimo_dias?: number | null
          permite_cancelamento_imediato?: boolean | null
          planos_permitidos?: string[]
          preco_mensal: number
          quantidade_numeros?: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          custo_provedor?: number | null
          descricao?: string | null
          destaque?: boolean
          id?: string
          inclui_creditos?: number
          markup_percentual?: number | null
          moeda?: string
          nome?: string
          periodo_minimo_dias?: number | null
          permite_cancelamento_imediato?: boolean | null
          planos_permitidos?: string[]
          preco_mensal?: number
          quantidade_numeros?: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          feature_id: string
          plan_id: string
        }
        Insert: {
          feature_id: string
          plan_id: string
        }
        Update: {
          feature_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_saude_valores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dias_recebimento: number
          exame_procedimento_id: string | null
          id: string
          observacoes: string | null
          plano_saude_id: string
          servico_id: string | null
          tenant_id: string
          updated_at: string | null
          valor: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dias_recebimento?: number
          exame_procedimento_id?: string | null
          id?: string
          observacoes?: string | null
          plano_saude_id: string
          servico_id?: string | null
          tenant_id: string
          updated_at?: string | null
          valor: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dias_recebimento?: number
          exame_procedimento_id?: string | null
          id?: string
          observacoes?: string | null
          plano_saude_id?: string
          servico_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          valor?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_saude_valores_plano_saude_id_fkey"
            columns: ["plano_saude_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_saude_valores_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_saude_valores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_saude_valores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "plano_saude_valores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      planos_limites: {
        Row: {
          atualizado_em: string
          codigo_plano: string
          criado_em: string
          flags: Json | null
          id: string
          max_clientes: number | null
          max_profissionais: number | null
          max_secretarias: number | null
          max_unidades: number | null
          mensagens_incluidas: number | null
        }
        Insert: {
          atualizado_em?: string
          codigo_plano: string
          criado_em?: string
          flags?: Json | null
          id?: string
          max_clientes?: number | null
          max_profissionais?: number | null
          max_secretarias?: number | null
          max_unidades?: number | null
          mensagens_incluidas?: number | null
        }
        Update: {
          atualizado_em?: string
          codigo_plano?: string
          criado_em?: string
          flags?: Json | null
          id?: string
          max_clientes?: number | null
          max_profissionais?: number | null
          max_secretarias?: number | null
          max_unidades?: number | null
          mensagens_incluidas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_limites_codigo_plano_fkey"
            columns: ["codigo_plano"]
            isOneToOne: true
            referencedRelation: "planos_precos"
            referencedColumns: ["codigo_plano"]
          },
        ]
      }
      planos_precos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          codigo_plano: string
          criado_em: string
          descricao: string
          id: string
          moeda: string
          preco_mensal_brl: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          codigo_plano: string
          criado_em?: string
          descricao: string
          id?: string
          moeda?: string
          preco_mensal_brl?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          codigo_plano?: string
          criado_em?: string
          descricao?: string
          id?: string
          moeda?: string
          preco_mensal_brl?: number
        }
        Relationships: []
      }
      planos_saude: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          site: string | null
          telefone: string | null
          tenant_id: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          site?: string | null
          telefone?: string | null
          tenant_id: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          site?: string | null
          telefone?: string | null
          tenant_id?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_saude_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_saude_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "planos_saude_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          complexity_level: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          limits: Json | null
          metadata: Json | null
          name: string
          price_monthly: number
          price_yearly: number | null
          segment_ids: Json | null
          slug: string | null
          stripe_price_id: string | null
          stripe_price_yearly_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          complexity_level?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          limits?: Json | null
          metadata?: Json | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          segment_ids?: Json | null
          slug?: string | null
          stripe_price_id?: string | null
          stripe_price_yearly_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          complexity_level?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          limits?: Json | null
          metadata?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          segment_ids?: Json | null
          slug?: string | null
          stripe_price_id?: string | null
          stripe_price_yearly_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      precos_atual: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          id: string
          moeda: string
          notas: string | null
          preco_unitario: number
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          id?: string
          moeda?: string
          notas?: string | null
          preco_unitario: number
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          moeda?: string
          notas?: string | null
          preco_unitario?: number
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      procedimentos: {
        Row: {
          anestesia_necessaria: boolean | null
          ativo: boolean | null
          codigo_tuss: string | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number | null
          id: string
          instrucoes_pos: string | null
          instrucoes_preparo: string | null
          nome: string
          tenant_id: string
          tipo_anestesia: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          anestesia_necessaria?: boolean | null
          ativo?: boolean | null
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          instrucoes_pos?: string | null
          instrucoes_preparo?: string | null
          nome: string
          tenant_id: string
          tipo_anestesia?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          anestesia_necessaria?: boolean | null
          ativo?: boolean | null
          codigo_tuss?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          instrucoes_pos?: string | null
          instrucoes_preparo?: string | null
          nome?: string
          tenant_id?: string
          tipo_anestesia?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      professional_commissions: {
        Row: {
          created_at: string | null
          fixed_value: number | null
          id: string
          percentage: number | null
          professional_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fixed_value?: number | null
          id?: string
          percentage?: number | null
          professional_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fixed_value?: number | null
          id?: string
          percentage?: number | null
          professional_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "professional_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cidade: string | null
          conselho_profissional: string | null
          cpf: string | null
          created_at: string | null
          email: string
          especialidade: string | null
          id: string
          nome: string
          numero_registro: string | null
          organization_id: string | null
          pode_alterar_valores: boolean | null
          registro_profissional: string | null
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          tenant_id: string | null
          theme: string | null
          tipo_profissional_id: string | null
          uf: string | null
          uf_registro: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cidade?: string | null
          conselho_profissional?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          especialidade?: string | null
          id: string
          nome: string
          numero_registro?: string | null
          organization_id?: string | null
          pode_alterar_valores?: boolean | null
          registro_profissional?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          tenant_id?: string | null
          theme?: string | null
          tipo_profissional_id?: string | null
          uf?: string | null
          uf_registro?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cidade?: string | null
          conselho_profissional?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          especialidade?: string | null
          id?: string
          nome?: string
          numero_registro?: string | null
          organization_id?: string | null
          pode_alterar_valores?: boolean | null
          registro_profissional?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          tenant_id?: string | null
          theme?: string | null
          tipo_profissional_id?: string | null
          uf?: string | null
          uf_registro?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      prontuarios: {
        Row: {
          agendamento_id: string | null
          antecedentes_familiares: string | null
          antecedentes_pessoais: string | null
          cid10: string[] | null
          conduta: string | null
          created_at: string | null
          data_atendimento: string
          encaminhamentos: string | null
          exame_fisico: Json | null
          exames_solicitados: Json | null
          habitos_vida: string | null
          hipotese_diagnostica: string | null
          historia_doenca_atual: string | null
          id: string
          observacoes: string | null
          paciente_id: string
          prescricoes: Json | null
          profissional_id: string
          queixa_principal: string | null
          sinais_vitais: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agendamento_id?: string | null
          antecedentes_familiares?: string | null
          antecedentes_pessoais?: string | null
          cid10?: string[] | null
          conduta?: string | null
          created_at?: string | null
          data_atendimento?: string
          encaminhamentos?: string | null
          exame_fisico?: Json | null
          exames_solicitados?: Json | null
          habitos_vida?: string | null
          hipotese_diagnostica?: string | null
          historia_doenca_atual?: string | null
          id?: string
          observacoes?: string | null
          paciente_id: string
          prescricoes?: Json | null
          profissional_id: string
          queixa_principal?: string | null
          sinais_vitais?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string | null
          antecedentes_familiares?: string | null
          antecedentes_pessoais?: string | null
          cid10?: string[] | null
          conduta?: string | null
          created_at?: string | null
          data_atendimento?: string
          encaminhamentos?: string | null
          exame_fisico?: Json | null
          exames_solicitados?: Json | null
          habitos_vida?: string | null
          hipotese_diagnostica?: string | null
          historia_doenca_atual?: string | null
          id?: string
          observacoes?: string | null
          paciente_id?: string
          prescricoes?: Json | null
          profissional_id?: string
          queixa_principal?: string | null
          sinais_vitais?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "prontuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      rbac_usuarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          papel: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          papel: string
          tenant_id: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          papel?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbac_usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rbac_usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      remarcacao_sugestoes: {
        Row: {
          agendamento_id: string
          created_at: string | null
          horario_sugerido: string
          id: string
          motivo_score: string | null
          respondido_em: string | null
          score: number | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agendamento_id: string
          created_at?: string | null
          horario_sugerido: string
          id?: string
          motivo_score?: string | null
          respondido_em?: string | null
          score?: number | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agendamento_id?: string
          created_at?: string | null
          horario_sugerido?: string
          id?: string
          motivo_score?: string | null
          respondido_em?: string | null
          score?: number | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remarcacao_sugestoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarcacao_sugestoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remarcacao_sugestoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "remarcacao_sugestoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      restricoes_tenant: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          iniciado_em: string | null
          motivo: string | null
          removido_em: string | null
          tenant_id: string
          tipo_restricao: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          iniciado_em?: string | null
          motivo?: string | null
          removido_em?: string | null
          tenant_id: string
          tipo_restricao: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          iniciado_em?: string | null
          motivo?: string | null
          removido_em?: string | null
          tenant_id?: string
          tipo_restricao?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restricoes_tenant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restricoes_tenant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "restricoes_tenant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      segment_configs: {
        Row: {
          active: boolean | null
          features: Json
          id: string
          name: string
          terminology: Json
          theme: Json
        }
        Insert: {
          active?: boolean | null
          features?: Json
          id: string
          name: string
          terminology?: Json
          theme?: Json
        }
        Update: {
          active?: boolean | null
          features?: Json
          id?: string
          name?: string
          terminology?: Json
          theme?: Json
        }
        Relationships: []
      }
      service_files: {
        Row: {
          content: Json | null
          created_at: string | null
          customer_id: string
          id: string
          status: string | null
          tenant_id: string
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          customer_id: string
          id?: string
          status?: string | null
          tenant_id: string
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          customer_id?: string
          id?: string
          status?: string | null
          tenant_id?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "service_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          duracao_minutos: number
          id: string
          nome: string
          organization_id: string | null
          preco: number | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number
          id?: string
          nome: string
          organization_id?: string | null
          preco?: number | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          duracao_minutos?: number
          id?: string
          nome?: string
          organization_id?: string | null
          preco?: number | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "servicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "servicos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      support_actions_log: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          support_user_id: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          support_user_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          support_user_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      support_chat_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          message: string
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          session_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "support_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chat_sessions: {
        Row: {
          accepted_at: string | null
          assigned_agent_id: string | null
          assigned_agent_name: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          priority: string | null
          queue_position: number | null
          satisfaction_rating: number | null
          started_at: string
          status: string | null
          subject: string | null
          tenant_id: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
          wait_time_seconds: number | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_agent_id?: string | null
          assigned_agent_name?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          queue_position?: number | null
          satisfaction_rating?: number | null
          started_at?: string
          status?: string | null
          subject?: string | null
          tenant_id: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
          wait_time_seconds?: number | null
        }
        Update: {
          accepted_at?: string | null
          assigned_agent_id?: string | null
          assigned_agent_name?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          queue_position?: number | null
          satisfaction_rating?: number | null
          started_at?: string
          status?: string | null
          subject?: string | null
          tenant_id?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          wait_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_chat_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "support_chat_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      support_holidays: {
        Row: {
          created_at: string | null
          date: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description: string
          id?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      support_knowledge_base: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          question: string
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question: string
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question?: string
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: []
      }
      support_macros: {
        Row: {
          atalho: string | null
          ativo: boolean | null
          categoria: string | null
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          nome: string
          updated_at: string
          uso_count: number | null
        }
        Insert: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          updated_at?: string
          uso_count?: number | null
        }
        Update: {
          atalho?: string | null
          ativo?: boolean | null
          categoria?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          updated_at?: string
          uso_count?: number | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_metrics: {
        Row: {
          chats_finalizados: number | null
          chats_iniciados: number | null
          created_at: string | null
          data: string
          id: string
          slas_estourados: number | null
          taxa_satisfacao: number | null
          tempo_medio_primeira_resposta_minutos: number | null
          tempo_medio_resolucao_horas: number | null
          tenant_id: string | null
          tickets_abertos: number | null
          tickets_fechados: number | null
          updated_at: string | null
        }
        Insert: {
          chats_finalizados?: number | null
          chats_iniciados?: number | null
          created_at?: string | null
          data: string
          id?: string
          slas_estourados?: number | null
          taxa_satisfacao?: number | null
          tempo_medio_primeira_resposta_minutos?: number | null
          tempo_medio_resolucao_horas?: number | null
          tenant_id?: string | null
          tickets_abertos?: number | null
          tickets_fechados?: number | null
          updated_at?: string | null
        }
        Update: {
          chats_finalizados?: number | null
          chats_iniciados?: number | null
          created_at?: string | null
          data?: string
          id?: string
          slas_estourados?: number | null
          taxa_satisfacao?: number | null
          tempo_medio_primeira_resposta_minutos?: number | null
          tempo_medio_resolucao_horas?: number | null
          tenant_id?: string | null
          tickets_abertos?: number | null
          tickets_fechados?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "support_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      support_operating_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_sla_configs: {
        Row: {
          created_at: string | null
          id: string
          prioridade: string
          tempo_resolucao_horas: number
          tempo_resposta_horas: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prioridade: string
          tempo_resolucao_horas?: number
          tempo_resposta_horas?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prioridade?: string
          tempo_resolucao_horas?: number
          tempo_resposta_horas?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      support_ticket_history: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string
          status_anterior: string | null
          status_novo: string
          ticket_id: string
          usuario_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          status_anterior?: string | null
          status_novo: string
          ticket_id: string
          usuario_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          status_anterior?: string | null
          status_novo?: string
          ticket_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_history_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_macros: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          conteudo: string
          created_at: string | null
          created_by: string | null
          id: string
          nome: string
          updated_at: string | null
          variaveis_exemplo: Json | null
          visibilidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nome: string
          updated_at?: string | null
          variaveis_exemplo?: Json | null
          visibilidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
          variaveis_exemplo?: Json | null
          visibilidade?: string | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          anexos: Json | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          mensagem: string
          sender_type: string | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          anexos?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          mensagem: string
          sender_type?: string | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          anexos?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          mensagem?: string
          sender_type?: string | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_usuario_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          anexos: Json | null
          assigned_to: string | null
          atribuido_a: string | null
          categoria: string | null
          category: string | null
          created_at: string
          description: string
          fechado_em: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          numero: number
          origem: string | null
          participantes: string[] | null
          prioridade:
            | Database["public"]["Enums"]["support_ticket_priority"]
            | null
          priority:
            | Database["public"]["Enums"]["support_ticket_priority"]
            | null
          resolved_at: string | null
          resolved_by: string | null
          resolvido_em: string | null
          sla: Json | null
          status: Database["public"]["Enums"]["support_ticket_status"] | null
          tags: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anexos?: Json | null
          assigned_to?: string | null
          atribuido_a?: string | null
          categoria?: string | null
          category?: string | null
          created_at?: string
          description: string
          fechado_em?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          numero?: number
          origem?: string | null
          participantes?: string[] | null
          prioridade?:
            | Database["public"]["Enums"]["support_ticket_priority"]
            | null
          priority?:
            | Database["public"]["Enums"]["support_ticket_priority"]
            | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolvido_em?: string | null
          sla?: Json | null
          status?: Database["public"]["Enums"]["support_ticket_status"] | null
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anexos?: Json | null
          assigned_to?: string | null
          atribuido_a?: string | null
          categoria?: string | null
          category?: string | null
          created_at?: string
          description?: string
          fechado_em?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          numero?: number
          origem?: string | null
          participantes?: string[] | null
          prioridade?:
            | Database["public"]["Enums"]["support_ticket_priority"]
            | null
          priority?:
            | Database["public"]["Enums"]["support_ticket_priority"]
            | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolvido_em?: string | null
          sla?: Json | null
          status?: Database["public"]["Enums"]["support_ticket_status"] | null
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_atribuido_a_fkey"
            columns: ["atribuido_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          request_id: string | null
          service: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          message: string
          metadata?: Json | null
          request_id?: string | null
          service?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          request_id?: string | null
          service?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_users: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          system_role: Database["public"]["Enums"]["system_role"]
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id: string
          system_role?: Database["public"]["Enums"]["system_role"]
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          system_role?: Database["public"]["Enums"]["system_role"]
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_credit_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          expirado: boolean | null
          id: string
          metadata: Json | null
          motivo: string | null
          preco_unitario: number | null
          quantidade: number
          saldo_anterior: number
          saldo_novo: number
          tenant_id: string
          tipo: string
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expirado?: boolean | null
          id?: string
          metadata?: Json | null
          motivo?: string | null
          preco_unitario?: number | null
          quantidade: number
          saldo_anterior: number
          saldo_novo: number
          tenant_id: string
          tipo: string
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expirado?: boolean | null
          id?: string
          metadata?: Json | null
          motivo?: string | null
          preco_unitario?: number | null
          quantidade?: number
          saldo_anterior?: number
          saldo_novo?: number
          tenant_id?: string
          tipo?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_credit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_feature_flags: {
        Row: {
          ativo: boolean
          created_at: string | null
          customizado: boolean | null
          id: string
          recurso: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          customizado?: boolean | null
          id?: string
          recurso: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          customizado?: boolean | null
          id?: string
          recurso?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          feature_id: string
          granted_by: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          feature_id: string
          granted_by?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          feature_id?: string
          granted_by?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_permissions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_phone_subscriptions: {
        Row: {
          cancelamento_efetivo_em: string | null
          cancelamento_solicitado_em: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          departamento: string | null
          id: string
          metadata: Json | null
          motivo_cancelamento: string | null
          package_id: string
          phone_number: string | null
          phone_number_id: string | null
          status: string
          stripe_subscription_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cancelamento_efetivo_em?: string | null
          cancelamento_solicitado_em?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          departamento?: string | null
          id?: string
          metadata?: Json | null
          motivo_cancelamento?: string | null
          package_id: string
          phone_number?: string | null
          phone_number_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cancelamento_efetivo_em?: string | null
          cancelamento_solicitado_em?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          departamento?: string | null
          id?: string
          metadata?: Json | null
          motivo_cancelamento?: string | null
          package_id?: string
          phone_number?: string | null
          phone_number_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_phone_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "phone_number_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_phone_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_phone_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_phone_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_profile: {
        Row: {
          configuracoes_segmento: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          onboarding_status: string | null
          onboarding_step: number | null
          segmento_principal: string
          subsegmentos: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          configuracoes_segmento?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          onboarding_status?: string | null
          onboarding_step?: number | null
          segmento_principal: string
          subsegmentos?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          configuracoes_segmento?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          onboarding_status?: string | null
          onboarding_step?: number | null
          segmento_principal?: string
          subsegmentos?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_profile_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_profile_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_profile_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_retention_settings: {
        Row: {
          created_at: string | null
          id: string
          retencao_dados_sensiveis_dias: number | null
          retencao_logs_dias: number | null
          retencao_mensagens_dias: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          retencao_dados_sensiveis_dias?: number | null
          retencao_logs_dias?: number | null
          retencao_mensagens_dias?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          retencao_dados_sensiveis_dias?: number | null
          retencao_logs_dias?: number | null
          retencao_mensagens_dias?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_retention_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_retention_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_retention_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_suporte: {
        Row: {
          contatos_suporte: Json | null
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contatos_suporte?: Json | null
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contatos_suporte?: Json | null
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_suporte_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_suporte_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_suporte_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_whatsapp_config: {
        Row: {
          auto_reply_enabled: boolean | null
          auto_reply_message: string | null
          created_at: string
          id: string
          max_messages_per_day: number | null
          max_messages_per_hour: number | null
          max_messages_per_minute: number | null
          metadata: Json | null
          require_marketing_consent: boolean | null
          require_operational_consent: boolean | null
          silence_end_hour: number | null
          silence_start_hour: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          created_at?: string
          id?: string
          max_messages_per_day?: number | null
          max_messages_per_hour?: number | null
          max_messages_per_minute?: number | null
          metadata?: Json | null
          require_marketing_consent?: boolean | null
          require_operational_consent?: boolean | null
          silence_end_hour?: number | null
          silence_start_hour?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          created_at?: string
          id?: string
          max_messages_per_day?: number | null
          max_messages_per_hour?: number | null
          max_messages_per_minute?: number | null
          metadata?: Json | null
          require_marketing_consent?: boolean | null
          require_operational_consent?: boolean | null
          silence_end_hour?: number | null
          silence_start_hour?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_whatsapp_credits: {
        Row: {
          created_at: string | null
          creditos_avulsos: number | null
          creditos_expirando: string | null
          creditos_mensais: number | null
          creditos_usados_mes: number | null
          id: string
          tenant_id: string
          ultimo_reset: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creditos_avulsos?: number | null
          creditos_expirando?: string | null
          creditos_mensais?: number | null
          creditos_usados_mes?: number | null
          id?: string
          tenant_id: string
          ultimo_reset?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creditos_avulsos?: number | null
          creditos_expirando?: string | null
          creditos_mensais?: number | null
          creditos_usados_mes?: number | null
          id?: string
          tenant_id?: string
          ultimo_reset?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_whatsapp_routing: {
        Row: {
          ai_model: string
          ai_routing_enabled: boolean
          ai_system_prompt: string | null
          created_at: string
          fallback_departamento_id: string | null
          id: string
          menu_inicial_enabled: boolean
          menu_opcoes: Json | null
          metadata: Json | null
          tenant_id: string
          updated_at: string
          usa_numero_compartilhado: boolean
        }
        Insert: {
          ai_model?: string
          ai_routing_enabled?: boolean
          ai_system_prompt?: string | null
          created_at?: string
          fallback_departamento_id?: string | null
          id?: string
          menu_inicial_enabled?: boolean
          menu_opcoes?: Json | null
          metadata?: Json | null
          tenant_id: string
          updated_at?: string
          usa_numero_compartilhado?: boolean
        }
        Update: {
          ai_model?: string
          ai_routing_enabled?: boolean
          ai_system_prompt?: string | null
          created_at?: string
          fallback_departamento_id?: string | null
          id?: string
          menu_inicial_enabled?: boolean
          menu_opcoes?: Json | null
          metadata?: Json | null
          tenant_id?: string
          updated_at?: string
          usa_numero_compartilhado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_routing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_routing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_routing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenants: {
        Row: {
          antecedencia_minima_horas: number | null
          bairro: string | null
          callmebot_apikey: string | null
          callmebot_phone: string | null
          cep: string | null
          cidade: string
          cnpj: string | null
          complemento: string | null
          cor_acao: string | null
          cor_primaria: string | null
          created_at: string | null
          email: string | null
          email_ativo: boolean | null
          font_size: number | null
          id: string
          janela_agendamento_dias: number | null
          logo_url: string | null
          logradouro: string | null
          modo_agendamento:
            | Database["public"]["Enums"]["modo_agendamento"]
            | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          overbooking_ativo: boolean | null
          razao_social: string | null
          reagendamento_permitido_horas: number | null
          segmentos: string[] | null
          sms_ativo: boolean | null
          status: Database["public"]["Enums"]["tenant_status"]
          telefone: string
          timezone: string | null
          tipo: Database["public"]["Enums"]["tenant_type"]
          uf: string
          updated_at: string | null
          whatsapp_ativo: boolean | null
          whatsapp_business_account_id: string | null
          whatsapp_configurado: boolean | null
          whatsapp_phone_number_id: string | null
          whatsapp_verificado: boolean | null
          whatsapp_verificado_em: string | null
        }
        Insert: {
          antecedencia_minima_horas?: number | null
          bairro?: string | null
          callmebot_apikey?: string | null
          callmebot_phone?: string | null
          cep?: string | null
          cidade: string
          cnpj?: string | null
          complemento?: string | null
          cor_acao?: string | null
          cor_primaria?: string | null
          created_at?: string | null
          email?: string | null
          email_ativo?: boolean | null
          font_size?: number | null
          id?: string
          janela_agendamento_dias?: number | null
          logo_url?: string | null
          logradouro?: string | null
          modo_agendamento?:
            | Database["public"]["Enums"]["modo_agendamento"]
            | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          overbooking_ativo?: boolean | null
          razao_social?: string | null
          reagendamento_permitido_horas?: number | null
          segmentos?: string[] | null
          sms_ativo?: boolean | null
          status?: Database["public"]["Enums"]["tenant_status"]
          telefone: string
          timezone?: string | null
          tipo?: Database["public"]["Enums"]["tenant_type"]
          uf: string
          updated_at?: string | null
          whatsapp_ativo?: boolean | null
          whatsapp_business_account_id?: string | null
          whatsapp_configurado?: boolean | null
          whatsapp_phone_number_id?: string | null
          whatsapp_verificado?: boolean | null
          whatsapp_verificado_em?: string | null
        }
        Update: {
          antecedencia_minima_horas?: number | null
          bairro?: string | null
          callmebot_apikey?: string | null
          callmebot_phone?: string | null
          cep?: string | null
          cidade?: string
          cnpj?: string | null
          complemento?: string | null
          cor_acao?: string | null
          cor_primaria?: string | null
          created_at?: string | null
          email?: string | null
          email_ativo?: boolean | null
          font_size?: number | null
          id?: string
          janela_agendamento_dias?: number | null
          logo_url?: string | null
          logradouro?: string | null
          modo_agendamento?:
            | Database["public"]["Enums"]["modo_agendamento"]
            | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          overbooking_ativo?: boolean | null
          razao_social?: string | null
          reagendamento_permitido_horas?: number | null
          segmentos?: string[] | null
          sms_ativo?: boolean | null
          status?: Database["public"]["Enums"]["tenant_status"]
          telefone?: string
          timezone?: string | null
          tipo?: Database["public"]["Enums"]["tenant_type"]
          uf?: string
          updated_at?: string | null
          whatsapp_ativo?: boolean | null
          whatsapp_business_account_id?: string | null
          whatsapp_configurado?: boolean | null
          whatsapp_phone_number_id?: string | null
          whatsapp_verificado?: boolean | null
          whatsapp_verificado_em?: string | null
        }
        Relationships: []
      }
      tipos_profissional: {
        Row: {
          acesso_prontuarios: boolean | null
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          acesso_prontuarios?: boolean | null
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          acesso_prontuarios?: boolean | null
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_profissional_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_profissional_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tipos_profissional_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      two_factor_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      unit_policies: {
        Row: {
          created_at: string | null
          custom_policies: Json | null
          id: string
          inherit_messaging: boolean | null
          inherit_payment_methods: boolean | null
          inherit_services: boolean | null
          local_messaging_enabled: boolean | null
          local_payment_methods_enabled: boolean | null
          local_services_enabled: boolean | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_policies?: Json | null
          id?: string
          inherit_messaging?: boolean | null
          inherit_payment_methods?: boolean | null
          inherit_services?: boolean | null
          local_messaging_enabled?: boolean | null
          local_payment_methods_enabled?: boolean | null
          local_services_enabled?: boolean | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_policies?: Json | null
          id?: string
          inherit_messaging?: boolean | null
          inherit_payment_methods?: boolean | null
          inherit_services?: boolean | null
          local_messaging_enabled?: boolean | null
          local_payment_methods_enabled?: boolean | null
          local_services_enabled?: boolean | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_policies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["org_role"]
          unit_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["org_role"]
          unit_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["org_role"]
          unit_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_roles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          cnpj: string | null
          configuracoes_override: Json | null
          created_at: string | null
          email: string | null
          endereco: Json | null
          horario_funcionamento: Json | null
          id: string
          nome: string
          organization_id: string
          status: string | null
          telefone: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp_business_account_id: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          cnpj?: string | null
          configuracoes_override?: Json | null
          created_at?: string | null
          email?: string | null
          endereco?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          nome: string
          organization_id: string
          status?: string | null
          telefone?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          cnpj?: string | null
          configuracoes_override?: Json | null
          created_at?: string | null
          email?: string | null
          endereco?: Json | null
          horario_funcionamento?: Json | null
          id?: string
          nome?: string
          organization_id?: string
          status?: string | null
          telefone?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          method: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          method?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          method?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_tour_preferences: {
        Row: {
          created_at: string | null
          id: string
          last_shown_at: string | null
          page_slug: string
          tour_completed: boolean | null
          tour_disabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_shown_at?: string | null
          page_slug: string
          tour_completed?: boolean | null
          tour_disabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_shown_at?: string | null
          page_slug?: string
          tour_completed?: boolean | null
          tour_disabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuarios_suporte: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          dashboard_filters: Json | null
          email: string
          forcar_troca_senha: boolean | null
          foto_url: string | null
          funcoes: Database["public"]["Enums"]["support_role"][] | null
          id: string
          nome: string
          senha_temporaria: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          telefone: string | null
          tema: Database["public"]["Enums"]["theme_preference"] | null
          ultimo_acesso: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          dashboard_filters?: Json | null
          email: string
          forcar_troca_senha?: boolean | null
          foto_url?: string | null
          funcoes?: Database["public"]["Enums"]["support_role"][] | null
          id?: string
          nome: string
          senha_temporaria?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          telefone?: string | null
          tema?: Database["public"]["Enums"]["theme_preference"] | null
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          dashboard_filters?: Json | null
          email?: string
          forcar_troca_senha?: boolean | null
          foto_url?: string | null
          funcoes?: Database["public"]["Enums"]["support_role"][] | null
          id?: string
          nome?: string
          senha_temporaria?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          telefone?: string | null
          tema?: Database["public"]["Enums"]["theme_preference"] | null
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      virtual_number_providers: {
        Row: {
          api_config: Json | null
          cost_per_message: number | null
          cost_per_number_monthly: number | null
          created_at: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          api_config?: Json | null
          cost_per_message?: number | null
          cost_per_number_monthly?: number | null
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_config?: Json | null
          cost_per_message?: number | null
          cost_per_number_monthly?: number | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_alarms: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alarm_type: string
          created_at: string
          current_value: number
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string
          status: string
          tenant_id: string | null
          threshold_value: number
          triggered_at: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alarm_type: string
          created_at?: string
          current_value: number
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string
          tenant_id?: string | null
          threshold_value: number
          triggered_at?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alarm_type?: string
          created_at?: string
          current_value?: number
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string
          tenant_id?: string | null
          threshold_value?: number
          triggered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_alarms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_alarms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_alarms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          atribuido_a: string | null
          created_at: string
          id: string
          metadata: Json | null
          nome_contato: string | null
          paciente_id: string | null
          status: string
          telefone: string
          tenant_id: string
          ultima_mensagem_em: string | null
          updated_at: string
          wa_conversation_id: string | null
        }
        Insert: {
          atribuido_a?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          nome_contato?: string | null
          paciente_id?: string | null
          status?: string
          telefone: string
          tenant_id: string
          ultima_mensagem_em?: string | null
          updated_at?: string
          wa_conversation_id?: string | null
        }
        Update: {
          atribuido_a?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          nome_contato?: string | null
          paciente_id?: string | null
          status?: string
          telefone?: string
          tenant_id?: string
          ultima_mensagem_em?: string | null
          updated_at?: string
          wa_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_atribuido_a_fkey"
            columns: ["atribuido_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_dlq: {
        Row: {
          attempt_count: number | null
          created_at: string
          error_message: string | null
          error_type: string
          id: string
          max_attempts: number | null
          message_content: string
          metadata: Json | null
          next_retry_at: string | null
          original_message_id: string | null
          phone_number: string
          status: string | null
          template_name: string | null
          template_params: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          error_type: string
          id?: string
          max_attempts?: number | null
          message_content: string
          metadata?: Json | null
          next_retry_at?: string | null
          original_message_id?: string | null
          phone_number: string
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          error_type?: string
          id?: string
          max_attempts?: number | null
          message_content?: string
          metadata?: Json | null
          next_retry_at?: string | null
          original_message_id?: string | null
          phone_number?: string
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_dlq_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_dlq_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_dlq_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          conteudo: string
          conversation_id: string
          created_at: string
          direcao: string
          erro_mensagem: string | null
          id: string
          metadata: Json | null
          midia_url: string | null
          sender_id: string | null
          sender_type: string | null
          status: string | null
          template_name: string | null
          template_params: Json | null
          timestamp: string
          tipo_mensagem: string | null
          wa_message_id: string | null
        }
        Insert: {
          conteudo: string
          conversation_id: string
          created_at?: string
          direcao: string
          erro_mensagem?: string | null
          id?: string
          metadata?: Json | null
          midia_url?: string | null
          sender_id?: string | null
          sender_type?: string | null
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          timestamp: string
          tipo_mensagem?: string | null
          wa_message_id?: string | null
        }
        Update: {
          conteudo?: string
          conversation_id?: string
          created_at?: string
          direcao?: string
          erro_mensagem?: string | null
          id?: string
          metadata?: Json | null
          midia_url?: string | null
          sender_id?: string | null
          sender_type?: string | null
          status?: string | null
          template_name?: string | null
          template_params?: Json | null
          timestamp?: string
          tipo_mensagem?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_metrics: {
        Row: {
          block_rate: number | null
          created_at: string
          erros_bloqueio: number | null
          erros_numero_invalido: number | null
          erros_outros: number | null
          erros_rede: number | null
          erros_template: number | null
          id: string
          latencia_p50: number | null
          latencia_p95: number | null
          latencia_p99: number | null
          mensagens_entregues: number | null
          mensagens_enviadas: number | null
          mensagens_falhadas: number | null
          mensagens_lidas: number | null
          optout_rate: number | null
          periodo: string
          quality_rating: string | null
          tenant_id: string
          tps_medio: number | null
          tps_pico: number | null
          updated_at: string
        }
        Insert: {
          block_rate?: number | null
          created_at?: string
          erros_bloqueio?: number | null
          erros_numero_invalido?: number | null
          erros_outros?: number | null
          erros_rede?: number | null
          erros_template?: number | null
          id?: string
          latencia_p50?: number | null
          latencia_p95?: number | null
          latencia_p99?: number | null
          mensagens_entregues?: number | null
          mensagens_enviadas?: number | null
          mensagens_falhadas?: number | null
          mensagens_lidas?: number | null
          optout_rate?: number | null
          periodo: string
          quality_rating?: string | null
          tenant_id: string
          tps_medio?: number | null
          tps_pico?: number | null
          updated_at?: string
        }
        Update: {
          block_rate?: number | null
          created_at?: string
          erros_bloqueio?: number | null
          erros_numero_invalido?: number | null
          erros_outros?: number | null
          erros_rede?: number | null
          erros_template?: number | null
          id?: string
          latencia_p50?: number | null
          latencia_p95?: number | null
          latencia_p99?: number | null
          mensagens_entregues?: number | null
          mensagens_enviadas?: number | null
          mensagens_falhadas?: number | null
          mensagens_lidas?: number | null
          optout_rate?: number | null
          periodo?: string
          quality_rating?: string | null
          tenant_id?: string
          tps_medio?: number | null
          tps_pico?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_outbox: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          last_error: string | null
          max_retries: number | null
          metadata: Json | null
          next_retry_at: string | null
          phone_to: string
          retries: number | null
          sent_at: string | null
          status: string
          template_name: string
          template_params: Json | null
          tenant_id: string
          updated_at: string
          wa_message_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          phone_to: string
          retries?: number | null
          sent_at?: string | null
          status?: string
          template_name: string
          template_params?: Json | null
          tenant_id: string
          updated_at?: string
          wa_message_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          phone_to?: string
          retries?: number | null
          sent_at?: string | null
          status?: string
          template_name?: string
          template_params?: Json | null
          tenant_id?: string
          updated_at?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_rate_limits: {
        Row: {
          auto_throttle_enabled: boolean | null
          created_at: string
          current_day_count: number | null
          current_hour_count: number | null
          current_minute_count: number | null
          id: string
          is_throttled: boolean | null
          last_reset_day: string | null
          last_reset_hour: string | null
          last_reset_minute: string | null
          max_messages_per_day: number | null
          max_messages_per_hour: number | null
          max_messages_per_minute: number | null
          phone_number: string
          silence_end_hour: number | null
          silence_start_hour: number | null
          tenant_id: string
          throttle_on_block_rate: number | null
          throttle_on_optout_rate: number | null
          throttle_reason: string | null
          updated_at: string
        }
        Insert: {
          auto_throttle_enabled?: boolean | null
          created_at?: string
          current_day_count?: number | null
          current_hour_count?: number | null
          current_minute_count?: number | null
          id?: string
          is_throttled?: boolean | null
          last_reset_day?: string | null
          last_reset_hour?: string | null
          last_reset_minute?: string | null
          max_messages_per_day?: number | null
          max_messages_per_hour?: number | null
          max_messages_per_minute?: number | null
          phone_number: string
          silence_end_hour?: number | null
          silence_start_hour?: number | null
          tenant_id: string
          throttle_on_block_rate?: number | null
          throttle_on_optout_rate?: number | null
          throttle_reason?: string | null
          updated_at?: string
        }
        Update: {
          auto_throttle_enabled?: boolean | null
          created_at?: string
          current_day_count?: number | null
          current_hour_count?: number | null
          current_minute_count?: number | null
          id?: string
          is_throttled?: boolean | null
          last_reset_day?: string | null
          last_reset_hour?: string | null
          last_reset_minute?: string | null
          max_messages_per_day?: number | null
          max_messages_per_hour?: number | null
          max_messages_per_minute?: number | null
          phone_number?: string
          silence_end_hour?: number | null
          silence_start_hour?: number | null
          tenant_id?: string
          throttle_on_block_rate?: number | null
          throttle_on_optout_rate?: number | null
          throttle_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_rate_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_rate_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_rate_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_reconciliation: {
        Row: {
          correction_applied: boolean | null
          cost_difference: number | null
          created_at: string
          has_divergence: boolean | null
          id: string
          internal_total_cost: number
          internal_total_messages: number
          message_difference: number | null
          meta_report_data: Json
          meta_total_cost: number
          meta_total_messages: number
          notes: string | null
          period_end: string
          period_start: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          correction_applied?: boolean | null
          cost_difference?: number | null
          created_at?: string
          has_divergence?: boolean | null
          id?: string
          internal_total_cost: number
          internal_total_messages: number
          message_difference?: number | null
          meta_report_data: Json
          meta_total_cost: number
          meta_total_messages: number
          notes?: string | null
          period_end: string
          period_start: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          correction_applied?: boolean | null
          cost_difference?: number | null
          created_at?: string
          has_divergence?: boolean | null
          id?: string
          internal_total_cost?: number
          internal_total_messages?: number
          message_difference?: number | null
          meta_report_data?: Json
          meta_total_cost?: number
          meta_total_messages?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_reconciliation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_reconciliation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_alarmes_dashboard"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_reconciliation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "view_support_stats"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      whatsapp_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          outbox_id: string | null
          phone_to: string
          status: string
          template_name: string
          tenant_id: string
          wa_message_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          outbox_id?: string | null
          phone_to: string
          status: string
          template_name: string
          tenant_id: string
          wa_message_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          outbox_id?: string | null
          phone_to?: string
          status?: string
          template_name?: string
          tenant_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_send_log_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_alarmes_dashboard: {
        Row: {
          tenant_id: string | null
          tenant_nome: string | null
          total_alarmes: number | null
          total_atrasados: number | null
          total_concluidos: number | null
          total_lembretes: number | null
          total_pendentes: number | null
          total_tarefas: number | null
          total_urgentes: number | null
        }
        Relationships: []
      }
      view_support_stats: {
        Row: {
          tempo_medio_resolucao_horas: number | null
          tenant_id: string | null
          tenant_nome: string | null
          tickets_abertos: number | null
          tickets_aguardando: number | null
          tickets_em_andamento: number | null
          tickets_fechados: number | null
          tickets_resolvidos: number | null
          tickets_urgentes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_alarmes_pendentes: {
        Args: { p_limite?: number; p_tenant_id: string; p_usuario_id?: string }
        Returns: {
          atrasado: boolean
          data_hora: string
          descricao: string
          id: string
          prioridade: string
          tipo: string
          titulo: string
          vinculo_id: string
          vinculo_tipo: string
        }[]
      }
      change_tenant_segment: {
        Args: {
          p_novo_segmento: string
          p_preservar_customizacoes?: boolean
          p_tenant_id: string
        }
        Returns: Json
      }
      create_guest_ticket: {
        Args: {
          p_description: string
          p_email: string
          p_name: string
          p_title: string
        }
        Returns: Json
      }
      creditar_whatsapp: {
        Args: { p_quantidade: number; p_tenant_id: string; p_tipo?: string }
        Returns: boolean
      }
      current_user_has_access_to_tenant: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      debitar_credito_whatsapp: {
        Args: { p_quantidade?: number; p_tenant_id: string }
        Returns: boolean
      }
      enqueue_whatsapp_message: {
        Args: {
          p_check_consent?: boolean
          p_consent_type?: string
          p_idempotency_key?: string
          p_phone_to: string
          p_template_name: string
          p_template_params?: Json
          p_tenant_id: string
        }
        Returns: string
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_support_level: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["system_role"]
      }
      get_tenant_menu: { Args: { p_tenant_id: string }; Returns: Json }
      get_user_tenant_id: { Args: { p_user_id: string }; Returns: string }
      get_whatsapp_outbox_batch: {
        Args: { p_batch_size?: number; p_tenant_id?: string }
        Returns: {
          id: string
          phone_to: string
          retries: number
          template_name: string
          template_params: Json
          tenant_id: string
        }[]
      }
      has_org_role: {
        Args: {
          p_org_id: string
          p_roles: Database["public"]["Enums"]["org_role"][]
          p_user_id: string
        }
        Returns: boolean
      }
      has_support_access: { Args: { p_user_id: string }; Returns: boolean }
      has_support_role: {
        Args: {
          p_role: Database["public"]["Enums"]["support_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_unit_access: {
        Args: { p_unit_id: string; p_user_id: string }
        Returns: boolean
      }
      has_valid_consent: {
        Args: {
          p_consent_type: string
          p_contact_id: string
          p_tenant_id: string
        }
        Returns: boolean
      }
      is_master: { Args: never; Returns: boolean }
      is_support: { Args: never; Returns: boolean }
      log_system_event: {
        Args: {
          p_level: string
          p_message: string
          p_metadata?: Json
          p_service?: string
        }
        Returns: string
      }
      marcar_alarme_concluido: {
        Args: { p_alarme_id: string; p_usuario_id: string }
        Returns: boolean
      }
      mark_whatsapp_error: {
        Args: {
          p_error_message: string
          p_latency_ms?: number
          p_outbox_id: string
        }
        Returns: undefined
      }
      mark_whatsapp_sent: {
        Args: {
          p_latency_ms?: number
          p_outbox_id: string
          p_wa_message_id?: string
        }
        Returns: undefined
      }
      preview_segment_config: { Args: { p_segmento: string }; Returns: Json }
      search_knowledge_base: {
        Args: { search_query: string }
        Returns: {
          answer: string
          id: string
          question: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      tenant_has_feature: {
        Args: { p_recurso: string; p_tenant_id: string }
        Returns: boolean
      }
      usar_sessao_pacote: {
        Args: { p_agendamento_id?: string; p_paciente_pacote_id: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status:
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "concluido"
        | "cancelado"
        | "falta"
      message_channel: "whatsapp" | "email" | "sms"
      message_status: "pendente" | "enviado" | "entregue" | "erro"
      modo_agendamento:
        | "por_profissional"
        | "por_clinica_sala"
        | "por_recurso"
        | "por_localizacao"
        | "externo"
        | "misto"
      org_role:
        | "org_admin"
        | "org_finance"
        | "unit_admin"
        | "unit_finance"
        | "atendimento"
        | "leitura"
      support_role: "master" | "admin" | "agente" | "financeiro" | "leitura"
      support_ticket_priority:
        | "low"
        | "medium"
        | "high"
        | "urgent"
        | "baixa"
        | "media"
        | "alta"
        | "urgente"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting_customer"
        | "resolved"
        | "closed"
        | "aberto"
        | "em_andamento"
        | "aguardando_cliente"
        | "resolvido"
        | "fechado"
      system_role:
        | "master"
        | "support"
        | "client"
        | "support_basic"
        | "support_intermediate"
      tenant_status: "ativo" | "suspenso" | "trial"
      tenant_type: "profissional" | "clinica" | "consultorio"
      theme_preference: "claro" | "escuro"
      tipo_exame_procedimento:
        | "exame_laboratorial"
        | "exame_imagem"
        | "procedimento_cirurgico"
        | "procedimento_terapeutico"
        | "procedimento_diagnostico"
      user_role:
        | "admin"
        | "profissional"
        | "recepcao"
        | "paciente"
        | "manager"
        | "professional"
        | "receptionist"
      user_status: "ativo" | "suspenso" | "pendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "agendado",
        "confirmado",
        "em_atendimento",
        "concluido",
        "cancelado",
        "falta",
      ],
      message_channel: ["whatsapp", "email", "sms"],
      message_status: ["pendente", "enviado", "entregue", "erro"],
      modo_agendamento: [
        "por_profissional",
        "por_clinica_sala",
        "por_recurso",
        "por_localizacao",
        "externo",
        "misto",
      ],
      org_role: [
        "org_admin",
        "org_finance",
        "unit_admin",
        "unit_finance",
        "atendimento",
        "leitura",
      ],
      support_role: ["master", "admin", "agente", "financeiro", "leitura"],
      support_ticket_priority: [
        "low",
        "medium",
        "high",
        "urgent",
        "baixa",
        "media",
        "alta",
        "urgente",
      ],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting_customer",
        "resolved",
        "closed",
        "aberto",
        "em_andamento",
        "aguardando_cliente",
        "resolvido",
        "fechado",
      ],
      system_role: [
        "master",
        "support",
        "client",
        "support_basic",
        "support_intermediate",
      ],
      tenant_status: ["ativo", "suspenso", "trial"],
      tenant_type: ["profissional", "clinica", "consultorio"],
      theme_preference: ["claro", "escuro"],
      tipo_exame_procedimento: [
        "exame_laboratorial",
        "exame_imagem",
        "procedimento_cirurgico",
        "procedimento_terapeutico",
        "procedimento_diagnostico",
      ],
      user_role: [
        "admin",
        "profissional",
        "recepcao",
        "paciente",
        "manager",
        "professional",
        "receptionist",
      ],
      user_status: ["ativo", "suspenso", "pendente"],
    },
  },
} as const

