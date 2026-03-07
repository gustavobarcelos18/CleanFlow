import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;

interface SidebarState {
  width: number;
  isResizing: boolean;
  sidebarScroll: number;
  setWidth: (width: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  setSidebarScroll: (sidebarScroll: number) => void;
  loadWidth: () => Promise<void>;
  saveWidth: (width: number) => Promise<void>;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  width: DEFAULT_WIDTH,
  isResizing: false,
  sidebarScroll: 0,

  setWidth: (width: number) => set({ width }),

  setIsResizing: (isResizing: boolean) => set({ isResizing }),

  setSidebarScroll: (sidebarScroll: number) => set({ sidebarScroll }),

  loadWidth: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase
        .from("user_preferences" as any)
        .select("sidebar_width")
        .eq("user_id", user.id)
        .maybeSingle() as any);

      if (data?.sidebar_width) {
        set({ width: data.sidebar_width });
      }
    } catch (error: any) {
      if (error?.code !== "PGRST116" && error?.status !== 404) {
        console.error("Erro ao carregar largura da sidebar:", error);
      }
    }
  },

  saveWidth: async (newWidth: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from("user_preferences" as any).upsert(
        {
          user_id: user.id,
          sidebar_width: newWidth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        } as any,
      ) as any);
    } catch (error) {
      console.error("Erro ao salvar largura da sidebar:", error);
    }
  },
}));
