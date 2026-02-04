import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Número do WhatsApp (substitua pelo número real da empresa)
  const whatsappNumber = "5511999999999"; // Formato: código do país + DDD + número

  const handleWhatsAppClick = (type: "vendas" | "suporte") => {
    const messages = {
      vendas: "Olá! Gostaria de saber mais sobre o CleanFlow e como ele pode ajudar minha clínica.",
      suporte: "Olá! Preciso de suporte técnico com o CleanFlow."
    };

    const message = encodeURIComponent(messages[type]);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu expandido */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-card border border-border rounded-2xl shadow-2xl p-4 w-64 mb-2 animate-in slide-in-from-bottom-4 fade-in">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Como podemos ajudar?</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => handleWhatsAppClick("vendas")}
              className="w-full text-left p-3 rounded-xl bg-success/10 hover:bg-success/20 border border-success/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Falar com Vendas</p>
                  <p className="text-xs text-muted-foreground">Conheça nossos planos</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleWhatsAppClick("suporte")}
              className="w-full text-left p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Suporte Técnico</p>
                  <p className="text-xs text-muted-foreground">Tire suas dúvidas</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-success hover:bg-success/90 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group relative"
        aria-label="Abrir chat do WhatsApp"
      >
        {/* Animação de pulso */}
        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-20" />

        <MessageCircle className="h-8 w-8 text-white relative z-10" />
      </button>
    </div>
  );
}
