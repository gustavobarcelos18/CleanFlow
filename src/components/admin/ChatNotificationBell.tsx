import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupportChat } from "@/hooks/useSupportChat";
import { ChatDrawer } from "./ChatDrawer";

export const ChatNotificationBell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { waitingSessions } = useSupportChat();

  const waitingCount = waitingSessions.length;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setDrawerOpen(true)}
          data-chat-bell
        >
          <Bell className="h-5 w-5" />
          {waitingCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground"
              variant="destructive"
            >
              {waitingCount > 9 ? '9+' : waitingCount}
            </Badge>
          )}
        </Button>
      </div>

      <ChatDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
};
