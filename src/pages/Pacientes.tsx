import React, { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTerminology } from "@/stores/useSegmentStore";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { NewPatientDialog } from "@/components/schedule/NewPatientDialog";
import { EditPatientDialog } from "@/components/schedule/EditPatientDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { validatePacienteDelete } from "@/lib/deleteValidation";

// New Components
import { PatientSummaryCards } from "@/components/patients/PatientSummaryCards";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientCardSkeleton } from "@/components/patients/PatientCardSkeleton";

const Pacientes = () => {
  const t = useTerminology();
  const { setTitle, setSubtitle } = useLayoutTitle();
  const { toast } = useToast();

  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .order("nome");

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar pacientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pacientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setTitle(t.client_label + "s");
    setSubtitle(`Gerenciamento de ${t.client_label.toLowerCase()}s`);
  }, [setTitle, setSubtitle, t.client_label]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search logic
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefone?.includes(searchTerm) ||
        p.cpf?.includes(searchTerm.replace(/\D/g, "")) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Risk logic
      const matchesRisk =
        riskFilter === "all" ||
        p.no_show_risk_level?.toLowerCase() === riskFilter.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [patients, searchTerm, riskFilter]);

  const handleDeleteClick = async (id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    try {
      const validation = await validatePacienteDelete(id);

      if (!validation.canDelete) {
        toast({
          title: "Não é possível excluir",
          description: validation.message,
          variant: "destructive",
          duration: 10000,
        });
        return;
      }

      setPatientToDelete(patient);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error("Erro ao validar exclusão:", error);
      toast({
        title: "Erro",
        description: "Erro ao validar exclusão do paciente.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;

    try {
      const { error } = await supabase
        .from("pacientes")
        .delete()
        .eq("id", patientToDelete.id);

      if (error) throw error;

      setPatients((prev) => prev.filter((p) => p.id !== patientToDelete.id));

      toast({
        title: `${t.client_label} excluído`,
        description: `O ${t.client_label.toLowerCase()} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: `Não foi possível excluir o ${t.client_label.toLowerCase()}.`,
        variant: "destructive",
      });
    } finally {
      setPatientToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-2 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t.client_label}s
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Gerencie o cadastro e histórico dos seus{" "}
              {t.client_label.toLowerCase()}s de forma centralizada.
            </p>
          </div>
          <NewPatientDialog onSuccess={fetchPatients} />
        </div>

        <PatientSummaryCards patients={patients} isLoading={isLoading} />

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <PatientFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            riskFilter={riskFilter}
            setRiskFilter={setRiskFilter}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PatientCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onEdit={setEditingId}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <UsersIcon className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold text-muted-foreground">
                Nenhum {t.client_label.toLowerCase()} encontrado
              </h3>
              <p className="text-muted-foreground mt-2">
                Tente ajustar sua busca ou filtros para encontrar o que procura.
              </p>
            </div>
          )}
        </div>

        {editingId && (
          <EditPatientDialog
            patientId={editingId}
            open={!!editingId}
            onOpenChange={(open) => !open && setEditingId(null)}
            onSuccess={fetchPatients}
          />
        )}

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title={`Excluir ${t.client_label}`}
          description={`Tem certeza que deseja excluir o ${t.client_label.toLowerCase()} ${patientToDelete?.nome}? Esta ação não pode ser desfeita.`}
        />
      </div>
    </MainLayout>
  );
};

// Simple icon for empty state
const UsersIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default Pacientes;
