
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
  User,
  Loader2,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewPatientDialog } from "@/components/schedule/NewPatientDialog";
import { EditPatientDialog } from "@/components/schedule/EditPatientDialog";
import { VincularPacoteDialog } from "@/components/pacotes/VincularPacoteDialog";
import { useToast } from "@/hooks/use-toast";
import { useTerminology } from "@/stores/useSegmentStore";

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  preferencia_contato: "whatsapp" | "sms" | "email";
  historico_faltas: number;
  risco_no_show: number;
  created_at: string;
}

const Pacientes = () => {
  const t = useTerminology();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pacientes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const getRiskLevel = (risco: number): "low" | "medium" | "high" => {
    if (risco <= 30) return "low";
    if (risco <= 70) return "medium";
    return "high";
  };

  const getRiskBadge = (level: "low" | "medium" | "high") => {
    const config = {
      low: { label: "Baixo", variant: "default" as const, color: "text-success" },
      medium: { label: "Médio", variant: "secondary" as const, color: "text-warning" },
      high: { label: "Alto", variant: "destructive" as const, color: "text-destructive" }
    };
    return config[level as keyof typeof config];
  };

  const filteredPatients = patients.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefone.includes(searchTerm) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.client_label}s</h1>
            <p className="text-muted-foreground">
              Gerenciar cadastro e histórico de {t.client_label.toLowerCase()}s ({patients.length})
            </p>
          </div>
          <NewPatientDialog onSuccess={() => fetchPatients()} />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar por nome, telefone ou e-mail...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? `Nenhum ${t.client_label.toLowerCase()} encontrado` : `Nenhum ${t.client_label.toLowerCase()} cadastrado`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente uma busca diferente" : `Comece adicionando seu primeiro ${t.client_label.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => {
              const riskLevel = getRiskLevel(patient.risco_no_show);
              const riskConfig = getRiskBadge(riskLevel);

              return (
                <div key={patient.id} className="p-6 bg-card border border-border rounded-lg hover:bg-card-hover transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-light rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{patient.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          Cadastrado em {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={riskConfig.variant}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Risco {riskConfig.label}
                      </Badge>
                      {patient.historico_faltas > 0 && (
                        <Badge variant="destructive">
                          {patient.historico_faltas} faltas
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patient.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patient.email || "Não informado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">Prefere {patient.preferencia_contato}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(patient.id)}
                    >
                      Editar
                    </Button>
                    <VincularPacoteDialog
                      pacienteId={patient.id}
                      pacienteNome={patient.nome}
                      onSuccess={() => fetchPatients()}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const { validatePacienteDelete } = await import('@/lib/deleteValidation');
                        const validation = await validatePacienteDelete(patient.id);

                        if (!validation.canDelete) {
                          toast({
                            title: "Não é possível excluir",
                            description: validation.message,
                            variant: "destructive",
                            duration: 10000
                          });
                          return;
                        }

                        if (!confirm(`Tem certeza que deseja excluir o ${t.client_label.toLowerCase()} ${patient.nome}?`)) return;

                        try {
                          const { error } = await supabase
                            .from('pacientes')
                            .delete()
                            .eq('id', patient.id);

                          if (error) throw error;

                          setPatients(prev => prev.filter(p => p.id !== patient.id));

                          toast({
                            title: `${t.client_label} excluído`,
                            description: `O ${t.client_label.toLowerCase()} foi removido com sucesso.`
                          });
                        } catch (error) {
                          console.error('Erro ao excluir:', error);
                          toast({
                            title: "Erro",
                            description: `Não foi possível excluir o ${t.client_label.toLowerCase()}.`,
                            variant: "destructive"
                          });
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingId && (
        <EditPatientDialog
          patientId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => fetchPatients()}
        />
      )}
    </MainLayout>
  );
};

export default Pacientes;