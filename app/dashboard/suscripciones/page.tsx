'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { StatCard } from '@/components/StatCard';
import { suscripcionesService, gastosService, ingresosService } from '@/services/finanzasService';
import { Suscripcion, SuscripcionCiclo, Ingreso, Gasto } from '@/types';
import { formatLocalDate, renewalBadge } from '@/lib/dates';
import { useCurrency } from '@/hooks/useCurrency';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MONEDAS_DISPONIBLES } from '@/lib/currency';

const isOverdue = (dateStr: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

export default function SuscripcionesPage() {
  const { fmt, convert, baseCurrency } = useCurrency();
  const { config } = useAppConfig();
  const { usuario } = useAuth();
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Pay Modal state
  const [payItem, setPayItem] = useState<Suscripcion | null>(null);

  // Delete Modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [servicio, setServicio] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [ciclo, setCiclo] = useState<SuscripcionCiclo>('MENSUAL');
  const [proximaRenovacion, setProximaRen] = useState('');
  const [igv, setIgv] = useState(config.porcentajeRetencion || 0);

  const refresh = async () => {
    try {
      const [subsData, gastosData, ingresosData] = await Promise.all([
        suscripcionesService.getAll(),
        gastosService.getAll(),
        ingresosService.getAll(),
      ]);
      setSuscripciones(subsData);
      setGastos(gastosData);
      setIngresos(ingresosData);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setEditId(null);
    setServicio(''); setMonto(''); setMoneda('USD'); setCiclo('MENSUAL'); setProximaRen('');
    setIgv(config.porcentajeRetencion || 0);
  };

  const openEditModal = (item: Suscripcion) => {
    setEditId(item.id);
    setServicio(item.servicio);
    const igvRate = item.igv ?? config.porcentajeRetencion ?? 0;
    // Revert IGV
    setMonto((item.monto / (1 + igvRate / 100)).toFixed(2));
    setMoneda(item.moneda);
    setCiclo(item.ciclo);
    setProximaRen(item.proximaRenovacion || '');
    setIgv(igvRate);
    setModalOpen(true);
  };

  const handleCicloChange = (newCiclo: SuscripcionCiclo) => {
    setCiclo(newCiclo);
    if (proximaRenovacion) {
      const next = suscripcionesService.calcularProximaFecha(proximaRenovacion, newCiclo);
      setProximaRen(next);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(monto);
    if (!servicio.trim() || isNaN(c) || c <= 0) return;

    const data = {
      servicio: servicio.trim(),
      monto: c * (1 + (igv / 100)),
      moneda,
      ciclo,
      proximaRenovacion,
      status: 'ACTIVA' as const,
      igv,
    };

    try {
      if (editId) {
        await suscripcionesService.update(editId, data);
        toast.success(`Suscripción "${servicio.trim()}" actualizada ✓`);
      } else {
        await suscripcionesService.add(data);
        toast.success(`Suscripción "${servicio.trim()}" guardada ✓`);
      }
      resetForm();
      setModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la suscripción');
    }
  };

  const handlePay = (item: Suscripcion) => {
    setPayItem(item);
  };

  const confirmPay = async (metodo: 'SALDO' | 'CUENTA') => {
    if (!payItem) return;
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute saldo if paying with SALDO
    if (metodo === 'SALDO') {
      const totalNetos = ingresos
        .filter((i) => i.status === 'PAGADO')
        .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);
      const totalGastos = gastos.reduce((s, g) => s + convert(g.monto, g.moneda), 0);
      const saldoVirtual = totalNetos - totalGastos;
      if (convert(payItem.monto, payItem.moneda) > saldoVirtual) {
        toast.error('Saldo insuficiente en el SaaS');
        return;
      }
    }

    try {
      // 1. Add record to expenses (Gastos)
      const labelMetodo = metodo === 'SALDO' ? 'Saldo SaaS' : 'Cuenta Bancaria';
      await gastosService.add({
        concepto: `Pago Suscripción (${labelMetodo}): ${payItem.servicio}`,
        monto: payItem.monto,
        moneda: payItem.moneda,
        categoria: 'TECNOLOGIA_SAAS',
        esDeducible: true,
        esRecurrente: true,
        fecha: todayStr,
        cantidad: 1,
        igv: payItem.igv || 0
      });

      // 2. Advance the renewal date
      const baseDate = payItem.proximaRenovacion || todayStr;
      const nextDateStr = suscripcionesService.calcularProximaFecha(baseDate, payItem.ciclo);
      await suscripcionesService.update(payItem.id, { proximaRenovacion: nextDateStr });

      toast.success(`Pago de "${payItem.servicio}" registrado ✓`);
      setPayItem(null);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el pago');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const sub = suscripciones.find(s => s.id === deleteId);
    try {
      await suscripcionesService.remove(deleteId);
      toast.error(`Suscripción "${sub?.servicio}" eliminada`);
      refresh();
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la suscripción');
    }
  };

  const filtered = suscripciones.filter((s) =>
    !busqueda || s.servicio.toLowerCase().includes(busqueda.toLowerCase())
  );
  const activas = filtered.filter((s) => s.status === 'ACTIVA');
  const totalMensual = suscripcionesService.costoMensualActivo(activas);
  const costoAnualProyectado = totalMensual * 12;

  const todayStr = new Date().toISOString().split('T')[0];
  const vencidas = activas.filter(s => s.proximaRenovacion && s.proximaRenovacion < todayStr);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Suscripciones</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona suscripciones y sus ciclos de renovación · montos en {baseCurrency}</p>
        </div>
        <button
          id="btnNuevaSuscripcion"
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 transition-all text-sm"
        >
          <i className="fas fa-plus" /> Nueva Suscripción
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <StatCard label="Costo Mensual Estimado" value={fmt(totalMensual)}
          icon="fas fa-redo-alt" accentColor="border-l-[#4e73df]" iconColor="text-[#4e73df]" />
        <StatCard label="Costo Anual Proyectado" value={fmt(costoAnualProyectado)}
          icon="fas fa-chart-line" accentColor="border-l-[#f6c23e]" iconColor="text-[#f6c23e]" />
        <StatCard label="Suscripciones Activas" value={`${activas.length}`}
          icon="fas fa-check-circle" accentColor="border-l-[#1cc88a]" iconColor="text-[#1cc88a]" />
        <StatCard label="Por Pagar / Vencidas" value={`${vencidas.length}`}
          icon="fas fa-exclamation-triangle"
          accentColor="border-l-[#e74a3b]"
          iconColor="text-[#e74a3b]"
          subLabel={vencidas.length > 0 ? "Requiere acción inmediata" : "Todo al día"}
        />
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-xs">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-8 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] bg-white w-full"
        />
      </div>

      {/* Tabla activas */}
      <div className="fp-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <h6 className="font-bold text-gray-700 text-sm">Suscripciones ({activas.length})</h6>
        </div>
        {activas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-calendar-times text-3xl mb-3 opacity-20" />
            <p className="text-sm">No hay suscripciones registradas.</p>
          </div>
        ) : (
          <SuscripcionesTable
            rows={activas}
            onDelete={(id) => setDeleteId(id)}
            onEdit={openEditModal}
            onPay={handlePay}
            fmt={fmt}
            baseCurrency={baseCurrency}
          />
        )}
      </div>

      {/* Modal — Create / Edit */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => { setModalOpen(false); resetForm(); }}
        >
          <div className="flex items-center justify-center min-h-full p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <i className={`fas ${editId ? 'fa-edit text-blue-500' : 'fa-plus-circle text-[#4e73df]'}`} />
                {editId ? 'Editar Suscripción' : 'Nueva Suscripción'}
              </h5>
              <button onClick={() => { setModalOpen(false); resetForm(); }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputServicio" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Servicio</label>
                <input id="inputServicio" type="text" required value={servicio} onChange={(e) => setServicio(e.target.value)}
                  placeholder="Ej: Adobe Creative Cloud"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm transition" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="inputMonto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Costo</label>
                  <input id="inputMonto" type="number" required min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm transition" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">IGV ({igv}%) incl.</label>
                  <p className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-[#4e73df] font-semibold">
                    {moneda} {((parseFloat(monto) || 0) * (igv / (100 + igv))).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-1">
                  <label htmlFor="inputMonedaSub" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Moneda</label>
                  <select id="inputMonedaSub" value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm bg-white transition">
                    {MONEDAS_DISPONIBLES.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
                  </select>
                </div>
              </div>

              {/* Muestra visual de la equivalencia */}
              {moneda !== baseCurrency && (
                <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                  <i className="fas fa-info-circle mr-1" />
                  Equivalente: <span className="font-bold underline">{fmt(parseFloat(monto) || 0, moneda)}</span> en {baseCurrency}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ciclo de facturación</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['MENSUAL', 'ANUAL'] as SuscripcionCiclo[]).map((c) => (
                    <button key={c} type="button" onClick={() => handleCicloChange(c)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition ${ciclo === c
                        ? 'bg-[#4e73df] text-white border-[#4e73df] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#4e73df]'
                        }`}>
                      {c === 'MENSUAL' ? '📅 Mensual' : '🗓️ Anual'}
                    </button>
                  ))}
                </div>
                {ciclo === 'ANUAL' && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                    ⚠️ Pago único anual. El sistema calculará el costo mensual equivalente.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="inputRenovacion" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Próxima renovación</label>
                <input id="inputRenovacion" type="date" value={proximaRenovacion} onChange={(e) => setProximaRen(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] text-sm transition" />
              </div>

              {usuario?.cuentaBancaria && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 shrink-0 text-blue-500" />
                  <p>
                    <strong>Nota:</strong> Esta suscripción se cobrará de tu cuenta bancaria principal: <span className="font-bold">{usuario.cuentaBancaria}</span>.
                  </p>
                </div>
              )}

              <button type="submit"
                className={`w-full py-3 rounded-xl text-white font-bold transition flex items-center justify-center gap-2 text-sm ${editId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-[#4e73df] hover:bg-[#3d5fc9]'
                  }`}>
                <i className={`fas ${editId ? 'fa-save' : 'fa-check'}`} />
                {editId ? 'Guardar Cambios' : 'Guardar Suscripción'}
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* ── Modal de Pago ─────────────────────────────────────────────── */}
      {payItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setPayItem(null)}
        >
          <div className="flex items-center justify-center min-h-full p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <i className="fas fa-credit-card text-[#4e73df]" /> Pagar Suscripción
                </h5>
                <button
                  onClick={() => setPayItem(null)}
                  className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Servicio a pagar</p>
                  <p className="text-lg font-bold text-blue-700">{payItem.servicio}</p>
                  <p className="text-sm font-semibold text-blue-800 mt-1">{fmt(payItem.monto, payItem.moneda)}</p>
                </div>
                
                <p className="text-xs text-gray-500 font-medium">Selecciona el origen de los fondos:</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => confirmPay('SALDO')}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-[#4e73df] hover:bg-blue-50 transition flex gap-3 items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#4e73df]/10 flex items-center justify-center shrink-0">
                      <i className="fas fa-wallet text-[#4e73df]" />
                    </div>
                    <div>
                      <h6 className="font-bold text-gray-800 text-sm">Saldo Virtual SaaS</h6>
                      <p className="text-xs text-gray-500">Descuenta del saldo generado por ingresos</p>
                    </div>
                  </button>

                  <button
                    onClick={() => confirmPay('CUENTA')}
                    className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-800 hover:bg-gray-50 transition flex gap-3 items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <i className="fas fa-university text-gray-600" />
                    </div>
                    <div>
                      <h6 className="font-bold text-gray-800 text-sm">Cuenta Bancaria</h6>
                      <p className="text-xs text-gray-500">{usuario?.cuentaBancaria || 'Cuenta externa principal'}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Suscripción"
        message="¿Estás seguro de que deseas eliminar esta suscripción? Esto no cancela el servicio real con el proveedor, solo lo remueve de tu control."
        confirmText="Eliminar"
        intent="danger"
      />
    </div>
  );
}

/* ── Tabla reutilizable ────────────────────────────────────────────────── */
function SuscripcionesTable({
  rows,
  onDelete,
  onEdit,
  onPay,
  fmt,
  baseCurrency,
}: {
  rows: Suscripcion[];
  onDelete: (id: number) => void;
  onEdit: (item: Suscripcion) => void;
  onPay: (item: Suscripcion) => void;
  fmt: (amount: number, from?: string) => string;
  baseCurrency: string;
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm fp-table">
        <thead className="bg-gray-50/70 text-gray-400 uppercase text-[10px] tracking-wider">
          <tr>
            <th className="px-5 py-3 text-left font-semibold">Servicio</th>
            <th className="px-5 py-3 text-left font-semibold">Costo ({baseCurrency})</th>
            <th className="px-5 py-3 text-left font-semibold">Ciclo</th>
            <th className="px-5 py-3 text-left font-semibold">Renovación</th>
            <th className="px-5 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((item) => {
            const badge = item.proximaRenovacion ? renewalBadge(item.proximaRenovacion) : null;
            const overdue = item.proximaRenovacion ? isOverdue(item.proximaRenovacion) : false;
            const isPaid = !!(item.proximaRenovacion && item.proximaRenovacion > todayStr);

            return (
              <tr key={item.id} className={overdue ? 'bg-red-50/20' : ''}>
                <td className="px-5 py-3.5 font-semibold text-gray-800 flex items-center gap-2">
                  {item.servicio}
                  {overdue && (
                    <span className="badge bg-red-100 text-red-700 border border-red-200 text-[9px] animate-pulse">
                      ¡Vencido!
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-bold text-[#e74a3b]">{fmt(item.monto, item.moneda)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${item.ciclo === 'ANUAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.ciclo}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {item.proximaRenovacion ? (
                    <>
                      <span className={overdue ? 'text-red-600 font-bold' : ''}>
                        {formatLocalDate(item.proximaRenovacion)}
                      </span>
                      {badge && <span className={`ml-2 badge ${badge.color}`}>{badge.label}</span>}
                    </>
                  ) : '—'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => !isPaid && onPay(item)}
                      disabled={isPaid}
                      title={isPaid ? "Ya pagado para este periodo" : "Registrar Pago"}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${isPaid
                        ? 'bg-gray-400 text-white border-gray-400 opacity-50 cursor-not-allowed'
                        : overdue
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm shadow-red-500/10'
                          : 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm shadow-green-500/10'
                        }`}
                    >
                      <i className="fas fa-credit-card text-[10px]" /> {isPaid ? 'Pagado' : 'Pagar'}
                    </button>
                    <button onClick={() => onEdit(item)} title="Editar"
                      className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition">
                      <i className="fas fa-pencil-alt text-[10px]" />
                    </button>
                    <button onClick={() => onDelete(item.id)} title="Eliminar"
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition">
                      <i className="fas fa-trash-alt text-[10px]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
