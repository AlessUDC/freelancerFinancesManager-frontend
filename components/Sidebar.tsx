'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { href: '/dashboard/ingresos', label: 'Ingresos', icon: 'fas fa-chart-line' },
  { href: '/dashboard/gastos', label: 'Gastos', icon: 'fas fa-shopping-cart' },
  { href: '/dashboard/suscripciones', label: 'Suscripciones', icon: 'fas fa-calendar-check' },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: 'fas fa-user-circle' },
];

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col pt-2">
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-6 py-3.5 text-sm font-medium border-l-[3px] transition-all duration-200
              ${
                isActive
                  ? 'bg-[rgba(78,115,223,0.15)] text-white border-l-[#4e73df]'
                  : 'text-[rgba(255,255,255,0.65)] border-l-transparent hover:bg-[rgba(255,255,255,0.07)] hover:text-white'
              }`}
          >
            <i className={`${item.icon} w-5 text-center`}></i>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Desktop Sidebar ── */
export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[250px] min-w-[250px] min-h-screen bg-[#1a1c23] flex-shrink-0">
      <div className="px-6 py-5 font-bold text-white uppercase tracking-widest text-sm border-b border-white/[0.08]">
        <i className="fas fa-wallet me-2 text-[#4e73df]"></i> FinancePro
      </div>
      <NavLinks />
    </aside>
  );
}

/* ── Mobile Drawer ── */
export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#1a1c23] z-50 md:hidden transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <span className="font-bold text-white text-sm uppercase tracking-widest">
            <i className="fas fa-wallet me-2 text-[#4e73df]"></i> FinancePro
          </span>
          <button onClick={onClose} className="text-white/60 hover:text-white transition" aria-label="Cerrar menú">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        <NavLinks onClose={onClose} />
      </aside>
    </>
  );
}
