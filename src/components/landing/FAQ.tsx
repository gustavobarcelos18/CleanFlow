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
      "Sim. A integração é nativa. Seus clientes recebem mensagens da sua conta, com seu nome e foto.",
  },
  {
    pergunta: "Posso testar antes de pagar?",
    resposta:
      "Sim. 7 dias de acesso completo. Sem cartão de crédito e sem burocracia para testar.",
  },
  {
    pergunta: "Como faço a migração da agenda atual?",
    resposta:
      "Nossa equipe de onboarding importa sua base de clientes e agendamentos via planilha de forma gratuita e rápida.",
  },
  {
    pergunta: "Como funciona o cancelamento?",
    resposta:
      "Sem burocracia. Um clique e está cancelado, não cobramos taxa de fidelidade.",
  },
];

export function FAQ() {
  return (
    <section className="py-12 md:py-16 bg-[#070B12]" id="faq">
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
