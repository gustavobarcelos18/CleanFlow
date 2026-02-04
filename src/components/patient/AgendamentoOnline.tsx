import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2 } from "lucide-react";
import { format, addDays, setHours, setMinutes, isBefore, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendamentoOnlineProps {
    pacienteId: string;
    tenantId: string;
}

export function AgendamentoOnline({ pacienteId, tenantId }: AgendamentoOnlineProps) {
    const [step, setStep] = useState(1);
    const [profissionais, setProfissionais] = useState<any[]>([]);
    const [servicos, setServicos] = useState<any[]>([]);
    const [horariosDisponiveis, setHorariosDisponiveis] = useState<any[]>([]);

    const [profissionalSelecionado, setProfissionalSelecionado] = useState('');
    const [servicoSelecionado, setServicoSelecionado] = useState('');
    const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
    const [horarioSelecionado, setHorarioSelecionado] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProfissionais();
        loadServicos();
    }, [tenantId]);

    useEffect(() => {
        if (profissionalSelecionado && dataSelecionada) {
            loadHorariosDisponiveis();
        }
    }, [profissionalSelecionado, dataSelecionada]);

    const loadProfissionais = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, nome')
                .eq('tenant_id', tenantId)
                .eq('ativo', true);

            setProfissionais(data || []);
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    const loadServicos = async () => {
        try {
            const { data } = await supabase
                .from('servicos')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('ativo', true);

            setServicos(data || []);
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    const loadHorariosDisponiveis = async () => {
        if (!profissionalSelecionado || !dataSelecionada) return;

        try {
            setLoading(true);

            const dataInicio = startOfDay(dataSelecionada);
            const dataFim = addDays(dataInicio, 1);

            const { data: agendamentosExistentes } = await supabase
                .from('agenda')
                .select('inicio, fim')
                .eq('profissional_id', profissionalSelecionado)
                .gte('inicio', dataInicio.toISOString())
                .lt('inicio', dataFim.toISOString())
                .neq('status', 'cancelado');

            const horarios: any[] = [];
            const servicoDuracao = servicos.find(s => s.id === servicoSelecionado)?.duracao_minutos || 30;

            for (let hora = 8; hora < 18; hora++) {
                for (let minuto = 0; minuto < 60; minuto += 30) {
                    const inicio = setMinutes(setHours(dataSelecionada, hora), minuto);
                    const fim = new Date(inicio.getTime() + servicoDuracao * 60000);

                    const conflito = agendamentosExistentes?.some(ag => {
                        const agInicio = new Date(ag.inicio);
                        const agFim = new Date(ag.fim);
                        return (
                            (inicio >= agInicio && inicio < agFim) ||
                            (fim > agInicio && fim <= agFim) ||
                            (inicio <= agInicio && fim >= agFim)
                        );
                    });

                    if (!conflito && isBefore(new Date(), inicio)) {
                        horarios.push({ inicio, fim });
                    }
                }
            }

            setHorariosDisponiveis(horarios);
        } catch (error) {
            toast.error('Erro ao carregar horários');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarAgendamento = async () => {
        if (!profissionalSelecionado || !servicoSelecionado || !horarioSelecionado) {
            toast.error('Preencha todos os campos');
            return;
        }

        try {
            setLoading(true);

            const horario = horariosDisponiveis.find(h =>
                h.inicio.toISOString() === horarioSelecionado
            );

            const { error } = await supabase
                .from('agenda')
                .insert({
                    tenant_id: tenantId,
                    paciente_id: pacienteId,
                    profissional_id: profissionalSelecionado,
                    servico_id: servicoSelecionado,
                    inicio: horario.inicio.toISOString(),
                    fim: horario.fim.toISOString(),
                    status: 'agendado',
                    confirmado: false,
                    observacoes
                });

            if (error) throw error;

            toast.success('Agendamento realizado!');
            setStep(4);

            setTimeout(() => {
                setStep(1);
                setProfissionalSelecionado('');
                setServicoSelecionado('');
                setDataSelecionada(undefined);
                setHorarioSelecionado('');
                setObservacoes('');
            }, 3000);

        } catch (error) {
            toast.error('Erro ao agendar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Profissional e Serviço */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Escolha o Profissional
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Profissional</Label>
                            <Select value={profissionalSelecionado} onValueChange={setProfissionalSelecionado}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {profissionais.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Serviço</Label>
                            <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {servicos.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.nome} - {s.duracao_minutos}min - R$ {s.valor}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => setStep(2)}
                            disabled={!profissionalSelecionado || !servicoSelecionado}
                        >
                            Próximo: Escolher Data
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Data */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Escolha a Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={dataSelecionada}
                                onSelect={setDataSelecionada}
                                disabled={(date) =>
                                    isBefore(date, new Date()) ||
                                    isAfter(date, addDays(new Date(), 60))
                                }
                                locale={ptBR}
                                className="rounded-md border"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                Voltar
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!dataSelecionada}
                                className="flex-1"
                            >
                                Próximo: Horário
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Horário */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Escolha o Horário
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Carregando...</div>
                        ) : horariosDisponiveis.length === 0 ? (
                            <div className="text-center py-8">
                                <p>Nenhum horário disponível</p>
                                <Button variant="outline" onClick={() => setStep(2)} className="mt-4">
                                    Outra Data
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                                    {horariosDisponiveis.map((horario, i) => (
                                        <Button
                                            key={i}
                                            variant={horarioSelecionado === horario.inicio.toISOString() ? "default" : "outline"}
                                            onClick={() => setHorarioSelecionado(horario.inicio.toISOString())}
                                        >
                                            {format(horario.inicio, 'HH:mm')}
                                        </Button>
                                    ))}
                                </div>

                                <div>
                                    <Label>Observações</Label>
                                    <Textarea
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                                        Voltar
                                    </Button>
                                    <Button
                                        onClick={handleConfirmarAgendamento}
                                        disabled={!horarioSelecionado || loading}
                                        className="flex-1"
                                    >
                                        Confirmar
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Confirmação */}
            {step === 4 && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6 text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                        <h3 className="text-2xl font-bold">Agendamento Confirmado!</h3>
                        <p>Você receberá uma confirmação por WhatsApp.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
