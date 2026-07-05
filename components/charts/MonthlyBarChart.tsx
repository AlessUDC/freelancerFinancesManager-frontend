'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useCurrency } from '@/hooks/useCurrency';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement, Filler
);

interface MonthlyDataPoint {
  month: string;       // Ej: "Ene", "Feb"
  ingresos: number;
  gastos: number;
}

interface MonthlyBarChartProps {
  data: MonthlyDataPoint[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const { baseCurrency } = useCurrency();

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map((d) => d.ingresos),
        backgroundColor: 'rgba(28, 200, 138, 0.85)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Gastos',
        data: data.map((d) => d.gastos),
        backgroundColor: 'rgba(231, 74, 59, 0.85)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'Inter', size: 10 },
          color: '#6B7280',
          usePointStyle: true,
          pointStyleWidth: 14,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1a1c23',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => {
            const yValue = ctx.parsed?.y ?? 0;
            return ` ${ctx.dataset.label}: ${baseCurrency} ${yValue.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#9CA3AF' },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#9CA3AF',
          callback: (v: number | string) => `${baseCurrency} ${Number(v).toLocaleString()}`,
        },
        border: { display: false },
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
        <i className="fas fa-chart-bar text-4xl mb-3 opacity-25" />
        <p className="text-sm">Sin datos para mostrar</p>
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
}
