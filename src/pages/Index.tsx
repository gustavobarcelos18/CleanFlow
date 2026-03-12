import React, { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { GuidedTour } from "@/components/tour/GuidedTour";
import { dashboardTourSteps } from "@/components/tour/tourSteps";
import { useTourStore } from "@/stores/useTourStore";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";

const Index = () => {
  const { hasSeenTour, startTour } = useTourStore();
  const { setTitle, setSubtitle } = useLayoutTitle();

  // Configurar títulos no header
  useEffect(() => {
    setTitle("Dashboard");
    setSubtitle("Visão geral das consultas e atividades da clínica");
  }, [setTitle, setSubtitle]);

  // Iniciar tour automaticamente no primeiro acesso
  useEffect(() => {
    if (!hasSeenTour) {
      // Pequeno delay para garantir que a página carregou
      const timer = setTimeout(() => {
        startTour("dashboard");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, startTour]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <DashboardOverview />
      </div>

      <GuidedTour steps={dashboardTourSteps} tourId="dashboard" />
    </MainLayout>
  );
};

export default Index;
