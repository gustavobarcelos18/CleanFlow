import React, { useState } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  MessageCircle,
  Video,
  HelpCircle,
  FileText,
  Zap,
  Mail,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SupportIndex = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "duvida"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.tenant_id) {
      toast.error("Você precisa estar logado para enviar uma mensagem.");
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          tenant_id: profile.tenant_id,
          user_id: user.id,
          title: formData.subject,
          description: formData.message,
          category: formData.category,
          status: 'open',
          origem: 'portal_suporte'
        });

      if (error) throw error;

      setTicketSent(true);
      toast.success("Mensagem enviada com sucesso! Nossa equipe entrará em contato.");
      setFormData({ subject: "", message: "", category: "duvida" });
    } catch (error) {
      console.error("Erro ao enviar ticket:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Conditional Header: If logged in, show simple back button, else LandingHeader */}
      {user ? (
        <header className="border-b bg-card py-4 px-6 sticky top-0 z-50">
          <div className="container mx-auto max-w-6xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-xl font-bold">Central de Suporte</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Logado como {profile?.nome || user.email}
              </span>
            </div>
          </div>
        </header>
      ) : (
        <LandingHeader />
      )}

      <main className={user ? "pb-16" : "pt-24 pb-16"}>
        {/* Hero Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-primary/10 via-background to-success/10">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Como podemos ajudar você hoje?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Encontre respostas rápidas ou entre em contato com nosso time.
            </p>

            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Busque por dúvidas, tutoriais ou guias..."
                className="pl-10 h-12 text-lg bg-background shadow-sm"
              />
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto mb-8 gap-2">
              <TabsTrigger value="faq" className="py-3">Perguntas Frequentes</TabsTrigger>
              <TabsTrigger value="guides" className="py-3">Guias e Tutoriais</TabsTrigger>
              <TabsTrigger value="troubleshooting" className="py-3">Solução de Problemas</TabsTrigger>
              <TabsTrigger value="contact" className="py-3">Fale Conosco</TabsTrigger>
            </TabsList>

            {/* FAQ Content */}
            <TabsContent value="faq" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Primeiros Passos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Como configuro minha clínica?</AccordionTrigger>
                        <AccordionContent>
                          Para configurar sua clínica, acesse o menu "Configurações" e preencha os dados básicos, como nome, endereço e logotipo. Em seguida, configure os horários de funcionamento e as unidades de atendimento.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Como adicionar profissionais?</AccordionTrigger>
                        <AccordionContent>
                          Vá até a seção "Equipe" nas configurações ou no menu lateral. Clique em "Convidar Membro", insira o e-mail do profissional e defina seu nível de acesso (Profissional, Recepcionista, etc.).
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>O sistema funciona no celular?</AccordionTrigger>
                        <AccordionContent>
                          Sim! O CleanFlow é totalmente responsivo e pode ser acessado através do navegador do seu smartphone ou tablet, sem necessidade de instalação.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Agendamento e Pacientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-4">
                        <AccordionTrigger>Como agendar uma consulta?</AccordionTrigger>
                        <AccordionContent>
                          Na tela "Agenda", clique no horário desejado. Uma janela se abrirá para você selecionar o paciente (ou cadastrar um novo), o tipo de procedimento e o profissional responsável.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger>Como enviar lembretes automáticos?</AccordionTrigger>
                        <AccordionContent>
                          Os lembretes são configurados automaticamente. Você pode personalizar as mensagens e o tempo de envio (ex: 24h antes) no menu "Configurações &gt; WhatsApp/Notificações".
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-6">
                        <AccordionTrigger>Posso importar minha lista de pacientes?</AccordionTrigger>
                        <AccordionContent>
                          Sim, oferecemos uma ferramenta de importação via planilha Excel/CSV. Entre em contato com nosso suporte para auxílio neste processo.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Financeiro e Planos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-7">
                        <AccordionTrigger>Quais são as formas de pagamento aceitas?</AccordionTrigger>
                        <AccordionContent>
                          Aceitamos cartões de crédito (Visa, Mastercard, Elo), boleto bancário e PIX. O faturamento é realizado mensalmente.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-8">
                        <AccordionTrigger>Como funciona o comissionamento?</AccordionTrigger>
                        <AccordionContent>
                          Você pode definir regras de comissão por profissional ou por procedimento. O sistema calcula automaticamente os valores a serem repassados com base nos atendimentos realizados e pagos.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-9">
                        <AccordionTrigger>Posso cancelar a qualquer momento?</AccordionTrigger>
                        <AccordionContent>
                          Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento através do painel financeiro, sem multas.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Segurança e Privacidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-10">
                        <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                        <AccordionContent>
                          Absolutamente. Utilizamos criptografia de ponta a ponta e servidores seguros (AWS/Supabase) com backups diários automáticos para garantir a integridade dos seus dados.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-11">
                        <AccordionTrigger>O sistema está adequado à LGPD?</AccordionTrigger>
                        <AccordionContent>
                          Sim, o CleanFlow foi desenvolvido seguindo todas as diretrizes da Lei Geral de Proteção de Dados (LGPD), garantindo a privacidade e os direitos dos seus pacientes.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Guides Content */}
            <TabsContent value="guides" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Video className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Tour pelo Sistema</CardTitle>
                    <CardDescription>Uma visão geral de 5 minutos sobre as principais funcionalidades.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Assistir Vídeo</Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <FileText className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Manual do Administrador</CardTitle>
                    <CardDescription>Guia completo para gestores de clínicas e consultórios.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Ler Guia</Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Zap className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Configuração de Agenda</CardTitle>
                    <CardDescription>Aprenda a configurar horários, bloqueios e exceções.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Ver Tutorial</Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted p-6 rounded-lg mt-8">
                <h3 className="text-xl font-bold mb-4">Artigos Populares</h3>
                <ul className="space-y-3">
                  {/* Links corrigidos para apontar para a própria página de FAQ por enquanto, ou removidos se não existirem */}
                  <li><Button variant="link" className="p-0 h-auto text-primary hover:underline flex items-center gap-2" onClick={() => document.querySelector('[value="faq"]')?.dispatchEvent(new MouseEvent('click'))}><FileText className="h-4 w-4" /> Como emitir notas fiscais automaticamente</Button></li>
                  <li><Button variant="link" className="p-0 h-auto text-primary hover:underline flex items-center gap-2" onClick={() => document.querySelector('[value="faq"]')?.dispatchEvent(new MouseEvent('click'))}><FileText className="h-4 w-4" /> Configurando o prontuário eletrônico personalizado</Button></li>
                  <li><Button variant="link" className="p-0 h-auto text-primary hover:underline flex items-center gap-2" onClick={() => document.querySelector('[value="faq"]')?.dispatchEvent(new MouseEvent('click'))}><FileText className="h-4 w-4" /> Integração com WhatsApp Business</Button></li>
                </ul>
              </div>
            </TabsContent>

            {/* Troubleshooting Content */}
            <TabsContent value="troubleshooting" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Problemas Comuns</CardTitle>
                  <CardDescription>Soluções rápidas para situações do dia a dia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Não consigo fazer login</h4>
                    <p className="text-muted-foreground text-sm">Verifique se o Caps Lock está ativado. Se esqueceu a senha, utilize a opção "Esqueci minha senha" na tela de login para receber um link de redefinição por e-mail.</p>
                  </div>
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">A agenda não está carregando</h4>
                    <p className="text-muted-foreground text-sm">Tente limpar o cache do seu navegador (Ctrl+F5). Verifique também sua conexão com a internet. Se o problema persistir, entre em contato com o suporte.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Erro ao gerar relatório</h4>
                    <p className="text-muted-foreground text-sm">Certifique-se de que o período selecionado possui dados. Relatórios muito extensos podem levar alguns segundos para serem processados.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Content */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">Estamos aqui para ajudar</h3>
                  <p className="text-muted-foreground">
                    Nossa equipe especializada está disponível para resolver qualquer dúvida ou problema técnico que você possa ter.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">E-mail</p>
                        <a href="mailto:suporte@cleanflow.com.br" className="text-muted-foreground hover:text-primary">suporte@cleanflow.com.br</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <MessageCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Chat Online</p>
                        <p className="text-muted-foreground">Em breve disponível para atendimento em tempo real</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Horário de Atendimento</p>
                        <p className="text-muted-foreground">Segunda a Sexta, das 08:00 às 18:00</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Envie uma mensagem</CardTitle>
                    <CardDescription>
                      {user ? "Abra um chamado de suporte diretamente por aqui." : "Faça login para abrir um chamado de suporte."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ticketSent ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Mensagem Enviada!</h3>
                        <p className="text-muted-foreground mb-4">
                          Recebemos sua solicitação e responderemos em breve.
                        </p>
                        <Button onClick={() => setTicketSent(false)} variant="outline">
                          Enviar outra mensagem
                        </Button>
                      </div>
                    ) : (
                      <form className="space-y-4" onSubmit={handleSubmit}>
                        {!user && (
                          <div className="p-4 bg-muted rounded-md text-sm text-center mb-4">
                            Você precisa estar logado para enviar mensagens.
                            <br />
                            <Link to="/login" className="text-primary font-bold hover:underline">Fazer Login</Link>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Assunto</Label>
                          <Input
                            placeholder="Resumo do problema"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            disabled={!user || isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            disabled={!user || isSubmitting}
                          >
                            <option value="duvida">Dúvida Geral</option>
                            <option value="tecnico">Problema Técnico</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="sugestao">Sugestão</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Mensagem</Label>
                          <Textarea
                            className="min-h-[120px]"
                            placeholder="Descreva detalhadamente sua dúvida ou problema..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            disabled={!user || isSubmitting}
                          />
                        </div>

                        <Button className="w-full" disabled={!user || isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            "Enviar Mensagem"
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {!user && <LandingFooter />}
    </div>
  );
};

export default SupportIndex;
