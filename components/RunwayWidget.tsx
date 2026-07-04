'use client';

import { useCurrency } from '@/hooks/useCurrency';

interface RunwayWidgetProps {
  /** Balance total histórico (todos los ingresos PAGADOS - todos los gastos) */
  balanceHistorico: number;
  /** Gasto mensual promedio basado en los últimos meses */
  gastoMensualPromedio: number;
}

type RunwayStatus = 'critical' | 'tight' | 'stable' | 'great';

function getStatus(runway: number | null): RunwayStatus {
  if (runway === null || runway < 1) return 'critical';
  if (runway < 3) return 'tight';
  if (runway < 6) return 'stable';
  return 'great';
}

const STATUS_CONFIG = {
  critical: {
    bar: 'bg-red-500',
    glow: 'shadow-red-500/40',
    text: 'text-red-600',
    bg: 'bg-red-50 border border-red-100',
    icon: '🚨',
    label: 'Situación crítica',
    advice: 'Necesitas nuevos clientes urgentemente.',
    tooltip: 'Tienes menos de 1 mes de margen financiero.',
  },
  tight: {
    bar: 'bg-amber-500',
    glow: 'shadow-amber-500/40',
    text: 'text-amber-600',
    bg: 'bg-amber-50 border border-amber-100',
    icon: '⚡',
    label: 'Margen ajustado',
    advice: 'Activa nuevos proyectos pronto.',
    tooltip: 'Tienes entre 1 y 3 meses de margen financiero.',
  },
  stable: {
    bar: 'bg-blue-500',
    glow: 'shadow-blue-500/40',
    text: 'text-blue-600',
    bg: 'bg-blue-50 border border-blue-100',
    icon: '✅',
    label: 'Estable',
    advice: 'Buen colchón. Sigue generando ingresos.',
    tooltip: 'Tienes entre 3 y 6 meses de margen financiero.',
  },
  great: {
    bar: 'bg-green-500',
    glow: 'shadow-green-500/40',
    text: 'text-green-600',
    bg: 'bg-green-50 border border-green-100',
    icon: '🚀',
    label: 'Excelente colchón',
    advice: 'Considera invertir el excedente.',
    tooltip: 'Tienes más de 6 meses de margen. ¡Excelente!',
  },
};

const MILESTONES = [
  { months: 1, label: '1m', pct: (1 / 12) * 100 },
  { months: 3, label: '3m', pct: (3 / 12) * 100 },
  { months: 6, label: '6m', pct: (6 / 12) * 100 },
  { months: 12, label: '12m+', pct: 100 },
];

export function RunwayWidget({ balanceHistorico, gastoMensualPromedio }: RunwayWidgetProps) {
  const { fmt, loading } = useCurrency();

  const runway = gastoMensualPromedio > 0 ? balanceHistorico / gastoMensualPromedio : null;
  const status = getStatus(runway);
  const cfg = STATUS_CONFIG[status];

  // barWidth is capped at 100%, representing 12 months as the "full" scale
  const barWidth = runway !== null ? Math.min((runway / 12) * 100, 100) : 0;

  return (
    <div className="fp-card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <i className="fas fa-rocket text-[#4e73df] text-sm" />
          </div>
          <div>
            <h6 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              Runway Financiero
              <span
                className="fas fa-info-circle text-[10px] text-gray-400 cursor-help"
                title="¿Cuántos meses puedes sobrevivir sin ingresos? Se calcula dividiendo tu balance total histórico entre tu gasto mensual promedio. No cambia según el filtro de fechas."
              />
            </h6>
            <p className="text-[11px] text-gray-400 leading-tight">
              ¿Cuántos meses aguantas sin cobrar?
            </p>
          </div>
        </div>
        {/* Big number */}
        {!loading && runway !== null ? (
          <div className="text-right">
            <span className={`text-3xl font-extrabold ${cfg.text}`}>
              {runway < 12 ? runway.toFixed(1) : '12+'}
            </span>
            <span className={`text-sm font-semibold ml-0.5 ${cfg.text}`}>m</span>
            <p className="text-[10px] text-gray-400 mt-0.5">meses</p>
          </div>
        ) : loading ? (
          <div className="skeleton h-9 w-16" />
        ) : null}
      </div>

      {/* Progress bar with milestone markers */}
      <div className="space-y-2">
        <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          {/* Zone backgrounds */}
          <div className="absolute inset-0 flex">
            <div className="h-full bg-red-100" style={{ width: '8.33%' }} />
            <div className="h-full bg-amber-100" style={{ width: '16.67%' }} />
            <div className="h-full bg-blue-100" style={{ width: '25%' }} />
            <div className="h-full bg-green-100" style={{ flex: 1 }} />
          </div>
          {/* Progress bar */}
          <div
            className={`absolute inset-y-0 left-0 ${cfg.bar} rounded-full transition-all duration-700 shadow-sm ${cfg.glow}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-[10px] text-gray-400 font-medium px-0.5">
          <span className="text-red-400 font-semibold">0</span>
          <span className="text-amber-500 font-semibold">3m</span>
          <span className="text-blue-500 font-semibold">6m</span>
          <span className="text-green-500 font-semibold">12m</span>
        </div>

        {/* Zone legend */}
        <div className="flex gap-3 text-[9px] font-semibold">
          <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Crítico</span>
          <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Ajustado</span>
          <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Estable</span>
          <span className="flex items-center gap-1 text-green-500"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Excelente</span>
        </div>
      </div>

      {/* Status box */}
      <div className={`rounded-xl p-3.5 ${cfg.bg} space-y-2`}>
        {runway === null ? (
          <p className="text-xs text-gray-500 text-center">
            <i className="fas fa-info-circle mr-1" />
            Registra gastos para calcular tu runway
          </p>
        ) : (
          <>
            <p className={`text-xs font-bold ${cfg.text} flex items-center gap-1.5`}>
              <span>{cfg.icon}</span> {cfg.label} — {cfg.advice}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              <span>Balance histórico</span>
              <span className="font-semibold text-right">{loading ? '…' : fmt(balanceHistorico)}</span>
              <span>Gasto/mes promedio</span>
              <span className="font-semibold text-right">{loading ? '…' : fmt(gastoMensualPromedio)}</span>
            </div>
          </>
        )}
      </div>

      <p className="text-[10px] text-gray-400 text-center -mt-1">
        Independiente del filtro de fechas seleccionado
      </p>
    </div>
  );
}
