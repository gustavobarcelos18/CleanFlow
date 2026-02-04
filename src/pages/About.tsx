import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Activity, Target, Users, Award } from "lucide-react";
const About = () => {
  return <div className="min-h-screen bg-background">
    <LandingHeader />

    <main className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-success/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Sobre o CleanFlow
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">Transformamos a gestão da agenda de profisssionais de
            saúde através de tecnologia inteligente e automação.</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Nossa Missão</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Reduzir as faltas em consultas médicas e procedimentos e maximizar a ocupação das agendas através de
                confirmação proativa e encaixes automáticos inteligentes.
              </p>
              <p className="text-lg text-muted-foreground">
                Acreditamos que cada horário vago na agenda de um profissional de saúde representa
                uma oportunidade perdida de atender alguém que precisa de cuidados.
              </p>
            </div>
            <div className="bg-card p-8 rounded-2xl border border-border">
              <Activity className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Inteligência que Funciona
              </h3>
              <p className="text-muted-foreground">
                Nossa plataforma combina confirmações automáticas via WhatsApp e e-mail com um
                sistema de encaixes que preenche vagas antes mesmo que elas se tornem um problema.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Nossos Valores
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border">
              <Target className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Eficiência</h3>
              <p className="text-muted-foreground">
                Cada recurso é projetado para economizar tempo e aumentar a produtividade da sua equipe.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Foco no Cliente</h3>
              <p className="text-muted-foreground">
                Desenvolvemos soluções baseadas nas necessidades reais de clínicas e profissionais de saúde.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <Award className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-3">Qualidade</h3>
              <p className="text-muted-foreground">
                Compromisso com a excelência em cada detalhe, desde o código até o suporte ao cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Equipe Dedicada
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Somos uma equipe de desenvolvedores, designers e especialistas em saúde trabalhando
            para revolucionar a gestão de profissionais, consultórios e clínicas de saúde e beleza.
          </p>
          <p className="text-lg text-muted-foreground">
            Com anos de experiência no setor de saúde e tecnologia, entendemos os desafios únicos
            que os profissionais de saúde enfrentam diariamente.
          </p>
        </div>
      </section>
    </main>

    <LandingFooter />
  </div>;
};
export default About;