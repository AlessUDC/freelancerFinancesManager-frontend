'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { suscripcionesService } from '@/services/finanzasService';
import { Suscripcion } from '@/types';

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getRenewalBadge(renovacion: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fecha = new Date(renovacion + 'T00:00:00');
  const diffDays = Math.ceil((fecha.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return { label: `${diffDays}d`, color: 'bg-red-100 text-red-700' };
  if (diffDays <= 7) return { label: `${diffDays}d`, color: 'bg-yellow-100 text-yellow-700' };
  return { label: `${diffDays}d`, color: 'bg-gray-100 text-gray-600' };
}

export default function SuscripcionesPage() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [servicio, setServicio] = useState('');
  const [costo, setCosto] = useState('');
  const [renovacion, setRenovacion] = useState('');

  const refresh = () => setSuscripciones(suscripcionesService.getAll());

  useEffect(() => { refresh(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(costo);
    if (!servicio.trim() || isNaN(c) || c <= 0) return;
    suscripcionesService.add({ servicio: servicio.trim(), costo: c, renovacion });
    setServicio(''); setCosto(''); setRenovacion('');
    setModalOpen(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    suscripcionesService.remove(id);
    refresh();
  };

  const total = suscripciones.reduce((s, i) => s + i.costo, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suscripciones</h1>
          <p className="text-gray-500 text-sm">Gestiona tus suscripciones y renovaciones</p>
        </div>
        <button id="btnNuevaSuscripcion" onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200">
          <i className="fas fa-plus"></i> Nueva Suscripción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Suscripciones" value={fmt(total)} icon="fas fa-calendar-check"
          accentColor="border-l-[#4e73df]" iconColor="text-[#4e73df]" />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.08)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <i className="fas fa-list text-[#4e73df]"></i>
          <h6 className="font-bold text-gray-700">Mis Suscripciones</h6>
        </div>

        {suscripciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-calendar-times text-4xl mb-3 opacity-25"></i>
            <p className="mb-3">No hay suscripciones registradas aún.</p>
            <button onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm bg-[#4e73df] text-white px-4 py-2 rounded-lg hover:bg-[#3d5fc9] transition">
              <i className="fas fa-plus"></i> Agregar la primera
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-5 py-3 text-left font-semibold">Costo</th>
                  <th className="px-5 py-3 text-left font-semibold">Renovación</th>
                  <th className="px-5 py-3 text-left font-semibold w-16">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suscripciones.map((item) => {
                  const badge = item.renovacion ? getRenewalBadge(item.renovacion) : null;
                  const fechaStr = item.renovacion
                    ? new Date(item.renovacion + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{item.servicio}</td>
                      <td className="px-5 py-3.5 font-bold text-[#e74a3b]">{fmt(item.costo)}</td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {fechaStr}
                        {badge && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition" title="Eliminar">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fas fa-plus-circle text-[#4e73df]"></i> Nueva Suscripción
              </h5>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputServicio" className="block text-sm font-medium text-gray-700 mb-1.5">Servicio</label>
                <input id="inputServicio" type="text" required value={servicio} onChange={e => setServicio(e.target.value)}
                  placeholder="Ej: Adobe Creative Cloud"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df] transition text-sm" />
              </div>
              <div>
                <label htmlFor="inputCosto" className="block text-sm font-medium text-gray-700 mb-1.5">Costo mensual ($)</label>
                <input id="inputCosto" type="number" required min="0.01" step="0.01" value={costo} onChange={e => setCosto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df] transition text-sm" />
              </div>
              <div>
                <label htmlFor="inputRenovacion" className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de renovación</label>
                <input id="inputRenovacion" type="date" value={renovacion} onChange={e => setRenovacion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df] transition text-sm" />
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-bold transition flex items-center justify-center gap-2">
                <i className="fas fa-check"></i> Guardar Suscripción
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
