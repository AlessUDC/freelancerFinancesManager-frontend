'use client';

import { useState } from 'react';
import { Sidebar, MobileDrawer } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { AppConfigProvider } from '@/hooks/useAppConfig';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-12 h-12 border-4 border-[#4e73df]/20 border-t-[#4e73df] rounded-full animate-spin" />
          <p className="text-sm font-medium">Cargando FinancePro...</p>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  const handleToggleSidebar = () => {
    // On mobile, open the drawer instead of collapsing
    if (window.innerWidth < 768) {
      setDrawerOpen(true);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  };

  return (
    <AppConfigProvider>
      <CurrencyProvider>
        <div className="flex min-h-screen bg-[#f3f4f8]">
          {/* Desktop sidebar */}
          <Sidebar collapsed={sidebarCollapsed} />

          {/* Mobile drawer */}
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

          {/* Main content */}
          <div className="flex flex-col flex-1 min-w-0">
            <Navbar
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
              onLogout={logout}
              userName={usuario.nombre}
              userEmail={usuario.email}
            />
            <main className="flex-1 p-4 md:p-6 animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </CurrencyProvider>
    </AppConfigProvider>
  );
}
