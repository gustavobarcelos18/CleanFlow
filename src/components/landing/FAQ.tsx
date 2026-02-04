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
    question: "Como funciona o plano Free Solo?",
    answer: "O plano Free Solo é completamente gratuito e permite gerenciar até 50 clientes com 1 profissional. Você tem acesso à agenda básica, cadastro de clientes, relatórios simples e WhatsApp manual. É perfeito para começar e conhecer a plataforma sem compromisso."
  },
  {
    question: "A IA Anti Faltas realmente funciona?",
    answer: "Sim! Nossa IA analisa mais de 15 variáveis (histórico de faltas, tempo desde último agendamento, confirmações anteriores, etc.) e prevê com 85% de precisão quais clientes têm maior risco de faltar. Isso permite que você tome ações proativas como ligações de confirmação ou reagendamentos, reduzindo até 70% das faltas."
  },
  {
    question: "Como funciona a automação de WhatsApp?",
    answer: "O CleanFlow envia automaticamente mensagens de confirmação 2 dias antes (D-2) e 3 horas antes (H-3h) do agendamento. As mensagens são totalmente personalizáveis com o nome do cliente, profissional, data e hora. Você também pode criar fluxos customizados com o Flow Builder para lembretes, follow-ups e campanhas de marketing."
  },
  {
    question: "Posso usar em múltiplas unidades/filiais?",
    answer: "Sim! O plano Multi-unidades foi desenvolvido especialmente para redes, franquias e empresas com múltiplas filiais. Você pode gerenciar quantas unidades quiser com governança centralizada, analytics consolidados e configurações individuais por unidade. Cada unidade adicional tem 10% de desconto."
  },
  {
    question: "Os dados dos meus clientes estão seguros?",
    answer: "Absolutamente! Somos 100% conformes com a LGPD. Todos os dados são criptografados end-to-end, fazemos backup automático diário, temos auditoria completa de acessos e você tem controle total sobre quem acessa o quê. Nossa infraestrutura é hospedada em servidores seguros com certificação ISO 27001."
  },
  {
    question: "Preciso instalar algum software?",
    answer: "Não! O CleanFlow é 100% na nuvem (SaaS). Você acessa pelo navegador de qualquer computador, tablet ou celular. Não precisa instalar nada, fazer backups manuais ou se preocupar com atualizações - tudo é automático."
  },
  {
    question: "Posso integrar com outros sistemas?",
    answer: "Sim! Oferecemos API pública RESTful completa e webhooks em tempo real para integração com qualquer sistema. Também temos SDK de plugins para criar extensões customizadas. Integrações nativas com Stripe, Pagar.me e WhatsApp Business já estão disponíveis."
  },
  {
    question: "Como funciona o período de teste?",
    answer: "Você pode começar com o plano Free Solo gratuitamente e sem cartão de crédito. Para testar os planos pagos, oferecemos 14 dias grátis com acesso total a todas as funcionalidades. Não pedimos cartão de crédito no teste e você pode cancelar a qualquer momento."
  },
  {
    question: "Qual o prazo de implementação?",
    answer: "Você pode começar a usar imediatamente após o cadastro! O sistema é intuitivo e oferecemos um tour guiado interativo no primeiro acesso. Para empresas maiores, oferecemos onboarding personalizado com importação de dados, treinamento da equipe e configuração completa em até 7 dias."
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim! Não temos contratos de fidelidade. Você pode cancelar sua assinatura a qualquer momento diretamente no painel. Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação, e depois são permanentemente deletados conforme LGPD."
  },
  {
    question: "Vocês oferecem suporte?",
    answer: "Sim! Todos os planos incluem suporte por e-mail com resposta em até 24h. Planos Empresa e Multi-unidades têm suporte prioritário. Também oferecemos base de conhecimento completa, vídeos tutoriais e webinars mensais de treinamento."
  },
  {
    question: "O que é o Flow Builder?",
    answer: "É uma ferramenta visual de arrastar e soltar para criar automações sem código. Você pode criar fluxos de confirmação personalizados, lembretes automáticos, follow-ups pós-atendimento, campanhas de aniversário e muito mais. É como ter um desenvolvedor trabalhando para você!"
  }
];

export function FAQ() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 mb-6">
            <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Perguntas Frequentes
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Dúvidas sobre o
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CleanFlow?
            </span>
          </h2>

          <p className="text-xl text-slate-600 dark:text-slate-300">
            Respondemos as perguntas mais comuns. Não encontrou o que procura?
            Entre em contato conosco!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300 pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Ainda tem dúvidas?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all text-lg"
          >
            Fale com nosso time
            <HelpCircle className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
