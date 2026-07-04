'use client';

import { useState, useEffect } from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useCurrency } from '@/hooks/useCurrency';
import { MONEDAS_DISPONIBLES } from '@/lib/currency';

const TIMEZONES = [
  'America/Mexico_City', 'America/Bogota', 'America/Lima',
  'America/Santiago', 'America/Buenos_Aires', 'America/Caracas',
  'America/Guayaquil', 'America/La_Paz', 'America/Asuncion',
  'America/Montevideo', 'America/Sao_Paulo', 'Europe/Madrid',
  'America/New_York', 'America/Los_Angeles', 'UTC',
];

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ icon, title, subtitle, children }: {
  icon: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="fp-card p-6 space-y-4">
      <div>
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <i className={`${icon} text-[#4e73df] w-4`} />
          {title}
        </h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-6">{subtitle}</p>}
      </div>
      <div className="border-t border-gray-50 pt-4 space-y-5">{children}</div>
    </div>
  );
}

/* ── Toggle switch ───────────────────────────────────────────────────────── */
function Toggle({ id, checked, onChange, label, description }: {
  id: string; checked: boolean; onChange: (v: boolean) => void;
  label: string; description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 ${
          checked ? 'bg-[#4e73df]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ConfiguracionPage() {
  const { config, setConfig, setAlerta } = useAppConfig();
  const { baseCurrency, setBaseCurrency, loading: ratesLoading } = useCurrency();

  /* Local form state — synced from context on mount */
  const [moneda, setMoneda]       = useState(baseCurrency);
  const [tz, setTz]               = useState('America/Mexico_City');
  const [taxCow, setTaxCow]       = useState(config.taxCow);
  const [meta, setMeta]           = useState(config.metaIngresoMensual);
  const [limite, setLimite]       = useState(config.limiteGastos);
  const [saved, setSaved]         = useState(false);

  /* Sync tz from localStorage.usuario */
  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try { const u = JSON.parse(raw); if (u.zonaHoraria) setTz(u.zonaHoraria); } catch {}
    }
    setMoneda(baseCurrency);
    setTaxCow(config.taxCow);
    setMeta(config.metaIngresoMensual);
    setLimite(config.limiteGastos);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Save financial preferences + goals */
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Currency → useCurrency context (also writes to usuario localStorage)
    if (moneda !== baseCurrency) setBaseCurrency(moneda);

    // Timezone → usuario localStorage
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        u.zonaHoraria = tz;
        u.porcentajeImpuesto = taxCow;
        localStorage.setItem('usuario', JSON.stringify(u));
      } catch {}
    }

    // Goals & tax cow → appConfig
    setConfig({ taxCow, metaIngresoMensual: meta, limiteGastos: limite });

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currSymbol = MONEDAS_DISPONIBLES.find((m) => m.code === moneda)?.symbol ?? '$';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Configuración</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Define las reglas con las que FinancePro procesa tus datos financieros.
        </p>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl animate-slide-left">
          <i className="fas fa-check-circle text-lg" />
          Configuración guardada correctamente.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* ── A: Preferencias Financieras ── */}
        <Section
          icon="fas fa-coins"
          title="Preferencias Financieras"
          subtitle="Parámetros base que afectan los cálculos de toda la plataforma."
        >
          {/* Currency */}
          <div>
            <label htmlFor="selectMoneda" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Divisa Base del Sistema
            </label>
            <div className="relative">
              <i className="fas fa-coins absolute left-3 top-1/2 -translate-y-1/2 text-[#4e73df] text-xs pointer-events-none" />
              <select
                id="selectMoneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] transition"
              >
                {MONEDAS_DISPONIBLES.map((m) => (
                  <option key={m.code} value={m.code}>{m.label}</option>
                ))}
              </select>
              {ratesLoading && (
                <i className="fas fa-circle-notch fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#4e73df] text-xs" />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Todos los montos del Dashboard, Ingresos y Gastos se convertirán a esta divisa.
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="selectTz" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Zona Horaria
            </label>
            <div className="relative">
              <i className="fas fa-clock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              <select
                id="selectTz"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] transition"
              >
                {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Tax Cow slider */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="sliderTaxCow" className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fas fa-piggy-bank" /> Fondo de Reserva de Impuestos (Tax Cow)
              </label>
              <span className="font-bold text-amber-700 text-lg bg-white px-3 py-0.5 rounded-lg shadow-sm border border-amber-200 min-w-[52px] text-center">
                {taxCow}%
              </span>
            </div>
            <input
              id="sliderTaxCow"
              type="range" min={0} max={50} step={1}
              value={taxCow}
              onChange={(e) => setTaxCow(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="text-[11px] text-amber-600/80 font-medium">
              De cada ingreso de {currSymbol}1,000 reservarás{' '}
              <strong>{currSymbol}{(1000 * taxCow / 100).toFixed(0)}</strong> para impuestos en tu <em>Tax Cow</em>.
            </p>
          </div>
        </Section>

        {/* ── B: Metas y Presupuestos ── */}
        <Section
          icon="fas fa-bullseye"
          title="Metas y Presupuestos"
          subtitle="Define tus objetivos para que el Dashboard muestre barras de progreso y alertas dinámicas."
        >
          {/* Income goal */}
          <div>
            <label htmlFor="inputMeta" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Meta de Ingreso Mensual Neto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">
                {currSymbol}
              </span>
              <input
                id="inputMeta"
                type="number" min={0} step={100}
                value={meta || ''}
                onChange={(e) => setMeta(Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] transition"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              El Dashboard mostrará una barra de progreso hacia este objetivo cada mes.
            </p>
          </div>

          {/* Expense limit */}
          <div>
            <label htmlFor="inputLimite" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Límite de Alerta de Gastos Mensuales
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">
                {currSymbol}
              </span>
              <input
                id="inputLimite"
                type="number" min={0} step={100}
                value={limite || ''}
                onChange={(e) => setLimite(Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] transition"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Si superas este monto, el Dashboard activará la alerta visual de <strong className="text-red-500">Situación crítica</strong>.
            </p>
          </div>
        </Section>

        {/* ── C: Alertas y Notificaciones ── */}
        <Section
          icon="fas fa-bell"
          title="Alertas y Notificaciones"
          subtitle="Controla qué comportamientos automáticos activa el sistema."
        >
          <Toggle
            id="toggleRenovaciones"
            checked={config.alertas.renovaciones7Dias}
            onChange={(v) => setAlerta('renovaciones7Dias', v)}
            label="Alerta de renovaciones próximas"
            description="Muestra un badge en el Dashboard y en Suscripciones cuando falten menos de 7 días para una renovación."
          />
        </Section>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            id="btnGuardarConfig"
            type="submit"
            className="flex items-center gap-2 bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 transition text-sm"
          >
            <i className="fas fa-check" /> Guardar configuración
          </button>
        </div>
      </form>
    </div>
  );
}
