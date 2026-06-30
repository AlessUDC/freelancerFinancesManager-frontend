'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface NavbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

/** Breadcrumb label for each route segment */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  ingresos: 'Ingresos',
  gastos: 'Gastos',
  suscripciones: 'Suscripciones',
  perfil: 'Mi Perfil',
  configuracion: 'Configuración',
};

function useBreadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean); // ['dashboard', 'ingresos', ...]
  return parts.map((seg) => ({
    label: ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/' + parts.slice(0, parts.indexOf(seg) + 1).join('/'),
  }));
}

/** Moon SVG */
function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

/** Sun SVG */
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar({
  sidebarCollapsed,
  onToggleSidebar,
  onLogout,
  userName = 'Usuario',
  userEmail = '',
}: NavbarProps) {
  const breadcrumbs = useBreadcrumb();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* ── Left: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3">
        {/* Hamburger — works on all breakpoints */}
        <button
          id="btnToggleSidebar"
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition"
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <i className="fas fa-bars text-sm" />
        </button>
      </div>

      {/* ── Right: dark mode toggle + user dropdown ── */}
      <div className="flex items-center gap-2">
        {/* Dark / Light mode toggle (prototype) */}
        <button
          id="btnDarkMode"
          onClick={() => setDarkMode((d) => !d)}
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="btnUserMenu"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition group"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-[#4e73df] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {initials}
            </div>
            {/* Name + email */}
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-semibold text-gray-800 leading-none">{userName}</p>
              {userEmail && (
                <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{userEmail}</p>
              )}
            </div>
            {/* Chevron */}
            <i
              className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'} text-[10px] text-gray-400 group-hover:text-gray-600 transition-transform duration-200`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              id="userDropdown"
              className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/60 py-1 animate-scale-in z-50"
            >
              <Link
                href="/dashboard/perfil"
                id="linkVerPerfil"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <i className="fas fa-user-circle text-[#4e73df] w-4 text-center" />
                Ver mi perfil
              </Link>
              <div className="border-t border-gray-50 my-1" />
              <button
                id="btnLogout"
                onClick={() => { setDropdownOpen(false); onLogout(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
              >
                <i className="fas fa-sign-out-alt w-4 text-center" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
