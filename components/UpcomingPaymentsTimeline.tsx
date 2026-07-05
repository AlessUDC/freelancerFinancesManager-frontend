'use client';

import { daysUntil, formatLocalDate } from '@/lib/dates';
import { Gasto, GastoCategoria } from '@/types';

type CompromisoItem = {
    id: string;
    concepto: string;
    monto: number;
    moneda: string;
    fecha: string;
    dias: number;
    icon: string;
    origen: 'GASTO' | 'SUSCRIPCION';
    refId: number | string;
};

interface Props {
    gastos: Gasto[];
    suscripciones: any[];
    categoriaMeta: Record<GastoCategoria, { label: string; icon: string; color: string; donutColor: string }>;
    fmt: (monto: number, moneda?: string) => string;
    onPagarGasto: (gasto: Gasto) => void;
    onPagarSuscripcion?: (sub: any) => void;
    diasVentana?: number;
}

export function UpcomingPaymentsTimeline({
    gastos,
    suscripciones,
    categoriaMeta,
    fmt,
    onPagarGasto,
    onPagarSuscripcion,
    diasVentana = 30,
}: Props) {
    // 1. Gastos fijos/recurrentes con fecha futura dentro de la ventana
    const gastosItems: CompromisoItem[] = gastos
        .filter((g) => g.fecha && g.esRecurrente)
        .map((g) => ({ g, d: daysUntil(g.fecha!) }))
        .filter(({ d }) => d >= 0 && d <= diasVentana)
        .map(({ g, d }) => ({
            id: `gasto-${g.id}`,
            concepto: g.concepto,
            monto: g.monto,
            moneda: g.moneda,
            fecha: g.fecha!,
            dias: d,
            icon: categoriaMeta[g.categoria]?.icon || '💳',
            origen: 'GASTO' as const,
            refId: g.id,
        }));

    // 2. Suscripciones activas con renovación dentro de la ventana
    const subsItems: CompromisoItem[] = suscripciones
        .filter((s) => s.status === 'ACTIVA' && s.proximaRenovacion)
        .map((s) => ({ s, d: daysUntil(s.proximaRenovacion) }))
        .filter(({ d }) => d >= 0 && d <= diasVentana)
        .map(({ s, d }) => ({
            id: `sub-${s.id}`,
            concepto: s.nombre || s.concepto,
            monto: s.monto,
            moneda: s.moneda,
            fecha: s.proximaRenovacion,
            dias: d,
            icon: '🚀',
            origen: 'SUSCRIPCION' as const,
            refId: s.id,
        }));

    const items = [...gastosItems, ...subsItems].sort((a, b) => a.dias - b.dias);

    if (items.length === 0) return null;

    const diaLabel = (d: number) => {
        if (d === 0) return 'Hoy';
        if (d === 1) return 'Mañana';
        return `En ${d} días`;
    };

    return (
        <div className="fp-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-bell text-amber-500 text-sm" />
                <h6 className="font-bold text-gray-700 text-sm">
                    Próximos Compromisos <span className="text-gray-400 font-medium">(Siguientes {diasVentana} días)</span>
                </h6>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="shrink-0 w-56 rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-[#e74a3b]/30 hover:bg-white hover:shadow-sm transition"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.dias <= 3
                                    ? 'bg-red-100 text-red-600'
                                    : item.dias <= 10
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {diaLabel(item.dias)}
                            </span>
                            <span className="text-[10px] text-gray-400">{formatLocalDate(item.fecha)}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg leading-none">{item.icon}</span>
                            <span className="text-sm font-semibold text-gray-700 truncate" title={item.concepto}>
                                {item.concepto}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[#e74a3b] text-sm">{fmt(item.monto, item.moneda)}</span>
                            <button
                                onClick={() => {
                                    if (item.origen === 'GASTO') {
                                        const g = gastos.find((x) => x.id === item.refId);
                                        if (g) onPagarGasto(g);
                                    } else {
                                        const s = suscripciones.find((x) => x.id === item.refId);
                                        if (s && onPagarSuscripcion) onPagarSuscripcion(s);
                                    }
                                }}
                                className="text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:border-[#e74a3b] hover:text-[#e74a3b] transition"
                            >
                                Pagar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}