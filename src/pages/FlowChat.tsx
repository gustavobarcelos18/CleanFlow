import React, { useState, useEffect, useMemo, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { useToast } from "@/hooks/use-toast";
import { usePatients, Patient } from "@/hooks/data/usePatients";
import { normalizarTelefoneWhatsApp, montarLinkWhatsApp } from "@/lib/phone";
import {
  MessageSquare,
  Search,
  Send,
  Copy,
  ArrowLeft,
  User,
  Phone,
} from "lucide-react";

/**
 * Interface local para garantir tipagem estrita no FlowChat
 */
interface PacienteChat {
  id: string;
  nome: string;
  telefone: string | null;
  email?: string | null;
}

const FlowChat = () => {
  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Estados principais
  const [selectedPatient, setSelectedPatient] = useState<PacienteChat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  // Hook de Pacientes (Limite de 200 para v1)
  const { data: patientsData, isLoading } = usePatients({ 
    pageSize: 200 
  });

  // Mapeamento e Filtro Local (Evita custo de backend no v1)
  const filteredPatients = useMemo(() => {
    if (!patientsData?.data) return [];
    
    // Mapeamento seguro
    const patients: PacienteChat[] = patientsData.data.map(p => ({
      id: p.id,
      nome: p.nome,
      telefone: p.telefone,
      email: p.email
    }));

    if (!searchQuery.trim()) return patients;

    const term = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.nome.toLowerCase().includes(term) || 
      (p.telefone && p.telefone.includes(term))
    );
  }, [patientsData, searchQuery]);

  // Telefone normalizado para o envio
  const normalizedPhone = useMemo(() => 
    normalizarTelefoneWhatsApp(selectedPatient?.telefone), 
    [selectedPatient]
  );

  // Efeitos de Layout
  useEffect(() => {
    if (setTitle) setTitle("FlowChat");
    if (setSubtitle) setSubtitle("Envio rápido de mensagens via WhatsApp para seus pacientes");
  }, [setTitle, setSubtitle]);

  // Auto-focus no mobile ao selecionar
  useEffect(() => {
    if (selectedPatient && window.innerWidth < 768) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [selectedPatient]);

  // Ações
  const handleOpenWhatsApp = () => {
    if (!normalizedPhone) return;
    
    const url = montarLinkWhatsApp(normalizedPhone, message);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    
    if (!win) {
      toast({
        title: "Pop-up Bloqueado",
        description: "Não conseguimos abrir o WhatsApp. Por favor, libere pop-ups ou use o botão de copiar.",
        variant: "destructive",
      });
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem Copiada",
      description: "A mensagem foi copiada para a área de transferência.",
    });
  };

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto w-full h-[calc(100vh-140px)] animate-in fade-in duration-500">
        <div className="flex w-full h-full bg-card/30 rounded-2xl border border-border/50 overflow-hidden backdrop-blur-md shadow-2xl divide-x divide-border/50 min-w-0">
          
          {/* Coluna Esquerda: Lista de Pacientes (Oculta no mobile se selecionado) */}
          <div className={`w-full md:w-[350px] flex-shrink-0 flex flex-col bg-background/40 h-full min-w-0 ${selectedPatient ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border/50 bg-background/30">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50 border-border/30 focus:bg-background transition-all rounded-xl h-10 w-full"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="py-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-primary/5 active:bg-primary/10 relative group ${
                        selectedPatient?.id === patient.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12 border border-border/50">
                        <AvatarFallback><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left pr-2">
                        <span className="font-bold text-sm text-foreground line-clamp-2 block">{patient.nome}</span>
                        <p className="text-xs text-muted-foreground truncate leading-relaxed">
                          {patient.telefone || "Sem telefone"}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">Nenhum paciente encontrado.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Coluna Direita: Painel de Atendimento (Oculta no mobile se nenhum selecionado) */}
          <div className={`flex-1 flex flex-col min-w-0 bg-background/10 relative overflow-x-hidden ${!selectedPatient ? 'hidden md:flex' : 'flex'}`}>
            {selectedPatient ? (
              <>
                {/* Header Mobile/Desktop */}
                <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-background/50 backdrop-blur-sm shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden shrink-0 h-9 w-9 rounded-full"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                    <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pr-2">
                    <h2 className="font-bold text-sm text-foreground line-clamp-2">{selectedPatient.nome}</h2>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate font-medium">
                        {selectedPatient.telefone || "Não cadastrado"}
                      </span>
                    </div>
                  </div>
                  {!normalizedPhone && selectedPatient.telefone && (
                    <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full font-bold">
                      Número Inválido
                    </span>
                  )}
                </div>

                {/* Área de Composição */}
                <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center">
                  <div className="w-full max-w-2xl space-y-6">
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="text-lg font-bold tracking-tight">Nova Mensagem</h3>
                      <p className="text-sm text-muted-foreground">
                        Escreva abaixo o que deseja enviar para o paciente.
                      </p>
                    </div>

                    <div className="bg-card/50 border border-border/50 rounded-2xl p-4 shadow-sm focus-within:border-primary/50 transition-colors">
                      <textarea 
                        ref={textareaRef}
                        placeholder={`Olá ${selectedPatient.nome.split(' ')[0]}, gostaria de...`}
                        className="w-full min-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-2 text-sm placeholder:text-muted-foreground/50 leading-relaxed"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={handleOpenWhatsApp}
                        disabled={!normalizedPhone}
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 font-bold"
                      >
                        <Send className="h-4 w-4" />
                        Abrir WhatsApp
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleCopyMessage}
                        className="flex-1 h-12 rounded-xl border-border/50 hover:bg-accent transition-all gap-2 font-bold"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar Mensagem
                      </Button>
                    </div>

                    {!normalizedPhone && (
                      <p className="text-xs text-center text-destructive font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/10 italic">
                        Nota: O sistema não identificou um número de telefone válido do Brasil para este paciente. Verifique o cadastro.
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé Informativo */}
                <div className="p-4 border-t border-border/50 text-center bg-background/30 italic">
                  <p className="text-[10px] text-muted-foreground">
                    O CleanFlow não armazena as mensagens enviadas. Elas são transmitidas diretamente via link oficial wa.me.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/20 relative group">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">FlowChat</h2>
                <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                  Selecione um paciente na lista lateral para iniciar um atendimento via WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlowChat;
