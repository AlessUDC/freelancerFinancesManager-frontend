'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDonutProps {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
}

export function CategoryDonut({ data, centerLabel }: CategoryDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = data.length > 0 && total > 0;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        display: false, // Turn off native legend
      },
      tooltip: {
        backgroundColor: '#1a1c23',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed ?? 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${ctx.label}: ${pct}%`;
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
    <div className="flex flex-col sm:flex-row items-center gap-6 h-full w-full">
      {/* Chart container */}
      <div className="relative w-40 h-40 shrink-0">
        <Doughnut data={chartData} options={options} />
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-gray-700 text-center leading-tight whitespace-pre-line">
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      {/* Custom Legend */}
      <div className="flex-1 w-full flex flex-col justify-center gap-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600 truncate" title={d.label}>{d.label}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-gray-800">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
