import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { AgitacaoDor } from "@/components/landing/AgitacaoDor";
import { Metrics } from "@/components/landing/Metrics";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
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
    <div className="min-h-screen bg-[#070B12] overflow-x-clip">
      <LandingHeader />
      <main>
        {/* 1. HERO — Promessa */}
        <Hero />
        {/* 2. O PROBLEMA + SOLUÇÃO RÁPIDA */}
        <AgitacaoDor />
        {/* 3. COMO FUNCIONA */}
        <HowItWorks />
        {/* 4. MÉTRICAS — A Prova incontestável */}
        <Metrics />
        {/* 5. PROVA SOCIAL — Case e depoimentos */}
        <Testimonials />
        {/* 6. PLANOS — Risco Reverso */}
        <Pricing />
        {/* 7. FAQ — Quebra Final de Objeções */}
        <FAQ />
        {/* 8. CTA FINAL */}
        <FinalCTA />
      </main>
      <LandingFooter />
      <SupportChatWidget />
      <CookieConsent />
    </div>
  );
};

export default Landing;
