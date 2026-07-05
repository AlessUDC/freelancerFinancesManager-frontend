'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { StatCard } from '@/components/StatCard';
import { ingresosService } from '@/services/finanzasService';
import { Ingreso, IngresoStatus, Usuario } from '@/types';
import { MONEDAS_DISPONIBLES } from '@/lib/currency';
import { formatLocalDate, isWithinTimeFilter, TimeFilter } from '@/lib/dates';
import { useCurrency } from '@/hooks/useCurrency';
import { ConfirmModal } from '@/components/ConfirmModal';

const STATUS_META: Record<IngresoStatus, { label: string; color: string; dot: string }> = {
  ESTIMADO: { label: 'Estimado', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  PENDIENTE: { label: 'Pendiente de Pago', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  PAGADO: { label: 'Pagado', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  ATRASADO: { label: 'Atrasado', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
};

const FILTROS: Array<{ value: IngresoStatus | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ESTIMADO', label: 'Estimados' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PAGADO', label: 'Pagados' },
  { value: 'ATRASADO', label: 'Atrasados' },
];

export default function IngresosPage() {
  const { fmt, convert, baseCurrency } = useCurrency();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [filtro, setFiltro] = useState<IngresoStatus | 'TODOS'>('TODOS');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [proyectoNombre, setProyectoNombre] = useState('');
  const [montoBruto, setMontoBruto] = useState('');
  const [retencion, setRetencion] = useState('0');
  const [moneda, setMoneda] = useState('USD');
  const [status, setStatus] = useState<IngresoStatus>('ESTIMADO');
  const [fecha, setFecha] = useState(''); // Fecha pago
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const refresh = () => setIngresos(ingresosService.getAll());

  useEffect(() => {
    refresh();
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUsuario(parsed);
        if (parsed.porcentajeImpuesto) {
          setRetencion(parsed.porcentajeImpuesto.toString());
        }
      } catch { }
    }
  }, []);

  const montoNeto = (() => {
    const b = parseFloat(montoBruto) || 0;
    const r = parseFloat(retencion) || 0;
    return b * (1 - r / 100);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(montoBruto);
    const r = parseFloat(retencion) || 0;
    if (!proyectoNombre.trim() || isNaN(b) || b <= 0) return;

    const data = {
      proyectoNombre: proyectoNombre.trim(),
      montoBruto: b,
      retencion: r,
      montoNeto: b * (1 - r / 100),
      moneda,
      status,
      fecha: status === 'PAGADO' ? fecha : '',
      fechaEmision,
      fechaVencimiento,
    };

    if (editId) {
      ingresosService.update(editId, data);
      toast.success(`Ingreso "${proyectoNombre.trim()}" actualizado ✓`);
    } else {
      ingresosService.add(data);
      toast.success(`Ingreso "${proyectoNombre.trim()}" guardado ✓`);
    }

    resetForm();
    setModalOpen(false);
    refresh();
  };

  const resetForm = () => {
    setEditId(null);
    setProyectoNombre('');
    setMontoBruto('');
    setRetencion(usuario?.porcentajeImpuesto?.toString() || '0');
    setMoneda(baseCurrency || 'USD');
    setStatus('ESTIMADO');
    setFecha('');
    setFechaEmision('');
    setFechaVencimiento('');
  };

  const openEditModal = (item: Ingreso) => {
    setEditId(item.id);
    setProyectoNombre(item.proyectoNombre);
    setMontoBruto(item.montoBruto.toString());
    setRetencion(item.retencion.toString());
    setMoneda(item.moneda);
    setStatus(item.status);
    setFecha(item.fecha || '');
    setFechaEmision(item.fechaEmision || '');
    setFechaVencimiento(item.fechaVencimiento || '');
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const item = ingresos.find(i => i.id === deleteId);
    ingresosService.remove(deleteId);
    toast.error(`Ingreso "${item?.proyectoNombre}" eliminado`);
    refresh();
    setDeleteId(null);
  };

  const handleStatusChange = (item: Ingreso, newStatus: IngresoStatus) => {
    if (newStatus === 'PAGADO' || item.status === 'PAGADO') {
      openEditModal(item);
      setStatus(newStatus);
      return;
    }
    ingresosService.updateStatus(item.id, newStatus);
    toast.success(`Estado actualizado a "${newStatus}" ✓`);
    refresh();
  };

  // Lógica para detectar si está retrasado dinámicamente si la fecha de vencimiento ya pasó y no está pagado
  const ingresosProcesados = ingresos.map(item => {
    let currentStatus = item.status;
    if (currentStatus !== 'PAGADO' && item.fechaVencimiento) {
      const v = new Date(item.fechaVencimiento + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (v < today) {
        currentStatus = 'ATRASADO';
      }
    }
    return { ...item, computedStatus: currentStatus };
  });

  const filtrados = ingresosProcesados
    .filter((i) => filtro === 'TODOS' || i.computedStatus === filtro)
    .filter((i) => !busqueda || i.proyectoNombre.toLowerCase().includes(busqueda.toLowerCase()));

  // KPIs
  const ingresosEnTiempo = ingresos.filter(i => {
    const dateToUse = i.status === 'PAGADO' ? i.fecha : i.fechaEmision;
    return isWithinTimeFilter(dateToUse, timeFilter);
  });

  const ingresosEnTiempoPagados = ingresosEnTiempo.filter(i => i.status === 'PAGADO');
  const totalBruto = ingresosEnTiempoPagados.reduce((s, i) => s + convert(i.montoBruto, i.moneda), 0);
  const totalImpuestos = ingresosEnTiempoPagados.reduce((s, i) => s + convert(i.montoBruto * (i.retencion / 100), i.moneda), 0);
  const totalNeto = ingresosEnTiempoPagados.reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);

  const totalPorCobrar = ingresosProcesados
    .filter(i => (i.computedStatus === 'PENDIENTE' || i.computedStatus === 'ATRASADO' || i.computedStatus === 'ESTIMADO')
      && isWithinTimeFilter(i.fechaVencimiento, timeFilter))
    .reduce((s, i) => s + convert(i.montoNeto, i.moneda), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Mis Ingresos
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="ml-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-[#4e73df]"
            >
              <option value="TODOS">Histórico</option>
              <option value="DIA">Hoy</option>
              <option value="SEMANA">Últimos 7 días</option>
              <option value="MES">Este mes</option>
              <option value="AÑO">Este año</option>
            </select>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Registro de ganancias de proyectos · montos en {baseCurrency}</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#1cc88a] hover:bg-[#17a874] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-green-500/20 transition-all text-sm"
        >
          <i className="fas fa-plus" /> Nuevo Ingreso
        </button>
      </div>

      {/* Stat cards KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        <StatCard label="Ingreso Bruto" value={fmt(totalBruto)}
          icon="fas fa-chart-line" accentColor="border-l-[#4e73df]" iconColor="text-[#4e73df]"
          subLabel="Todas las ganancias" />
        <StatCard label="Impuestos Retenidos" value={fmt(totalImpuestos)}
          icon="fas fa-file-invoice-dollar" accentColor="border-l-[#e74a3b]" iconColor="text-[#e74a3b]"
          subLabel="Retención calculada" />
        <StatCard label="Ingreso Neto" value={fmt(totalNeto)}
          icon="fas fa-wallet" accentColor="border-l-[#1cc88a]" iconColor="text-[#1cc88a]"
          subLabel="Ingreso final" />
        <StatCard label="Total a Cobrar" value={fmt(totalPorCobrar)}
          icon="fas fa-hourglass-half" accentColor="border-l-[#f6c23e]" iconColor="text-[#f6c23e]"
          subLabel="En camino o retrasado" />
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${filtro === f.value
                ? 'bg-[#4e73df] text-white border-[#4e73df]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#4e73df] hover:text-[#4e73df]'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder="Buscar proyecto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df] bg-white w-full sm:w-48"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="fp-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
          <i className="fas fa-list text-[#1cc88a] text-sm" />
          <h6 className="font-bold text-gray-700 text-sm">Historial de Ingresos</h6>
          <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {filtrados.length} registros
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <i className="fas fa-inbox text-4xl mb-3 opacity-20" />
            <p className="text-sm mb-3">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay ingresos registrados aún.'}
            </p>
            {!busqueda && (
              <button onClick={() => { resetForm(); setModalOpen(true); }}
                className="inline-flex items-center gap-2 text-sm bg-[#1cc88a] text-white px-4 py-2 rounded-xl hover:bg-[#17a874] transition">
                <i className="fas fa-plus" /> Agregar ingreso
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm fp-table">
              <thead className="bg-gray-50/70 text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Proyecto</th>
                  <th className="px-5 py-3 text-left font-semibold">Bruto</th>
                  <th className="px-5 py-3 text-left font-semibold">Ret.%</th>
                  <th className="px-5 py-3 text-left font-semibold">Neto ({baseCurrency})</th>
                  <th className="px-5 py-3 text-left font-semibold">Fechas</th>
                  <th className="px-5 py-3 text-left font-semibold">Estado</th>
                  <th className="px-5 py-3 w-20 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((item) => {
                  const meta = STATUS_META[item.computedStatus];
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-800">{item.proyectoNombre}</div>
                        <div className="currency-chip mt-0.5">{item.moneda}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-medium">
                        {item.montoBruto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{item.retencion}%</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#1cc88a]">{fmt(item.montoNeto, item.moneda)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {item.fechaEmision && <div><span className="font-medium text-gray-400">Emi:</span> {formatLocalDate(item.fechaEmision)}</div>}
                        {item.fechaVencimiento && <div><span className="font-medium text-gray-400">Venc:</span> {formatLocalDate(item.fechaVencimiento)}</div>}
                        {item.fecha && <div><span className="font-medium text-gray-400">Pago:</span> {formatLocalDate(item.fecha)}</div>}
                        {!item.fechaEmision && !item.fechaVencimiento && !item.fecha && '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          <select
                            value={item.computedStatus}
                            onChange={(e) => handleStatusChange(item, e.target.value as IngresoStatus)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${meta.color}`}
                          >
                            {Object.entries(STATUS_META).map(([k, v]) => (
                              <option key={k} value={k} disabled={k === 'ATRASADO'}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {item.computedStatus !== 'PAGADO' && (
                          <button onClick={() => handleStatusChange(item, 'PAGADO')}
                            className="text-gray-400 hover:text-green-500 hover:bg-green-50 p-1.5 rounded-lg transition mr-1" title="Marcar como pagado">
                            <i className="fas fa-check text-xs" />
                          </button>
                        )}
                        <button onClick={() => openEditModal(item)}
                          className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition mr-1" title="Editar">
                          <i className="fas fa-edit text-xs" />
                        </button>
                        <button onClick={() => setDeleteId(item.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Eliminar">
                          <i className="fas fa-trash-alt text-xs" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <i className={`fas ${editId ? 'fa-edit text-blue-500' : 'fa-plus-circle text-[#1cc88a]'}`} />
                {editId ? 'Editar Ingreso' : 'Nuevo Ingreso'}
              </h5>
              <button onClick={() => { setModalOpen(false); resetForm(); }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="inputProyecto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Proyecto / Concepto</label>
                <input id="inputProyecto" type="text" required value={proyectoNombre} onChange={(e) => setProyectoNombre(e.target.value)}
                  placeholder="Ej: Proyecto E-commerce"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-sm transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inputMontoBruto" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Monto Bruto</label>
                  <input id="inputMontoBruto" type="number" required min="0.01" step="0.01" value={montoBruto} onChange={(e) => setMontoBruto(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-sm transition" />
                </div>
                <div>
                  <label htmlFor="inputRetencion" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Retención (%)</label>
                  <input id="inputRetencion" type="number" min="0" max="100" step="0.5" value={retencion} onChange={(e) => setRetencion(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-sm transition" />
                </div>
              </div>

              {parseFloat(montoBruto) > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700 font-medium">Monto Neto (lo que recibes)</span>
                    <span className="font-bold text-green-700">{moneda} {montoNeto.toFixed(2)}</span>
                  </div>
                  {moneda !== baseCurrency && (
                    <div className="text-[10px] text-green-600 font-semibold bg-green-100/50 rounded p-1 flex justify-between items-center mt-1">
                      <span>Equivalente aproximado:</span>
                      <span>{fmt(montoNeto, moneda)} {baseCurrency}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inputMoneda" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Moneda</label>
                  <select id="inputMoneda" value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-sm bg-white transition">
                    {MONEDAS_DISPONIBLES.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.label.split('—')[1]?.trim()}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="inputStatus" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Estado Inicial</label>
                  <select id="inputStatus" value={status} onChange={(e) => setStatus(e.target.value as IngresoStatus)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-sm bg-white transition">
                    <option value="ESTIMADO">Estimado</option>
                    <option value="PENDIENTE">Pendiente de Pago</option>
                    <option value="PAGADO">Pagado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="inputEmision" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha Emisión</label>
                  <input id="inputEmision" type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-xs transition" />
                </div>
                <div>
                  <label htmlFor="inputVencimiento" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Vencimiento</label>
                  <input id="inputVencimiento" type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)}
                    min={fechaEmision || undefined}
                    disabled={!fechaEmision}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-xs transition disabled:bg-gray-100 disabled:text-gray-400" />
                </div>
                <div>
                  <label htmlFor="inputFecha" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha de Pago</label>
                  <input id="inputFecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                    min={fechaEmision || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    required={status === 'PAGADO'}
                    disabled={status !== 'PAGADO'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1cc88a]/30 focus:border-[#1cc88a] text-xs transition disabled:bg-gray-100 disabled:text-gray-400" />
                </div>
              </div>

              <button type="submit"
                className={`w-full py-3 rounded-xl text-white font-bold transition flex items-center justify-center gap-2 text-sm ${editId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-[#1cc88a] hover:bg-[#17a874]'}`}>
                <i className={`fas ${editId ? 'fa-save' : 'fa-check'}`} /> {editId ? 'Guardar Cambios' : 'Guardar Ingreso'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Ingreso"
        message="¿Estás seguro de que deseas eliminar este ingreso? Tu balance general e impuestos calculados se verán afectados."
        confirmText="Eliminar"
        intent="danger"
      />
    </div>
  );
}
