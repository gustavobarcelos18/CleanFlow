import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, X, Volume2, VolumeX } from "lucide-react";
import { useWhatsAppNotifications } from "@/hooks/useWhatsAppNotifications";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WhatsAppNotificationBadge() {
  const {
    unreadCount,
    notifications,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    clearNotification,
  } = useWhatsAppNotifications();
  
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Notificações WhatsApp</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card key={notification.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">
                          {notification.paciente_nome || notification.telefone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => clearNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {notification.mensagem}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        markAsRead(notification.conversation_id);
                        setOpen(false);
                      }}
                      className="w-full"
                    >
                      Responder
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
