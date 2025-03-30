
import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className={cn("flex-1 bg-gray-50", isMobile ? "p-4" : "p-6")}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

// Import cn at the top
import { cn } from "@/lib/utils";
