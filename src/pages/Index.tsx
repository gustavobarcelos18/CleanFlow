import React, { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { GuidedTour } from "@/components/tour/GuidedTour";
import { dashboardTourSteps } from "@/components/tour/tourSteps";
import { useTourStore } from "@/stores/useTourStore";

const Index = () => {
  const { hasSeenTour, startTour } = useTourStore();

  // Iniciar tour automaticamente no primeiro acesso
  useEffect(() => {
    if (!hasSeenTour) {
      // Pequeno delay para garantir que a página carregou
      const timer = setTimeout(() => {
        startTour('dashboard');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, startTour]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das consultas e atividades da clínica
          </p>
        </div>
        <DashboardOverview />
      </div>

      <GuidedTour
        steps={dashboardTourSteps}
        tourId="dashboard"
      />
    </MainLayout>
  );
};

export default Index;

