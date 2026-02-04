import React, { useState } from 'react';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Building2,
  MapPin,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { UnitSettingsDialog } from '@/components/organization/UnitSettingsDialog';

interface UnitFormData {
  nome_unidade: string;
  codigo_interno: string;
  razao_social: string;
  documento: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_cep: string;
  telefone: string;
  email: string;
  is_matriz: boolean;
}

const initialFormData: UnitFormData = {
  nome_unidade: '',
  codigo_interno: '',
  razao_social: '',
  documento: '',
  endereco_logradouro: '',
  endereco_numero: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_uf: '',
  endereco_cep: '',
  telefone: '',
  email: '',
  is_matriz: false
};

export function UnitManagement() {
  const { organization, units, refreshData, isOrgAdmin } = useOrganizationContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [formData, setFormData] = useState<UnitFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Settings Dialog State
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsUnitId, setSettingsUnitId] = useState<string | null>(null);

  if (!organization) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Organização não encontrada</p>
      </Card>
    );
  }

  const handleOpenDialog = (unitId?: string) => {
    if (unitId) {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        setFormData({
          nome_unidade: unit.nome_unidade,
          codigo_interno: unit.codigo_interno || '',
          razao_social: unit.razao_social || '',
          documento: unit.documento || '',
          endereco_logradouro: (unit as any).endereco_logradouro || '',
          endereco_numero: (unit as any).endereco_numero || '',
          endereco_bairro: (unit as any).endereco_bairro || '',
          endereco_cidade: (unit as any).endereco_cidade || '',
          endereco_uf: (unit as any).endereco_uf || '',
          endereco_cep: (unit as any).endereco_cep || '',
          telefone: (unit as any).telefone || '',
          email: (unit as any).email || '',
          is_matriz: unit.is_matriz
        });
        setEditingUnit(unitId);
      }
    } else {
      setFormData(initialFormData);
      setEditingUnit(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    setFormData(initialFormData);
  };

  const handleOpenSettings = (unitId: string) => {
    setSettingsUnitId(unitId);
    setSettingsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome_unidade.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da unidade é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.razao_social.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A razão social é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const unitData = {
        organization_id: organization.id,
        nome_unidade: formData.nome_unidade,
        codigo_interno: formData.codigo_interno || null,
        razao_social: formData.razao_social,
        documento: formData.documento || null,
        endereco_logradouro: formData.endereco_logradouro || null,
        endereco_numero: formData.endereco_numero || null,
        endereco_bairro: formData.endereco_bairro || null,
        endereco_cidade: formData.endereco_cidade || null,
        endereco_uf: formData.endereco_uf || null,
        endereco_cep: formData.endereco_cep || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        is_matriz: formData.is_matriz
      };

      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(unitData)
          .eq('id', editingUnit);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Unidade atualizada com sucesso!"
        });
      } else {
        // Create unit
        const { data: newUnit, error: unitError } = await supabase
          .from('units')
          .insert(unitData)
          .select()
          .single();

        if (unitError) throw unitError;

        // Create unit_settings
        const { error: settingsError } = await supabase
          .from('unit_settings')
          .insert({
            unit_id: newUnit.id,
            organization_id: organization.id
          });

        if (settingsError) throw settingsError;

        toast({
          title: "Sucesso",
          description: "Unidade criada com sucesso!",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenSettings(newUnit.id)}
            >
              Configurar Agora
            </Button>
          )
        });
      }

      handleCloseDialog();
      refreshData();

    } catch (error: any) {
      console.error('Erro ao salvar unidade:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a unidade.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;

    if (unit.is_matriz) {
      toast({
        title: "Ação não permitida",
        description: "Não é possível excluir a unidade matriz.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a unidade "${unit.nome_unidade}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .update({ status: 'inativo' })
        .eq('id', unitId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Unidade desativada com sucesso."
      });

      refreshData();

    } catch (error: any) {
      console.error('Erro ao excluir unidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a unidade.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Unidades</h2>
          <p className="text-muted-foreground">
            Gerencie as unidades/filiais da organização {organization.nome_fantasia}
          </p>
        </div>
        {isOrgAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma unidade cadastrada</p>
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{unit.nome_unidade}</p>
                        {unit.codigo_interno && (
                          <p className="text-xs text-muted-foreground">{unit.codigo_interno}</p>
                        )}
                      </div>
                      {unit.is_matriz && (
                        <Badge variant="secondary">Matriz</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{unit.razao_social || '-'}</TableCell>
                  <TableCell>{unit.documento || '-'}</TableCell>
                  <TableCell>
                    {(unit as any).endereco_cidade && (unit as any).endereco_uf
                      ? `${(unit as any).endereco_cidade}/${(unit as any).endereco_uf}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={unit.status === 'ativo' ? 'default' : 'secondary'}>
                      {unit.status === 'ativo' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isOrgAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSettings(unit.id)}
                            title="Configurações"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(unit.id)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!unit.is_matriz && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(unit.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog for Add/Edit Unit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Identificação */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Identificação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_unidade">Nome da Unidade *</Label>
                  <Input
                    id="nome_unidade"
                    placeholder="Ex: Filial Centro"
                    value={formData.nome_unidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_unidade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="codigo_interno">Código Interno</Label>
                  <Input
                    id="codigo_interno"
                    placeholder="Ex: FIL01"
                    value={formData.codigo_interno}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_interno: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    placeholder="Nome legal da empresa"
                    value={formData.razao_social}
                    onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="documento">CNPJ</Label>
                  <Input
                    id="documento"
                    placeholder="00.000.000/0000-00"
                    value={formData.documento}
                    onChange={(e) => setFormData(prev => ({ ...prev, documento: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Endereço
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="endereco_logradouro">Logradouro</Label>
                  <Input
                    id="endereco_logradouro"
                    placeholder="Rua, Avenida..."
                    value={formData.endereco_logradouro}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_logradouro: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_numero">Número</Label>
                  <Input
                    id="endereco_numero"
                    placeholder="123"
                    value={formData.endereco_numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_numero: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="endereco_bairro">Bairro</Label>
                  <Input
                    id="endereco_bairro"
                    value={formData.endereco_bairro}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_bairro: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_cidade">Cidade</Label>
                  <Input
                    id="endereco_cidade"
                    value={formData.endereco_cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_cidade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endereco_uf">UF</Label>
                  <Input
                    id="endereco_uf"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.endereco_uf}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_uf: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="endereco_cep">CEP</Label>
                <Input
                  id="endereco_cep"
                  placeholder="00000-000"
                  value={formData.endereco_cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco_cep: e.target.value }))}
                  className="w-40"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Contato
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="unidade@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnitSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        unitId={settingsUnitId}
        organizationId={organization.id}
      />
    </div>
  );
}
