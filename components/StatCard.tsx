'use client';

import { useCurrency } from '@/hooks/useCurrency';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  accentColor?: string;
  iconColor?: string;
  subLabel?: string;
  trend?: number; // porcentaje positivo o negativo
}

export function StatCard({ label, value, icon, accentColor = 'border-l-[#4e73df]', iconColor = 'text-[#4e73df]', subLabel, trend }: StatCardProps) {
  const { loading } = useCurrency();

  return (
    <div className={`fp-card border-l-4 ${accentColor} px-5 py-4 animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 truncate">{label}</p>
          {loading ? (
            <div className="skeleton h-6 w-28 mt-1" />
          ) : (
            <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
          )}
          {subLabel && !loading && (
            <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>
          )}
          {typeof trend === 'number' && !loading && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <i className={`fas ${trend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`} />
              {Math.abs(trend).toFixed(1)}% vs. mes anterior
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ml-3 shrink-0`}>
          <i className={`${icon} ${iconColor} text-base`} />
        </div>
      </div>
    </div>
  );
}
