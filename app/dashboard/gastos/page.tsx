'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { StatCard } from '@/components/StatCard';
import { gastosService, ingresosService } from '@/services/finanzasService';
import { Gasto, GastoCategoria, Ingreso } from '@/types';
import { MONEDAS_DISPONIBLES } from '@/lib/currency';
import { formatLocalDate, isWithinTimeFilter, TimeFilter, daysUntil } from '@/lib/dates';
import { useCurrency } from '@/hooks/useCurrency';
import { useAppConfig } from '@/hooks/useAppConfig';
import { suscripcionesService } from '@/services/finanzasService';
import { ConfirmModal } from '@/components/ConfirmModal';
import { UpcomingPaymentsTimeline } from '@/components/UpcomingPaymentsTimeline';

const CategoryDonut = dynamic(
  () => import('@/components/charts/CategoryDonut').then((m) => m.CategoryDonut),
  { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-xl" /> }
);

const CATEGORIAS: GastoCategoria[] = [
  'TECNOLOGIA_SAAS',
  'SERVICIOS_PUBLICOS_CONECTIVIDAD',
  'COWORKING',
  'EDUCACION_CAPACITACION',
  'IMPUESTOS_LEGAL',
  'PERSONAL',
];

const CATEGORIA_META: Record<GastoCategoria, { label: string; icon: string; color: string; donutColor: string }> = {
  TECNOLOGIA_SAAS: {
    label: 'Herramientas y Saas (Tecnología)',
    icon: '💻',
    color: 'bg-blue-100 text-blue-700',
    donutColor: '#2563EB'
  },
  SERVICIOS_PUBLICOS_CONECTIVIDAD: {
    label: 'Servicios Públicos y Conectividad',
    icon: '🔌',
    color: 'bg-purple-100 text-purple-700',
    donutColor: '#0EA5A4'
  },
  COWORKING: {
    label: 'Espacio de Trabajo y Oficina (Coworking)',
    icon: '☕',
    color: 'bg-cyan-100 text-cyan-700',
    donutColor: '#F59E0B'
  },
  EDUCACION_CAPACITACION: {
    label: 'Educación y Capacitación',
    icon: '📚',
    color: 'bg-red-100 text-red-700',
    donutColor: '#8B5CF6'
  },
  IMPUESTOS_LEGAL: {
    label: 'Impuestos y Legal',
    icon: '💰',
    color: 'bg-red-100 text-red-700',
    donutColor: '#DC2626'
  },
  PERSONAL: {
    label: 'Personal',
    icon: '🏡',
    color: 'bg-amber-100 text-amber-700',
    donutColor: '#7488A3'
  },
};

export default function GastosPage() {
  const { fmt, convert, baseCurrency } = useCurrency();
  const { config } = useAppConfig();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroCat, setFiltroCat] = useState<GastoCategoria | 'TODOS'>('TODOS');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('MES');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);

  const [loading, setLoading] = useState(true);

  // Delete Modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Retiro modal state
  const [retiroOpen, setRetiroOpen] = useState(false);
  const [montoRetiro, setMontoRetiro] = useState('');
  const [cuentaRetiro, setCuentaRetiro] = useState('');

  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [concepto, setConcepto] = useState('');
  const [montoUnitario, setMontoUnitario] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [moneda, setMoneda] = useState('USD');
  const [categoria, setCategoria] = useState<GastoCategoria>('TECNOLOGIA_SAAS');
  const [esDeducible, setEsDeducible] = useState(true);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [fecha, setFecha] = useState('');
  const [igv, setIgv] = useState(config.porcentajeRetencion || 0);

  const refresh = async () => {
    try {
      const [gastosData, ingresosData, subsData] = await Promise.all([
        gastosService.getAll(),
        ingresosService.getAll(),
        suscripcionesService.getAll(),
      ]);
      setGastos(gastosData);
      setIngresos(ingresosData);
      setSuscripciones(subsData);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar gastos');
    }
  };

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
    setEditId(null);
    setConcepto('');
    setMontoUnitario('');
    setCantidad(1);
    setMoneda(baseCurrency || 'USD');
    setCategoria('TECNOLOGIA_SAAS');
    setEsDeducible(true);
    setEsRecurrente(false);
    setFecha('');
    setIgv(config.porcentajeRetencion || 0);
  };

  const openEditModal = (gasto: Gasto) => {
    setEditId(gasto.id);
    setConcepto(gasto.concepto);
    const cant = gasto.cantidad || 1;
    const igvRate = gasto.igv ?? config.porcentajeRetencion ?? 0;
    setCantidad(cant);
    // Revert IGV: monto guardado = unitario * cant * (1 + igv/100) → recuperamos el unitario original
    setMontoUnitario((gasto.monto / cant / (1 + igvRate / 100)).toFixed(2));
    setMoneda(gasto.moneda);
    setCategoria(gasto.categoria);
    setEsDeducible(gasto.esDeducible);
    setEsRecurrente(gasto.esRecurrente || false);
    setFecha(gasto.fecha || '');
    setIgv(igvRate);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const mUnitario = parseFloat(montoUnitario);
    if (!concepto.trim() || isNaN(mUnitario) || mUnitario <= 0 || cantidad < 1) return;

    const montoTotal = mUnitario * cantidad * (1 + (igv / 100));

    const data: Omit<Gasto, 'id'> = {
      concepto: concepto.trim(),
      monto: montoTotal,
      cantidad,
      moneda,
      categoria,
      esDeducible,
      esRecurrente,
      fecha,
      igv
    };

    try {
      if (editId) {
        await gastosService.update(editId, data);
        toast.success(`Gasto "${concepto.trim()}" actualizado ✓`);
      } else {
        await gastosService.add(data);
        toast.success(`Gasto "${concepto.trim()}" guardado ✓`);
      }
      resetForm();
      setModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el gasto');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const item = gastos.find(g => g.id === deleteId);
    try {
      await gastosService.remove(deleteId);
      toast.error(`Gasto "${item?.concepto}" eliminado`);
      refresh();
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoRetiro);
    if (isNaN(monto) || monto <= 0) return;
    // Compute saldo on the fly using current state
    const totalNetos = ingresos
      .filter((i) => i.status === 'PAGADO')
      .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);
    const totalGastos = gastos.reduce((s, g) => s + convert(g.monto, g.moneda), 0);
    const saldoActual = totalNetos - totalGastos;
    if (monto > saldoActual) {
      toast.error('Saldo insuficiente para realizar el retiro');
      return;
    }
    try {
      await gastosService.add({
        concepto: `Retiro a cuenta bancaria: ${cuentaRetiro}`,
        monto,
        moneda: baseCurrency,
        categoria: 'PERSONAL',
        esDeducible: false,
        esRecurrente: false,
        fecha: new Date().toISOString().split('T')[0],
        igv: 0,
        cantidad: 1,
      });
      setRetiroOpen(false);
      setMontoRetiro('');
      toast.success('Retiro registrado exitosamente ✓');
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el retiro');
    }
  };

  // 1. Filtrar gastos según factor tiempo
  const gastosEnTiempo = gastos.filter((g) => isWithinTimeFilter(g.fecha, timeFilter));

  const filtrados = gastosEnTiempo
    .filter((g) => filtroCat === 'TODOS' || g.categoria === filtroCat)
    .filter((g) => !busqueda || g.concepto.toLowerCase().includes(busqueda.toLowerCase()));

  const totalMensual = gastosEnTiempo.reduce((s, g) => s + convert(g.monto, g.moneda), 0);

  // 2. Impacto fiscal
  const taxRate = usuario?.porcentajeImpuesto || 20; // por defecto 20%
  const totalDeducible = gastosEnTiempo
    .filter((g) => g.esDeducible)
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);
  const impactoFiscal = totalDeducible * (taxRate / 100);

  // 3. Fuga de suscripciones
  const totalRecurrentes = gastosEnTiempo
    .filter((g) => g.esRecurrente)
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);
  const totalUnicos = gastosEnTiempo
    .filter((g) => !g.esRecurrente)
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

  // 4. Gastos por pagar (a 30 días)
  const gastosFuturos = gastos
    .filter(g => g.fecha)
    .filter(g => {
      const d = daysUntil(g.fecha!);
      return d > 0 && d <= 30;
    })
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

  const subsFuturas = suscripciones
    .filter(s => s.status === 'ACTIVA' && s.proximaRenovacion)
    .filter(s => {
      const d = daysUntil(s.proximaRenovacion);
      return d >= 0 && d <= 30;
    })
    .reduce((s, sub) => s + convert(sub.monto, sub.moneda), 0);

  const gastosPorPagar30d = gastosFuturos + subsFuturas;

  // 5. Saldo virtual (ingresos PAGADOS netos − todos los gastos registrados)
  const totalIngresosNetos = ingresos
    .filter((i) => i.status === 'PAGADO')
    .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);
  const totalGastosSaldo = gastos.reduce((s, g) => s + convert(g.monto, g.moneda), 0);
  const saldoVirtual = totalIngresosNetos - totalGastosSaldo;

  // Data para dona
  const categoryDonutData = CATEGORIAS
    .map((c) => {
      const sum = gastosEnTiempo.filter((g) => g.categoria === c).reduce((s, g) => s + convert(g.monto, g.moneda), 0);
      return {
        label: CATEGORIA_META[c].label,
        value: sum,
        color: CATEGORIA_META[c].donutColor
      };
    })
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Mis Gastos
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="ml-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-[#e74a3b]"
            >
              <option value="TODOS">Histórico</option>
              <option value="DIA">Hoy</option>
              <option value="SEMANA">Últimos 7 días</option>
              <option value="MES">Este mes</option>
              <option value="AÑO">Este año</option>
            </select>
          </h1>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
            <StatCard
              label="Gasto Total"
              value={fmt(totalMensual)}
              icon="fas fa-calendar-alt"
              accentColor="border-l-[#e74a3b]"
              iconColor="text-[#e74a3b]"
              subLabel="Según filtro de tiempo"
            />
            <StatCard
              label="Gastos por pagar"
              value={fmt(gastosPorPagar30d)}
              icon="fas fa-clock"
              accentColor="border-l-[#4e73df]"
              iconColor="text-[#4e73df]"
              subLabel="Próximos 30 días"
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
              <i className="fas fa-search absolute left-3 top-4/17 -translate-y-1/2 text-gray-400 text-xs" />
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
          <div className="h-full">
            <CategoryDonut
              data={categoryDonutData}
              centerLabel={fmt(totalMensual)}
            />
          </div>
        </div>
      </div>

      {/* ── Panel de Saldo Virtual ─────────────────────────────────────── */}
      <div className="fp-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              saldoVirtual >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <i className={`fas fa-wallet text-lg ${
                saldoVirtual >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Saldo Virtual SaaS</p>
              <p className={`text-2xl font-bold ${
                saldoVirtual >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {saldoVirtual < 0 ? '−' : ''}{fmt(Math.abs(saldoVirtual))}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                💰 Cobrado: <span className="font-semibold text-gray-600">{fmt(totalIngresosNetos)}</span>
                &nbsp;·&nbsp;
                📤 Gastado: <span className="font-semibold text-gray-600">{fmt(totalGastosSaldo)}</span>
              </p>
            </div>
          </div>
          <button
            id="btnRetirarSaldo"
            onClick={() => { setCuentaRetiro(usuario?.cuentaBancaria || ''); setRetiroOpen(true); }}
            disabled={saldoVirtual <= 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-green-500/20 transition-all text-sm"
          >
            <i className="fas fa-arrow-circle-down" /> Retirar a Cuenta
          </button>
        </div>
        {totalIngresosNetos > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
              <span>
                Gastos ({Math.min(100, (totalGastosSaldo / totalIngresosNetos) * 100).toFixed(0)}% de ingresos cobrados)
              </span>
              <span>Libre: {fmt(Math.max(0, saldoVirtual))}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  saldoVirtual >= 0
                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${Math.min(100, (totalGastosSaldo / totalIngresosNetos) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <UpcomingPaymentsTimeline
        gastos={gastos}
        suscripciones={suscripciones}
        categoriaMeta={CATEGORIA_META}
        fmt={fmt}
        onPagarGasto={openEditModal}
      />

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
                  <th className="px-5 py-3 text-left font-semibold">Cantidad</th>
                  <th className="px-5 py-3 text-left font-semibold">Monto Total</th>
                  <th className="px-5 py-3 text-left font-semibold">Categoría</th>
                  <th className="px-5 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-5 py-3 text-left font-semibold">Fiscal</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((item) => {
                  const catMeta = CATEGORIA_META[item.categoria];

                  return (
                    <tr key={item.id}>
                      <td className='px-5 py-3.5'>
                        <span className='font-semibold'>{item.concepto}</span>
                      </td>
                      <td className='px-5 py-3.5 text-gray-600 font-medium'>
                        {item.cantidad || 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#e74a3b]">{fmt(item.monto, item.moneda)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${catMeta ? catMeta.color : 'bg-gray-100 text-gray-700'}`}>
                          {catMeta ? catMeta.icon : ''}
                          {catMeta ? catMeta.label : catMeta}
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
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(item)}
                            className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Editar">
                            <i className="fas fa-edit text-xs" />
                          </button>
                          <button onClick={() => setDeleteId(item.id)}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Eliminar">
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => { setModalOpen(false); resetForm(); }}
        >
          <div className="flex items-center justify-center min-h-full p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <i className={`fas ${editId ? 'fa-edit' : 'fa-plus-circle'} text-[#e74a3b]`} /> {editId ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h5>
              <button onClick={() => { setModalOpen(false); resetForm(); }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputConcepto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Concepto</label>
                <input id="inputConcepto" type="text" required value={concepto} onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Alquiler de oficina, internet, etc."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm transition" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="inputCantidad" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Cantidad</label>
                  <input id="inputCantidad" type="number" required min="1" step="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e74a3b]/30 focus:border-[#e74a3b] text-sm transition" />
                </div>
                <div>
                  <label htmlFor="inputMonto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Monto Unit.</label>
                  <input id="inputMonto" type="number" required min="0.01" step="0.01" value={montoUnitario} onChange={(e) => setMontoUnitario(e.target.value)}
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
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">IGV ({igv}%) incluido</label>
                  <p className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-[#e74a3b] font-semibold">
                    {moneda} {((parseFloat(montoUnitario) || 0) * (igv / (100 + igv))).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Muestra visual de la equivalencia */}
              {moneda !== baseCurrency && (
                <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                  <i className="fas fa-info-circle mr-1" />
                  Monto Total: {cantidad} x {moneda} {parseFloat(montoUnitario) || 0} = <span className="font-bold underline">{fmt(cantidad * (parseFloat(montoUnitario) || 0), moneda)}</span> equivalentes en {baseCurrency}
                </p>
              )}

              {moneda === baseCurrency && (
                <p className="text-xs font-medium text-gray-500 px-1">
                  Monto Total: <span className="font-semibold text-gray-700">{moneda} {(cantidad * (parseFloat(montoUnitario) || 0)).toFixed(2)}</span>
                </p>
              )}

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

              {usuario?.cuentaBancaria && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 shrink-0 text-blue-500" />
                  <p>
                    <strong>Nota:</strong> Este gasto se registrará usando tu cuenta bancaria principal: <span className="font-bold">{usuario.cuentaBancaria}</span>.
                  </p>
                </div>
              )}

              <button type="submit"
                className="w-full py-3 rounded-xl bg-[#e74a3b] hover:bg-[#c0392b] text-white font-bold transition flex items-center justify-center gap-2 text-sm">
                <i className="fas fa-check" /> Guardar Gasto
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* ── Modal de Retiro ─────────────────────────────────────────────── */}
      {retiroOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setRetiroOpen(false)}
        >
          <div className="flex items-center justify-center min-h-full p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <i className="fas fa-arrow-circle-down text-green-500" /> Retirar Saldo a Cuenta
                </h5>
                <button
                  onClick={() => setRetiroOpen(false)}
                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <form onSubmit={handleRetiro} className="px-6 py-5 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-0.5">Saldo disponible</p>
                  <p className="text-2xl font-bold text-green-700">{fmt(saldoVirtual)}</p>
                  <p className="text-xs text-green-500 mt-0.5">Ingresos cobrados menos gastos registrados</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Monto a Retirar ({baseCurrency})
                  </label>
                  <input
                    type="number" required min="0.01" step="0.01"
                    value={montoRetiro}
                    onChange={(e) => setMontoRetiro(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Cuenta Destino</label>
                  <input
                    type="text" required
                    value={cuentaRetiro}
                    onChange={(e) => setCuentaRetiro(e.target.value)}
                    placeholder="Número de cuenta bancaria"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm transition"
                  />
                </div>
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  <i className="fas fa-info-circle mr-1" />
                  El retiro se registrará como gasto en tu historial para mantener el saldo actualizado.
                </p>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-check" /> Confirmar Retiro
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Gasto"
        message="¿Estás seguro que deseas eliminar este gasto de tu historial? Esta acción no se puede deshacer y afectará tu balance e impuestos."
        confirmText="Eliminar"
        intent="danger"
      />
    </div>
  );
}
