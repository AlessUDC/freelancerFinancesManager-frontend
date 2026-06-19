'use client';

interface NavbarProps {
  title: string;
  titleIcon?: string;
  onMenuOpen: () => void;
  onLogout: () => void;
  userName?: string;
}

export function Navbar({ title, titleIcon, onMenuOpen, onLogout, userName }: NavbarProps) {
  return (
    <header className="bg-white shadow-sm px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="md:hidden text-gray-500 hover:text-gray-700 transition"
          aria-label="Abrir menú"
          id="btnMenuOpen"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
        <h5 className="font-semibold text-gray-600 m-0 flex items-center gap-2">
          {titleIcon && <i className={`${titleIcon} text-base`}></i>}
          {userName ? `Bienvenido, ${userName}` : title}
        </h5>
      </div>

      {/* Right: logout */}
      <button
        onClick={onLogout}
        id="btnLogout"
        className="flex items-center gap-1.5 text-sm font-medium text-red-500 border border-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200"
      >
        <i className="fas fa-sign-out-alt"></i>
        <span className="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </header>
  );
}
