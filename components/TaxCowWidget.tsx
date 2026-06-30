'use client';

import { useCurrency } from '@/hooks/useCurrency';

interface TaxCowWidgetProps {
  totalIngresosNeto: number;
  totalGastosDeducibles: number;
  porcentajeImpuesto: number; // 0-100
}

export function TaxCowWidget({ totalIngresosNeto, totalGastosDeducibles, porcentajeImpuesto }: TaxCowWidgetProps) {
  const { fmt, loading } = useCurrency();
  
  const baseImponible = Math.max(0, totalIngresosNeto - totalGastosDeducibles);
  const fondoImpuesto = baseImponible * (porcentajeImpuesto / 100);
  const disponible = totalIngresosNeto - fondoImpuesto;
  const pctDisplay = Math.min(porcentajeImpuesto, 100);

  return (
    <div className="fp-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <i className="fas fa-piggy-bank text-amber-500 text-sm" />
          </div>
          <div>
            <h6 className="font-bold text-gray-800 text-sm">Fondo de Impuestos</h6>
            <p className="text-xs text-gray-400">Tax Cow — reserva {porcentajeImpuesto}%</p>
          </div>
        </div>
        {!loading ? (
          <span className="text-2xl font-extrabold text-amber-500">
            {pctDisplay}%
          </span>
        ) : (
          <div className="skeleton h-8 w-12" />
        )}
      </div>

      {/* Barra visual */}
      <div className="space-y-1.5">
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className="h-full flex rounded-full overflow-hidden">
            <div
              className="bg-[#1cc88a] transition-all duration-700"
              style={{ width: `${100 - pctDisplay}%` }}
            />
            <div
              className="bg-amber-400 transition-all duration-700"
              style={{ width: `${pctDisplay}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-semibold">
          <span className="text-green-600">💰 Disponible</span>
          <span className="text-amber-600">🐄 Reservar</span>
        </div>
      </div>

      {/* Desgloses */}
      <div className="bg-amber-50 rounded-xl p-3.5 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Ingreso neto total</span>
          <span className="font-medium text-gray-800">{loading ? '...' : fmt(totalIngresosNeto)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Gastos deducibles</span>
          <span className="font-medium text-red-600">-{loading ? '...' : fmt(totalGastosDeducibles)}</span>
        </div>
        <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200/50">
          <span className="text-gray-600 font-semibold">Base imponible</span>
          <span className="font-semibold text-gray-800">{loading ? '...' : fmt(baseImponible)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
            <i className="fas fa-lock text-[10px]" />
            Reserva impuestos ({porcentajeImpuesto}%)
          </span>
          <span className="font-bold text-amber-700 text-sm">{loading ? '...' : fmt(fondoImpuesto)}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-amber-200">
          <span className="text-xs text-green-700 font-semibold flex items-center gap-1">
            <i className="fas fa-check-circle text-[10px]" />
            Disponible real
          </span>
          <span className="font-bold text-green-700 text-sm">{loading ? '...' : fmt(disponible)}</span>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        Configura el % en <span className="font-semibold text-[#4e73df]">Mi Perfil</span>
      </p>
    </div>
  );
}
