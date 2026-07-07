'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

export default function PerfilPage() {
  const { usuario } = useAuth();
  
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [cuentaBancaria, setCuentaBancaria] = useState('');
  
  // Perfil Fiscal
  const [razonSocial, setRazonSocial] = useState('');
  const [rucNif, setRucNif] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      setNombres(usuario.nombres || '');
      setApellidoPaterno(usuario.apellidoPaterno || '');
      setApellidoMaterno(usuario.apellidoMaterno || '');
      setTelefono(usuario.telefono || '');
      setFechaNacimiento(usuario.fechaNacimiento || '');
      setCuentaBancaria(usuario.cuentaBancaria || '');
      if (usuario.perfilFiscal) {
        setRazonSocial(usuario.perfilFiscal.razonSocial || '');
        setRucNif(usuario.perfilFiscal.rucNif || '');
        setDireccionFiscal(usuario.perfilFiscal.direccionFiscal || '');
      }
    }
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updatedUser = await authService.updateUser(usuario.id, {
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        telefono,
        fechaNacimiento,
        cuentaBancaria,
        email: usuario.email,
        perfilFiscal: { razonSocial, rucNif, direccionFiscal }
      });
      localStorage.setItem('usuario', JSON.stringify(updatedUser));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Gestiona tus datos personales y de facturación.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
          <i className="fas fa-check-circle" /> Datos actualizados correctamente.
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <i className="fas fa-exclamation-triangle" /> {error}
        </div>
      )}

      <form id="perfil-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Datos Personales */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fas fa-user text-[#4e73df]" /> Datos Personales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nombres</label>
              <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido Paterno</label>
              <input type="text" value={apellidoPaterno} onChange={e => setApellidoPaterno(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido Materno</label>
              <input type="text" value={apellidoMaterno} onChange={e => setApellidoMaterno(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de Nacimiento</label>
              <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm" />
            </div>
          </div>
        </section>

        {/* Cuenta Bancaria */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fas fa-university text-[#1cc88a]" /> Cuenta Bancaria Principal
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Esta cuenta se utilizará como referencia al registrar pagos de gastos y suscripciones.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cuenta Bancaria (Banco - Número)</label>
            <input type="text" value={cuentaBancaria} onChange={e => setCuentaBancaria(e.target.value)}
              placeholder="Ej. BCP - 194-00000000-0-00"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-sm" />
          </div>
        </section>

        {/* Perfil Fiscal */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fas fa-file-invoice-dollar text-[#f6c23e]" /> Datos de Facturación (Opcional)
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Si facturas a clientes o necesitas emitir recibos, puedes guardar estos datos de tu empresa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Razón Social</label>
              <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)}
                placeholder="Nombre Legal de tu Negocio"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f6c23e]/30 focus:border-[#f6c23e] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Documento (RUC / NIF)</label>
              <input type="text" value={rucNif} onChange={e => setRucNif(e.target.value)}
                placeholder="Número de identificación fiscal"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f6c23e]/30 focus:border-[#f6c23e] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección Fiscal</label>
              <input type="text" value={direccionFiscal} onChange={e => setDireccionFiscal(e.target.value)}
                placeholder="Calle, Ciudad, País"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f6c23e]/30 focus:border-[#f6c23e] text-sm" />
            </div>
          </div>
        </section>
      </form>

      {/* Floating Save Button */}
      <button
        form="perfil-form"
        type="submit"
        disabled={loading}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-blue-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i className={loading ? "fas fa-spinner fa-spin text-lg" : "fas fa-save text-lg"} />
        <span className="hidden sm:inline">{loading ? 'Guardando...' : 'Guardar Perfil'}</span>
      </button>
    </div>
  );
}
