import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { ClientLayoutWrapper } from "@/components/client-layout-wrapper";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { CSSProperties, ReactNode } from "react";

const ProtectedLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
