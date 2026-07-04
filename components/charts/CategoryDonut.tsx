'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useCurrency } from '@/hooks/useCurrency';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDonutProps {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
}

export function CategoryDonut({ data, centerLabel }: CategoryDonutProps) {
  const { fmt } = useCurrency();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = data.length > 0 && total > 0;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a1c23',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed ?? 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${pct}% · ${fmt(val)}`;
          },
        },
      },
    },
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
        <i className="fas fa-chart-pie text-4xl mb-3 opacity-25" />
        <p className="text-sm">Sin gastos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 h-full w-full">
      {/* Chart container */}
      <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
        <Doughnut data={chartData} options={options} />
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-gray-700 text-center leading-tight whitespace-pre-line">
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      {/* Custom Legend — label + amount + percentage */}
      <div className="flex-1 w-full flex flex-col justify-center gap-2.5 min-w-0">
        {data.map((d) => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={d.label} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-xs text-gray-600 truncate"
                    title={d.label}
                  >
                    {d.label}
                  </span>
                  <span className="text-xs font-bold text-gray-800 shrink-0">
                    {pct}%
                  </span>
                </div>
                {/* Mini progress bar per category */}
                <div className="mt-0.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{fmt(d.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
