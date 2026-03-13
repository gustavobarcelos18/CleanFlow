import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, User, Mail, Phone, MapPin, FileText, RefreshCw } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  nome: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome muito longo" }),
  telefone: z.string().trim().min(10, { message: "Telefone inválido" }).max(20, { message: "Telefone muito longo" }).optional().or(z.literal("")),
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255, { message: "E-mail muito longo" }).optional().or(z.literal("")),
  cpf: z.string().trim().max(14, { message: "CPF muito longo" }).optional().or(z.literal("")),
  cidade: z.string().trim().max(100, { message: "Cidade muito longa" }).optional().or(z.literal("")),
  uf: z.string().trim().length(2, { message: "UF deve ter 2 caracteres" }).optional().or(z.literal(""))
});

const Perfil = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
    cidade: "",
    uf: "",
    conselho_profissional: "",
    numero_registro: "",
    uf_registro: ""
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || "",
        telefone: profile.telefone || "",
        email: profile.email || "",
        cpf: profile.cpf || "",
        cidade: profile.cidade || "",
        uf: profile.uf || "",
        conselho_profissional: profile.conselho_profissional || "",
        numero_registro: profile.numero_registro || "",
        uf_registro: profile.uf_registro || ""
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Deletar avatar anterior se existir
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload do novo avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar profile com nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);

      // Refresh profile in context
      await refreshProfile();

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate input
    const validation = profileSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          cpf: formData.cpf,
          cidade: formData.cidade,
          uf: formData.uf,
          conselho_profissional: formData.conselho_profissional,
          numero_registro: formData.numero_registro,
          uf_registro: formData.uf_registro
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile in context
      await refreshProfile();

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto">
        <div className="border-b border-muted/30 pb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>

        <div className="bg-muted/30 rounded-xl border border-muted/50 p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={profile?.nome} />
                ) : (
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                    {profile?.nome ? getInitials(profile.nome) : <User className="h-12 w-12" />}
                  </AvatarFallback>
                )}
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Foto de Perfil</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha uma foto para seu perfil (JPG, PNG ou WEBP, máx 2MB)
              </p>
              <label htmlFor="avatar-upload">
                <Button variant="outline" disabled={isUploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Enviando..." : "Alterar Foto"}
                  </span>
                </Button>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl border border-muted/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">
                  <FileText className="h-4 w-4 inline mr-2" />
                  CPF
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                  maxLength={2}
                  placeholder="SP"
                />
              </div>
            </div>

            {/* Professional Info (if applicable) */}
            {profile?.role === 'profissional' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Informações Profissionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="conselho">Conselho</Label>
                      <Input
                        id="conselho"
                        value={formData.conselho_profissional}
                        onChange={(e) => setFormData(prev => ({ ...prev, conselho_profissional: e.target.value }))}
                        placeholder="CRM, CRO, CRF..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registro">Número de Registro</Label>
                      <Input
                        id="registro"
                        value={formData.numero_registro}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_registro: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uf_registro">UF do Registro</Label>
                      <Input
                        id="uf_registro"
                        value={formData.uf_registro}
                        onChange={(e) => setFormData(prev => ({ ...prev, uf_registro: e.target.value.toUpperCase() }))}
                        maxLength={2}
                        placeholder="SP"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-muted/30 rounded-xl border border-muted/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Tour Guiado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Reative o tour guiado para qualquer página do sistema
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                if (!user) return;

                // Limpar todas as preferências de tour do usuário
                const { error } = await supabase
                  .from('user_tour_preferences')
                  .delete()
                  .eq('user_id', user.id);

                if (error) throw error;

                toast({
                  title: "Sucesso",
                  description: "Tours reativados! Você verá o tour guiado ao acessar as páginas novamente."
                });
              } catch (error) {
                console.error('Erro ao reativar tours:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível reativar os tours.",
                  variant: "destructive"
                });
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reativar Todos os Tours
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Perfil;
