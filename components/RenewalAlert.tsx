'use client';

import Link from 'next/link';
import { Suscripcion } from '@/types';
import { daysUntil, formatLocalDate } from '@/lib/dates';
import { useCurrency } from '@/hooks/useCurrency';

interface RenewalAlertProps {
  suscripciones: Suscripcion[];
}

export function RenewalAlert({ suscripciones }: RenewalAlertProps) {
  const { fmt } = useCurrency();

  if (suscripciones.length === 0) return null;

  return (
    <div className="mb-5 animate-fade-in">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-100/60 border-b border-amber-200">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
            <i className="fas fa-bell text-white text-xs" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {suscripciones.length === 1
                ? '1 renovación próxima'
                : `${suscripciones.length} renovaciones próximas`}
            </p>
            <p className="text-xs text-amber-600">Dentro de los próximos 7 días</p>
          </div>
          <Link
            href="/dashboard/suscripciones"
            className="text-xs font-semibold text-amber-700 border border-amber-300 bg-white/60 px-3 py-1 rounded-lg hover:bg-amber-100 transition"
          >
            Ver todas
          </Link>
        </div>

        {/* Lista */}
        <div className="divide-y divide-amber-100">
          {suscripciones.map((s) => {
            const days = daysUntil(s.proximaRenovacion);
            const isUrgent = days <= 3;
            return (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-amber-50/50 transition">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                  isUrgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                }`}>
                  {days}d
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.servicio}</p>
                  <p className="text-xs text-gray-500">{formatLocalDate(s.proximaRenovacion)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
                    {fmt(s.monto, s.moneda)}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    s.ciclo === 'ANUAL' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {s.ciclo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
