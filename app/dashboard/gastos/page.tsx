'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/StatCard';
import { gastosService } from '@/services/finanzasService';
import { Gasto, GastoCategoria } from '@/types';
import { MONEDAS_DISPONIBLES } from '@/lib/currency';
import { formatLocalDate } from '@/lib/dates';
import { useCurrency } from '@/hooks/useCurrency';

const CategoryDonut = dynamic(
  () => import('@/components/charts/CategoryDonut').then((m) => m.CategoryDonut),
  { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-xl" /> }
);

const CATEGORIAS: GastoCategoria[] = [
  'TECNOLOGIA_SAAS',
  'EQUIPAMIENTO_HARDWARE',
  'INFRAESTRUCTURA_OFICINA',
  'MARKETING_SERVICIOS',
];

const CATEGORIA_META: Record<GastoCategoria, { label: string; icon: string; color: string; donutColor: string }> = {
  TECNOLOGIA_SAAS: {
    label: 'Tecnología/SaaS',
    icon: 'fas fa-cloud',
    color: 'bg-blue-100 text-blue-700',
    donutColor: '#4e73df'
  },
  EQUIPAMIENTO_HARDWARE: {
    label: 'Equipamiento/Hardware',
    icon: 'fas fa-laptop',
    color: 'bg-purple-100 text-purple-700',
    donutColor: '#9b59b6'
  },
  INFRAESTRUCTURA_OFICINA: {
    label: 'Infraestructura/Oficina',
    icon: 'fas fa-building',
    color: 'bg-cyan-100 text-cyan-700',
    donutColor: '#36b9cc'
  },
  MARKETING_SERVICIOS: {
    label: 'Marketing/Servicios',
    icon: 'fas fa-bullhorn',
    color: 'bg-red-100 text-red-700',
    donutColor: '#e74a3b'
  },
};

export default function GastosPage() {
  const { fmt, convert, baseCurrency } = useCurrency();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroCat, setFiltroCat] = useState<GastoCategoria | 'TODOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  // Form State
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [categoria, setCategoria] = useState<GastoCategoria>('TECNOLOGIA_SAAS');
  const [esDeducible, setEsDeducible] = useState(true);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [fecha, setFecha] = useState('');

  const refresh = () => setGastos(gastosService.getAll());

  useEffect(() => {
    refresh();
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser));
      } catch { }
    }
  }, []);

  const resetForm = () => {
    setConcepto('');
    setMonto('');
    setMoneda(baseCurrency || 'USD');
    setCategoria('TECNOLOGIA_SAAS');
    setEsDeducible(true);
    setEsRecurrente(false);
    setFecha('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(monto);
    if (!concepto.trim() || isNaN(m) || m <= 0) return;
    gastosService.add({
      concepto: concepto.trim(),
      monto: m,
      moneda,
      categoria,
      esDeducible,
      esRecurrente,
      fecha
    });
    resetForm();
    setModalOpen(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    gastosService.remove(id);
    refresh();
  };

  const filtrados = gastos
    .filter((g) => filtroCat === 'TODOS' || g.categoria === filtroCat)
    .filter((g) => !busqueda || g.concepto.toLowerCase().includes(busqueda.toLowerCase()));

  // 1. Gasto total mensual (del mes calendario actual en baseCurrency)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const totalMensual = gastos
    .filter((g) => {
      if (!g.fecha) return false;
      const d = new Date(g.fecha + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

  // 2. Impacto fiscal (dinero deducido en impuestos: deductible_expenses * tax_rate)
  const taxRate = usuario?.porcentajeImpuesto || 20; // por defecto 20%
  const totalDeducible = gastos
    .filter((g) => g.esDeducible)
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);
  const impactoFiscal = totalDeducible * (taxRate / 100);

  // 3. Fuga de suscripciones (dinero invertido en recurrentes VS únicos)
  const totalRecurrentes = gastos
    .filter((g) => g.esRecurrente)
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);
  const totalUnicos = gastos
    .filter((g) => !g.esRecurrente)
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

  // Data para dona
  const categoryDonutData = CATEGORIAS
    .map((c) => {
      const sum = gastos.filter((g) => g.categoria === c).reduce((s, g) => s + convert(g.monto, g.moneda), 0);
      return { label: CATEGORIA_META[c].label, value: sum, color: CATEGORIA_META[c].donutColor };
    })
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mis Gastos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Control de egresos, recurrencias e impacto fiscal · montos en {baseCurrency}</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#e74a3b] hover:bg-[#c0392b] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-red-500/20 transition-all text-sm"
        >
          <i className="fas fa-plus" /> Nuevo Gasto
        </button>
      </div>

      {/* Layout de dos columnas: widgets + dona */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stat cards (apiladas en columna izq) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
            <StatCard
              label="Gasto Total Mensual"
              value={fmt(totalMensual)}
              icon="fas fa-calendar-alt"
              accentColor="border-l-[#e74a3b]"
              iconColor="text-[#e74a3b]"
              subLabel="Acumulado este mes"
            />
            <StatCard
              label="Impacto Fiscal"
              value={fmt(impactoFiscal)}
              icon="fas fa-percentage"
              accentColor="border-l-[#1cc88a]"
              iconColor="text-[#1cc88a]"
              subLabel={`Ahorro estimado (${taxRate}% tasa)`}
            />
            <StatCard
              label="Fuga de Suscripciones"
              value={`${fmt(totalRecurrentes)}`}
              icon="fas fa-redo"
              accentColor="border-l-[#f6c23e]"
              iconColor="text-[#f6c23e]"
              subLabel={`Recurrentes vs ${fmt(totalUnicos)} únicos`}
            />
          </div>

          {/* Filtros + búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFiltroCat('TODOS')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${filtroCat === 'TODOS' ? 'bg-[#e74a3b] text-white border-[#e74a3b]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#e74a3b] hover:text-[#e74a3b]'
                  }`}>Todos</button>
              {CATEGORIAS.map((c) => (
                <button key={c} onClick={() => setFiltroCat(c)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${filtroCat === c ? 'bg-[#e74a3b] text-white border-[#e74a3b]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#e74a3b] hover:text-[#e74a3b]'
                    }`}>
                  {CATEGORIA_META[c].label}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Buscar concepto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] bg-white w-full sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Dona */}
        <div className="fp-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-chart-pie text-purple-500 text-sm" />
            <h6 className="font-bold text-gray-700 text-sm">Distribución de Gastos</h6>
          </div>
          <div className="h-44">
            <CategoryDonut data={categoryDonutData} />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="fp-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
          <i className="fas fa-list text-[#e74a3b] text-sm" />
          <h6 className="font-bold text-gray-700 text-sm">Historial de Gastos</h6>
          <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {filtrados.length} registros
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <i className="fas fa-inbox text-4xl mb-3 opacity-20" />
            <p className="text-sm mb-3">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay gastos registrados.'}
            </p>
            {!busqueda && (
              <button onClick={() => { resetForm(); setModalOpen(true); }}
                className="inline-flex items-center gap-2 text-sm bg-[#e74a3b] text-white px-4 py-2 rounded-xl hover:bg-[#c0392b] transition">
                <i className="fas fa-plus" /> Agregar el primero
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm fp-table">
              <thead className="bg-gray-50/70 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Concepto</th>
                  <th className="px-5 py-3 text-left font-semibold">Monto ({baseCurrency})</th>
                  <th className="px-5 py-3 text-left font-semibold">Categoría</th>
                  <th className="px-5 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-5 py-3 text-left font-semibold">Fiscal</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((item) => {
                  const catMeta = CATEGORIA_META[item.categoria];
                  return (
                    <tr key={item.id}>
                      <td className='px-5 py-3.5'>
                        <span className='font-semibold'>{item.concepto}</span>
                        <span className='ml-1.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded'>{item.moneda}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#e74a3b]">{fmt(item.monto, item.moneda)}</span>
                        {item.moneda !== baseCurrency && (
                          <span className="ml-1.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.moneda}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${catMeta ? catMeta.color : 'bg-gray-100 text-gray-700'}`}>
                          <i className={`${catMeta ? catMeta.icon : 'fas fa-receipt'} mr-1 text-[10px]`} />
                          {catMeta ? catMeta.label : item.categoria}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {item.esRecurrente ? (
                          <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                            <i className="fas fa-redo text-[9px] mr-1" /> Fijo / Recurrente
                          </span>
                        ) : (
                          <span className="badge bg-slate-50 text-slate-500">
                            Único
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.esDeducible
                          ? <span className="badge bg-green-50 text-green-700 border border-green-200">✓ Deducible</span>
                          : <span className="badge bg-gray-50 text-gray-500">No deducible</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {item.fecha ? formatLocalDate(item.fecha) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleDelete(item.id)}
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Eliminar">
                          <i className="fas fa-trash-alt text-xs" />
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <i className="fas fa-plus-circle text-[#e74a3b]" /> Nuevo Gasto
              </h5>
              <button onClick={() => { setModalOpen(false); resetForm(); }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputConcepto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Concepto</label>
                <input id="inputConcepto" type="text" required value={concepto} onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Alquiler de oficina, internet, etc."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inputMonto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Monto</label>
                  <input id="inputMonto" type="number" required min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm transition" />
                </div>
                <div>
                  <label htmlFor="inputMonedaGasto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Moneda</label>
                  <select id="inputMonedaGasto" value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm bg-white transition">
                    {MONEDAS_DISPONIBLES.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="inputCategoria" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Categoría</label>
                <select id="inputCategoria" value={categoria} onChange={(e) => setCategoria(e.target.value as GastoCategoria)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm bg-white transition">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_META[c].label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="inputFechaGasto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha</label>
                <input id="inputFechaGasto" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm transition" />
              </div>

              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Configuración del Gasto</p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={esRecurrente} onChange={(e) => setEsRecurrente(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">¿Es un Gasto Fijo / Recurrente?</span>
                    <p className="text-xs text-gray-400">Se repite de forma mensual (ej: Coworking, Internet, etc.)</p>
                  </div>
                </label>

                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200/60 bg-white">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">¿Es Gasto Deducible?</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {esDeducible
                        ? 'Sí · Vinculado al negocio (ej. hosting, herramientas)'
                        : 'No · Gasto personal (ej. almuerzo, café)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEsDeducible(!esDeducible)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${esDeducible ? 'bg-[#1cc88a]' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${esDeducible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>

              <button type="submit"
                className="w-full py-3 rounded-xl bg-[#e74a3b] hover:bg-[#c0392b] text-white font-bold transition flex items-center justify-center gap-2 text-sm">
                <i className="fas fa-check" /> Guardar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
