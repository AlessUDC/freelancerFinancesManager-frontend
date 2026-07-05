'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { RunwayWidget } from '@/components/RunwayWidget';
import { TaxCowWidget } from '@/components/TaxCowWidget';
import { RenewalAlert } from '@/components/RenewalAlert';
import { toast } from 'react-toastify';
import { ingresosService, gastosService, suscripcionesService } from '@/services/finanzasService';
import { Suscripcion, Ingreso, Gasto } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { useAppConfig } from '@/hooks/useAppConfig';
import { formatLocalDate, renewalBadge, TimeFilter, isWithinTimeFilter } from '@/lib/dates';

// Chart cargado dinámicamente (sin SSR) para evitar errores de window
const MonthlyBarChart = dynamic(
  () => import('@/components/charts/MonthlyBarChart').then((m) => m.MonthlyBarChart),
  { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-xl" /> }
);
const CategoryDonut = dynamic(
  () => import('@/components/charts/CategoryDonut').then((m) => m.CategoryDonut),
  { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-xl" /> }
);

/* ── helpers ── */
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CAT_COLORS: Record<string, string> = {
  TECNOLOGIA_SAAS: '#2563EB',
  SERVICIOS_PUBLICOS_CONECTIVIDAD: '#0EA5A4',
  COWORKING: '#F59E0B',
  EDUCACION_CAPACITACION: '#8B5CF6',
  IMPUESTOS_LEGAL: '#DC2626',
  PERSONAL: '#7488A3',
};

const CAT_LABELS: Record<string, string> = {
  TECNOLOGIA_SAAS: 'Herramientas y Saas (Tecnología)',
  SERVICIOS_PUBLICOS_CONECTIVIDAD: 'Servicios Públicos y Conectividad',
  COWORKING: 'Espacio de Trabajo y Oficina (Coworking)',
  EDUCACION_CAPACITACION: 'Educación y Capacitación',
  IMPUESTOS_LEGAL: 'Impuestos y Legal',
  PERSONAL: 'Personal',
};

function buildChartData(ingresos: Ingreso[], gastos: Gasto[], convert: (a: number, from: string) => number, timeFilter: TimeFilter) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (timeFilter === 'AÑO') {
    // 12 months of the current year
    return Array.from({ length: 12 }, (_, i) => {
      const ing = ingresos.filter((x) => { const fd = new Date(x.fecha || Date.now()); return fd.getMonth() === i && fd.getFullYear() === currentYear; }).reduce((s, x) => s + convert(x.montoNeto, x.moneda), 0);
      const gas = gastos.filter((x) => { const fd = new Date(x.fecha || Date.now()); return fd.getMonth() === i && fd.getFullYear() === currentYear; }).reduce((s, x) => s + convert(x.monto, x.moneda), 0);
      return { month: MESES[i], ingresos: ing, gastos: gas };
    });
  }

  if (timeFilter === 'MES') {
    // 4 weeks approximation
    return Array.from({ length: 4 }, (_, i) => {
      // Very simple approximation: 1-7, 8-14, 15-21, 22-end
      const startDay = i * 7 + 1;
      const endDay = i === 3 ? 31 : (i + 1) * 7;

      const ing = ingresos.filter((x) => { const fd = new Date(x.fecha || Date.now()); return fd.getMonth() === currentMonth && fd.getFullYear() === currentYear && fd.getDate() >= startDay && fd.getDate() <= endDay; }).reduce((s, x) => s + convert(x.montoNeto, x.moneda), 0);
      const gas = gastos.filter((x) => { const fd = new Date(x.fecha || Date.now()); return fd.getMonth() === currentMonth && fd.getFullYear() === currentYear && fd.getDate() >= startDay && fd.getDate() <= endDay; }).reduce((s, x) => s + convert(x.monto, x.moneda), 0);
      return { month: `Sem ${i + 1}`, ingresos: ing, gastos: gas };
    });
  }

  if (timeFilter === 'SEMANA') {
    // Last 7 days
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const targetStr = formatLocalDate(d.toISOString());

      const ing = ingresos.filter((x) => formatLocalDate(x.fecha || new Date().toISOString()) === targetStr).reduce((s, x) => s + convert(x.montoNeto, x.moneda), 0);
      const gas = gastos.filter((x) => formatLocalDate(x.fecha || new Date().toISOString()) === targetStr).reduce((s, x) => s + convert(x.monto, x.moneda), 0);
      return { month: targetStr.split(' ')[0], ingresos: ing, gastos: gas };
    });
  }

  if (timeFilter === 'DIA') {
    const todayStr = formatLocalDate(now.toISOString());
    const ing = ingresos.filter((x) => formatLocalDate(x.fecha || new Date().toISOString()) === todayStr).reduce((s, x) => s + convert(x.montoNeto, x.moneda), 0);
    const gas = gastos.filter((x) => formatLocalDate(x.fecha || new Date().toISOString()) === todayStr).reduce((s, x) => s + convert(x.monto, x.moneda), 0);
    return [{ month: 'Hoy', ingresos: ing, gastos: gas }];
  }

  // TODOS: group by year
  const years = Array.from(new Set([...ingresos, ...gastos].map(x => new Date(x.fecha || Date.now()).getFullYear()))).sort((a, b) => a - b);
  if (years.length === 0) return [{ month: currentYear.toString(), ingresos: 0, gastos: 0 }];
  return years.map(y => {
    const ing = ingresos.filter((x) => new Date(x.fecha || Date.now()).getFullYear() === y).reduce((s, x) => s + convert(x.montoNeto, x.moneda), 0);
    const gas = gastos.filter((x) => new Date(x.fecha || Date.now()).getFullYear() === y).reduce((s, x) => s + convert(x.monto, x.moneda), 0);
    return { month: y.toString(), ingresos: ing, gastos: gas };
  });
}

function buildCategoryData(gastos: Gasto[], convert: (a: number, from: string) => number) {
  const map: Record<string, number> = {};
  gastos.forEach((g) => {
    map[g.categoria] = (map[g.categoria] || 0) + convert(g.monto, g.moneda);
  });
  return Object.entries(map)
    .map(([label, value]) => ({
      label: CAT_LABELS[label] || label,
      value,
      color: CAT_COLORS[label] || '#9CA3AF'
    }))
    .sort((a, b) => b.value - a.value);
}

export default function DashboardPage() {
  const { fmt, convert, baseCurrency, loading: ratesLoading } = useCurrency();
  const { config } = useAppConfig();

  const [totalIngresosFiltrados, setTotalIngresosFiltrados] = useState(0);
  const [totalGastosFiltrados, setTotalGastosFiltrados] = useState(0);
  const [totalGastosDeduciblesFiltrados, setTotalGastosDeduciblesFiltrados] = useState(0);

  // Historical data for Runway
  const [balanceHistorico, setBalanceHistorico] = useState(0);
  const [gastoMensualActual, setGastoMensualActual] = useState(0);

  const [timeFilter, setTimeFilterState] = useState<TimeFilter>('TODOS');

  const setTimeFilter = (val: TimeFilter) => {
    setTimeFilterState(val);
    localStorage.setItem('fp_time_filter', val);
  };
  const [renovaciones, setRenovaciones] = useState<Suscripcion[]>([]);
  const [alertas, setAlertas] = useState<Suscripcion[]>([]);
  const [ingresosPendientes, setIngresosPendientes] = useState<Ingreso[]>([]);
  const [costoSubs, setCostoSubs] = useState(0);
  const [porcentajeImpuesto, setPorcentajeImpuesto] = useState(20);
  const [monthlyData, setMonthlyData] = useState<{ month: string; ingresos: number; gastos: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ label: string; value: number; color: string }[]>([]);

  // ── Función de carga reutilizable (evita window.location.reload) ──────
  const loadData = () => {
    const ingresos = ingresosService.getAll();
    const gastos = gastosService.getAll();
    const subs = suscripcionesService.getAll();

    // 1. Histórico global (necesario para el Runway - cuánto dinero hay realmente)
    const ingHistorico = ingresos
      .filter((i) => i.status === 'PAGADO')
      .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);
    const gasHistorico = gastos.reduce((s, g) => s + convert(g.monto, g.moneda), 0);
    setBalanceHistorico(ingHistorico - gasHistorico);

    // 2. Gasto mensual promedio (Runway) — promedio de los últimos 6 meses + costo fijo de suscripciones
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Collect monthly totals for the last 6 months (gastos registrados)
    const monthlyTotals: number[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const total = gastos
        .filter((g) => { if (!g.fecha) return false; const fd = new Date(g.fecha + 'T00:00:00'); return fd.getMonth() === m && fd.getFullYear() === y; })
        .reduce((s, g) => s + convert(g.monto, g.moneda), 0);
      monthlyTotals.push(total);
    }
    const monthsWithData = monthlyTotals.filter(t => t > 0);
    const avgHistoricBurn = monthsWithData.length > 0
      ? monthsWithData.reduce((a, b) => a + b, 0) / monthsWithData.length
      : 0;
    // Añadir costo mensual de suscripciones activas (convertido a moneda base)
    const costoSubsMensual = subs
      .filter((s) => s.status === 'ACTIVA')
      .reduce((sum, s) => sum + convert(s.ciclo === 'ANUAL' ? s.monto / 12 : s.monto, s.moneda), 0);
    const avgMonthlyBurn = avgHistoricBurn + costoSubsMensual;
    setGastoMensualActual(avgMonthlyBurn);

    // 3. Filtrados por el período seleccionado (para las StatCards y TaxCow)
    const ingFiltrado = ingresos
      .filter((i) => i.status === 'PAGADO' && isWithinTimeFilter(i.fecha, timeFilter))
      .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);

    const gasFiltrado = gastos
      .filter((g) => isWithinTimeFilter(g.fecha, timeFilter))
      .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

    const gasDeducibleFiltrado = gastos
      .filter((g) => g.esDeducible && isWithinTimeFilter(g.fecha, timeFilter))
      .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

    setTotalIngresosFiltrados(ingFiltrado);
    setTotalGastosFiltrados(gasFiltrado);
    setTotalGastosDeduciblesFiltrados(gasDeducibleFiltrado);

    const proxSubs = subs
      .filter((s) => s.proximaRenovacion && s.status === 'ACTIVA')
      .sort((a, b) => new Date(a.proximaRenovacion).getTime() - new Date(b.proximaRenovacion).getTime())
      .slice(0, 5);
    setRenovaciones(proxSubs);
    setAlertas(suscripcionesService.proximasRenovaciones(7));

    // Ingresos pendientes o atrasados
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const pendientes = ingresos
      .filter(i => {
        let computedStatus = i.status;
        if (computedStatus !== 'PAGADO' && i.fechaVencimiento) {
          const v = new Date(i.fechaVencimiento + 'T00:00:00');
          if (v < now) computedStatus = 'ATRASADO';
        }
        return computedStatus === 'PENDIENTE' || computedStatus === 'ATRASADO';
      })
      .slice(0, 5);
    // 4. Update charts with filtered data so they respect the time filter
    const filteredIngresos = ingresos.filter((i) => isWithinTimeFilter(i.fecha, timeFilter));
    const filteredGastos = gastos.filter((g) => isWithinTimeFilter(g.fecha, timeFilter));

    setMonthlyData(buildChartData(filteredIngresos, filteredGastos, convert, timeFilter));
    setCategoryData(buildCategoryData(filteredGastos, convert));

    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u.porcentajeImpuesto) setPorcentajeImpuesto(u.porcentajeImpuesto);
      } catch { }
    }
  };

  // Función para marcar ingreso como pagado — sin reload()
  const handleMarkAsPaid = (id: number) => {
    ingresosService.updateStatus(id, 'PAGADO');
    ingresosService.update(id, { fecha: new Date().toISOString().split('T')[0] });
    toast.success('Ingreso marcado como pagado ✓');
    loadData();
  };

  useEffect(() => {
    const saved = localStorage.getItem('fp_time_filter') as TimeFilter;
    if (saved) setTimeFilterState(saved);
  }, []);

  useEffect(() => {
    loadData();
  }, [convert, baseCurrency, timeFilter]);

  const balanceFiltrado = totalIngresosFiltrados - totalGastosFiltrados;

  const FILTER_LABELS: Record<TimeFilter, string> = {
    'TODOS': 'Histórico global',
    'AÑO': 'Este año',
    'MES': 'Este mes',
    'SEMANA': 'Esta semana',
    'DIA': 'Hoy',
  };
  // ── Metas y límites (mensuales por definición en config) ──
  const now = new Date();
  const gastosEsteMes = gastosService.getAll()
    .filter((g) => {
      if (!g.fecha) return false;
      const fd = new Date(g.fecha + 'T00:00:00');
      return fd.getMonth() === now.getMonth() && fd.getFullYear() === now.getFullYear();
    })
    .reduce((s, g) => s + convert(g.monto, g.moneda), 0);

  const ingresosEsteMes = ingresosService.getAll()
    .filter((i) => {
      if (!i.fecha) return false;
      const fd = new Date(i.fecha + 'T00:00:00');
      return i.status === 'PAGADO' && fd.getMonth() === now.getMonth() && fd.getFullYear() === now.getFullYear();
    })
    .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);

  const gastosSuperanLimite = config.limiteGastos > 0 && gastosEsteMes > config.limiteGastos;
  const progresoMeta = config.metaIngresoMensual > 0
    ? Math.min((ingresosEsteMes / config.metaIngresoMensual) * 100, 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Alertas */}
      <RenewalAlert suscripciones={alertas} />

      {/* ── Alerta de límite de gastos ── */}
      {gastosSuperanLimite && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3.5 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <i className="fas fa-triangle-exclamation text-red-600 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">⚠️ Situación crítica — Límite de gastos superado</p>
            <p className="text-xs text-red-500 mt-0.5">
              Llevas {fmt(gastosEsteMes)} en gastos este mes, superando tu límite de{' '}
              <span className="font-bold">{fmt(config.limiteGastos)}</span>.
              Revisa tu módulo de gastos.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-lg">
              +{fmt(gastosEsteMes - config.limiteGastos)} sobre el límite
            </span>
          </div>
        </div>
      )}

      {/* ── Barra de progreso meta de ingresos ── */}
      {config.metaIngresoMensual > 0 && (
        <div className="fp-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <i className="fas fa-bullseye text-[#1cc88a] text-xs" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Meta de Ingresos — Este mes</p>
                <p className="text-[10px] text-gray-400">Objetivo: {fmt(config.metaIngresoMensual)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${progresoMeta >= 100 ? 'text-[#1cc88a]' :
                progresoMeta >= 60 ? 'text-amber-500' : 'text-gray-500'
                }`}>
                {progresoMeta.toFixed(1)}%
              </span>
              <p className="text-[10px] text-gray-400">{fmt(ingresosEsteMes)} cobrados</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progresoMeta >= 100 ? 'bg-[#1cc88a]' :
                progresoMeta >= 60 ? 'bg-amber-400' : 'bg-[#4e73df]'
                }`}
              style={{ width: `${progresoMeta}%` }}
            />
          </div>
          {progresoMeta >= 100 ? (
            <p className="text-[11px] text-[#1cc88a] font-semibold mt-1.5">🎉 ¡Meta alcanzada este mes!</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Faltan <span className="font-semibold text-gray-600">{fmt(config.metaIngresoMensual - ingresosEsteMes)}</span> para alcanzar tu meta.
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Resumen Financiero</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Todos los montos en{' '}
            <span className="font-semibold text-[#4e73df]">{baseCurrency}</span>
            {ratesLoading && <i className="fas fa-circle-notch fa-spin ml-1.5 text-[10px]" />}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/dashboard/ingresos" className="text-xs font-semibold border border-[#1cc88a] text-[#1cc88a] px-3 py-1.5 rounded-lg hover:bg-[#1cc88a] hover:text-white transition">
            <i className="fas fa-plus mr-1" />Ingreso
          </Link>
          <Link href="/dashboard/gastos" className="text-xs font-semibold border border-[#e74a3b] text-[#e74a3b] px-3 py-1.5 rounded-lg hover:bg-[#e74a3b] hover:text-white transition">
            <i className="fas fa-plus mr-1" />Gasto
          </Link>
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
          <i className="fas fa-calendar-alt text-gray-400 text-sm ml-1" />
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as TimeFilter)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 transition shadow-sm"
          >
            <option value="TODOS">Histórico Global</option>
            <option value="AÑO">Este Año</option>
            <option value="MES">Este Mes</option>
            <option value="SEMANA">Esta Semana</option>
            <option value="DIA">Hoy</option>
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 stagger">
        <StatCard
          label="Ingresos Cobrados"
          value={fmt(totalIngresosFiltrados)}
          icon="fas fa-arrow-trend-up"
          accentColor="border-l-transparent hover:border-l-green-500"
          iconColor="text-green-500"
          subLabel={`Ingresos pagados en ${FILTER_LABELS[timeFilter].toLowerCase()}`}
        />
        <StatCard
          label="Gastos Totales"
          value={fmt(totalGastosFiltrados)}
          icon="fas fa-receipt"
          accentColor="border-l-transparent hover:border-l-red-500"
          iconColor="text-red-500"
          subLabel={`Gastos en ${FILTER_LABELS[timeFilter].toLowerCase()}`}
        />
        <StatCard
          label={timeFilter === 'TODOS' ? "Balance General" : "Balance del Período"}
          value={fmt(balanceFiltrado)}
          icon="fas fa-scale-balanced"
          accentColor="border-l-transparent hover:border-l-blue-500"
          iconColor="text-blue-500"
          subLabel="Ingresos – Gastos"
        />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RunwayWidget
          balanceHistorico={balanceHistorico}
          gastoMensualPromedio={gastoMensualActual}
        />
        <TaxCowWidget
          totalIngresosNeto={totalIngresosFiltrados}
          totalGastosDeducibles={totalGastosDeduciblesFiltrados}
          porcentajeImpuesto={porcentajeImpuesto}
          periodLabel={FILTER_LABELS[timeFilter]}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Barras mensuales */}
        <div className="fp-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <i className="fas fa-chart-bar text-[#4e73df] text-xs" />
              </div>
              <div>
                <h6 className="font-bold text-gray-800 text-sm">Ingresos vs Gastos</h6>
                <p className="text-[10px] text-gray-400">Distribución según filtro temporal · {baseCurrency}</p>
              </div>
            </div>
          </div>
          <div className="h-full max-h-100 lg:max-h-140">
            <MonthlyBarChart data={monthlyData} />
          </div>
        </div>

        {/* Dona de categorías */}
        <div className="fp-card p-5 h-full">
          <div className="h-fit flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <i className="fas fa-chart-pie text-purple-500 text-xs" />
            </div>
            <div>
              <h6 className="font-bold text-gray-800 text-sm">Gastos por categoría</h6>
              <p className="text-[10px] text-gray-400">{baseCurrency}</p>
            </div>
          </div>
          <div className="h-full">
            <CategoryDonut
              data={categoryData}
              centerLabel={fmt(totalGastosFiltrados)}
            />
          </div>
        </div>
      </div>

      {/* Próximas renovaciones */}
      <div className="fp-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <i className="fas fa-calendar-alt text-[#4e73df] text-xs" />
            </div>
            <h6 className="font-bold text-gray-800 text-sm">Próximas Renovaciones</h6>
          </div>
          <Link
            href="/dashboard/suscripciones"
            className="text-xs font-semibold text-[#4e73df] border border-[#4e73df]/30 px-3 py-1 rounded-lg hover:bg-[#4e73df] hover:text-white transition"
          >
            Ver todas
          </Link>
        </div>

        {renovaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-calendar-day text-4xl mb-3 opacity-20" />
            <p className="text-sm mb-3">No hay suscripciones activas registradas.</p>
            <Link
              href="/dashboard/suscripciones"
              className="inline-flex items-center gap-2 text-sm bg-[#4e73df] text-white px-4 py-2 rounded-xl hover:bg-[#3d5fc9] transition"
            >
              <i className="fas fa-plus" /> Agregar suscripción
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm fp-table">
              <thead className="bg-gray-50/70 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-5 py-3 text-left font-semibold">Costo</th>
                  <th className="px-5 py-3 text-left font-semibold">Ciclo</th>
                  <th className="px-5 py-3 text-left font-semibold">Renovación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {renovaciones.map((s) => {
                  const badge = renewalBadge(s.proximaRenovacion);
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{s.servicio}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#e74a3b]">{fmt(s.monto, s.moneda)}</span>
                        {s.moneda !== baseCurrency && (
                          <span className="ml-1.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.moneda}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${s.ciclo === 'ANUAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {s.ciclo}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-sm">
                        {formatLocalDate(s.proximaRenovacion)}
                        <span className={`ml-2 badge ${badge.color}`}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ingresos Pendientes */}
      <div className="fp-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <i className="fas fa-hourglass-half text-[#1cc88a] text-xs" />
            </div>
            <h6 className="font-bold text-gray-800 text-sm">Ingresos Pendientes de Cobro</h6>
          </div>
          <Link
            href="/dashboard/ingresos"
            className="text-xs font-semibold text-[#1cc88a] border border-[#1cc88a]/30 px-3 py-1 rounded-lg hover:bg-[#1cc88a] hover:text-white transition"
          >
            Ir a Ingresos
          </Link>
        </div>

        {ingresosPendientes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-check-circle text-3xl mb-3 opacity-20 text-[#1cc88a]" />
            <p className="text-sm">No tienes pagos pendientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm fp-table">
              <thead className="bg-gray-50/70 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Proyecto</th>
                  <th className="px-5 py-3 text-left font-semibold">Neto</th>
                  <th className="px-5 py-3 text-left font-semibold">Vencimiento</th>
                  <th className="px-5 py-3 w-12 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ingresosPendientes.map((i) => {
                  let statusLabel = 'Pendiente';
                  let statusColor = 'bg-blue-100 text-blue-700';

                  if (i.fechaVencimiento) {
                    const v = new Date(i.fechaVencimiento + 'T00:00:00');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (v < today) {
                      statusLabel = 'Atrasado';
                      statusColor = 'bg-red-100 text-red-700';
                    }
                  }

                  return (
                    <tr key={i.id}>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{i.proyectoNombre}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#1cc88a]">{fmt(i.montoNeto, i.moneda)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {i.fechaVencimiento ? formatLocalDate(i.fechaVencimiento) : '—'}
                        <span className={`ml-2 badge ${statusColor}`}>{statusLabel}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleMarkAsPaid(i.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-[#1cc88a] text-white px-3 py-1.5 rounded-lg hover:bg-[#17a874] transition"
                        >
                          <i className="fas fa-check" /> Pagado
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
    </div>
  );
}
