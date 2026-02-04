import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useSupportChat } from "@/hooks/useSupportChat";
import { MessageSquare, Clock, CheckCircle2, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChatWindow } from "./ChatWindow";
import { ChatPreferences } from "./ChatPreferences";

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatDrawer = ({ open, onOpenChange }: ChatDrawerProps) => {
  const { waitingSessions, activeSessions, recentSessions, acceptChat } = useSupportChat();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleAcceptChat = async (sessionId: string) => {
    const success = await acceptChat(sessionId);
    if (success) {
      setSelectedSession(sessionId);
    }
  };

  if (selectedSession && !showPreferences) {
    return (
      <ChatWindow
        sessionId={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    );
  }

  if (showPreferences) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Preferências de Chat</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
              >
                Voltar
              </Button>
            </div>
          </SheetHeader>
          <ChatPreferences />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Chats de Suporte</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreferences(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="waiting" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="waiting" className="relative">
              <Clock className="h-4 w-4 mr-2" />
              Aguardando
              {waitingSessions.length > 0 && (
                <Badge className="ml-2" variant="destructive">
                  {waitingSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ativos ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Recentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {waitingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum chat aguardando
                </div>
              ) : (
                <div className="space-y-2">
                  {waitingSessions.map((session) => (
                    <Card key={session.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">
                            {session.client_name || "Cliente Anônimo"}
                          </h4>
                          {session.client_email && (
                            <p className="text-sm text-muted-foreground">
                              {session.client_email}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {formatDistanceToNow(new Date(session.started_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </Badge>
                      </div>
                      <Button
                        className="w-full mt-2"
                        onClick={() => handleAcceptChat(session.id)}
                      >
                        Aceitar Chat
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum chat ativo
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {session.client_name || "Cliente Anônimo"}
                          </h4>
                          {session.client_email && (
                            <p className="text-sm text-muted-foreground">
                              {session.client_email}
                            </p>
                          )}
                          {session.accepted_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Iniciado {formatDistanceToNow(new Date(session.accepted_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          )}
                        </div>
                        <Badge>Em andamento</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {recentSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum chat recente
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <Card key={session.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {session.client_name || "Cliente Anônimo"}
                          </h4>
                          {session.client_email && (
                            <p className="text-sm text-muted-foreground">
                              {session.client_email}
                            </p>
                          )}
                          {session.ended_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Encerrado {formatDistanceToNow(new Date(session.ended_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          )}
                        </div>
                        <Badge variant={session.status === 'resolved' ? 'default' : 'secondary'}>
                          {session.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
