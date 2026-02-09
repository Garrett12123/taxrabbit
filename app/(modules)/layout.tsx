import { redirect } from 'next/navigation';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { isVaultConfigured } from '@/server/security/vault';
import { isAuthenticated } from '@/server/security/session';

export default async function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isVaultConfigured()) {
    redirect('/setup');
  }

  if (!(await isAuthenticated())) {
    redirect('/unlock');
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="w-full px-6 py-6 lg:px-8 xl:px-10 lg:py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
