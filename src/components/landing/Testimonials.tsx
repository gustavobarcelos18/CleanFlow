import React from "react";
import { Star } from "lucide-react";

const depoimentos = [
  {
    quote:
      "Em 30 dias, os buracos na agenda sumiram. O robô do WhatsApp funciona melhor que qualquer secretária que já tive.",
    autor: "João Batista",
    segmento: "Clínica Odontológica",
    cidade: "SP",
    iniciais: "JB",
  },
  {
    quote:
      "A IA previu uma falta ontem às 7h. Minha equipe ligou, encaixou outro paciente. Aquele slot teria ficado vazio.",
    autor: "Marcela Viana",
    segmento: "Fisioterapia",
    cidade: "RJ",
    iniciais: "MV",
  },
  {
    quote:
      "Nem acredito que fui meses trabalhando sem isso. A redução de faltas pagou a ferramenta três vezes no primeiro mês.",
    autor: "Roberto Mendes",
    segmento: "Dermatologia",
    cidade: "BH",
    iniciais: "RM",
  },
];

const objecoes = [
  { pergunta: "Funciona no meu segmento?", resposta: "Sim." },
  { pergunta: "Dá trabalho pra configurar?", resposta: "Não." },
  { pergunta: "Precisa instalar algo?", resposta: "Não." },
  { pergunta: "É seguro? LGPD?", resposta: "Sim." },
  { pergunta: "Posso cancelar?", resposta: "Sim." },
];

export function Testimonials() {
  return (
    <section className="py-12 md:py-16 bg-[#070B12]" id="depoimentos">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              Prova social
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Quem usa, não consegue imaginar a vida sem.
            </h2>
          </div>

          {/* Depoimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {depoimentos.map((d) => (
              <div
                key={d.autor}
                className="bg-[#0B1220] border border-[#1B2A40] rounded-2xl p-6 hover:border-cyan-400/20 transition-colors duration-300"
              >
                <div className="flex gap-1 mb-4" aria-label="5 estrelas">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-orange-400 text-orange-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-[#EAF2FF] text-sm leading-relaxed mb-6">
                  "{d.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#1B2A40]">
                  <div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white"
                    aria-hidden="true"
                  >
                    {d.iniciais}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{d.autor}</p>
                    <p className="text-[#A9B7D0] text-xs">
                      {d.segmento} · {d.cidade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mini case */}
          <div className="bg-gradient-to-r from-cyan-400/10 to-blue-500/5 border border-cyan-400/20 rounded-2xl p-6 md:p-8 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Mini case · exemplo
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-2 mb-4">
              "Zeramos as faltas e aumentamos a receita em 45% em 2 meses."
            </h3>
            <p className="text-[#A9B7D0] text-sm leading-relaxed">
              Clínica Vivitar (fictício): antes, 30% dos pacientes marcavam e
              não apareciam. Com as confirmações automáticas do CleanFlow, a
              taxa de no-show caiu para menos de 2% em 60 dias, e os encaixes
              automáticos lotaram os horários que antes ficariam vazios.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {[
                { label: "No-show", antes: "30%", depois: "2%" },
                { label: "Ocupação", antes: "65%", depois: "94%" },
                { label: "Receita", antes: "Referência", depois: "+45%" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-[#A9B7D0] mb-1">{item.label}</p>
                  <p className="text-sm text-red-400 line-through">
                    {item.antes}
                  </p>
                  <p className="text-lg font-bold text-cyan-400">
                    {item.depois}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ de objeções rápidas */}
          <div className="bg-[#0B1220] border border-[#1B2A40] rounded-2xl p-6 md:p-8">
            <p className="text-white font-bold text-lg mb-4">
              Respondidas em 1 segundo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {objecoes.map((o) => (
                <div
                  key={o.pergunta}
                  className="bg-[#070B12] rounded-xl p-3 border border-[#1B2A40]"
                >
                  <p className="text-[#A9B7D0] text-xs mb-1">{o.pergunta}</p>
                  <p className="text-cyan-400 font-bold text-sm">
                    {o.resposta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
