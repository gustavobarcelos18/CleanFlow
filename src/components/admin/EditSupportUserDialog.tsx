import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditSupportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

interface SupportUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  status: string;
  funcoes: string[];
  foto_url?: string;
}

interface TenantBinding {
  id: string;
  tenant_id: string;
  papeis_no_tenant: string[];
  tenant?: {
    nome: string;
  };
}

const roleOptions = [
  { value: "leitura", label: "Leitura" },
  { value: "agente", label: "Agente" },
  { value: "financeiro", label: "Financeiro" },
  { value: "admin", label: "Admin" },
  { value: "master", label: "Master" }
];

export function EditSupportUserDialog({ open, onOpenChange, userId, onSuccess }: EditSupportUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [user, setUser] = useState<SupportUser | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [tenantBindings, setTenantBindings] = useState<TenantBinding[]>([]);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);

  useEffect(() => {
    if (open && userId) {
      loadUser();
      loadTenantBindings();
      loadAvailableTenants();
    }
  }, [open, userId]);

  const loadUser = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios_suporte")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUser(data);
      if (data.foto_url) {
        setPhotoPreview(data.foto_url);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Erro ao carregar usuário");
    }
  };

  const loadTenantBindings = async () => {
    try {
      const { data, error } = await supabase
        .from("vinculo_usuario_tenant")
        .select(`
          *,
          tenant:tenants(nome)
        `)
        .eq("usuario_id", userId);

      if (error) throw error;
      setTenantBindings(data || []);
    } catch (error) {
      console.error("Error loading tenant bindings:", error);
    }
  };

  const loadAvailableTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, nome, status")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      setAvailableTenants(data || []);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 2MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !user) return;

    setUploadingPhoto(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("usuarios_suporte")
        .update({ foto_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setUser({ ...user, foto_url: publicUrl });
      toast.success("Foto atualizada com sucesso");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(user?.foto_url || null);
  };

  const handleRoleToggle = (role: string) => {
    if (!user) return;
    setUser({
      ...user,
      funcoes: user.funcoes.includes(role)
        ? user.funcoes.filter(r => r !== role)
        : [...user.funcoes, role]
    });
  };

  const handleAddTenantBinding = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from("vinculo_usuario_tenant")
        .insert({
          usuario_id: userId,
          tenant_id: tenantId,
          papeis_no_tenant: ['leitura']
        });

      if (error) throw error;
      toast.success("Tenant vinculado com sucesso");
      loadTenantBindings();
    } catch (error) {
      console.error("Error adding tenant binding:", error);
      toast.error("Erro ao vincular tenant");
    }
  };

  const handleRemoveTenantBinding = async (bindingId: string) => {
    try {
      const { error } = await supabase
        .from("vinculo_usuario_tenant")
        .delete()
        .eq("id", bindingId);

      if (error) throw error;
      toast.success("Vínculo removido com sucesso");
      loadTenantBindings();
    } catch (error) {
      console.error("Error removing tenant binding:", error);
      toast.error("Erro ao remover vínculo");
    }
  };

  const handleUpdateTenantRoles = async (bindingId: string, roles: string[]) => {
    try {
      const { error } = await supabase
        .from("vinculo_usuario_tenant")
        .update({ papeis_no_tenant: roles as any })
        .eq("id", bindingId);

      if (error) throw error;
      toast.success("Papéis atualizados com sucesso");
      loadTenantBindings();
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Erro ao atualizar papéis");
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (user.funcoes.length === 0) {
      toast.error("Selecione pelo menos uma função");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("usuarios_suporte")
        .update({
          nome: user.nome,
          telefone: user.telefone,
          status: user.status as any,
          funcoes: user.funcoes as any
        })
        .eq("id", userId);

      if (error) throw error;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("support_actions_log").insert({
          support_user_id: currentUser.id,
          action_type: "usuario_editado",
          target_type: "usuarios_suporte",
          target_id: userId,
          description: `Usuário de suporte atualizado: ${user.nome}`,
        });
      }

      toast.success("Usuário atualizado com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const unboundTenants = availableTenants.filter(
    t => !tenantBindings.some(b => b.tenant_id === t.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário de Suporte</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="photo">Foto de Perfil</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={user.nome}
                onChange={(e) => setUser({ ...user, nome: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={user.telefone || ""}
                onChange={(e) => setUser({ ...user, telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Funções *</Label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={user.funcoes.includes(role.value)}
                      onCheckedChange={() => handleRoleToggle(role.value)}
                    />
                    <label
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={user.status === 'ativo'}
                onCheckedChange={(checked) => 
                  setUser({ ...user, status: checked ? 'ativo' : 'suspenso' })
                }
              />
              <Label htmlFor="status">Ativo</Label>
            </div>
          </TabsContent>

          <TabsContent value="photo" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={photoPreview || user.foto_url} />
                <AvatarFallback className="text-3xl">
                  {user.nome.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploadingPhoto}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher Foto
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoFile && (
                  <>
                    <Button
                      type="button"
                      onClick={handleUploadPhoto}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Foto
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <div>
              <Label>Adicionar Tenant</Label>
              <select
                className="w-full p-2 border rounded-md"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddTenantBinding(e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Selecione um tenant</option>
                {unboundTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>Tenants Vinculados</Label>
              {tenantBindings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum tenant vinculado
                </p>
              ) : (
                tenantBindings.map((binding) => (
                  <div key={binding.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{binding.tenant?.nome}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTenantBinding(binding.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((role) => (
                        <div key={role.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tenant-${binding.id}-${role.value}`}
                            checked={binding.papeis_no_tenant.includes(role.value)}
                            onCheckedChange={(checked) => {
                              const newRoles = checked
                                ? [...binding.papeis_no_tenant, role.value]
                                : binding.papeis_no_tenant.filter(r => r !== role.value);
                              handleUpdateTenantRoles(binding.id, newRoles);
                            }}
                          />
                          <label
                            htmlFor={`tenant-${binding.id}-${role.value}`}
                            className="text-sm"
                          >
                            {role.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}