import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InviteMember } from "@/components/settings/InviteMember";
import { PendingInvitationsList } from "@/components/settings/PendingInvitationsList";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "210 100% 45%";
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  h = Math.round(h * 360);
  return `${h} ${s}% ${l}%`;
}
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTenantData } from "@/hooks/useTenantData";
import {
  Settings,
  Palette,
  MessageSquare,
  Clock,
  Shield,
  Building,
  Stethoscope,
  Loader2,
  Plus,
  DollarSign,
  Save,
  Layers,
  CreditCard,
  Users
} from "lucide-react";
import FinanceiroConfig from "@/components/configuracoes/FinanceiroConfig";
import SegmentoConfig from "@/components/configuracoes/SegmentoConfig";
import PlanosConfig from "@/components/configuracoes/PlanosConfig";
import { TourControl } from "@/components/tour/TourControl";

interface Especialidade {
  id: string;
  nome: string;
}

const Configuracoes = () => {
  const { profile } = useAuth();
  const { tenantData, updateTenantData } = useTenantData();
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [isLoadingEspecialidades, setIsLoadingEspecialidades] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"por_profissional" | "por_clinica_sala">("por_profissional");
  const [clinicData, setClinicData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    timezone: "America/Sao_Paulo",
    primaryColor: "#016CA5",
    accentColor: "#25D366",
    fontSize: 16
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  // Sync local state with tenant data from context
  useEffect(() => {
    if (tenantData) {
      setClinicData(prev => ({
        ...prev,
        razaoSocial: tenantData.razao_social || tenantData.nome || "",
        nomeFantasia: tenantData.nome_fantasia || "",
        cnpj: tenantData.cnpj || "",
        fontSize: tenantData.font_size || 16,
        primaryColor: tenantData.cor_primaria || "#016CA5",
        accentColor: tenantData.cor_acao || "#25D366"
      }));
    }
  }, [tenantData]);

  // Apply font size and colors immediately for preview
  useEffect(() => {
    const root = document.documentElement;

    // Font Size
    if (clinicData.fontSize) {
      root.style.fontSize = `${clinicData.fontSize}px`;
    }

    // Colors
    if (clinicData.primaryColor) {
      const hsl = hexToHSL(clinicData.primaryColor);
      root.style.setProperty('--primary', hsl);
      // Also update ring and sidebar-primary to match
      root.style.setProperty('--ring', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
    }

    if (clinicData.accentColor) {
      const hsl = hexToHSL(clinicData.accentColor);
      root.style.setProperty('--accent', hsl);
    }

    // Cleanup/Revert is handled by useTenantData when component unmounts or tenantData changes
  }, [clinicData.fontSize, clinicData.primaryColor, clinicData.accentColor]);

  const handleSaveConfiguracoes = async () => {
    if (!profile?.tenant_id) return;

    if (!clinicData.razaoSocial.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A Razão Social é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          razao_social: clinicData.razaoSocial,
          nome_fantasia: clinicData.nomeFantasia || null,
          cnpj: clinicData.cnpj || null,
          nome: clinicData.razaoSocial, // Keep nome in sync with razao_social for backwards compatibility
          font_size: clinicData.fontSize,
          cor_primaria: clinicData.primaryColor,
          cor_acao: clinicData.accentColor
        })
        .eq('id', profile.tenant_id);

      if (error) throw error;

      // Update the global tenant context so sidebar updates immediately
      updateTenantData({
        razao_social: clinicData.razaoSocial,
        nome_fantasia: clinicData.nomeFantasia,
        cnpj: clinicData.cnpj,
        nome: clinicData.razaoSocial,
        font_size: clinicData.fontSize,
        cor_primaria: clinicData.primaryColor,
        cor_acao: clinicData.accentColor
      });

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      setIsLoadingEspecialidades(true);
      const { data, error } = await supabase
        .from('especialidades')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      // Adicionar "Outra Especialidade" no final
      const especialidadesComOutra = [
        ...(data || []),
        { id: 'outra', nome: 'Outra Especialidade' }
      ];

      setEspecialidades(especialidadesComOutra);
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEspecialidades(false);
    }
  };

  const toggleClinicType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações da Clínica</h1>
          <p className="text-muted-foreground">
            Personalize sua clínica e configure as funcionalidades do CleanFlow
          </p>
        </div>

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="w-full flex justify-start overflow-x-auto">
            <TabsTrigger value="geral">
              <Building className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="segmento">
              <Layers className="h-4 w-4 mr-2" />
              Segmento
            </TabsTrigger>
            <TabsTrigger value="identidade">
              <Palette className="h-4 w-4 mr-2" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="agenda">
              <Clock className="h-4 w-4 mr-2" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              <DollarSign className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="planos">
              <CreditCard className="h-4 w-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="mensagens">
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="lgpd">
              <Shield className="h-4 w-4 mr-2" />
              LGPD
            </TabsTrigger>
            <TabsTrigger value="equipe">
              <Users className="h-4 w-4 mr-2" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="ajuda">
              <HelpCircle className="h-4 w-4 mr-2" />
              Ajuda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ajuda" className="space-y-6">
            <TourControl />
          </TabsContent>

          <TabsContent value="equipe" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gestão de Equipe</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Convide novos membros para sua clínica e gerencie permissões.
              </p>
              <InviteMember />
              <PendingInvitationsList />
            </Card>
          </TabsContent>

          <TabsContent value="segmento" className="space-y-6">
            <SegmentoConfig />
          </TabsContent>

          <TabsContent value="geral" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="razao-social">Razão Social *</Label>
                  <Input
                    id="razao-social"
                    placeholder="Nome legal da empresa"
                    value={clinicData.razaoSocial}
                    onChange={(e) => setClinicData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Nome legal registrado</p>
                </div>
                <div>
                  <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome-fantasia"
                    placeholder="Nome comercial (opcional)"
                    value={clinicData.nomeFantasia}
                    onChange={(e) => setClinicData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Nome exibido no sistema</p>
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={clinicData.cnpj}
                    onChange={(e) => setClinicData(prev => ({ ...prev, cnpj: e.target.value }))}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Especialidades da Clínica</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione as especialidades oferecidas pela sua clínica
              </p>

              {isLoadingEspecialidades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : especialidades.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma especialidade cadastrada. Cadastre especialidades em Especialidades.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {especialidades.map((especialidade) => {
                    const isSelected = selectedTypes.includes(especialidade.id);
                    const isOutra = especialidade.id === 'outra';

                    return (
                      <button
                        key={especialidade.id}
                        onClick={() => toggleClinicType(especialidade.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected
                          ? "border-primary bg-primary-light text-primary"
                          : "border-border hover:border-primary/50"
                          } ${isOutra ? "border-dashed" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {isOutra ? (
                            <Plus className="h-5 w-5 flex-shrink-0" />
                          ) : (
                            <Stethoscope className="h-5 w-5 flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium line-clamp-2">{especialidade.nome}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Modo de Agendamento</h3>
              <div className="space-y-4">
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${scheduleMode === "por_profissional" ? "border-primary bg-primary-light" : "border-border"
                  }`} onClick={() => setScheduleMode("por_profissional")}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${scheduleMode === "por_profissional" ? "border-primary bg-primary" : "border-border"
                      }`} />
                    <div>
                      <h4 className="font-medium">Por Profissional</h4>
                      <p className="text-sm text-muted-foreground">
                        Cada médico/dentista tem sua própria agenda
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${scheduleMode === "por_clinica_sala" ? "border-primary bg-primary-light" : "border-border"
                  }`} onClick={() => setScheduleMode("por_clinica_sala")}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${scheduleMode === "por_clinica_sala" ? "border-primary bg-primary" : "border-border"
                      }`} />
                    <div>
                      <h4 className="font-medium">Por Clínica/Sala</h4>
                      <p className="text-sm text-muted-foreground">
                        Agenda por sala/consultório, profissional alocado depois
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Políticas de Agendamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="antecedencia">Antecedência Mínima (horas)</Label>
                  <Input id="antecedencia" type="number" defaultValue="12" />
                </div>
                <div>
                  <Label htmlFor="janela">Janela de Agendamento (dias)</Label>
                  <Input id="janela" type="number" defaultValue="21" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="overbooking" />
                  <Label htmlFor="overbooking">Permitir Overbooking</Label>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="mensagens" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Canais de Mensagem</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">WhatsApp (Deep Link)</h4>
                    <p className="text-sm text-muted-foreground">Gratuito - abre conversa no WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">CallMeBot (WhatsApp automático)</h4>
                    <p className="text-sm text-muted-foreground">Gratuito - envio automático</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">E-mail</h4>
                    <p className="text-sm text-muted-foreground">Configurável por provedor</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS</h4>
                    <p className="text-sm text-muted-foreground">Desabilitado por padrão</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Templates de Mensagem</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-d2">Confirmação D-2 (WhatsApp)</Label>
                  <Textarea
                    id="template-d2"
                    defaultValue="Olá {{paciente}}, sua consulta é {{data}} às {{hora}} com {{profissional}} na {{clinica}}. Confirmar: {{link_confirmar}} • Reagendar: {{link_reagendar}}"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="template-h3">Lembrete H-3h (WhatsApp)</Label>
                  <Textarea
                    id="template-h3"
                    defaultValue="Lembrete: hoje às {{hora}} com {{profissional}}. Confirmar: {{link_confirmar}} • Reagendar: {{link_reagendar}}"
                    rows={3}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <FinanceiroConfig />
          </TabsContent>

          <TabsContent value="planos" className="space-y-6">
            <PlanosConfig />
          </TabsContent>

          <TabsContent value="identidade" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Aparência e Cores</h3>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="font-size" className="text-base">Tamanho da Fonte</Label>
                      <p className="text-sm text-muted-foreground">
                        Ajuste o tamanho da fonte do sistema para melhor legibilidade.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {clinicData.fontSize}px
                    </Badge>
                  </div>
                  <Slider
                    id="font-size"
                    min={12}
                    max={20}
                    step={1}
                    value={[clinicData.fontSize]}
                    onValueChange={(value) => setClinicData(prev => ({ ...prev, fontSize: value[0] }))}
                    className="w-full max-w-xl"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground max-w-xl mt-2">
                    <span>Pequeno (12px)</span>
                    <span>Padrão (16px)</span>
                    <span>Grande (20px)</span>
                  </div>

                  {/* Preview Section */}
                  <div className="mt-8 p-6 border rounded-lg bg-background/50">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Visualização</h4>
                    <div className="space-y-4">
                      <div>
                        <h1 className="text-2xl font-bold">Título Principal (H1)</h1>
                        <p className="text-sm text-muted-foreground">Exemplo de título de página</p>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Subtítulo (H2)</h2>
                        <p className="text-base">
                          Este é um exemplo de texto padrão do corpo. O tamanho da fonte ajustado afetará a legibilidade de todo o conteúdo.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Badge</Badge>
                        <Button size="sm">Botão Pequeno</Button>
                        <p className="text-sm text-muted-foreground">Texto pequeno e legendas</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <Label htmlFor="primary-color">Cor Primária</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primary-color"
                        type="color"
                        value={clinicData.primaryColor}
                        onChange={(e) => setClinicData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={clinicData.primaryColor}
                        onChange={(e) => setClinicData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accent-color">Cor de Ação</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="accent-color"
                        type="color"
                        value={clinicData.accentColor}
                        onChange={(e) => setClinicData(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={clinicData.accentColor}
                        onChange={(e) => setClinicData(prev => ({ ...prev, accentColor: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="lgpd" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configurações LGPD</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Consentimento Obrigatório</h4>
                    <p className="text-sm text-muted-foreground">Exigir aceite antes do agendamento</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Logs de Auditoria</h4>
                    <p className="text-sm text-muted-foreground">Registrar todas as ações</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Minimização de Dados</h4>
                    <p className="text-sm text-muted-foreground">Coletar apenas dados essenciais</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3">
          <Button size="lg" onClick={handleSaveConfiguracoes} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
          <Button variant="outline" size="lg">
            Cancelar
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Configuracoes;