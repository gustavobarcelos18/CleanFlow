// Tipos para o sistema de encaixe automático

export interface ListaEspera {
    id: string;
    tenant_id: string;
    paciente_id: string;
    profissional_id?: string;
    servico_id?: string;
    unidade_id?: string;
    prioridade: 0 | 1 | 2; // 0=normal, 1=alta, 2=urgente
    data_preferencial?: string;
    horario_preferencial?: string;
    periodo_preferencial?: 'manha' | 'tarde' | 'noite' | 'qualquer';
    observacoes?: string;
    ativo: boolean;
    notificado_em?: string;
    created_at: string;
    updated_at: string;
}

export interface EncaixeOferta {
    id: string;
    tenant_id: string;
    lista_espera_id: string;
    horario_disponivel_inicio: string;
    horario_disponivel_fim: string;
    profissional_id?: string;
    unidade_id?: string;
    status: 'pendente' | 'aceito' | 'recusado' | 'expirado';
    mensagem_enviada_em?: string;
    resposta_recebida_em?: string;
    expira_em: string;
    agendamento_id?: string;
    created_at: string;
}

export interface WhatsAppAutoResponse {
    id: string;
    tenant_id: string;
    palavra_chave: string;
    tipo_resposta: 'confirmacao' | 'cancelamento' | 'reagendamento' | 'encaixe';
    ativo: boolean;
    created_at: string;
}

export interface ProximoListaEspera {
    lista_espera_id: string;
    paciente_id: string;
    paciente_nome: string;
    paciente_telefone: string;
    prioridade: number;
    tempo_espera: string; // interval
}

export interface EncaixeAnalytics {
    tenant_id: string;
    tenant_nome: string;
    lista_espera_ativos: number;
    ofertas_pendentes: number;
    ofertas_aceitas: number;
    ofertas_recusadas: number;
    ofertas_expiradas: number;
    taxa_aceitacao_pct: number;
    tempo_medio_resposta_min: number;
}

// Tipos estendidos para agenda
export interface AgendaComEncaixe {
    confirmado_em?: string;
    confirmado_via?: 'whatsapp' | 'telefone' | 'presencial' | 'email';
    lembrete_d2_enviado: boolean;
    lembrete_h3_enviado: boolean;
    origem_encaixe: boolean;
    oferta_encaixe_id?: string;
}
