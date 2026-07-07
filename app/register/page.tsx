'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function RegisterPage() {
  const router = useRouter();
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register({ nombres, apellidoPaterno, apellidoMaterno, telefono, fechaNacimiento, email, password });
      router.push('/?registered=1');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar. Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1c23] via-[#2c2f3f] to-[#1a1c23] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1cc88a] mb-4 shadow-lg shadow-green-500/30">
            <i className="fas fa-user-plus text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white">FinancePro</h1>
          <p className="text-gray-400 mt-1 text-sm">Crea tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Crear Cuenta</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="nombres" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nombres
                </label>
                <input id="nombres" type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Juan Carlos"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition" />
              </div>
              
              <div>
                <label htmlFor="apellidoPaterno" className="block text-sm font-medium text-gray-300 mb-1.5">Apellido Paterno</label>
                <input id="apellidoPaterno" type="text" required value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)}
                  placeholder="Ej. Pérez"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition" />
              </div>

              <div>
                <label htmlFor="apellidoMaterno" className="block text-sm font-medium text-gray-300 mb-1.5">Apellido Materno</label>
                <input id="apellidoMaterno" type="text" required value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)}
                  placeholder="Ej. Gómez"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition" />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono</label>
                <input id="telefono" type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +1 234 567 8900"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition" />
              </div>

              <div>
                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-300 mb-1.5">Fecha Nacimiento</label>
                <input id="fechaNacimiento" type="date" required value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btnRegister"
              className="w-full py-3 px-4 rounded-xl bg-[#1cc88a] hover:bg-[#17a874] text-white font-semibold transition-all duration-200 shadow-lg shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Registrando...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Registrarse
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/" className="text-[#1cc88a] hover:text-green-400 font-medium transition">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
