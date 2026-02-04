import React from "react";
import { CheckCircle } from "lucide-react";

export function TechDetails() {
  const details = [
    "Funciona no computador da clínica e no celular do médico.",
    "Mensagens por WhatsApp usando link oficial; opção gratuita via serviço de automação.",
    "E-mail transacional incluso no plano para confirmação de consultas.",
    "Sem instalação: é só criar a conta e começar a usar na clínica.",
    "Você decide: agenda por profissional de saúde ou por consultório/sala.",
    "Você cadastra os procedimentos e/ou exames que oferece e ajusta os textos das mensagens.",
    "Você escolhe as especialidades que oferece marcando caixas, sem complicação.",
  ];

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Tecnologia a Serviço da Qualidade no Atendimento
          </h2>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 space-y-4">
          {details.map((detail, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
              <p className="text-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
