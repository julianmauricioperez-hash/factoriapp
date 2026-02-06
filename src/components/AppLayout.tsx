import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppHeader title={title} />}
      <main className="container mx-auto px-4 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}
