import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Send,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  lastContact?: string;
  notes?: string;
}

interface Message {
  id: string;
  contactId: string;
  text: string;
  template: string;
  channel: "whatsapp" | "email";
  sentAt: string;
  sentBy: string;
  status: "sent" | "error";
}

const TEMPLATES = {
  "confirmation-d2": {
    name: "Confirmação D-2",
    text: "Olá {{nome}} 👋. Sua {{servico}} é {{data}} às {{hora}}. Confirmar: {{link_confirmar}} • Reagendar: {{link_reagendar}}",
  },
  "reminder-h3": {
    name: "Lembrete H-3h",
    text: "Lembrete: hoje às {{hora}}, {{servico}}. Confirmar: {{link_confirmar}} • Reagendar: {{link_reagendar}}",
  },
  "slot-available": {
    name: "Vaga liberada",
    text: "Vaga liberada hoje às {{hora}}. Pegar agora: {{link_agendar}} (ordem de chegada)",
  },
  budget: {
    name: "Orçamento",
    text: "Olá {{nome}}! Posso te enviar um orçamento para {{servico}}? Agende aqui: {{link_agendar}}",
  },
};

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Maria Silva",
    phone: "+55 11 99999-8888",
    tags: ["Novo lead"],
    lastContact: "2025-01-15T10:30:00",
    notes: "Prefere terças de manhã",
  },
  {
    id: "2",
    name: "João Santos",
    phone: "+55 11 98888-7777",
    tags: ["Retorno", "Confirmação pendente"],
    lastContact: "2025-01-14T15:20:00",
  },
  {
    id: "3",
    name: "Ana Costa",
    phone: "+55 11 97777-6666",
    tags: ["Orçamento"],
    lastContact: "2025-01-13T09:15:00",
  },
];

const FlowChat = () => {
  const { toast } = useToast();
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [messageHistory] = useState<Message[]>([]);
  const [contactNotes, setContactNotes] = useState("");

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery),
  );

  // Sync internal UI state when a different contact is selected
  useEffect(() => {
    if (selectedContact) {
      setContactNotes(selectedContact.notes || "");
      setMessageText("");
      setSelectedTemplate("");
    } else {
      setContactNotes("");
      setMessageText("");
      setSelectedTemplate("");
    }
  }, [selectedContact]);

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setMessageText(TEMPLATES[templateKey as keyof typeof TEMPLATES].text);
  };

  const handleSendWhatsApp = () => {
    if (!selectedContact) return;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappLink = `https://wa.me/${selectedContact.phone.replace(/\D/g, "")}?text=${encodedMessage}`;

    window.open(whatsappLink, "_blank");

    toast({
      title: "WhatsApp aberto",
      description: "Mensagem carregada. Complete o envio no WhatsApp.",
    });

    setMessageText("");
    setSelectedTemplate("");
  };

  const handleBackToList = () => {
    setSelectedContact(null);
  };

  return (
    <MainLayout>
      <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-4">
        {/* Header Section */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted/30 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1 flex items-center gap-3">
              <MessageSquare className="h-8 md:h-10 w-8 md:w-10 text-primary" />
              FlowChat
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Comunique-se com seus clientes via WhatsApp Oficial
            </p>
          </div>
          <div className="bg-amber-100/50 dark:bg-amber-950/30 border border-amber-300/50 dark:border-amber-700/30 rounded-lg p-3 flex items-center gap-2 max-w-sm shadow-sm backdrop-blur-sm">
            <span className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-tight">
              <strong>Aviso:</strong> Respostas do cliente não são sincronizadas (apenas via API Oficial no plano Enterprise).
            </span>
          </div>
        </div>

        {/* App Layout Container */}
        <div className="flex-1 flex bg-muted/30 border border-muted/50 rounded-xl shadow-sm overflow-hidden min-h-0 relative">
          
          {/* Left Pane: Contact List */}
          <div className={`w-full md:w-[320px] lg:w-[350px] flex-shrink-0 flex-col border-r border-muted/50 bg-background/50 backdrop-blur-sm ${selectedContact ? 'hidden md:flex' : 'flex'} h-full`}>
            <div className="p-3 border-b border-muted/50 bg-muted/20 z-10 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contato..."
                  className="pl-9 bg-background/80 shadow-sm border-muted/50 h-9 text-sm focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 items-start content-start">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left p-3 flex flex-col gap-1.5 rounded-lg transition-all group ${
                    selectedContact?.id === contact.id
                      ? "bg-background/80 border border-muted-foreground/30 shadow-sm"
                      : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium text-sm text-foreground transition-colors group-hover:text-foreground">
                      {contact.name}
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${selectedContact?.id === contact.id ? 'text-primary' : 'text-muted-foreground/30 group-hover:translate-x-0.5 group-hover:text-muted-foreground/70'}`} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground transition-colors group-hover:text-muted-foreground">
                    {contact.phone}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {contact.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 rounded-md font-normal border-border/40 ${selectedContact?.id === contact.id ? 'bg-background shadow-xs text-foreground' : 'bg-transparent text-muted-foreground group-hover:text-foreground/80'}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))}
              {filteredContacts.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 text-muted-foreground/50" />
                  <p>Nenhum contato encontrado na busca.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Chat Window */}
          <div className={`flex-1 flex-col bg-background/50 relative h-full min-w-0 ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-muted/50 flex items-center gap-3 bg-muted/10 backdrop-blur-sm shadow-sm z-10 shrink-0 h-[61px]">
                  <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8 -ml-1" onClick={handleBackToList}>
                    <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <span className="font-semibold text-primary">{selectedContact.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {selectedContact.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {selectedContact.phone}
                    </p>
                  </div>
                </div>

                {/* Chat Content - Scrollable Tabs Area */}
                <div className="flex-1 overflow-y-auto bg-muted/5 min-h-0">
                  <div className="p-4 md:p-6 max-w-3xl mx-auto min-h-full flex flex-col">
                    <Tabs defaultValue="compose" className="flex-1 flex flex-col min-h-0">
                      <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/30 border border-muted/50 shadow-sm p-1 rounded-xl shrink-0">
                        <TabsTrigger value="compose" className="text-xs md:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                          <Send className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                          <span className="hidden sm:inline">Mensagem</span>
                          <span className="sm:hidden">Msg</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs md:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                          Histórico
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="text-xs md:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                          <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                          Notas
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex-1 flex flex-col min-h-0">
                        <TabsContent value="compose" className="m-0 flex-1 flex flex-col gap-5 animate-in fade-in-50 duration-300 min-h-0">
                          <div className="space-y-1.5 shrink-0">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                              Template Rápido
                            </label>
                            <Select
                              value={selectedTemplate}
                              onValueChange={handleTemplateSelect}
                            >
                              <SelectTrigger className="bg-background shadow-sm border-input font-medium">
                                <SelectValue placeholder="Selecione um template..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(TEMPLATES).map(([key, template]) => (
                                  <SelectItem key={key} value={key} className="cursor-pointer">
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex-1 flex flex-col space-y-1.5 min-h-[250px] relative">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block flex-shrink-0">
                              Conteúdo da Mensagem
                            </label>
                            <Textarea
                              placeholder="Digite sua mensagem para o WhatsApp..."
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              className="flex-1 resize-none bg-background focus-visible:ring-1 p-4 text-base shadow-sm border-input leading-relaxed"
                            />
                            <div className="shrink-0 flex items-center justify-between pt-1">
                               <p className="text-[11px] text-muted-foreground font-mono bg-accent px-2 py-0.5 rounded-md">
                                 {messageText.length} caracteres
                               </p>
                               <p className="text-[10px] md:text-xs text-muted-foreground truncate ml-4" title="Variáveis: {{nome}}, {{data}}, {{hora}}, {{servico}}, {{link_confirmar}}">
                                 Variáveis: {"{{nome}}"}, {"{{data}}"}...
                               </p>
                            </div>
                          </div>
                      
                          <div className="shrink-0 pt-3 border-t border-border/50">
                            <Button
                              onClick={handleSendWhatsApp}
                              disabled={!messageText}
                              size="lg"
                              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm font-semibold transition-all hover:shadow-md h-12 rounded-lg"
                            >
                              <ExternalLink className="h-5 w-5 mr-2" />
                              Continuar no WhatsApp
                            </Button>
                            <p className="text-center text-[10px] text-muted-foreground mt-2">
                              O WhatsApp Web/App será aberto em uma nova aba.
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="history" className="m-0 flex-1 overflow-y-auto animate-in fade-in-50 duration-300">
                           {messageHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center border-2 border-dashed rounded-xl bg-background/50">
                              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                              <p className="text-sm font-medium text-foreground">Nenhuma mensagem registrada</p>
                              <p className="text-xs text-muted-foreground mt-1">O histórico de mensagens ativas aparecerá aqui.</p>
                            </div>
                          ) : (
                            <div className="space-y-4 pb-4">
                              {messageHistory.map((msg) => (
                                <div
                                  key={msg.id}
                                  className="p-4 bg-background border rounded-lg shadow-sm space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="font-normal">{msg.template}</Badge>
                                    <div className="flex items-center gap-1.5">
                                      {msg.status === "sent" ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                      ) : null}
                                      <span className={`text-xs font-medium ${msg.status === 'sent' ? 'text-success' : 'text-destructive'}`}>
                                        {msg.status === "sent" ? "Enviado" : "Erro"}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-foreground/90 leading-relaxed bg-accent/30 p-3 rounded-md border border-border/50">{msg.text}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono text-right">
                                    {msg.sentAt} • Por {msg.sentBy}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="notes" className="m-0 flex-1 flex flex-col gap-4 animate-in fade-in-50 duration-300">
                          <div className="flex-1 flex flex-col space-y-1.5 overflow-hidden">
                             <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block flex-shrink-0">
                              Anotações Internas
                            </label>
                            <Textarea
                              placeholder="Adicione notas contextuais sobre este contato (preferências, último contato, etc)..."
                              value={contactNotes}
                              onChange={(e) => setContactNotes(e.target.value)}
                              className="flex-1 min-h-[250px] resize-none bg-[#fffdf0] dark:bg-accent/10 focus-visible:ring-1 p-4 shadow-inner border-warning/20 leading-relaxed text-sm"
                            />
                          </div>
                          <Button className="w-full shrink-0 shadow-sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Salvar Anotações
                          </Button>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-accent/5 backdrop-blur-sm">
                <div className="w-20 h-20 rounded-2xl bg-background shadow-sm border flex items-center justify-center mb-6 rotate-3">
                  <div className="w-16 h-16 rounded-xl bg-accent/30 flex items-center justify-center -rotate-6 transition-transform hover:rotate-0 duration-300">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Pronto para atender
                </h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Selecione um paciente na lista lateral para iniciar um novo atendimento ou continuar uma conversa.
                </p>
                <div className="mt-8 flex gap-3 w-full max-w-[280px] p-4 bg-background rounded-xl border shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                   <div className="flex-1 space-y-2 py-1.5 flex flex-col justify-center">
                     <div className="h-2.5 bg-muted rounded w-3/4 animate-pulse" />
                     <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlowChat;
