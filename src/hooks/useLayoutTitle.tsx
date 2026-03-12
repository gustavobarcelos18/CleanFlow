import React, { createContext, useContext, useState, ReactNode } from "react";

interface LayoutTitleContextType {
  title: string;
  subtitle: string;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
}

const LayoutTitleContext = createContext<LayoutTitleContextType | undefined>(
  undefined,
);

export function LayoutTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  return (
    <LayoutTitleContext.Provider
      value={{ title, subtitle, setTitle, setSubtitle }}
    >
      {children}
    </LayoutTitleContext.Provider>
  );
}

export function useLayoutTitle() {
  const context = useContext(LayoutTitleContext);
  if (context === undefined) {
    throw new Error("useLayoutTitle must be used within a LayoutTitleProvider");
  }
  return context;
}
