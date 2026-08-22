import React from "react";
import { MobileLayout } from "./MobileLayout";

interface MainLayoutProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export function MainLayout({ children, contentClassName }: MainLayoutProps) {
  return (
    <MobileLayout contentClassName={contentClassName}>
      {children}
    </MobileLayout>
  );
}
