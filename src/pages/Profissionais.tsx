import React, { useState, useEffect } from "react";
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
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewProfessionalDialog } from "@/components/schedule/NewProfessionalDialog";
import { EditProfessionalDialog } from "@/components/schedule/EditProfessionalDialog";
import { DeleteProfessionalDialog } from "@/components/schedule/DeleteProfessionalDialog";

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
  const [deletingProfessional, setDeletingProfessional] = useState<{ id: string; nome: string } | null>(null);
  const { toast } = useToast();

  const fetchProfessionals = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          especialidades:especialidade_id(nome)
        `)
        .eq('role', 'profissional')
        .order('nome');

      if (error) throw error;
      setProfessionals((data as any) || []);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const filteredProfessionals = professionals.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.numero_registro && p.numero_registro.includes(searchTerm))
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground">
              Gerenciar cadastro de profissionais de saúde ({professionals.length})
            </p>
          </div>
          {!isLoading && professionals.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/profissionais/recontratar'}>
                <Upload className="mr-2 h-4 w-4" />
                Recontratar (CSV)
              </Button>
              <NewProfessionalDialog onSuccess={() => fetchProfessionals()} />
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou registro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente uma busca diferente" : "Comece adicionando seu primeiro profissional"}
            </p>
            {!searchTerm && <NewProfessionalDialog onSuccess={() => fetchProfessionals()} />}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProfessionals.map((professional) => (
              <Card key={professional.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-light rounded-full">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{professional.nome}</h3>
                      {professional.especialidades && (
                        <Badge variant="secondary" className="mt-1">
                          {professional.especialidades.nome}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {professional.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{professional.email}</span>
                    </div>
                  )}
                  {professional.telefone && (
                    <div className="flex items-center gap-2">
                      <IconeTelefone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{professional.telefone}</span>
                    </div>
                  )}
                  {professional.conselho_profissional && professional.numero_registro && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {professional.conselho_profissional} {professional.numero_registro}
                        {professional.uf_registro && ` - ${professional.uf_registro}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(professional.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingProfessional({ id: professional.id, nome: professional.nome })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </Card>
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
