import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function AppLayout({ 
  children, 
  title, 
  showHeader = true,
  showBottomNav = true 
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppHeader title={title} />}
      <main className="container mx-auto px-4 py-4 pb-20 md:py-6 md:pb-6">
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
