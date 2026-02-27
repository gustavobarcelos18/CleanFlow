import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { AgitacaoDor } from "@/components/landing/AgitacaoDor";
import { Metrics } from "@/components/landing/Metrics";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { TargetAudience } from "@/components/landing/TargetAudience";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { LeadMagnet } from "@/components/landing/LeadMagnet";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { useTheme } from "@/components/theme/ThemeProvider";

const Landing = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
    // Ensure root font size is reset on landing page
    document.documentElement.style.fontSize = "";
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-[#070B12]">
      <LandingHeader />
      <main>
        {/* 1. HERO — Promessa */}
        <Hero />
        {/* 2. O PROBLEMA — Agitação */}
        <AgitacaoDor />
        {/* 3. MÉTRICAS — O que muda */}
        <Metrics />
        {/* 4. COMO FUNCIONA — 3 passos */}
        <HowItWorks />
        {/* 5. RECURSOS — 6 cards */}
        <Features />
        {/* 6. PARA QUEM É — 3 perfis */}
        <TargetAudience />
        {/* 7. PLANOS — Oferta + Risco Reverso */}
        <Pricing />
        {/* 8. PROVA SOCIAL — Depoimentos + Mini case */}
        <Testimonials />
        {/* 9. LEAD MAGNET — Checklist anti-faltas */}
        <LeadMagnet />
        {/* 10. FAQ — 8 perguntas */}
        <FAQ />
        {/* 11. CTA FINAL — Punch */}
        <FinalCTA />
      </main>
      <LandingFooter />
      <SupportChatWidget />
      <CookieConsent />
    </div>
  );
};

export default Landing;
