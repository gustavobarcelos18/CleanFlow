import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    pergunta: "Funciona com WhatsApp Business?",
    resposta:
      "Sim. A integração é nativa com WhatsApp Business API. Seus clientes recebem mensagens da sua conta, com seu nome e foto.",
  },
  {
    pergunta: "Os dados dos pacientes são seguros?",
    resposta:
      "100%. Criptografia ponta a ponta, servidores certificados e todos os termos de consentimento LGPD assinados no próprio agendamento.",
  },
  {
    pergunta: "Como faço a migração da agenda atual?",
    resposta:
      "Nossa equipe de onboarding importa os dados da sua agenda atual durante a configuração. Não começa do zero.",
  },
  {
    pergunta: "Funciona para multiunidade?",
    resposta:
      "Sim. O plano Empresa gerencia múltiplas salas e profissionais. Para redes com mais unidades, fale com nossa equipe.",
  },
  {
    pergunta: "Qual é o suporte disponível?",
    resposta:
      "Chat em tempo real, e-mail e vídeo-chamada de onboarding. Plano Pro e Empresa têm atendimento prioritário.",
  },
  {
    pergunta: "Posso testar antes de pagar?",
    resposta:
      "Sim. 7 dias com acesso completo. Sem cartão de crédito, sem compromisso.",
  },
  {
    pergunta: "Posso importar minha base de clientes?",
    resposta:
      "Sim. Importamos via planilha Excel/CSV. Nosso time ajuda durante o onboarding.",
  },
  {
    pergunta: "Como funciona o cancelamento?",
    resposta:
      "Sem burocracia. Um clique no painel cancela a assinatura. Seus dados ficam disponíveis por 30 dias para exportação.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 md:py-24 bg-[#070B12]" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Perguntas frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-[#0B1220] border border-[#1B2A40] rounded-xl px-5 data-[state=open]:border-cyan-400/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 gap-3">
                  <div className="flex items-start gap-3">
                    <HelpCircle
                      className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-[#EAF2FF] font-semibold text-sm leading-snug">
                      {item.pergunta}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-[#A9B7D0] text-sm leading-relaxed pb-4 pl-7">
                  {item.resposta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
