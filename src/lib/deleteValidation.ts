import { supabase } from "@/integrations/supabase/client";

interface ValidationResult {
  canDelete: boolean;
  dependencies: string[];
  message?: string;
}

export const validateEspecialidadeDelete = async (especialidadeId: string): Promise<ValidationResult> => {
  try {
    // Verificar se há profissionais usando esta especialidade
    const { data: profissionais, error } = await supabase
      .from('profiles')
      .select('nome')
      .eq('especialidade_id', especialidadeId)
      .eq('role', 'profissional');

    if (error) throw error;

    if (profissionais && profissionais.length > 0) {
      return {
        canDelete: false,
        dependencies: ['Profissionais'],
        message: `Não é possível excluir esta especialidade pois ${profissionais.length} profissional(is) está(ão) vinculado(s) a ela.\n\nPara excluir:\n1. Primeiro remova ou altere a especialidade dos seguintes profissionais:\n   - ${profissionais.map(p => p.nome).join('\n   - ')}\n2. Depois tente excluir novamente.`
      };
    }

    return { canDelete: true, dependencies: [] };
  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      canDelete: false,
      dependencies: [],
      message: 'Erro ao validar exclusão. Tente novamente.'
    };
  }
};

export const validateExameProcedimentoDelete = async (exameId: string): Promise<ValidationResult> => {
  try {
    // Verificar se há agendamentos usando este exame
    const { data: agendamentos, error } = await supabase
      .from('agenda')
      .select('id, pacientes(nome)')
      .eq('servico_id', exameId)
      .limit(10);

    if (error) throw error;

    if (agendamentos && agendamentos.length > 0) {
      return {
        canDelete: false,
        dependencies: ['Agendamentos'],
        message: `Não é possível excluir este exame/procedimento pois há ${agendamentos.length} agendamento(s) vinculado(s).\n\nPara excluir:\n1. Primeiro cancele ou conclua os agendamentos relacionados\n2. Depois tente excluir novamente.`
      };
    }

    return { canDelete: true, dependencies: [] };
  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      canDelete: false,
      dependencies: [],
      message: 'Erro ao validar exclusão. Tente novamente.'
    };
  }
};

export const validatePacienteDelete = async (pacienteId: string): Promise<ValidationResult> => {
  const dependencies: string[] = [];
  let message = '';

  try {
    // Verificar agendamentos
    const { data: agendamentos, error: agendaError } = await supabase
      .from('agenda')
      .select('id')
      .eq('paciente_id', pacienteId);

    if (agendaError) throw agendaError;

    if (agendamentos && agendamentos.length > 0) {
      dependencies.push(`${agendamentos.length} agendamento(s)`);
    }

    // Verificar pacotes
    const { data: pacotes, error: pacotesError } = await supabase
      .from('pacientes_pacotes')
      .select('id, pacotes(nome)')
      .eq('paciente_id', pacienteId);

    if (pacotesError) throw pacotesError;

    if (pacotes && pacotes.length > 0) {
      dependencies.push(`${pacotes.length} pacote(s) vinculado(s)`);
    }

    // Verificar lista de espera
    const { data: listaEspera, error: listaError } = await supabase
      .from('lista_espera')
      .select('id')
      .eq('paciente_id', pacienteId);

    if (listaError) throw listaError;

    if (listaEspera && listaEspera.length > 0) {
      dependencies.push(`${listaEspera.length} registro(s) na lista de espera`);
    }

    if (dependencies.length > 0) {
      message = `Não é possível excluir este paciente pois há:\n${dependencies.map(d => `• ${d}`).join('\n')}\n\nPara excluir:\n1. Primeiro remova ou conclua os itens acima\n2. Depois tente excluir o paciente`;
      return {
        canDelete: false,
        dependencies,
        message
      };
    }

    return { canDelete: true, dependencies: [] };
  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      canDelete: false,
      dependencies: [],
      message: 'Erro ao validar exclusão. Tente novamente.'
    };
  }
};

export const validatePacoteDelete = async (pacoteId: string): Promise<ValidationResult> => {
  try {
    // Verificar se há pacientes usando este pacote
    const { data: pacientesPacotes, error } = await supabase
      .from('pacientes_pacotes')
      .select('id, pacientes(nome), status, sessoes_restantes')
      .eq('pacote_id', pacoteId);

    if (error) throw error;

    if (pacientesPacotes && pacientesPacotes.length > 0) {
      const ativos = pacientesPacotes.filter(pp => pp.status === 'ativo');
      
      return {
        canDelete: false,
        dependencies: ['Pacientes com pacote'],
        message: `Não é possível excluir este pacote pois ${pacientesPacotes.length} paciente(s) possui(em) este pacote vinculado${ativos.length > 0 ? `, sendo ${ativos.length} ativo(s)` : ''}.\n\nPara excluir:\n1. Primeiro finalize ou cancele os pacotes dos pacientes\n2. Depois tente excluir novamente.`
      };
    }

    return { canDelete: true, dependencies: [] };
  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      canDelete: false,
      dependencies: [],
      message: 'Erro ao validar exclusão. Tente novamente.'
    };
  }
};

export const validateProfissionalDelete = async (profissionalId: string): Promise<ValidationResult> => {
  const dependencies: string[] = [];
  let message = '';

  try {
    // Verificar agendamentos
    const { data: agendamentos, error: agendaError } = await supabase
      .from('agenda')
      .select('id')
      .eq('profissional_id', profissionalId);

    if (agendaError) throw agendaError;

    if (agendamentos && agendamentos.length > 0) {
      dependencies.push(`${agendamentos.length} agendamento(s)`);
    }

    // Verificar atribuições de pacientes
    const { data: atribuicoes, error: atribuicoesError } = await supabase
      .from('paciente_atribuicoes')
      .select('id, pacientes(nome)')
      .eq('profissional_id', profissionalId);

    if (atribuicoesError) throw atribuicoesError;

    if (atribuicoes && atribuicoes.length > 0) {
      dependencies.push(`${atribuicoes.length} paciente(s) atribuído(s)`);
    }

    if (dependencies.length > 0) {
      message = `Não é possível excluir este profissional pois há:\n${dependencies.map(d => `• ${d}`).join('\n')}\n\nPara excluir:\n1. Primeiro reatribua os pacientes a outro profissional\n2. Cancele ou conclua os agendamentos\n3. Depois tente excluir o profissional`;
      return {
        canDelete: false,
        dependencies,
        message
      };
    }

    return { canDelete: true, dependencies: [] };
  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      canDelete: false,
      dependencies: [],
      message: 'Erro ao validar exclusão. Tente novamente.'
    };
  }
};

export const validateServicoDelete = async (servicoId: string): Promise<ValidationResult> => {
  const dependencies: string[] = [];
  let message = '';

  try {
    // Verificar agendamentos
    const { data: agendamentos, error: agendaError } = await supabase
      .from('agenda')
      .select('id')
      .eq('servico_id', servicoId);

    if (agendaError) throw agendaError;

    if (agendamentos && agendamentos.length > 0) {
      dependencies.push(`${agendamentos.length} agendamento(s)`);
    }

    // Verificar pacotes
    const { data: pacotes, error: pacotesError } = await supabase
      .from('pacotes')
      .select('id, nome')
      .eq('servico_id', servicoId);

    if (pacotesError) throw pacotesError;

    if (pacotes && pacotes.length > 0) {
      dependencies.push(`${pacotes.length} pacote(s) vinculado(s)`);
    }

    // Verificar lista de espera
    const { data: listaEspera, error: listaError } = await supabase
      .from('lista_espera')
      .select('id')
      .eq('servico_id', servicoId);

    if (listaError) throw listaError;

    if (listaEspera && listaEspera.length > 0) {
      dependencies.push(`${listaEspera.length} registro(s) na lista de espera`);
    }

    if (dependencies.length > 0) {
      message = `Não é possível excluir este serviço pois há:\n${dependencies.map(d => `• ${d}`).join('\n')}\n\nPara excluir:\n1. Primeiro remova as vinculações acima\n2. Depois tente excluir o serviço`;
      return {
        canDelete: false,
        dependencies,
        message
      };
    }

    return { canDelete: true, dependencies: [] };
  } catch (error) {
    console.error('Erro ao validar exclusão:', error);
    return {
      canDelete: false,
      dependencies: [],
      message: 'Erro ao validar exclusão. Tente novamente.'
    };
  }
};