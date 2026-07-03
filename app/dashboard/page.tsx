'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { RunwayWidget } from '@/components/RunwayWidget';
import { TaxCowWidget } from '@/components/TaxCowWidget';
import { RenewalAlert } from '@/components/RenewalAlert';
import { ingresosService, gastosService, suscripcionesService } from '@/services/finanzasService';
import { Suscripcion, Ingreso, Gasto } from '@/types';
import { useCurrency } from '@/hooks/useCurrency';
import { formatLocalDate, renewalBadge } from '@/lib/dates';

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
  TECNOLOGIA_SAAS: '#4e73df',
  EQUIPAMIENTO_HARDWARE: '#9b59b6',
  INFRAESTRUCTURA_OFICINA: '#36b9cc',
  MARKETING_SERVICIOS: '#e74a3b',
};

const CAT_LABELS: Record<string, string> = {
  TECNOLOGIA_SAAS: 'Tecnología/SaaS',
  EQUIPAMIENTO_HARDWARE: 'Equipamiento/Hardware',
  INFRAESTRUCTURA_OFICINA: 'Infraestructura/Oficina',
  MARKETING_SERVICIOS: 'Marketing/Servicios',
};

function buildMonthlyData(ingresos: Ingreso[], gastos: Gasto[], convert: (a: number, from: string) => number) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const ing = ingresos
      .filter((x) => { const fd = new Date(x.fecha || Date.now()); return fd.getMonth() === m && fd.getFullYear() === y; })
      .reduce((s, x) => s + convert(x.montoNeto, x.moneda), 0);
    const gas = gastos
      .filter((x) => { const fd = new Date(x.fecha || Date.now()); return fd.getMonth() === m && fd.getFullYear() === y; })
      .reduce((s, x) => s + convert(x.monto, x.moneda), 0);
    return { month: MESES[m], ingresos: ing, gastos: gas };
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

  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalGastosHistorico, setTotalGastosHistorico] = useState(0);
  const [totalGastosDeducibles, setTotalGastosDeducibles] = useState(0);
  const [renovaciones, setRenovaciones] = useState<Suscripcion[]>([]);
  const [alertas, setAlertas] = useState<Suscripcion[]>([]);
  const [ingresosPendientes, setIngresosPendientes] = useState<Ingreso[]>([]);
  const [costoSubs, setCostoSubs] = useState(0);
  const [porcentajeImpuesto, setPorcentajeImpuesto] = useState(20);
  const [monthlyData, setMonthlyData] = useState<{ month: string; ingresos: number; gastos: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ label: string; value: number; color: string }[]>([]);

  // Function to mark an income as paid from the dashboard
  const handleMarkAsPaid = (id: number) => {
    ingresosService.updateStatus(id, 'PAGADO');
    ingresosService.update(id, { fecha: new Date().toISOString().split('T')[0] });
    window.dispatchEvent(new Event('financeDataChanged')); // refresh trick
    // Re-run the calculations inside useEffect by refreshing the page or extracting the logic
    window.location.reload(); 
  };

  useEffect(() => {
    const ingresos = ingresosService.getAll();
    const gastos   = gastosService.getAll();
    const subs     = suscripcionesService.getAll();

    const ing = ingresos.filter((i) => i.status === 'PAGADO').reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);
    const gasTotal = gastos.reduce((s, g) => s + convert(g.monto, g.moneda), 0);
    
    // Gastos del mes actual
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const gastosMes = gastos.filter((g) => {
      if (!g.fecha) return false;
      const d = new Date(g.fecha + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const gasMes = gastosMes.reduce((s, g) => s + convert(g.monto, g.moneda), 0);
    const gasDeducible = gastosMes.filter((g) => g.esDeducible).reduce((s, g) => s + convert(g.monto, g.moneda), 0);
    
    const costoSub = subs.filter((s) => s.status === 'ACTIVA')
      .reduce((acc, s) => acc + convert(s.ciclo === 'ANUAL' ? s.monto / 12 : s.monto, s.moneda), 0);

    setTotalIngresos(ing);
    setTotalGastos(gasMes); 
    setTotalGastosDeducibles(gasDeducible);
    setTotalGastosHistorico(gasTotal);

    const proxSubs = subs
      .filter((s) => s.proximaRenovacion && s.status === 'ACTIVA')
      .sort((a, b) => new Date(a.proximaRenovacion).getTime() - new Date(b.proximaRenovacion).getTime())
      .slice(0, 5);
    setRenovaciones(proxSubs);
    setAlertas(suscripcionesService.proximasRenovaciones(7));

    // Ingresos pendientes o atrasados
    const pendientes = ingresos
      .filter(i => {
        let computedStatus = i.status;
        if (computedStatus !== 'PAGADO' && i.fechaVencimiento) {
          const v = new Date(i.fechaVencimiento + 'T00:00:00');
          today.setHours(0,0,0,0);
          if (v < today) computedStatus = 'ATRASADO';
        }
        return computedStatus === 'PENDIENTE' || computedStatus === 'ATRASADO';
      })
      .slice(0, 5); // limit to 5
    setIngresosPendientes(pendientes);

    setMonthlyData(buildMonthlyData(ingresos, gastos, convert));
    setCategoryData(buildCategoryData(gastos, convert));

    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u.porcentajeImpuesto) setPorcentajeImpuesto(u.porcentajeImpuesto);
      } catch {}
    }
  }, [convert, baseCurrency]);

  const balance = totalIngresos - totalGastosHistorico;
  return (
    <div className="space-y-5">
      {/* Alertas */}
      <RenewalAlert suscripciones={alertas} />

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
        <div className="flex gap-2">
          <Link href="/dashboard/ingresos" className="text-xs font-semibold border border-[#1cc88a] text-[#1cc88a] px-3 py-1.5 rounded-lg hover:bg-[#1cc88a] hover:text-white transition">
            <i className="fas fa-plus mr-1" />Ingreso
          </Link>
          <Link href="/dashboard/gastos" className="text-xs font-semibold border border-[#e74a3b] text-[#e74a3b] px-3 py-1.5 rounded-lg hover:bg-[#e74a3b] hover:text-white transition">
            <i className="fas fa-plus mr-1" />Gasto
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <StatCard
          label="Ingresos Cobrados"
          value={fmt(totalIngresos)}
          icon="fas fa-arrow-trend-up"
          accentColor="border-l-[#1cc88a]"
          iconColor="text-[#1cc88a]"
          subLabel="Solo ingresos con estado PAGADO"
        />
        <StatCard
          label="Gastos del Mes"
          value={fmt(totalGastos)}
          icon="fas fa-receipt"
          accentColor="border-l-[#e74a3b]"
          iconColor="text-[#e74a3b]"
          subLabel="Acumulado este mes"
        />
        <StatCard
          label="Balance General"
          value={fmt(balance)}
          icon="fas fa-scale-balanced"
          accentColor={`border-l-[${balance < 0 ? '#e74a3b' : '#4e73df'}]`}
          iconColor={balance < 0 ? 'text-[#e74a3b]' : 'text-[#4e73df]'}
          subLabel={balance < 0 ? '⚠️ Balance negativo' : 'Ingresos − Gastos'}
        />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RunwayWidget
          balanceGeneral={balance}
          gastoMesActual={totalGastos}
        />
        <TaxCowWidget 
          totalIngresosNeto={totalIngresos} 
          totalGastosDeducibles={totalGastosDeducibles}
          porcentajeImpuesto={porcentajeImpuesto} 
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
                <p className="text-[10px] text-gray-400">Últimos 6 meses · {baseCurrency}</p>
              </div>
            </div>
          </div>
          <div className="h-52">
            <MonthlyBarChart data={monthlyData} />
          </div>
        </div>

        {/* Dona de categorías */}
        <div className="fp-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <i className="fas fa-chart-pie text-purple-500 text-xs" />
            </div>
            <div>
              <h6 className="font-bold text-gray-800 text-sm">Gastos por categoría</h6>
              <p className="text-[10px] text-gray-400">{baseCurrency}</p>
            </div>
          </div>
          <div className="h-52">
            <CategoryDonut
              data={categoryData}
              centerLabel={`Total\n${fmt(totalGastos)}`}
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
                    today.setHours(0,0,0,0);
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
