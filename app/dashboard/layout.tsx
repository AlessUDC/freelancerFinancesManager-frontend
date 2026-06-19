'use client';

import { useState } from 'react';
import { Sidebar, MobileDrawer } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <i className="fas fa-spinner fa-spin text-3xl text-[#4e73df]"></i>
          <p className="text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          title="Dashboard"
          onMenuOpen={() => setDrawerOpen(true)}
          onLogout={logout}
          userName={usuario.nombre}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
