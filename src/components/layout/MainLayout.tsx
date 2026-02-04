import React from "react";
import { MobileLayout } from "./MobileLayout";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return <MobileLayout>{children}</MobileLayout>;
}