'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { suscripcionesService } from '@/services/finanzasService';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-th-large', badgeKey: null },
  { href: '/dashboard/ingresos', label: 'Ingresos', icon: 'fas fa-arrow-trend-up', badgeKey: null },
  { href: '/dashboard/gastos', label: 'Gastos', icon: 'fas fa-receipt', badgeKey: null },
  { href: '/dashboard/suscripciones', label: 'Suscripciones', icon: 'fas fa-calendar-check', badgeKey: 'subs' },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: 'fas fa-user-circle', badgeKey: null },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: 'fas fa-sliders-h', badgeKey: null },
];

function NavLinks({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const proximas = suscripcionesService.proximasRenovaciones(7);
    setAlertCount(proximas.length);
  }, []);

  return (
    <nav className="flex flex-col pt-3 gap-0.5 px-2">
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
        const showBadge = item.badgeKey === 'subs' && alertCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            title={collapsed ? item.label : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 relative group
              ${collapsed ? 'justify-center' : ''}
              ${isActive
                ? 'bg-[#4e73df] text-white shadow-sm shadow-blue-500/30'
                : 'text-[rgba(255,255,255,0.6)] hover:bg-white/8 hover:text-white'
              }
            `}
          >
            <i
              className={`${item.icon} w-4 text-center text-sm shrink-0
                ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}
            />
            {!collapsed && (
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
            )}
            {showBadge && !collapsed && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1">
                {alertCount}
              </span>
            )}
            {showBadge && collapsed && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Desktop Sidebar ── */
export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen sticky top-0 bg-[#1a1c23] shrink-0
        border-r border-white/5 transition-all duration-300
        ${collapsed ? 'w-[64px] min-w-[64px]' : 'w-[240px] min-w-[240px]'}
      `}
    >
      {/* Logo */}
      <div className={`py-5 border-b border-white/[0.07] ${collapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-[#4e73df] flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <i className="fas fa-wallet text-white text-sm" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm tracking-wide">FinancePro</p>
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium">Freelancer</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        <NavLinks collapsed={collapsed} />
      </div>

      {/* Footer */}
      <div className={`py-4 border-t border-white/[0.07] ${collapsed ? 'px-3 flex justify-center' : 'px-4'}`}>
        {collapsed ? (
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        ) : (
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 text-xs">v1.0 — MVP</span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Mobile Drawer (unchanged behaviour) ── */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[240px] bg-[#1a1c23] z-50 md:hidden transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#4e73df] flex items-center justify-center">
              <i className="fas fa-wallet text-white text-xs" />
            </div>
            <span className="font-bold text-white text-sm">FinancePro</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1" aria-label="Cerrar menú">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="py-2">
          <NavLinks onClose={onClose} />
        </div>
      </aside>
    </>
  );
}
