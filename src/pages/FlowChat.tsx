import React, { useState } from "react";
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            FlowChat
          </h1>
          <p className="text-muted-foreground">
            Comunique-se com seus clientes via WhatsApp
          </p>
        </div>

        <Card className="p-3 bg-warning/10 border-warning/30">
          <p className="text-sm text-foreground">
            <strong>Aviso:</strong> O FlowChat usa o link oficial do WhatsApp. O
            conteúdo das respostas do cliente NÃO é capturado pelo CleanFlow.
          </p>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <Card className="p-4 lg:col-span-1">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contato..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-card border border-border hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium text-foreground">
                      {contact.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contact.phone}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Message Composer */}
          <Card className="p-6 lg:col-span-2">
            {selectedContact ? (
              <Tabs defaultValue="compose">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="compose">
                    <Send className="h-4 w-4 mr-2" />
                    Compor
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <Clock className="h-4 w-4 mr-2" />
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    <FileText className="h-4 w-4 mr-2" />
                    Notas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Conversar com: {selectedContact.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.phone}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Templates rápidos
                    </label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEMPLATES).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Mensagem
                    </label>
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {messageText.length} caracteres
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Variáveis disponíveis: {"{"}
                      {"{nome}}"}, {"{"}
                      {"{data}}"}, {"{"}
                      {"{hora}}"}, {"{"}
                      {"{servico}}"}, {"{"}
                      {"{link_confirmar}}"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSendWhatsApp}
                      disabled={!messageText}
                      className="flex-1 bg-success hover:bg-success/90"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir no WhatsApp
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <h3 className="font-semibold">Histórico de mensagens</h3>
                  {messageHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem enviada ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messageHistory.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 bg-muted rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{msg.template}</Badge>
                            <Badge
                              variant={
                                msg.status === "sent"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {msg.status === "sent" ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : null}
                              {msg.status === "sent" ? "Enviado" : "Erro"}
                            </Badge>
                          </div>
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {msg.sentAt} • Por {msg.sentBy}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <h3 className="font-semibold">Notas internas</h3>
                  <Textarea
                    placeholder="Adicione notas sobre este contato..."
                    value={contactNotes || selectedContact.notes || ""}
                    onChange={(e) => setContactNotes(e.target.value)}
                    rows={8}
                  />
                  <Button>Salvar notas</Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Selecione um contato
                </h3>
                <p className="text-muted-foreground">
                  Escolha um contato da lista para começar a conversar
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlowChat;
