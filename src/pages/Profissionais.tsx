import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Trash2,
  User,
  Loader2,
  Search,
  Mail,
  Phone as IconeTelefone,
  FileText,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewProfessionalDialog } from "@/components/schedule/NewProfessionalDialog";
import { EditProfessionalDialog } from "@/components/schedule/EditProfessionalDialog";
import { DeleteProfessionalDialog } from "@/components/schedule/DeleteProfessionalDialog";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";

interface Professional {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  conselho_profissional: string | null;
  numero_registro: string | null;
  uf_registro: string | null;
  role: string;
  especialidade_id: string | null;
  especialidades?: {
    nome: string;
  };
  created_at: string;
}

const Profissionais = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingProfessional, setDeletingProfessional] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();

  const fetchProfessionals = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select(
          `
          *,
          profissional_especialidades (
            especialidade_id,
            especialidades (
              nome
            )
          )
        `,
        )
        .eq("role", "profissional")
        .order("nome");

      if (profError) throw profError;

      const professionalsWithEspecialidades = (profData || []).map((p) => ({
        ...p,
        especialidades:
          p.profissional_especialidades?.[0]?.especialidades || null,
      }));

      setProfessionals(professionalsWithEspecialidades as any);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  useEffect(() => {
    setTitle("Profissionais");
    setSubtitle("Gerencie profissionais e permissões");
  }, [setTitle, setSubtitle]);

  const filteredProfessionals = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return professionals.filter(
      (p) =>
        searchLower === "" ||
        p.nome.toLowerCase().includes(searchLower) ||
        (p.email && p.email.toLowerCase().includes(searchLower)) ||
        (p.numero_registro && p.numero_registro.includes(searchLower)),
    );
  }, [professionals, searchTerm]);

  return (
    <MainLayout>
      <div className="w-full space-y-4 animate-in fade-in duration-500 pb-10">

        {/* Slim Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card/30 border border-border/50 backdrop-blur-sm rounded-xl p-4 md:p-5 w-full min-w-0">
          <div className="relative w-full md:flex-1 md:min-w-[240px] md:max-w-[560px] group min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
            <Input
              placeholder="Buscar por nome, e-mail ou registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-muted/50 shadow-inner focus:bg-background transition-all rounded-full h-10 min-w-0"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            {!isLoading && professionals.length > 0 && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/profissionais/recontratar")}
                className="rounded-xl h-10 px-4 w-full md:w-auto"
              >
                <Upload className="mr-2 h-4 w-4 shrink-0" />
                Recontratar (CSV)
              </Button>
            )}
            <div className="w-full md:w-auto shrink-0">
              <NewProfessionalDialog onSuccess={() => fetchProfessionals()} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-border/50 rounded-xl bg-muted/10">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {searchTerm ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Tente uma busca diferente" : "Comece adicionando seu primeiro profissional"}
            </p>
            {!searchTerm && (
              <NewProfessionalDialog onSuccess={() => fetchProfessionals()} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProfessionals.map((professional) => (
              <div
                key={professional.id}
                className={`bg-card/30 border border-border/50 backdrop-blur-sm rounded-xl transition-colors hover:bg-muted/50 flex flex-col min-w-0${filteredProfessionals.length === 1 ? " col-span-full max-w-2xl mx-auto w-full" : ""}`}
              >
                {/* Card Header: avatar + name + badge | actions */}
                <div className="flex items-start justify-between p-5 pb-3 gap-2 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 bg-primary/10 rounded-full border border-primary/20 shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-foreground truncate block">
                        {professional.nome}
                      </h3>
                      {professional.especialidades && (
                        <Badge variant="secondary" className="mt-1 text-[11px]">
                          {professional.especialidades.nome}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(professional.id)}
                      className="h-8 w-8 text-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setDeletingProfessional({
                          id: professional.id,
                          nome: professional.nome,
                        })
                      }
                      className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Card Body: metadata grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-5 pb-5 min-w-0">
                  {professional.email && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{professional.email}</span>
                    </div>
                  )}
                  {professional.telefone && (
                    <div className="flex items-center gap-2 min-w-0">
                      <IconeTelefone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{professional.telefone}</span>
                    </div>
                  )}
                  {professional.conselho_profissional && professional.numero_registro && (
                    <div className="flex items-center gap-2 min-w-0 sm:col-span-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">
                        {professional.conselho_profissional}{" "}
                        {professional.numero_registro}
                        {professional.uf_registro && ` - ${professional.uf_registro}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <EditProfessionalDialog
          professionalId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => fetchProfessionals()}
        />
      )}

      {deletingProfessional && (
        <DeleteProfessionalDialog
          professional={deletingProfessional}
          open={!!deletingProfessional}
          onOpenChange={(open) => !open && setDeletingProfessional(null)}
          onSuccess={() => fetchProfessionals()}
        />
      )}
    </MainLayout>
  );
};

export default Profissionais;
