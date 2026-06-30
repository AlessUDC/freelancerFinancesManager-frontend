'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDonutProps {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
}

export function CategoryDonut({ data, centerLabel }: CategoryDonutProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

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
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: { family: 'Inter', size: 11 },
          color: '#6B7280',
          usePointStyle: true,
          pointStyleWidth: 8,
          padding: 12,
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1a1c23',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
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
    <div className="relative h-full w-full">
      <Doughnut data={chartData} options={options} />
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold text-gray-500 text-center leading-tight px-6">
            {centerLabel}
          </span>
        </div>
      )}
    </div>
  );
}
