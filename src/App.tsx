import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenantData";
import { OrganizationProvider } from "@/hooks/useOrganizationContext";
import { BillingProvider } from "@/hooks/useBilling";
import { LayoutTitleProvider } from "@/hooks/useLayoutTitle";
import { BillingBanner } from "@/components/billing/BillingBanner";
import { RequireRole, RoleGuards } from "@/components/auth/RequireRole";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/erros/ErrorBoundary";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const HubCentral = lazy(() => import("./pages/HubCentral"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Pacientes = lazy(() => import("./pages/Pacientes"));
const Profissionais = lazy(() => import("./pages/Profissionais"));
const TiposProfissional = lazy(() => import("./pages/TiposProfissional"));
const Especialidades = lazy(() => import("./pages/Especialidades"));
const Exames = lazy(() => import("./pages/Exames"));
const Procedimentos = lazy(() => import("./pages/Procedimentos"));
const Pacotes = lazy(() => import("./pages/Pacotes"));
const PlanosSaude = lazy(() => import("./pages/PlanosSaude"));
const CaixaDiario = lazy(() => import("./pages/CaixaDiario"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const FlowChat = lazy(() => import("./pages/FlowChat"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const SupportIndex = lazy(() => import("./pages/support/Index"));
const AdminIndex = lazy(() => import("./pages/admin/Index"));
import MultiUnitDashboard from "./pages/admin/MultiUnitDashboard";
import { WorkshopDashboard } from "./components/workshop/WorkshopDashboard";
import { LegalDashboard } from "./components/legal/LegalDashboard";
import { BeautyDashboard } from "./components/beauty/BeautyDashboard";
import AdminLogin from "./pages/admin/Login";
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminChangePassword = lazy(() => import("./pages/admin/ChangePassword"));
const AdminSignupMaster = lazy(() => import("./pages/admin/SignupMaster"));
const AdminTenants = lazy(() => import("./pages/admin/Tenants"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminObservability = lazy(() => import("./pages/admin/Observability"));
const AdminProviders = lazy(() => import("./pages/admin/Providers"));
const RecontratarProfissionalCsv = lazy(
  () => import("./pages/admin/RecontratarProfissionalCsv"),
);
const AdminIntegrations = lazy(() => import("./pages/admin/Integrations"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const Prontuarios = lazy(() => import("./pages/Prontuarios"));
const Atendimento = lazy(() => import("./pages/Atendimento"));
const PatientLogin = lazy(() => import("./pages/PatientLogin"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const AgendamentoPublico = lazy(() => import("./pages/AgendamentoPublico"));
const WhatsAppDashboard = lazy(() => import("./pages/WhatsAppDashboard"));
const ConfiguracoesWhatsApp = lazy(
  () => import("./pages/ConfiguracoesWhatsApp"),
);
const ListaEspera = lazy(() => import("./pages/ListaEspera"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const OnboardingNegocio = lazy(() => import("./pages/OnboardingNegocio"));
const Unidades = lazy(() => import("./pages/Unidades"));
const OrganizationManager = lazy(() => import("./pages/OrganizationManager"));
const GovernancaTenant = lazy(() => import("./pages/admin/GovernancaTenant"));
const AutomationsFlowBuilder = lazy(
  () => import("./pages/admin/AutomationsFlowBuilder"),
);
const ListaEsperaManager = lazy(
  () => import("./pages/admin/ListaEsperaManager"),
);
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const IntegracoesApi = lazy(() => import("./pages/admin/IntegracoesApi"));
const PluginsManager = lazy(() => import("./pages/admin/Plugins"));
const OrgGovernance = lazy(() => import("./pages/admin/OrgGovernance"));
const Planos = lazy(() => import("./pages/admin/Planos"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const AlarmesLembretes = lazy(() => import("./pages/AlarmesLembretes"));
const AdminAlarmesLembretes = lazy(
  () => import("./pages/admin/AdminAlarmesLembretes"),
);
const SupportSettings = lazy(() => import("./pages/admin/SupportSettings"));
const AdminWhatsApp = lazy(() => import("./pages/admin/WhatsApp"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

import { useEffect } from "react";
import { useSegmentStore } from "@/stores/useSegmentStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { fetchSegment } = useSegmentStore();

  useEffect(() => {
    const loadSegment = async () => {
      if (session?.user) {
        const savedSegment =
          localStorage.getItem("cleanflow_segment") || "saude";
        await fetchSegment(savedSegment);
      }
    };
    loadSegment();
  }, [session, fetchSegment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-auth contents">
      <BillingBanner />
      {children}
    </div>
  );
}

/**
 * Wrapper para injetar IDs de contexto no ErrorBoundary
 */
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const orgContext = useOrganizationContext();

  return (
    <ErrorBoundary
      user_id={user?.id}
      tenant_id={profile?.tenant_id}
      organization_id={profile?.organization_id}
      organization_unit_id={orgContext?.currentUnit?.id}
    >
      {children}
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="cleanflow-ui-theme">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <ThemeSync />
            <TenantProvider>
              <OrganizationProvider>
                <LayoutTitleProvider>
                  <BillingProvider>
                    <ErrorBoundaryWrapper>
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center min-h-screen">
                            <p className="text-muted-foreground">
                              Carregando...
                            </p>
                          </div>
                        }
                      >
                        <Routes>
                          {/* ... existing routes ... */}
                          <Route path="/" element={<Landing />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/signup" element={<Signup />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/support" element={<SupportIndex />} />
                          <Route
                            path="/agendar"
                            element={<AgendamentoPublico />}
                          />
                          <Route
                            path="/onboarding-negocio"
                            element={<OnboardingNegocio />}
                          />
                          <Route
                            path="/patient-login"
                            element={<PatientLogin />}
                          />
                          <Route
                            path="/patient-portal"
                            element={<PatientPortal />}
                          />

                          {/* Admin Routes - Protected by support roles */}
                          <Route
                            path="/admin/rede"
                            element={<MultiUnitDashboard />}
                          />
                          <Route
                            path="/workshop"
                            element={<WorkshopDashboard />}
                          />
                          <Route path="/legal" element={<LegalDashboard />} />
                          <Route path="/beauty" element={<BeautyDashboard />} />
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route
                            path="/admin/signup-master"
                            element={<AdminSignupMaster />}
                          />
                          <Route
                            path="/admin/dashboard"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminDashboard />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/change-password"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminChangePassword />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/tenants"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminTenants />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/users"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminUsers />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/reports"
                            element={
                              <RequireRole
                                roles={[
                                  ...RoleGuards.support,
                                  ...RoleGuards.financial,
                                ]}
                              >
                                <AdminReports />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/observability"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminObservability />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/providers"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminProviders />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/integrations"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <AdminIntegrations />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/api-keys"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <IntegracoesApi />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/plugins"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <PluginsManager />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/org-governance"
                            element={
                              <RequireRole roles={RoleGuards.financial}>
                                <OrgGovernance />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/planos"
                            element={
                              <RequireRole roles={RoleGuards.financial}>
                                <Planos />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/coupons"
                            element={
                              <RequireRole roles={RoleGuards.financial}>
                                <AdminCoupons />
                              </RequireRole>
                            }
                          />

                          <Route
                            path="/admin"
                            element={
                              <ProtectedRoute>
                                <AdminIndex />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute>
                                <HubCentral />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/visao-geral"
                            element={
                              <ProtectedRoute>
                                <Index />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/agenda"
                            element={
                              <ProtectedRoute>
                                <Agenda />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/procedimentos"
                            element={
                              <ProtectedRoute>
                                <Procedimentos />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pacotes"
                            element={
                              <ProtectedRoute>
                                <Pacotes />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pacientes"
                            element={
                              <ProtectedRoute>
                                <Pacientes />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profissionais"
                            element={
                              <ProtectedRoute>
                                <Profissionais />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profissionais/recontratar"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <RecontratarProfissionalCsv />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/tipos-profissional"
                            element={
                              <ProtectedRoute>
                                <TiposProfissional />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/especialidades"
                            element={
                              <ProtectedRoute>
                                <Especialidades />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/exames"
                            element={
                              <ProtectedRoute>
                                <Exames />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/perfil"
                            element={
                              <ProtectedRoute>
                                <Perfil />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/configuracoes"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <Configuracoes />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/flowchat"
                            element={
                              <ProtectedRoute>
                                <FlowChat />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/relatorios"
                            element={
                              <ProtectedRoute>
                                <Relatorios />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/analytics"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <AnalyticsDashboard />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/prontuarios"
                            element={
                              <ProtectedRoute>
                                <Prontuarios />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/atendimento"
                            element={
                              <ProtectedRoute>
                                <Atendimento />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/planos-saude"
                            element={
                              <ProtectedRoute>
                                <PlanosSaude />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/caixa-diario"
                            element={
                              <RequireRole roles={RoleGuards.financial}>
                                <CaixaDiario />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/whatsapp-dashboard"
                            element={
                              <ProtectedRoute>
                                <WhatsAppDashboard />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/configuracoes-whatsapp"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <ConfiguracoesWhatsApp />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/lista-espera"
                            element={
                              <ProtectedRoute>
                                <ListaEspera />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/financeiro"
                            element={
                              <RequireRole roles={RoleGuards.financial}>
                                <Financeiro />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/unidades"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <Unidades />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/governanca"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <GovernancaTenant />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/automations"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <AutomationsFlowBuilder />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/lista-espera"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <ListaEsperaManager />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/tickets"
                            element={
                              <ProtectedRoute>
                                <AdminIndex />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/admin/governanca-tenant"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <GovernancaTenant />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/integracoes-api"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <IntegracoesApi />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/admin/whatsapp"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <AdminWhatsApp />
                              </RequireRole>
                            }
                          />
                          <Route path="/tickets" element={<SupportTickets />} />
                          <Route
                            path="/admin/support-settings"
                            element={
                              <RequireRole roles={RoleGuards.support}>
                                <SupportSettings />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/alarmes-lembretes"
                            element={<AlarmesLembretes />}
                          />
                          <Route
                            path="/admin/alarmes-lembretes"
                            element={
                              <RequireRole roles={RoleGuards.config}>
                                <AdminAlarmesLembretes />
                              </RequireRole>
                            }
                          />
                          <Route
                            path="/organization-manager"
                            element={
                              <RequireRole roles={RoleGuards.orgLevel}>
                                <OrganizationManager />
                              </RequireRole>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundaryWrapper>
                  </BillingProvider>
                </LayoutTitleProvider>
              </OrganizationProvider>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
