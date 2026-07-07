'use client';

import { useState, useEffect } from 'react';
import { Sidebar, MobileDrawer } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { AppConfigProvider } from '@/hooks/useAppConfig';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('lsBannerDismissed');
    if (!dismissed) setBannerDismissed(false);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem('lsBannerDismissed', '1');
    setBannerDismissed(true);
  };

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
        <div className="flex min-h-screen bg-[#f3f4f8] items-start">
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
              userName={`${usuario.nombres} ${usuario.apellidoPaterno}`}
              userEmail={usuario.email}
            />
            {/* localStorage warning banner */}
            {!bannerDismissed && (
              <div className="mx-4 mt-3 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 animate-fade-in">
                <i className="fas fa-info-circle mt-0.5 shrink-0 text-blue-500" />
                <p className="flex-1">
                  <span className="font-semibold">Tus datos se almacenan en este navegador.</span>{' '}
                  Si limpias el caché o usas otro dispositivo, perderás tu información. Exporta tus datos regularmente.
                </p>
                <button
                  onClick={dismissBanner}
                  className="shrink-0 text-blue-400 hover:text-blue-700 transition p-0.5"
                  aria-label="Cerrar aviso"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            )}
            <main className="flex-1 p-4 md:p-6 animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </CurrencyProvider>
    </AppConfigProvider>
  );
}
