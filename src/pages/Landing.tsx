import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { ValuePillars } from "@/components/landing/ValuePillars";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { TechDetails } from "@/components/landing/TechDetails";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
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
    setTheme('dark');
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <Hero />
        <ValuePillars />
        <HowItWorks />
        <Features />
        <TechDetails />
        <BeforeAfter />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
      <SupportChatWidget />
      <CookieConsent />
    </div>
  );
};

export default Landing;
