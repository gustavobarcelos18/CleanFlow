import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";

interface TenantData {
  nome: string;
  tipo: string;
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  font_size: number;
}

interface TenantContextType {
  tenantData: TenantData | null;
  isLoading: boolean;
  refreshTenantData: () => Promise<void>;
  updateTenantData: (data: Partial<TenantData>) => void;
  displayName: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const fetchTenantData = useCallback(async () => {
    const impersonationId = localStorage.getItem(
      "support_impersonation_tenant_id",
    );
    const targetTenantId = impersonationId || profile?.tenant_id;

    if (!targetTenantId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tenants")
        .select("nome, tipo, cnpj, razao_social, nome_fantasia, font_size")
        .eq("id", targetTenantId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setTenantData({
          nome: data.nome,
          tipo: data.tipo,
          cnpj: data.cnpj,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          font_size: data.font_size || 16,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do tenant:", error);
      setTenantData({
        nome: "Empresa",
        tipo: "clinica",
        cnpj: null,
        razao_social: null,
        nome_fantasia: null,
        font_size: 16,
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  // Apply font size to document root, but NOT on the landing page
  useEffect(() => {
    const isLandingPage = location.pathname === "/";

    if (tenantData?.font_size && !isLandingPage) {
      document.documentElement.style.fontSize = `${tenantData.font_size}px`;
    } else if (isLandingPage) {
      // Reset to browser default on landing page
      document.documentElement.style.fontSize = "";
    }
  }, [tenantData?.font_size, location.pathname]);

  const updateTenantData = useCallback((data: Partial<TenantData>) => {
    setTenantData((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  // Display name: prefer nome_fantasia, fallback to razao_social, then nome
  const displayName =
    tenantData?.nome_fantasia ||
    tenantData?.razao_social ||
    tenantData?.nome ||
    "Empresa";

  return (
    <TenantContext.Provider
      value={{
        tenantData,
        isLoading,
        refreshTenantData: fetchTenantData,
        updateTenantData,
        displayName,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantData() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenantData must be used within a TenantProvider");
  }
  return context;
}
