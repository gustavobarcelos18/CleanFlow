import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Cookies e Privacidade
            </h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência, analisar o
              tráfego do site e personalizar conteúdo. Ao clicar em "Aceitar",
              você concorda com o uso de cookies conforme nossa Política de
              Privacidade.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={declineCookies}
              className="flex-1 sm:flex-none"
            >
              Recusar
            </Button>
            <Button onClick={acceptCookies} className="flex-1 sm:flex-none">
              Aceitar
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={declineCookies}
            className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
