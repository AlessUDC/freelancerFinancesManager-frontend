'use client';

import Link from 'next/link';
import { useCurrency } from '@/hooks/useCurrency';

interface TaxCowWidgetProps {
  totalIngresosNeto: number;
  totalGastosDeducibles: number;
  porcentajeImpuesto: number; // 0-100
  periodLabel?: string; // e.g. "Este mes", "Esta semana"
}

export function TaxCowWidget({
  totalIngresosNeto,
  totalGastosDeducibles,
  porcentajeImpuesto,
  periodLabel = 'Histórico global',
}: TaxCowWidgetProps) {
  const { fmt, loading } = useCurrency();

  const baseImponible = Math.max(0, totalIngresosNeto - totalGastosDeducibles);
  const fondoImpuesto = baseImponible * (porcentajeImpuesto / 100);
  const disponible = Math.max(0, totalIngresosNeto - fondoImpuesto);

  // proportional widths for visual bar (relative to totalIngresosNeto)
  const pctDisponible = totalIngresosNeto > 0 ? (disponible / totalIngresosNeto) * 100 : 70;
  const pctReserva = totalIngresosNeto > 0 ? (fondoImpuesto / totalIngresosNeto) * 100 : 30;

  const healthColor = porcentajeImpuesto <= 15
    ? 'text-green-600'
    : porcentajeImpuesto <= 25
    ? 'text-amber-600'
    : 'text-red-600';

  return (
    <div className="fp-card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <i className="fas fa-piggy-bank text-amber-500 text-sm" />
          </div>
          <div>
            <h6 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              Fondo de Impuestos
              <span
                className="fas fa-info-circle text-[10px] text-gray-400 cursor-help"
                title="Calcula cuánto debes reservar de tus ingresos para pagar impuestos. Fórmula: (Ingresos Netos - Gastos Deducibles) × % de impuesto configurado."
              />
            </h6>
            <p className="text-[11px] text-gray-400 leading-tight">
              ¿Cuánto reservar para el fisco?
            </p>
          </div>
        </div>
        {/* Big percentage */}
        <div className="text-right">
          <span className={`text-3xl font-extrabold ${healthColor}`}>
            {porcentajeImpuesto}
          </span>
          <span className={`text-sm font-semibold ml-0.5 ${healthColor}`}>%</span>
          <p className="text-[10px] text-gray-400 mt-0.5">a reservar</p>
        </div>
      </div>

      {/* Dual-color stacked bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
          <div
            className="bg-[#1cc88a] h-full transition-all duration-700 flex items-center justify-center"
            style={{ width: `${pctDisponible}%` }}
          >
            {pctDisponible > 20 && (
              <span className="text-[9px] text-white font-bold truncate px-1">
                {Math.round(pctDisponible)}% libre
              </span>
            )}
          </div>
          <div
            className="bg-amber-400 h-full transition-all duration-700 flex items-center justify-center"
            style={{ width: `${pctReserva}%` }}
          >
            {pctReserva > 10 && (
              <span className="text-[9px] text-white font-bold truncate px-1">
                {Math.round(pctReserva)}% fisco
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-[#1cc88a] inline-block" />
            💰 Dinero disponible
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            🐄 Reservar para impuestos
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-amber-50 rounded-xl p-4 space-y-2 border border-amber-100/70">
        {/* Period label */}
        <div className="flex items-center gap-1.5 mb-1">
          <i className="fas fa-calendar-alt text-amber-500 text-[10px]" />
          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
            Período: {periodLabel}
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 flex items-center gap-1">
              <i className="fas fa-arrow-trend-up text-green-500 text-[10px]" />
              Ingresos netos
            </span>
            <span className="font-semibold text-gray-800">{loading ? '…' : fmt(totalIngresosNeto)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 flex items-center gap-1">
              <i className="fas fa-receipt text-blue-500 text-[10px]" />
              Gastos deducibles
            </span>
            <span className="font-semibold text-green-700">-{loading ? '…' : fmt(totalGastosDeducibles)}</span>
          </div>

          <div className="border-t border-amber-200 pt-1.5 flex justify-between items-center">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <i className="fas fa-calculator text-gray-400 text-[10px]" />
              Base imponible
            </span>
            <span className="font-semibold text-gray-800">{loading ? '…' : fmt(baseImponible)}</span>
          </div>

          <div className="flex justify-between items-center bg-amber-100 rounded-lg px-2.5 py-1.5">
            <span className="font-bold text-amber-800 flex items-center gap-1">
              <i className="fas fa-lock text-[10px]" />
              Reserva ({porcentajeImpuesto}%)
            </span>
            <span className="font-extrabold text-amber-700">{loading ? '…' : fmt(fondoImpuesto)}</span>
          </div>

          <div className="flex justify-between items-center bg-green-50 rounded-lg px-2.5 py-1.5 border border-green-100">
            <span className="font-bold text-green-700 flex items-center gap-1">
              <i className="fas fa-check-circle text-[10px]" />
              Disponible real
            </span>
            <span className="font-extrabold text-green-700">{loading ? '…' : fmt(disponible)}</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center -mt-1">
        Configura el % en{' '}
        <Link href="/dashboard/configuracion" className="font-semibold text-[#4e73df] hover:underline">
          Configuración
        </Link>
      </p>
    </div>
  );
}
