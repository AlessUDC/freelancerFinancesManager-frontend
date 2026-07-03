'use client';

import { useCurrency } from '@/hooks/useCurrency';

interface RunwayWidgetProps {
  balanceGeneral: number;
  gastoMesActual: number;
}

export function RunwayWidget({ balanceGeneral, gastoMesActual }: RunwayWidgetProps) {
  const { fmt, loading } = useCurrency();
  const runway = gastoMesActual > 0 ? balanceGeneral / gastoMesActual : null;

  const getRunwayColor = () => {
    if (runway === null) return { bar: 'bg-gray-300', text: 'text-gray-500', bg: 'bg-gray-50' };
    if (runway < 1) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
    if (runway < 3) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    if (runway < 6) return { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' };
    return { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' };
  };

  const colors = getRunwayColor();
  const barWidth = runway !== null ? Math.min((runway / 12) * 100, 100) : 0;

  return (
    <div className="fp-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <i className="fas fa-rocket text-[#4e73df] text-sm" />
          </div>
          <div>
            <h6 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              Runway Financiero
              <i className="fas fa-info-circle text-[10px] text-gray-400 cursor-help" title="Fórmula: Balance General / Gasto del Mes Actual. Indica cuántos meses puedes sobrevivir sin ingresos con tus gastos actuales." />
            </h6>
            <p className="text-xs text-gray-400">Meses de respaldo</p>
          </div>
        </div>
        {runway !== null && !loading && (
          <span className={`text-2xl font-extrabold ${colors.text}`}>
            {runway.toFixed(1)}<span className="text-sm font-semibold ml-0.5">m</span>
          </span>
        )}
        {loading && <div className="skeleton h-8 w-16" />}
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1.5">
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`${colors.bar} h-2.5 rounded-full transition-all duration-700`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
          <span>0m</span>
          <span>3m</span>
          <span>6m</span>
          <span>12m</span>
        </div>
      </div>

      {/* Desglose */}
      <div className={`rounded-xl p-3.5 ${colors.bg} space-y-2`}>
        {runway === null ? (
          <p className="text-xs text-gray-500 text-center">
            <i className="fas fa-info-circle mr-1" />
            Registra gastos para calcular tu runway
          </p>
        ) : (
          <>
            <p className={`text-xs font-semibold ${colors.text}`}>
              <i className="fas fa-shield-alt mr-1.5" />
              {runway < 1
                ? '⚠️ Situación crítica — busca nuevos clientes'
                : runway < 3
                ? '⚡ Margen ajustado — mantente activo'
                : runway < 6
                ? '✅ Estable — sigue así'
                : '🚀 Excelente colchón financiero'}
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Balance General</span>
                <span className="font-semibold">{loading ? '...' : fmt(balanceGeneral)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gasto del Mes Actual</span>
                <span className="font-semibold">{loading ? '...' : fmt(gastoMesActual)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
