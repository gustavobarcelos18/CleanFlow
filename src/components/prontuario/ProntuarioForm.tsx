import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Save, 
  Clock, 
  Activity, 
  ClipboardList, 
  Stethoscope, 
  Pill, 
  Microscope,
} from "lucide-react";
import { RegistroMedico } from "./RegistroMedico";
import { differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";

interface ProntuarioFormProps {
  pacienteId: string;
  agendamentoId?: string;
  existingProntuarioId?: string;
  onSave?: () => void;
}

export default function ProntuarioForm({
  pacienteId,
  agendamentoId,
  existingProntuarioId,
  onSave,
}: ProntuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [prontuarioId, setProntuarioId] = useState<string | undefined>(existingProntuarioId);
  const [isFinalized, setIsFinalized] = useState(false);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("soap");
  const [professionalName, setProfessionalName] = useState("");

  const [formData, setFormData] = useState({
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",
    peso: "",
    altura: "",
    pressao_arterial: "",
    frequencia_cardiaca: "",
    temperatura: "",
    saturacao_o2: "",
    cid10_principal: "",
    prescricoes: "",
  });

  const imcValue = useMemo(() => {
    const p = parseFloat(formData.peso.replace(',', '.'));
    const a = parseFloat(formData.altura.replace(',', '.'));
    if (!isNaN(p) && !isNaN(a) && p > 0 && a > 0) {
      const alturaM = a > 3 ? a / 100 : a;
      return (p / (alturaM * alturaM)).toFixed(1);
    }
    return "0.0";
  }, [formData.peso, formData.altura]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: pac } = await supabase.from("pacientes").select("nome, data_nascimento").eq("id", pacienteId).maybeSingle();
      if (pac) setPacienteInfo(pac);

      const idToFetch = existingProntuarioId || prontuarioId;
      if (!idToFetch) return;

      const { data, error } = await supabase.from("prontuarios" as any).select("*, profiles(nome)").eq("id", idToFetch).single();
      if (error) throw error;
      if (data) {
        setFormData({
          subjetivo: data.subjetivo || "",
          objetivo: data.objetivo || "",
          avaliacao: data.avaliacao || "",
          plano: data.plano || "",
          peso: data.peso?.toString() || "",
          altura: data.altura?.toString() || "",
          pressao_arterial: data.pressao_arterial || "",
          frequencia_cardiaca: data.frequencia_cardiaca?.toString() || "",
          temperatura: data.temperatura?.toString() || "",
          saturacao_o2: data.saturacao_o2?.toString() || "",
          cid10_principal: data.cid10_principal || "",
          prescricoes: data.prescricoes || "",
        });
        setProntuarioId(data.id);
        setIsFinalized(data.status === "finalizado");
        if ((data as any).profiles?.nome) setProfessionalName((data as any).profiles.nome);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, existingProntuarioId, prontuarioId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (status: "rascunho" | "finalizado") => {
    const toastId = toast.loading(status === "finalizado" ? "Assinando..." : "Salvando...");
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acesso negado.");
      const { data: profile } = await supabase.from("profiles").select("tenant_id, nome").eq("id", user.id).single();
      if (!profile) throw new Error("Perfil de acesso inválido.");

      const payload = {
        tenant_id: profile.tenant_id,
        paciente_id: pacienteId,
        profissional_id: user.id,
        agendamento_id: agendamentoId || null,
        status,
        ...formData,
        frequencia_cardiaca: formData.frequencia_cardiaca ? parseInt(formData.frequencia_cardiaca) : null,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        saturacao_o2: formData.saturacao_o2 ? parseInt(formData.saturacao_o2) : null,
        imc: parseFloat(imcValue)
      };

      if (prontuarioId) {
        const { error } = await supabase.from("prontuarios" as any).update({ ...payload, finalizado_em: status === "finalizado" ? new Date().toISOString() : null }).eq("id", prontuarioId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("prontuarios" as any).insert({ ...payload, data_atendimento: new Date().toISOString(), finalizado_em: status === "finalizado" ? new Date().toISOString() : null }).select().single();
        if (error) throw error;
        if (data) setProntuarioId(data.id);
      }

      toast.success(status === "finalizado" ? "Documento autenticado!" : "Rascunho atualizado.", { id: toastId });
      setIsFinalized(status === "finalizado");
      if (onSave) setTimeout(onSave, 1000);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const idade = useMemo(() => {
    if (pacienteInfo?.data_nascimento) return differenceInYears(new Date(), new Date(pacienteInfo.data_nascimento));
    return null;
  }, [pacienteInfo]);

  return (
    <div className="flex flex-col bg-transparent text-white font-sans h-full overflow-hidden">
      
      {/* STATUS BANNER - ULTRA COMPACTO */}
      <div className={cn(
        "px-4 py-1.5 flex items-center justify-between border-b transition-all rounded-t-2xl mb-4",
        isFinalized ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" : "bg-amber-500/5 border-amber-500/10 text-zinc-500"
      )}>
        <div className="flex items-center gap-2">
          {isFinalized ? <ShieldCheck className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-pulse" />}
          <h2 className="text-[8px] font-black uppercase tracking-widest italic leading-none">
            {isFinalized ? "Finalizado" : "Edição Ativa"}
          </h2>
        </div>
        <p className="text-[7px] font-bold opacity-30 uppercase tracking-tighter">Sessão: {prontuarioId?.split('-')[0] || "Nova"}</p>
      </div>

      <div className="flex-grow space-y-4 lg:flex lg:gap-6 lg:items-start overflow-hidden">
        
        {/* LADO ESQUERDO: CONTEÚDO COMPACTADO */}
        <div className="flex-grow space-y-4 lg:max-w-[calc(100%-240px)] h-full overflow-y-auto pr-1 custom-scrollbar pb-6">
          
          {/* PACIENTE - SUPER SLIM */}
          <div className="border border-white/10 p-3 rounded-xl flex items-center justify-between bg-zinc-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-cyan-500/20 bg-zinc-950/40 flex items-center justify-center text-cyan-400 font-black text-xl italic">
                {pacienteInfo?.nome?.charAt(0)}
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight italic text-zinc-100 uppercase leading-none">{pacienteInfo?.nome || "..."}</h1>
                <p className="text-[7px] text-zinc-700 uppercase font-black tracking-widest mt-1">Prontuário Digital</p>
              </div>
            </div>
            {idade !== null && (
              <div className="text-right border-l border-white/5 pl-4 flex flex-col justify-center">
                <span className="text-[7px] uppercase font-black text-zinc-700 block italic leading-none mb-0.5">Idade</span>
                <p className="text-lg font-black italic text-zinc-500 leading-none">{idade} <span className="text-[8px] font-bold opacity-30">A</span></p>
              </div>
            )}
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden bg-transparent">
            {/* TABS - SUPER SLIM */}
            <div className="flex border-b border-white/10 bg-zinc-950/40">
              {[
                { id: "soap", label: "SOAP", icon: <ClipboardList className="h-3 w-3" /> },
                { id: "vitais", label: "Bio / Vitais", icon: <Activity className="h-3 w-3" /> },
                { id: "diagnostico", label: "CID-10", icon: <Stethoscope className="h-3 w-3" /> },
                { id: "prescricoes", label: "Receituário", icon: <Pill className="h-3 w-3" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-2 gap-1 font-black uppercase text-[7px] tracking-widest transition-all border-r border-white/5 relative",
                    activeTab === tab.id ? "text-cyan-400 bg-white/[0.02]" : "text-zinc-700 hover:text-zinc-500"
                  )}
                >
                  {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-500 shadow-[0_0_5px_cyan]" />}
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 min-h-[320px]">
              {activeTab === "soap" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-200">
                  {["subjetivo", "objetivo", "avaliacao", "plano"].map(f => (
                    <div key={f} className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-cyan-500/60 italic tracking-widest ml-1">{f.charAt(0)} - {f}</label>
                      <textarea 
                        value={(formData as any)[f]} 
                        onChange={(e) => handleInputChange(f, e.target.value)}
                        readOnly={isFinalized}
                        className="w-full bg-transparent border border-white/5 min-h-[110px] rounded-lg p-3 text-[11px] font-medium italic text-zinc-200 placeholder:opacity-10 outline-none focus:border-cyan-500/40 resize-none transition-all"
                        placeholder={`Descreva ${f}...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "vitais" && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
                  {[
                    { id: "pressao_arterial", label: "Pressão", u: "mmHg" },
                    { id: "frequencia_cardiaca", label: "Pulsão", u: "bpm" },
                    { id: "temperatura", label: "Temp", u: "°C" },
                    { id: "saturacao_o2", label: "SpO2", u: "%" },
                    { id: "peso", label: "Peso", u: "kg" },
                    { id: "altura", label: "Altura", u: "cm" }
                  ].map(f => (
                    <div key={f.id} className="space-y-1">
                      <label className="text-[7px] uppercase font-black text-zinc-800 block ml-1">{f.label}</label>
                      <div className="relative">
                        <input value={(formData as any)[f.id]} onChange={(e) => handleInputChange(f.id, e.target.value)} readOnly={isFinalized} className="w-full bg-transparent border border-white/5 h-9 rounded-lg font-bold italic text-base px-3 text-cyan-400 outline-none focus:border-cyan-500/40" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black text-zinc-800 uppercase">{f.u}</span>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-1 bg-zinc-950/10 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                     <div>
                        <span className="text-[7px] uppercase font-black text-cyan-500/40 block leading-none mb-1">IMC</span>
                        <span className="text-2xl font-black italic text-zinc-100 leading-none">{imcValue}</span>
                     </div>
                     <Activity className="h-6 w-6 text-cyan-500/10" />
                  </div>
                </div>
              )}

              {activeTab === "diagnostico" && (
                <div className="max-w-md mx-auto py-8 animate-in fade-in duration-200">
                   <div className="bg-transparent p-6 rounded-2xl border border-cyan-500/10 text-center space-y-4">
                      <label className="text-[9px] font-black uppercase tracking-widest text-cyan-500 italic block">CID-10 Principal</label>
                      <input value={formData.cid10_principal} onChange={(e) => handleInputChange("cid10_principal", e.target.value)} readOnly={isFinalized} className="w-full bg-transparent border-b border-white/10 h-12 text-2xl font-black italic text-center outline-none focus:border-cyan-500" placeholder="Ex: Z00.0" />
                   </div>
                </div>
              )}

              {activeTab === "prescricoes" && (
                <div className="animate-in fade-in h-4/5 space-y-3">
                  <label className="text-[8px] font-black uppercase tracking-widest text-cyan-500 italic ml-1 leading-none">Conduta Medicamentosa</label>
                  <textarea value={formData.prescricoes} onChange={(e) => handleInputChange("prescricoes", e.target.value)} readOnly={isFinalized} placeholder="..." className="w-full bg-transparent border border-white/5 min-h-[200px] rounded-xl p-4 text-base font-black italic text-zinc-200 outline-none focus:border-cyan-500/20 resize-none shadow-inner" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LADO DIREITO: AÇÕES - ULTRA SLIM */}
        <div className="lg:w-[220px] lg:flex-shrink-0 space-y-3">
          {!isFinalized ? (
            <div className="bg-transparent p-4 rounded-xl border border-white/10 space-y-4">
               <div className="flex flex-col gap-3">
                  <button onClick={() => handleSave("rascunho")} disabled={loading} className="w-full h-11 bg-zinc-950/40 hover:bg-white/5 text-zinc-600 hover:text-white rounded-lg font-black uppercase tracking-widest text-[7px] transition-all flex items-center justify-center gap-2 border border-white/5 group">
                    <Save className="h-3 w-3 opacity-40 group-hover:opacity-100" /> Salvar Rascunho
                  </button>
                  <button onClick={() => handleSave("finalizado")} disabled={loading} className="w-full h-16 bg-cyan-700 hover:bg-cyan-600 text-zinc-950 rounded-lg font-black uppercase tracking-widest text-[8px] shadow-lg shadow-cyan-500/10 transition-all flex flex-col items-center justify-center gap-1 active:scale-95">
                    <ShieldCheck className="h-5 w-5" /> Assinar & Finalizar
                  </button>
               </div>
               <p className="text-[6px] font-black text-zinc-800 uppercase italic text-center leading-none">O arquivo será bloqueado após a assinatura.</p>
            </div>
          ) : (
            <div className="bg-emerald-600/5 border border-emerald-500/20 p-6 rounded-xl text-center space-y-3">
               <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
               <div className="space-y-0.5">
                  <span className="text-[6px] font-black text-emerald-500/40 uppercase">Assinado Clinicamente:</span>
                  <p className="font-black text-emerald-500 text-xs uppercase italic leading-none truncate">{professionalName || "Profissional"}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
