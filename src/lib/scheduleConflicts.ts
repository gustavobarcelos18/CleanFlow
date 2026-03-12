/**
 * Utilitários para detecção e gestão de conflitos de horários
 */

export interface AppointmentConflict {
  appointmentId: string;
  conflictsWith: string[];
  overlapMinutes: number;
  canAutoFix: boolean;
  affectedAppointments: string[];
}

/**
 * Calcula sobreposição em minutos entre dois períodos
 */
export function calculateOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): number {
  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;

  if (overlapStart >= overlapEnd) return 0;

  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);
}

/**
 * Detecta conflitos de um agendamento com outros
 * Considera apenas agendamentos do mesmo profissional
 */
export function detectConflict(
  appointmentId: string,
  inicio: Date,
  fim: Date,
  allAppointments: Array<{
    id: string;
    inicio: string | Date;
    fim?: string | Date;
    duration?: number;
    profissional_id?: string;
  }>,
  profissionalId?: string,
): AppointmentConflict | null {
  const conflicts: string[] = [];
  let totalOverlapMinutes = 0;

  for (const apt of allAppointments) {
    if (apt.id === appointmentId) continue;

    // Sò detectar conflito se for o mesmo profissional
    if (
      profissionalId &&
      apt.profissional_id &&
      apt.profissional_id !== profissionalId
    ) {
      continue;
    }

    const aptInicio =
      apt.inicio instanceof Date ? apt.inicio : new Date(apt.inicio);
    let aptFim: Date;

    if (apt.fim) {
      aptFim = apt.fim instanceof Date ? apt.fim : new Date(apt.fim);
    } else if (apt.duration) {
      aptFim = new Date(aptInicio);
      aptFim.setMinutes(aptInicio.getMinutes() + apt.duration);
    } else {
      continue;
    }

    const overlap = calculateOverlap(inicio, fim, aptInicio, aptFim);

    if (overlap > 0) {
      conflicts.push(apt.id);
      totalOverlapMinutes = Math.max(totalOverlapMinutes, overlap);
    }
  }

  if (conflicts.length === 0) return null;

  // Determinar se pode ser corrigido automaticamente
  const sortedAppointments = allAppointments
    .filter(
      (a) =>
        a.id !== appointmentId &&
        (!profissionalId || a.profissional_id === profissionalId),
    )
    .map((a) => {
      const aptInicio =
        a.inicio instanceof Date ? a.inicio : new Date(a.inicio);
      return { ...a, startTime: aptInicio.getTime() };
    })
    .sort((a, b) => a.startTime - b.startTime);

  const currentIndex = sortedAppointments.findIndex((a) =>
    conflicts.includes(a.id),
  );

  // Verifica se há agendamentos após o conflito que precisariam ser movidos
  const affectedAppointments =
    currentIndex >= 0
      ? sortedAppointments.slice(currentIndex).map((a) => a.id)
      : [];

  return {
    appointmentId,
    conflictsWith: conflicts,
    overlapMinutes: totalOverlapMinutes,
    canAutoFix: true,
    affectedAppointments,
  };
}

/**
 * Verifica se há conflitos ao criar novo agendamento
 */
export function checkNewAppointmentConflict(
  inicio: Date,
  duracao: number,
  existingAppointments: Array<{
    id: string;
    inicio: string | Date;
    duration: number;
    profissional_id?: string;
  }>,
  profissionalId?: string,
): { hasConflict: boolean; overlapMinutes: number; conflictingId?: string } {
  const fim = new Date(inicio);
  fim.setMinutes(inicio.getMinutes() + duracao);

  for (const apt of existingAppointments) {
    // Sò detectar conflito se for o mesmo profissional
    if (
      profissionalId &&
      apt.profissional_id &&
      apt.profissional_id !== profissionalId
    ) {
      continue;
    }

    const aptInicio =
      apt.inicio instanceof Date ? apt.inicio : new Date(apt.inicio);
    const aptFim = new Date(aptInicio);
    aptFim.setMinutes(aptInicio.getMinutes() + apt.duration);

    const overlap = calculateOverlap(inicio, fim, aptInicio, aptFim);

    if (overlap > 0) {
      return {
        hasConflict: true,
        overlapMinutes: overlap,
        conflictingId: apt.id,
      };
    }
  }

  return { hasConflict: false, overlapMinutes: 0 };
}

/**
 * Calcula ajustes necessários para resolver conflitos
 */
export function calculateAdjustments(
  appointmentId: string,
  newInicio: Date,
  duration: number,
  allAppointments: Array<{
    id: string;
    inicio: string | Date;
    duration: number;
    profissional_id?: string;
  }>,
  profissionalId?: string,
): Array<{ id: string; inicio: Date; fim: Date }> {
  const adjustments: Array<{ id: string; inicio: Date; fim: Date }> = [];

  const newFim = new Date(newInicio);
  newFim.setMinutes(newInicio.getMinutes() + duration);

  // Ordenar agendamentos por horário para o MESMO profissional
  const sorted = allAppointments
    .filter(
      (a) =>
        a.id !== appointmentId &&
        (!profissionalId || a.profissional_id === profissionalId),
    )
    .map((a) => ({
      ...a,
      inicioDate: a.inicio instanceof Date ? a.inicio : new Date(a.inicio),
    }))
    .sort((a, b) => a.inicioDate.getTime() - b.inicioDate.getTime());

  let lastEndTime = newFim;

  for (const apt of sorted) {
    const aptInicio = apt.inicioDate;

    // Se este agendamento começa antes do fim do último, precisa ser ajustado
    if (aptInicio < lastEndTime) {
      const adjustedInicio = new Date(lastEndTime);
      const adjustedFim = new Date(adjustedInicio);
      adjustedFim.setMinutes(adjustedInicio.getMinutes() + apt.duration);

      adjustments.push({
        id: apt.id,
        inicio: adjustedInicio,
        fim: adjustedFim,
      });

      lastEndTime = adjustedFim;
    } else {
      // Este agendamento não conflita mais
      const aptFim = new Date(aptInicio);
      aptFim.setMinutes(aptInicio.getMinutes() + apt.duration);
      lastEndTime = aptFim;
    }
  }

  return adjustments;
}
