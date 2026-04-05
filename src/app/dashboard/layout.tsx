import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Mofarm Admin Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content */}
        <main className="flex flex-col flex-1">
          {/* Top bar */}
          <header className="sticky bg-background/85 backdrop-blur-sm z-50 top-0 h-14 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>

          {/* Page content */}
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
