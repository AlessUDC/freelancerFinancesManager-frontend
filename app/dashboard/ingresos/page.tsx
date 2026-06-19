'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { ingresosService } from '@/services/finanzasService';
import { Ingreso } from '@/types';

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');

  const refresh = () => setIngresos(ingresosService.getAll());

  useEffect(() => { refresh(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(monto);
    if (!concepto.trim() || isNaN(m) || m <= 0) return;
    ingresosService.add({ concepto: concepto.trim(), monto: m, fecha });
    setConcepto(''); setMonto(''); setFecha('');
    setModalOpen(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este ingreso?')) return;
    ingresosService.remove(id);
    refresh();
  };

  const total = ingresos.reduce((s, i) => s + i.monto, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Ingresos</h1>
          <p className="text-gray-500 text-sm">Registro de todos tus ingresos freelance</p>
        </div>
        <button
          id="btnNuevoIngreso"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#1cc88a] hover:bg-[#17a874] text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-green-500/20 transition-all duration-200"
        >
          <i className="fas fa-plus"></i> Nuevo Ingreso
        </button>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Ingresos" value={fmt(total)} icon="fas fa-dollar-sign"
          accentColor="border-l-[#1cc88a]" iconColor="text-[#1cc88a]" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.08)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <i className="fas fa-list text-[#1cc88a]"></i>
          <h6 className="font-bold text-gray-700">Historial de Ingresos</h6>
        </div>

        {ingresos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-inbox text-4xl mb-3 opacity-25"></i>
            <p className="mb-3">No hay ingresos registrados aún.</p>
            <button onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm bg-[#1cc88a] text-white px-4 py-2 rounded-lg hover:bg-[#17a874] transition">
              <i className="fas fa-plus"></i> Agregar el primero
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Concepto</th>
                  <th className="px-5 py-3 text-left font-semibold">Monto</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-5 py-3 text-left font-semibold w-16">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ingresos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{item.concepto}</td>
                    <td className="px-5 py-3.5 font-bold text-[#1cc88a]">{fmt(item.monto)}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {item.fecha
                        ? new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition" title="Eliminar">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fas fa-plus-circle text-[#1cc88a]"></i> Nuevo Ingreso
              </h5>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputConcepto" className="block text-sm font-medium text-gray-700 mb-1.5">Concepto</label>
                <input id="inputConcepto" type="text" required value={concepto} onChange={e => setConcepto(e.target.value)}
                  placeholder="Ej: Proyecto Ecommerce"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] transition text-sm" />
              </div>
              <div>
                <label htmlFor="inputMonto" className="block text-sm font-medium text-gray-700 mb-1.5">Monto ($)</label>
                <input id="inputMonto" type="number" required min="0.01" step="0.01" value={monto} onChange={e => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] transition text-sm" />
              </div>
              <div>
                <label htmlFor="inputFecha" className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
                <input id="inputFecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a] transition text-sm" />
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl bg-[#1cc88a] hover:bg-[#17a874] text-white font-bold transition flex items-center justify-center gap-2">
                <i className="fas fa-check"></i> Guardar Ingreso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
