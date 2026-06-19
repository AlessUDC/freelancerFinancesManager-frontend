'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { ingresosService, gastosService, suscripcionesService } from '@/services/finanzasService';
import { Suscripcion } from '@/types';

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getRenewalBadge(renovacion: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fecha = new Date(renovacion + 'T00:00:00');
  const diffDays = Math.ceil((fecha.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return { label: `${diffDays}d`, color: 'bg-red-100 text-red-700' };
  if (diffDays <= 7) return { label: `${diffDays}d`, color: 'bg-yellow-100 text-yellow-700' };
  return { label: `${diffDays}d`, color: 'bg-gray-100 text-gray-600' };
}

export default function DashboardPage() {
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [renovaciones, setRenovaciones] = useState<Suscripcion[]>([]);

  useEffect(() => {
    setTotalIngresos(ingresosService.total());
    setTotalGastos(gastosService.total());

    const subs = suscripcionesService
      .getAll()
      .filter((s) => s.renovacion)
      .sort((a, b) => new Date(a.renovacion).getTime() - new Date(b.renovacion).getTime())
      .slice(0, 6);
    setRenovaciones(subs);
  }, []);

  const balance = totalIngresos - totalGastos;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Resumen Financiero</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Ingresos"
          value={fmt(totalIngresos)}
          icon="fas fa-arrow-up"
          accentColor="border-l-[#1cc88a]"
          iconColor="text-[#1cc88a]"
        />
        <StatCard
          label="Total Gastos"
          value={fmt(totalGastos)}
          icon="fas fa-arrow-down"
          accentColor="border-l-[#e74a3b]"
          iconColor="text-[#e74a3b]"
        />
        <StatCard
          label="Balance General"
          value={fmt(balance)}
          icon="fas fa-wallet"
          accentColor="border-l-[#4e73df]"
          iconColor={balance < 0 ? 'text-[#e74a3b]' : 'text-[#4e73df]'}
        />
      </div>

      {/* Próximas renovaciones */}
      <div className="bg-white rounded-2xl shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.08)] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <h6 className="font-bold text-[#4e73df] flex items-center gap-2">
            <i className="fas fa-calendar-alt"></i> Próximas Renovaciones
          </h6>
          <Link
            href="/dashboard/suscripciones"
            className="text-xs font-medium text-[#4e73df] border border-[#4e73df] px-3 py-1 rounded-lg hover:bg-[#4e73df] hover:text-white transition"
          >
            Ver todas
          </Link>
        </div>

        {renovaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-calendar-day text-4xl mb-3 opacity-25"></i>
            <p className="mb-3">No hay suscripciones registradas.</p>
            <Link
              href="/dashboard/suscripciones"
              className="inline-flex items-center gap-2 text-sm bg-[#4e73df] text-white px-4 py-2 rounded-lg hover:bg-[#3d5fc9] transition"
            >
              <i className="fas fa-plus"></i> Agregar suscripción
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Servicio</th>
                  <th className="px-5 py-3 text-left font-semibold">Costo</th>
                  <th className="px-5 py-3 text-left font-semibold">Renovación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {renovaciones.map((s) => {
                  const badge = getRenewalBadge(s.renovacion);
                  const fechaStr = new Date(s.renovacion + 'T00:00:00').toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{s.servicio}</td>
                      <td className="px-5 py-3.5 font-bold text-[#e74a3b]">${s.costo.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {fechaStr}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
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
