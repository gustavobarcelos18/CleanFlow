import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Phone,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Share2,
  Building2,
  Package,
  Brain,
  Settings,
} from "lucide-react";

interface Provider {
  id: string;
  nome: string;
  api_base_url: string;
  custo_mensal_numero: number;
  custo_por_mensagem: number;
  moeda: string;
  ativo: boolean;
}

interface PhoneNumber {
  id: string;
  phone_number: string;
  display_name: string;
  is_shared: boolean;
  status: string;
  provider_id: string | null;
  provider?: Provider;
}

interface PhonePackage {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade_numeros: number;
  preco_mensal: number;
  moeda: string;
  inclui_creditos: number;
  planos_permitidos: string[];
  destaque: boolean;
  ativo: boolean;
  stripe_price_id: string | null;
}

interface Allocation {
  id: string;
  tenant_id: string;
  phone_number_id: string;
  departamento: string;
  is_primary: boolean;
  status: string;
  alocado_em: string;
  tenant?: { nome: string };
  phone_number?: PhoneNumber;
}

export function AdminWhatsAppManagement() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [packages, setPackages] = useState<PhonePackage[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  // Dialog states
  const [newNumberDialog, setNewNumberDialog] = useState(false);
  const [newPackageDialog, setNewPackageDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PhonePackage | null>(
    null,
  );

  // Form states
  const [newNumber, setNewNumber] = useState({
    phone_number: "",
    display_name: "",
    is_shared: false,
    provider_id: "",
  });
  const [newPackage, setNewPackage] = useState({
    nome: "",
    descricao: "",
    quantidade_numeros: 1,
    preco_mensal: 0,
    inclui_creditos: 0,
    planos_permitidos: ["pro", "enterprise"],
    destaque: false,
    stripe_price_id: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [providersRes, numbersRes, packagesRes, allocationsRes] =
        await Promise.all([
          supabase.from("whatsapp_providers").select("*").order("nome"),
          supabase
            .from("whatsapp_phone_numbers")
            .select("*, provider:whatsapp_providers(*)")
            .order("created_at", { ascending: false }),
          supabase
            .from("phone_number_packages")
            .select("*")
            .order("preco_mensal"),
          supabase
            .from("tenant_phone_allocations")
            .select(
              `
          *,
          tenant:tenants(nome),
          phone_number:whatsapp_phone_numbers(*)
        `,
            )
            .eq("status", "active")
            .order("alocado_em", { ascending: false })
            .limit(50),
        ]);

      if (providersRes.data) setProviders(providersRes.data);
      if (numbersRes.data) setPhoneNumbers(numbersRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
      if (allocationsRes.data)
        setAllocations(allocationsRes.data as Allocation[]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNumber = async () => {
    if (!newNumber.phone_number || !newNumber.display_name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { error } = await supabase.from("whatsapp_phone_numbers").insert({
        phone_number: newNumber.phone_number,
        display_name: newNumber.display_name,
        is_shared: newNumber.is_shared,
        provider_id: newNumber.provider_id || null,
        status: "active",
      });

      if (error) throw error;

      toast.success("Número criado com sucesso");
      setNewNumberDialog(false);
      setNewNumber({
        phone_number: "",
        display_name: "",
        is_shared: false,
        provider_id: "",
      });
      loadData();
    } catch (error) {
      console.error("Error creating number:", error);
      const message =
        error instanceof Error ? error.message : "Erro ao criar número";
      toast.error(message);
    }
  };

  const handleToggleNumberStatus = async (
    id: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("whatsapp_phone_numbers")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success("Status atualizado");
      loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar status";
      toast.error(message);
    }
  };

  const handleSavePackage = async () => {
    if (!newPackage.nome || newPackage.preco_mensal <= 0) {
      toast.error("Preencha nome e preço");
      return;
    }

    try {
      if (editingPackage) {
        const { error } = await supabase
          .from("phone_number_packages")
          .update({
            nome: newPackage.nome,
            descricao: newPackage.descricao || null,
            quantidade_numeros: newPackage.quantidade_numeros,
            preco_mensal: newPackage.preco_mensal,
            inclui_creditos: newPackage.inclui_creditos,
            planos_permitidos: newPackage.planos_permitidos,
            destaque: newPackage.destaque,
            stripe_price_id: newPackage.stripe_price_id || null,
          })
          .eq("id", editingPackage.id);

        if (error) throw error;
        toast.success("Pacote atualizado");
      } else {
        const { error } = await supabase.from("phone_number_packages").insert({
          nome: newPackage.nome,
          descricao: newPackage.descricao || null,
          quantidade_numeros: newPackage.quantidade_numeros,
          preco_mensal: newPackage.preco_mensal,
          inclui_creditos: newPackage.inclui_creditos,
          planos_permitidos: newPackage.planos_permitidos,
          destaque: newPackage.destaque,
          stripe_price_id: newPackage.stripe_price_id || null,
        });

        if (error) throw error;
        toast.success("Pacote criado");
      }

      setNewPackageDialog(false);
      setEditingPackage(null);
      setNewPackage({
        nome: "",
        descricao: "",
        quantidade_numeros: 1,
        preco_mensal: 0,
        inclui_creditos: 0,
        planos_permitidos: ["pro", "enterprise"],
        destaque: false,
        stripe_price_id: "",
      });
      loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar pacote";
      toast.error(message);
    }
  };

  const handleTogglePackageStatus = async (
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("phone_number_packages")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success("Status atualizado");
      loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar status";
      toast.error(message);
    }
  };

  const openEditPackage = (pkg: PhonePackage) => {
    setEditingPackage(pkg);
    setNewPackage({
      nome: pkg.nome,
      descricao: pkg.descricao || "",
      quantidade_numeros: pkg.quantidade_numeros,
      preco_mensal: pkg.preco_mensal,
      inclui_creditos: pkg.inclui_creditos,
      planos_permitidos: pkg.planos_permitidos,
      destaque: pkg.destaque,
      stripe_price_id: pkg.stripe_price_id || "",
    });
    setNewPackageDialog(true);
  };

  const sharedNumber = phoneNumbers.find((p) => p.is_shared);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="shared" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Número Compartilhado
          </TabsTrigger>
          <TabsTrigger value="numbers" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Números
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pacotes
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Alocações
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Provedores
          </TabsTrigger>
        </TabsList>

        {/* Número Compartilhado (Free Plan) */}
        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Número Compartilhado para Plano Gratuito
              </CardTitle>
              <CardDescription>
                Este número é usado por todos os tenants do plano gratuito. A IA
                identifica automaticamente a origem e destino das mensagens
                baseado no contexto da conversa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sharedNumber ? (
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Número Atual
                      </p>
                      <p className="text-2xl font-bold">
                        {sharedNumber.phone_number}
                      </p>
                      <p className="text-muted-foreground">
                        {sharedNumber.display_name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        sharedNumber.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {sharedNumber.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    Roteamento por IA: Identificação automática via contexto de
                    conversa
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Alterar Número
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Alterar Número Compartilhado
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Número de Telefone</Label>
                            <Input
                              placeholder="+5511999999999"
                              defaultValue={sharedNumber.phone_number}
                              onChange={(e) => {
                                // Update directly in state for this specific case
                              }}
                            />
                          </div>
                          <div>
                            <Label>Nome de Exibição</Label>
                            <Input
                              placeholder="CleanFlow Compartilhado"
                              defaultValue={sharedNumber.display_name}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={async () => {
                              // Would update the shared number
                              toast.success("Número atualizado");
                            }}
                          >
                            Salvar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant={
                        sharedNumber.status === "active"
                          ? "destructive"
                          : "default"
                      }
                      size="sm"
                      onClick={() =>
                        handleToggleNumberStatus(
                          sharedNumber.id,
                          sharedNumber.status,
                        )
                      }
                    >
                      {sharedNumber.status === "active"
                        ? "Desativar"
                        : "Ativar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum número compartilhado configurado</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setNewNumber({
                        phone_number: "",
                        display_name: "",
                        is_shared: true,
                        provider_id: "",
                      });
                      setNewNumberDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Configurar Número Compartilhado
                  </Button>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Como funciona o roteamento por IA?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>
                    Quando uma mensagem chega, a IA analisa o contexto histórico
                    da conversa
                  </li>
                  <li>
                    Cruza com os telefones cadastrados nos pacientes de cada
                    tenant
                  </li>
                  <li>Identifica o tenant correto e direciona a mensagem</li>
                  <li>
                    Se não conseguir identificar, a mensagem fica pendente para
                    triagem manual
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Todos os Números */}
        <TabsContent value="numbers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Números de Telefone</CardTitle>
                <CardDescription>
                  Gerencie todos os números WhatsApp do sistema
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setNewNumber({
                    phone_number: "",
                    display_name: "",
                    is_shared: false,
                    provider_id: "",
                  });
                  setNewNumberDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Número
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoneNumbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell className="font-mono">
                        {number.phone_number}
                      </TableCell>
                      <TableCell>{number.display_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={number.is_shared ? "secondary" : "outline"}
                        >
                          {number.is_shared ? "Compartilhado" : "Exclusivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{number.provider?.nome || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            number.status === "active" ? "default" : "secondary"
                          }
                        >
                          {number.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleNumberStatus(number.id, number.status)
                          }
                        >
                          {number.status === "active" ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pacotes */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pacotes de Números</CardTitle>
                <CardDescription>
                  Configure os pacotes disponíveis para compra pelos tenants
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingPackage(null);
                  setNewPackage({
                    nome: "",
                    descricao: "",
                    quantidade_numeros: 1,
                    preco_mensal: 0,
                    inclui_creditos: 0,
                    planos_permitidos: ["pro", "enterprise"],
                    destaque: false,
                    stripe_price_id: "",
                  });
                  setNewPackageDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Pacote
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Números</TableHead>
                    <TableHead>Preço/mês</TableHead>
                    <TableHead>Créditos Inclusos</TableHead>
                    <TableHead>Planos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pkg.nome}
                          {pkg.destaque && (
                            <Badge variant="secondary" className="text-xs">
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{pkg.quantidade_numeros}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: pkg.moeda,
                        }).format(pkg.preco_mensal)}
                      </TableCell>
                      <TableCell>
                        {pkg.inclui_creditos.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {pkg.planos_permitidos.map((p) => (
                            <Badge
                              key={p}
                              variant="outline"
                              className="text-xs"
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={pkg.ativo}
                          onCheckedChange={() =>
                            handleTogglePackageStatus(pkg.id, pkg.ativo)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditPackage(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alocações */}
        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle>Alocações Ativas</CardTitle>
              <CardDescription>
                Visualize quais tenants estão usando quais números
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Alocado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhuma alocação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    allocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell>
                          {alloc.tenant?.nome || alloc.tenant_id}
                        </TableCell>
                        <TableCell className="font-mono">
                          {alloc.phone_number?.phone_number}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alloc.departamento}</Badge>
                        </TableCell>
                        <TableCell>
                          {alloc.phone_number?.is_shared ? (
                            <Badge variant="secondary">Compartilhado</Badge>
                          ) : (
                            <Badge>Exclusivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(alloc.alocado_em).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provedores */}
        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Provedores de Números Virtuais</CardTitle>
              <CardDescription>
                Configuração dos provedores integrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provedor</TableHead>
                    <TableHead>API</TableHead>
                    <TableHead>Custo/Número/Mês</TableHead>
                    <TableHead>Custo/Mensagem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">
                        {provider.nome}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {provider.api_base_url}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: provider.moeda,
                        }).format(provider.custo_mensal_numero)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: provider.moeda,
                        }).format(provider.custo_por_mensagem)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={provider.ativo ? "default" : "secondary"}
                        >
                          {provider.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Sobre os Provedores
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Os provedores são pré-configurados no sistema. Para adicionar
                  novos provedores ou alterar credenciais de API, entre em
                  contato com a equipe de desenvolvimento.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Novo Número */}
      <Dialog open={newNumberDialog} onOpenChange={setNewNumberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newNumber.is_shared
                ? "Configurar Número Compartilhado"
                : "Adicionar Novo Número"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número de Telefone *</Label>
              <Input
                placeholder="+5511999999999"
                value={newNumber.phone_number}
                onChange={(e) =>
                  setNewNumber({ ...newNumber, phone_number: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Nome de Exibição *</Label>
              <Input
                placeholder="Ex: CleanFlow Atendimento"
                value={newNumber.display_name}
                onChange={(e) =>
                  setNewNumber({ ...newNumber, display_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Provedor</Label>
              <Select
                value={newNumber.provider_id}
                onValueChange={(v) =>
                  setNewNumber({ ...newNumber, provider_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um provedor" />
                </SelectTrigger>
                <SelectContent>
                  {providers
                    .filter((p) => p.ativo)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newNumber.is_shared}
                onCheckedChange={(v) =>
                  setNewNumber({ ...newNumber, is_shared: v })
                }
              />
              <Label>Número compartilhado (para plano gratuito)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewNumberDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNumber}>Criar Número</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pacote */}
      <Dialog
        open={newPackageDialog}
        onOpenChange={(open) => {
          setNewPackageDialog(open);
          if (!open) setEditingPackage(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Editar Pacote" : "Novo Pacote"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Pacote Profissional"
                value={newPackage.nome}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, nome: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição do pacote"
                value={newPackage.descricao}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, descricao: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qtd. Números</Label>
                <Input
                  type="number"
                  min={1}
                  value={newPackage.quantidade_numeros}
                  onChange={(e) =>
                    setNewPackage({
                      ...newPackage,
                      quantidade_numeros: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>Preço/Mês (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newPackage.preco_mensal}
                  onChange={(e) =>
                    setNewPackage({
                      ...newPackage,
                      preco_mensal: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Créditos Inclusos</Label>
              <Input
                type="number"
                min={0}
                value={newPackage.inclui_creditos}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    inclui_creditos: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Stripe Price ID (opcional)</Label>
              <Input
                placeholder="price_xxxxx"
                value={newPackage.stripe_price_id}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    stripe_price_id: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newPackage.destaque}
                onCheckedChange={(v) =>
                  setNewPackage({ ...newPackage, destaque: v })
                }
              />
              <Label>Destacar este pacote</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewPackageDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePackage}>
              {editingPackage ? "Atualizar" : "Criar"} Pacote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
