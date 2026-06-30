'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { suscripcionesService } from '@/services/finanzasService';
import { Suscripcion, SuscripcionCiclo } from '@/types';
import { MONEDAS_DISPONIBLES } from '@/lib/currency';
import { formatLocalDate, renewalBadge } from '@/lib/dates';
import { useCurrency } from '@/hooks/useCurrency';

export default function SuscripcionesPage() {
  const { fmt, baseCurrency } = useCurrency();
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [servicio, setServicio]             = useState('');
  const [monto, setMonto]                   = useState('');
  const [moneda, setMoneda]                 = useState('USD');
  const [ciclo, setCiclo]                   = useState<SuscripcionCiclo>('MENSUAL');
  const [proximaRenovacion, setProximaRen]  = useState('');

  const refresh = () => setSuscripciones(suscripcionesService.getAll());
  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setServicio(''); setMonto(''); setMoneda('USD'); setCiclo('MENSUAL'); setProximaRen('');
  };

  const handleCicloChange = (newCiclo: SuscripcionCiclo) => {
    setCiclo(newCiclo);
    if (proximaRenovacion) {
      const next = suscripcionesService.calcularProximaFecha(proximaRenovacion, newCiclo);
      setProximaRen(next);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(monto);
    if (!servicio.trim() || isNaN(c) || c <= 0) return;
    suscripcionesService.add({
      servicio: servicio.trim(),
      monto: c,
      moneda,
      ciclo,
      proximaRenovacion,
      status: 'ACTIVA',
    });
    resetForm();
    setModalOpen(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    suscripcionesService.remove(id);
    refresh();
  };


  const filtered = suscripciones.filter((s) =>
    !busqueda || s.servicio.toLowerCase().includes(busqueda.toLowerCase())
  );
  const activas  = filtered.filter((s) => s.status === 'ACTIVA');
  const totalMensual = suscripcionesService.costoMensualActivo();
  const costoAnualProyectado = totalMensual * 12;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Suscripciones</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona suscripciones y sus ciclos de renovación · montos en {baseCurrency}</p>
        </div>
        <button
          id="btnNuevaSuscripcion"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 transition-all text-sm"
        >
          <i className="fas fa-plus" /> Nueva Suscripción
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <StatCard label="Costo Mensual Estimado" value={fmt(totalMensual)}
          icon="fas fa-redo-alt" accentColor="border-l-[#4e73df]" iconColor="text-[#4e73df]" />
        <StatCard label="Costo Anual Proyectado" value={fmt(costoAnualProyectado)}
          icon="fas fa-chart-line" accentColor="border-l-[#f6c23e]" iconColor="text-[#f6c23e]" />
        <StatCard label="Suscripciones Activas" value={`${activas.length}`}
          icon="fas fa-check-circle" accentColor="border-l-[#1cc88a]" iconColor="text-[#1cc88a]" />
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-xs">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-8 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] bg-white w-full"
        />
      </div>

      {/* Tabla activas */}
      <div className="fp-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <h6 className="font-bold text-gray-700 text-sm">Suscripciones ({activas.length})</h6>
        </div>
        {activas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-calendar-times text-3xl mb-3 opacity-20" />
            <p className="text-sm">No hay suscripciones registradas.</p>
          </div>
        ) : (
          <SuscripcionesTable rows={activas} onDelete={handleDelete} onEdit={() => alert('Modo de edición en desarrollo')} fmt={fmt} baseCurrency={baseCurrency} />
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <i className="fas fa-plus-circle text-[#4e73df]" /> Nueva Suscripción
              </h5>
              <button onClick={() => { setModalOpen(false); resetForm(); }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputServicio" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Servicio</label>
                <input id="inputServicio" type="text" required value={servicio} onChange={(e) => setServicio(e.target.value)}
                  placeholder="Ej: Adobe Creative Cloud"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inputMonto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Costo</label>
                  <input id="inputMonto" type="number" required min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm transition" />
                </div>
                <div>
                  <label htmlFor="inputMonedaSub" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Moneda</label>
                  <select id="inputMonedaSub" value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm bg-white transition">
                    {MONEDAS_DISPONIBLES.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ciclo de facturación</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['MENSUAL', 'ANUAL'] as SuscripcionCiclo[]).map((c) => (
                    <button key={c} type="button" onClick={() => handleCicloChange(c)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                        ciclo === c
                          ? 'bg-[#4e73df] text-white border-[#4e73df] shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#4e73df]'
                      }`}>
                      {c === 'MENSUAL' ? '📅 Mensual' : '🗓️ Anual'}
                    </button>
                  ))}
                </div>
                {ciclo === 'ANUAL' && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                    ⚠️ Pago único anual. El sistema calculará el costo mensual equivalente.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="inputRenovacion" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Próxima renovación</label>
                <input id="inputRenovacion" type="date" value={proximaRenovacion} onChange={(e) => setProximaRen(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm transition" />
              </div>

              <button type="submit"
                className="w-full py-3 rounded-xl bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-bold transition flex items-center justify-center gap-2 text-sm">
                <i className="fas fa-check" /> Guardar Suscripción
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tabla reutilizable ────────────────────────────────────────────────── */
function SuscripcionesTable({
  rows,
  onDelete,
  onEdit,
  fmt,
  baseCurrency,
}: {
  rows: Suscripcion[];
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  fmt: (amount: number, from?: string) => string;
  baseCurrency: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm fp-table">
        <thead className="bg-gray-50/70 text-gray-400 uppercase text-[10px] tracking-wider">
          <tr>
            <th className="px-5 py-3 text-left font-semibold">Servicio</th>
            <th className="px-5 py-3 text-left font-semibold">Costo ({baseCurrency})</th>
            <th className="px-5 py-3 text-left font-semibold">Ciclo</th>
            <th className="px-5 py-3 text-left font-semibold">Renovación</th>
            <th className="px-5 py-3 text-left font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((item) => {
            const badge = item.proximaRenovacion ? renewalBadge(item.proximaRenovacion) : null;
            return (
              <tr key={item.id}>
                <td className="px-5 py-3.5 font-semibold text-gray-800">{item.servicio}</td>
                <td className="px-5 py-3.5">
                  <span className="font-bold text-[#e74a3b]">{fmt(item.monto, item.moneda)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${item.ciclo === 'ANUAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.ciclo}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {item.proximaRenovacion ? (
                    <>
                      {formatLocalDate(item.proximaRenovacion)}
                      {badge && <span className={`ml-2 badge ${badge.color}`}>{badge.label}</span>}
                    </>
                  ) : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onEdit(item.id)} title="Editar"
                      className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition">
                      <i className="fas fa-pencil-alt text-[10px]" />
                    </button>
                    <button onClick={() => onDelete(item.id)} title="Eliminar"
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition">
                      <i className="fas fa-trash-alt text-[10px]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
