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
    PostgrestVersion: "13.0.5"
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
          profissional_id: string
          sala_id: string | null
          status: Database["public"]["Enums"]["agendamento_status"] | null
          tipo_consulta_id: string | null
          updated_at: string | null
          valor_consulta: number
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
          profissional_id: string
          sala_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"] | null
          tipo_consulta_id?: string | null
          updated_at?: string | null
          valor_consulta?: number
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
          profissional_id?: string
          sala_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"] | null
          tipo_consulta_id?: string | null
          updated_at?: string | null
          valor_consulta?: number
        }
        Relationships: [
          {
            foreignKeyName: "agenda_conta_pix_id_fkey"
            columns: ["conta_pix_id"]
            isOneToOne: false
            referencedRelation: "contas_pix"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
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
            foreignKeyName: "agenda_paciente_pacote_id_fkey"
            columns: ["paciente_pacote_id"]
            isOneToOne: false
            referencedRelation: "paciente_pacotes"
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
            foreignKeyName: "agenda_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_tipo_consulta_id_fkey"
            columns: ["tipo_consulta_id"]
            isOneToOne: false
            referencedRelation: "tipos_consulta"
            referencedColumns: ["id"]
          },
        ]
      }
      automations_edges: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          source: string
          source_handle: string | null
          target: string
          target_handle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          flow_id: string
          id?: string
          source: string
          source_handle?: string | null
          target: string
          target_handle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          source?: string
          source_handle?: string | null
          target?: string
          target_handle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_edges_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automations_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      automations_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_flows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations_nodes: {
        Row: {
          config: Json | null
          created_at: string
          flow_id: string
          id: string
          position_x: number
          position_y: number
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          flow_id: string
          id?: string
          position_x: number
          position_y: number
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          flow_id?: string
          id?: string
          position_x?: number
          position_y?: number
          type?: string
          updated_at?: string
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
          created_at: string | null
          id: string
          is_internal: boolean | null
          mensagem: string
          read_at: string | null
          sender_type: string
          ticket_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          mensagem: string
          read_at?: string | null
          sender_type: string
          ticket_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          mensagem?: string
          read_at?: string | null
          sender_type?: string
          ticket_id?: string | null
          updated_at?: string | null
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
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string | null
          descricao: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          last_reply_at: string | null
          numero: number
          organization_id: string | null
          origin: string | null
          priority: Database["public"]["Enums"]["support_ticket_priority"] | null
          resolved_at: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"] | null
          tags: string[] | null
          titulo: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          descricao: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          last_reply_at?: string | null
          numero?: number
          organization_id?: string | null
          origin?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"] | null
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"] | null
          tags?: string[] | null
          titulo: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          descricao?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          last_reply_at?: string | null
          numero?: number
          organization_id?: string | null
          origin?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"] | null
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"] | null
          tags?: string[] | null
          titulo?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tenant_type"]
          cnpj: string | null
          telefone: string
          email: string | null
          cidade: string
          uf: string
          timezone: string | null
          modo_agendamento: Database["public"]["Enums"]["modo_agendamento"] | null
          antecedencia_minima_horas: number | null
          janela_agendamento_dias: number | null
          reagendamento_permitido_horas: number | null
          overbooking_ativo: boolean | null
          cor_primaria: string | null
          cor_acao: string | null
          logo_url: string | null
          segmentos: string[] | null
          whatsapp_ativo: boolean | null
          email_ativo: boolean | null
          sms_ativo: boolean | null
          callmebot_phone: string | null
          callmebot_apikey: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tenant_type"]
          cnpj?: string | null
          telefone: string
          email?: string | null
          cidade: string
          uf: string
          timezone?: string | null
          modo_agendamento?: Database["public"]["Enums"]["modo_agendamento"] | null
          antecedencia_minima_horas?: number | null
          janela_agendamento_dias?: number | null
          reagendamento_permitido_horas?: number | null
          overbooking_ativo?: boolean | null
          cor_primaria?: string | null
          cor_acao?: string | null
          logo_url?: string | null
          segmentos?: string[] | null
          whatsapp_ativo?: boolean | null
          email_ativo?: boolean | null
          sms_ativo?: boolean | null
          callmebot_phone?: string | null
          callmebot_apikey?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tenant_type"]
          cnpj?: string | null
          telefone?: string
          email?: string | null
          cidade?: string
          uf?: string
          timezone?: string | null
          modo_agendamento?: Database["public"]["Enums"]["modo_agendamento"] | null
          antecedencia_minima_horas?: number | null
          janela_agendamento_dias?: number | null
          reagendamento_permitido_horas?: number | null
          overbooking_ativo?: boolean | null
          cor_primaria?: string | null
          cor_acao?: string | null
          logo_url?: string | null
          segmentos?: string[] | null
          whatsapp_ativo?: boolean | null
          email_ativo?: boolean | null
          sms_ativo?: boolean | null
          callmebot_phone?: string | null
          callmebot_apikey?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          nome: string
          telefone: string | null
          email: string | null
          cidade: string | null
          uf: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string | null
          cpf: string | null
          conselho_profissional: string | null
          numero_registro: string | null
          uf_registro: string | null
          especialidade_id: string | null
          avatar_url: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          nome: string
          telefone?: string | null
          email?: string | null
          cidade?: string | null
          uf?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
          cpf?: string | null
          conselho_profissional?: string | null
          numero_registro?: string | null
          uf_registro?: string | null
          especialidade_id?: string | null
          avatar_url?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string | null
          email?: string | null
          cidade?: string | null
          uf?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
          cpf?: string | null
          conselho_profissional?: string | null
          numero_registro?: string | null
          uf_registro?: string | null
          especialidade_id?: string | null
          avatar_url?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      pacientes: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          telefone: string
          email: string | null
          preferencia_contato: Database["public"]["Enums"]["message_channel"] | null
          consentimento_lgpd: boolean | null
          consentimento_data: string | null
          historico_faltas: number | null
          risco_no_show: number | null
          notas_internas: string | null
          cpf: string | null
          data_nascimento: string | null
          sexo: string | null
          endereco: string | null
          cidade: string | null
          uf: string | null
          cep: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          telefone: string
          email?: string | null
          preferencia_contato?: Database["public"]["Enums"]["message_channel"] | null
          consentimento_lgpd?: boolean | null
          consentimento_data?: string | null
          historico_faltas?: number | null
          risco_no_show?: number | null
          notas_internas?: string | null
          cpf?: string | null
          data_nascimento?: string | null
          sexo?: string | null
          endereco?: string | null
          cidade?: string | null
          uf?: string | null
          cep?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          telefone?: string
          email?: string | null
          preferencia_contato?: Database["public"]["Enums"]["message_channel"] | null
          consentimento_lgpd?: boolean | null
          consentimento_data?: string | null
          historico_faltas?: number | null
          risco_no_show?: number | null
          notas_internas?: string | null
          cpf?: string | null
          data_nascimento?: string | null
          sexo?: string | null
          endereco?: string | null
          cidade?: string | null
          uf?: string | null
          cep?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      servicos: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          duracao_minutos: number
          preco: number | null
          confirmacao_24h: boolean | null
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          duracao_minutos: number
          preco?: number | null
          confirmacao_24h?: boolean | null
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          duracao_minutos?: number
          preco?: number | null
          confirmacao_24h?: boolean | null
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      especialidades: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          descricao: string | null
          codigo_cfm: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          descricao?: string | null
          codigo_cfm?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          descricao?: string | null
          codigo_cfm?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      planos_saude: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          registro_ans: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          registro_ans?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          registro_ans?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_saude_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      procedimentos: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          codigo_tuss: string | null
          valor: number | null
          duracao_minutos: number | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          codigo_tuss?: string | null
          valor?: number | null
          duracao_minutos?: number | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          codigo_tuss?: string | null
          valor?: number | null
          duracao_minutos?: number | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedimentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      pacotes: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          descricao: string | null
          quantidade_sessoes: number
          valor_total: number
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          descricao?: string | null
          quantidade_sessoes: number
          valor_total: number
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          descricao?: string | null
          quantidade_sessoes?: number
          valor_total?: number
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          nome_fantasia: string
          razao_social: string | null
          cnpj: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome_fantasia: string
          razao_social?: string | null
          cnpj?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome_fantasia?: string
          razao_social?: string | null
          cnpj?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          organization_id: string
          nome: string
          nome_unidade: string | null
          tenant_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          nome: string
          nome_unidade?: string | null
          tenant_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          nome?: string
          nome_unidade?: string | null
          tenant_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      prontuarios: {
        Row: {
          id: string
          tenant_id: string
          paciente_id: string
          profissional_id: string | null
          tipo: string | null
          conteudo: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          paciente_id: string
          profissional_id?: string | null
          tipo?: string | null
          conteudo?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          paciente_id?: string
          profissional_id?: string | null
          tipo?: string | null
          conteudo?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prontuarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          }
        ]
      }
      tipos_profissional: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          descricao: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          descricao?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          descricao?: string | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_profissional_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      system_users: {
        Row: {
          id: string
          email: string
          nome: string
          role: Database["public"]["Enums"]["support_role"] | null
          active: boolean | null
          theme_preference: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          nome: string
          role?: Database["public"]["Enums"]["support_role"] | null
          active?: boolean | null
          theme_preference?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          role?: Database["public"]["Enums"]["support_role"] | null
          active?: boolean | null
          theme_preference?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lista_espera: {
        Row: {
          id: string
          tenant_id: string
          paciente_id: string
          servico_id: string | null
          profissional_id: string | null
          preferencia_data_inicio: string | null
          preferencia_data_fim: string | null
          preferencia_hora_inicio: string | null
          preferencia_hora_fim: string | null
          prioridade: number | null
          ativo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          paciente_id: string
          servico_id?: string | null
          profissional_id?: string | null
          preferencia_data_inicio?: string | null
          preferencia_data_fim?: string | null
          preferencia_hora_inicio?: string | null
          preferencia_hora_fim?: string | null
          prioridade?: number | null
          ativo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          paciente_id?: string
          servico_id?: string | null
          profissional_id?: string | null
          preferencia_data_inicio?: string | null
          preferencia_data_fim?: string | null
          preferencia_hora_inicio?: string | null
          preferencia_hora_fim?: string | null
          prioridade?: number | null
          ativo?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          }
        ]
      }
      log_mensagens: {
        Row: {
          id: string
          tenant_id: string
          paciente_id: string | null
          canal: Database["public"]["Enums"]["message_channel"]
          destinatario: string
          template_usado: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          erro_mensagem: string | null
          usuario_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          paciente_id?: string | null
          canal: Database["public"]["Enums"]["message_channel"]
          destinatario: string
          template_usado?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          erro_mensagem?: string | null
          usuario_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          paciente_id?: string | null
          canal?: Database["public"]["Enums"]["message_channel"]
          destinatario?: string
          template_usado?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          erro_mensagem?: string | null
          usuario_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_mensagens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      paciente_usuarios: {
        Row: {
          id: string
          paciente_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          paciente_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          paciente_id?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paciente_usuarios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          }
        ]
      }
      paciente_documentos: {
        Row: {
          id: string
          paciente_id: string
          nome: string
          url: string
          tipo: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          paciente_id: string
          nome: string
          url: string
          tipo?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          paciente_id?: string
          nome?: string
          url?: string
          tipo?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paciente_documentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          }
        ]
      }
      agendamento_online_config: {
        Row: {
          id: string
          tenant_id: string
          slug_publico: string
          ativo: boolean | null
          config: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          slug_publico: string
          ativo?: boolean | null
          config?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          slug_publico?: string
          ativo?: boolean | null
          config?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_online_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      usuarios_suporte: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string | null
          foto_url: string | null
          status: Database["public"]["Enums"]["user_status"]
          funcoes: Database["public"]["Enums"]["support_role"][]
          tema: Database["public"]["Enums"]["theme_preference"]
          forcar_troca_senha: boolean
          auth_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          telefone?: string | null
          foto_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          funcoes?: Database["public"]["Enums"]["support_role"][]
          tema?: Database["public"]["Enums"]["theme_preference"]
          forcar_troca_senha?: boolean
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string | null
          foto_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          funcoes?: Database["public"]["Enums"]["support_role"][]
          tema?: Database["public"]["Enums"]["theme_preference"]
          forcar_troca_senha?: boolean
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_suporte_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      consent_records: {
        Row: {
          id: string
          tenant_id: string
          paciente_id: string | null
          tipo: string
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          paciente_id?: string | null
          tipo: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          paciente_id?: string | null
          tipo?: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_system_event: {
        Args: {
          p_level: string
          p_message: string
          p_service: string
          p_metadata?: Json
        }
        Returns: void
      }
      log_admin_auth_event: {
        Args: {
          p_usuario_id: string | null
          p_tipo_evento: string
          p_descricao?: string | null
          p_ip_address?: string | null
          p_user_agent?: string | null
          p_metadata?: Json
        }
        Returns: void
      }
    }
    Enums: {
      agendamento_status:
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

type PublicSchema = Database["public"]

type PublicSchemaName = Extract<keyof Database, "public">

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: PublicSchemaName },
  TableName extends PublicTableNameOrOptions extends { schema: PublicSchemaName }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: PublicSchemaName }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: PublicSchemaName },
  TableName extends PublicTableNameOrOptions extends { schema: PublicSchemaName }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: PublicSchemaName }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: PublicSchemaName },
  TableName extends PublicTableNameOrOptions extends { schema: PublicSchemaName }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: PublicSchemaName }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: PublicSchemaName },
  EnumName extends PublicEnumNameOrOptions extends { schema: PublicSchemaName }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: PublicSchemaName }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: PublicSchemaName },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: PublicSchemaName
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: PublicSchemaName }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
