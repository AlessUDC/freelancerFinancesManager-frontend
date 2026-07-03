'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { UpdateUserPayload, PerfilFiscal } from '@/types';

/* ── Password strength helpers ───────────────────────────────────────────── */
type StrengthLevel = 'weak' | 'medium' | 'strong' | 'none';

function getStrength(pw: string): StrengthLevel {
  if (!pw) return 'none';
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 'weak';
  if (score <= 2) return 'medium';
  return 'strong';
}

const STRENGTH_META: Record<StrengthLevel, { label: string; color: string; width: string }> = {
  none: { label: '', color: 'bg-gray-200', width: 'w-0' },
  weak: { label: 'Débil', color: 'bg-red-400', width: 'w-1/3' },
  medium: { label: 'Media', color: 'bg-amber-400', width: 'w-2/3' },
  strong: { label: 'Fuerte', color: 'bg-green-400', width: 'w-full' },
};

/* ── Next billing date mock ──────────────────────────────────────────────── */
function nextBillingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ── Section Card wrapper ────────────────────────────────────────────────── */
function SectionCard({
  icon, title, children,
}: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="fp-card p-6 space-y-4">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
        <i className={`${icon} text-[#4e73df] w-4`} />
        {title}
      </h3>
      <div className="border-t border-gray-50 pt-4 space-y-4">{children}</div>
    </div>
  );
}

/* ── Input row helper ────────────────────────────────────────────────────── */
function Field({
  id, label, type = 'text', value, onChange, placeholder, required, readOnly, hint,
}: {
  id: string; label: string; type?: string;
  value: string; onChange?: (v: string) => void;
  placeholder?: string; required?: boolean; readOnly?: boolean; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id} type={type} value={value} required={required} readOnly={readOnly}
        placeholder={placeholder}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm transition
          ${readOnly
            ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed'
            : 'border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df]/30 focus:border-[#4e73df]'
          }`}
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  /* ── Identity state ── */
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [msgIdentity, setMsgIdentity] = useState<{ text: string; ok: boolean } | null>(null);

  /* ── Fiscal state ── */
  const [fiscal, setFiscal] = useState<PerfilFiscal>({ razonSocial: '', rucNif: '', direccionFiscal: '' });
  const [savingFiscal, setSavingFiscal] = useState(false);
  const [msgFiscal, setMsgFiscal] = useState<{ text: string; ok: boolean } | null>(null);

  /* ── Security state ── */
  const [pwActual, setPwActual] = useState('');
  const [pwNueva, setPwNueva] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msgPw, setMsgPw] = useState<{ text: string; ok: boolean } | null>(null);
  const strength = getStrength(pwNueva);

  /* ── Danger zone ── */
  const [deleting, setDeleting] = useState(false);

  /* ── Seed from localStorage ── */
  useEffect(() => {
    if (!usuario) return;
    setNombre(usuario.nombre);
    setEmail(usuario.email);
    if (usuario.perfilFiscal) setFiscal(usuario.perfilFiscal);
  }, [usuario]);

  if (!usuario) return null;

  /* ── Save identity ── */
  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIdentity(true);
    setMsgIdentity(null);
    try {
      const payload: UpdateUserPayload = { nombre, email };
      const updated = await authService.updateUser(usuario.id, payload);
      localStorage.setItem('usuario', JSON.stringify({ ...usuario, ...updated }));
      setMsgIdentity({ text: 'Información actualizada.', ok: true });
    } catch {
      setMsgIdentity({ text: 'Error al guardar.', ok: false });
    } finally {
      setSavingIdentity(false);
    }
  };

  /* ── Save fiscal (local only — prototype) ── */
  const handleSaveFiscal = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFiscal(true);
    setMsgFiscal(null);
    setTimeout(() => {
      const updated = { ...usuario, perfilFiscal: fiscal };
      localStorage.setItem('usuario', JSON.stringify(updated));
      setMsgFiscal({ text: 'Datos fiscales guardados.', ok: true });
      setSavingFiscal(false);
    }, 400);
  };

  /* ── Save password (prototype UI only) ── */
  const handleSavePw = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNueva !== pwConfirm) {
      setMsgPw({ text: 'Las contraseñas no coinciden.', ok: false });
      return;
    }
    if (strength === 'weak') {
      setMsgPw({ text: 'La contraseña es demasiado débil.', ok: false });
      return;
    }
    setSavingPw(true);
    setMsgPw(null);
    // Prototype: no real API call
    setTimeout(() => {
      setMsgPw({ text: 'Contraseña actualizada (modo prototipo).', ok: true });
      setPwActual(''); setPwNueva(''); setPwConfirm('');
      setSavingPw(false);
    }, 600);
  };

  /* ── Delete account ── */
  const handleDelete = async () => {
    if (!confirm('¿ESTÁS SEGURO? Esto eliminará permanentemente todos tus datos.')) return;
    setDeleting(true);
    try {
      await authService.deleteUser(usuario.id);
      localStorage.removeItem('usuario');
      logout();
    } catch {
      alert('Error al eliminar la cuenta.');
      setDeleting(false);
    }
  };

  const sm = STRENGTH_META[strength];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>

      {/* ── Avatar hero card ─────────────────────────────────────────── */}
      <div className="fp-card overflow-hidden">
        <div className="h-24 bg-linear-to-r from-[#4e73df] to-[#6f8ef5]" />
        <div className="px-6 pb-5 -mt-10">
          <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md mb-3 flex">
            <div className="w-full h-full rounded-xl bg-[#4e73df] flex items-center justify-center text-white text-3xl font-bold">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-800">{usuario.nombre}</h2>
          <p className="text-gray-400 text-sm">{usuario.email}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {/* Currency badge → links to Configuración */}
            <Link
              href="/dashboard/configuracion"
              title="Ir a Configuración para cambiar la moneda"
              className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 hover:bg-blue-100 transition"
            >
              <i className="fas fa-coins" /> {usuario.monedaBase ?? 'USD'}
            </Link>
            <span className="text-xs bg-green-50 border border-green-100 text-green-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
              <i className="fas fa-check-circle" /> Plan Activo
            </span>
            <span className="text-xs bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
              <i className="fas fa-crown" /> MVP Tier
            </span>
          </div>
        </div>
      </div>

      {/* ── A: Identity ──────────────────────────────────────────────── */}
      <SectionCard icon="fas fa-user" title="Información Personal">
        <form onSubmit={handleSaveIdentity} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="inputNombre" label="Nombre completo" value={nombre} onChange={setNombre} required />
            <Field id="inputEmail" label="Correo electrónico" type="email" value={email} onChange={setEmail} required />
          </div>
          {msgIdentity && (
            <p className={`text-xs px-3 py-2 rounded-lg ${msgIdentity.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <i className={`fas ${msgIdentity.ok ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1.5`} />
              {msgIdentity.text}
            </p>
          )}
          <button type="submit" disabled={savingIdentity}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-[#4e73df] hover:bg-[#3d5fc9] text-white transition disabled:opacity-60">
            {savingIdentity ? <><i className="fas fa-spinner fa-spin" /> Guardando...</> : <><i className="fas fa-check" /> Guardar</>}
          </button>
        </form>
      </SectionCard>

      {/* ── B: Datos Fiscales ─────────────────────────────────────────── */}
      <SectionCard icon="fas fa-file-invoice" title="Datos de Facturación Freelancer">
        <p className="text-xs text-gray-400 -mt-2">
          Estos datos aparecerán en futuras plantillas de facturas y recibos de honorarios.
        </p>
        <form onSubmit={handleSaveFiscal} className="space-y-3">
          <Field
            id="inputRazonSocial" label="Razón Social / Nombre Comercial"
            value={fiscal.razonSocial} onChange={(v) => setFiscal((f) => ({ ...f, razonSocial: v }))}
            placeholder="Ej. Paolo Alessandro Diseño Web"
          />
          <Field
            id="inputRucNif" label="Documento Fiscal (RUC / NIF / RFC)"
            value={fiscal.rucNif} onChange={(v) => setFiscal((f) => ({ ...f, rucNif: v }))}
            placeholder="Ej. 20123456789"
          />
          <Field
            id="inputDireccionFiscal" label="Dirección Fiscal"
            value={fiscal.direccionFiscal} onChange={(v) => setFiscal((f) => ({ ...f, direccionFiscal: v }))}
            placeholder="Ej. Av. Principal 123, Lima, Perú"
          />
          {msgFiscal && (
            <p className={`text-xs px-3 py-2 rounded-lg ${msgFiscal.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <i className={`fas ${msgFiscal.ok ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1.5`} />
              {msgFiscal.text}
            </p>
          )}
          <button type="submit" disabled={savingFiscal}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-[#4e73df] hover:bg-[#3d5fc9] text-white transition disabled:opacity-60">
            {savingFiscal ? <><i className="fas fa-spinner fa-spin" /> Guardando...</> : <><i className="fas fa-check" /> Guardar datos fiscales</>}
          </button>
        </form>
      </SectionCard>

      {/* ── C: Security ──────────────────────────────────────────────── */}
      <SectionCard icon="fas fa-shield-alt" title="Seguridad">
        {/* Password change */}
        <form onSubmit={handleSavePw} className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cambiar contraseña</p>
          <Field id="inputPwActual" label="Contraseña actual" type="password" value={pwActual} onChange={setPwActual} placeholder="••••••••" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="inputPwNueva" label="Nueva contraseña" type="password" value={pwNueva} onChange={setPwNueva} placeholder="••••••••" />
            <Field id="inputPwConfirm" label="Confirmar contraseña" type="password" value={pwConfirm} onChange={setPwConfirm} placeholder="••••••••" />
          </div>

          {/* Strength bar */}
          {pwNueva && (
            <div className="space-y-1">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${sm.color} ${sm.width}`} />
              </div>
              <p className={`text-[11px] font-semibold ${sm.color.replace('bg-', 'text-').replace('-400', '-600')}`}>
                Fortaleza: {sm.label}
              </p>
            </div>
          )}

          {msgPw && (
            <p className={`text-xs px-3 py-2 rounded-lg ${msgPw.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <i className={`fas ${msgPw.ok ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1.5`} />
              {msgPw.text}
            </p>
          )}
          <button type="submit" disabled={savingPw || !pwActual || !pwNueva || !pwConfirm}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-[#4e73df] hover:bg-[#3d5fc9] text-white transition disabled:opacity-60">
            {savingPw ? <><i className="fas fa-spinner fa-spin" /> Guardando...</> : <><i className="fas fa-key" /> Cambiar contraseña</>}
          </button>
        </form>

        {/* 2FA placeholder */}
        <div className="border-t border-gray-50 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Autenticación de Dos Factores (2FA)</p>
              <p className="text-xs text-gray-400 mt-0.5">Añade una capa extra de seguridad con Spring Security TOTP. <span className="text-amber-500 font-medium">(Próximamente)</span></p>
            </div>
            <button
              id="toggle2FA"
              onClick={() => setShow2FA((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-not-allowed opacity-60 ${show2FA ? 'bg-[#4e73df]' : 'bg-gray-200'}`}
              disabled
              title="Disponible próximamente"
            >
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ${show2FA ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── D: SaaS Status ───────────────────────────────────────────── */}
      <SectionCard icon="fas fa-crown" title="Tu Suscripción a FinancePro">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#f0f4ff] border border-[#c7d5f8] rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-[#4e73df] uppercase tracking-wider mb-1">Plan Actual</p>
            <p className="font-bold text-gray-800 text-sm">MVP Tier</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Acceso completo</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Estado</p>
            <span className="inline-flex items-center gap-1 font-bold text-green-700 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Activo
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Próximo Cobro</p>
            <p className="font-bold text-gray-800 text-sm">{nextBillingDate()}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 text-center">
          Plan académico — sin cargo real. La integración de pagos estará disponible en la versión de producción.
        </p>
      </SectionCard>

      {/* ── E: Danger Zone ───────────────────────────────────────────── */}
      <div className="fp-card p-6 border border-red-100 bg-red-50/30">
        <h3 className="font-bold text-red-600 mb-1 flex items-center gap-2 text-sm">
          <i className="fas fa-exclamation-triangle" /> Zona de Peligro
        </h3>
        <p className="text-xs text-red-400 mb-4 font-medium">
          Eliminar tu cuenta es irreversible. Perderás todos tus datos financieros.
        </p>
        <button id="btnDelete" onClick={handleDelete} disabled={deleting}
          className="flex items-center justify-center w-full sm:w-auto gap-2 text-xs font-bold text-red-500 bg-white border border-red-200 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition shadow-sm disabled:opacity-60">
          {deleting ? <><i className="fas fa-spinner fa-spin" /> Eliminando...</> : <><i className="fas fa-trash-alt" /> Eliminar cuenta</>}
        </button>
      </div>
    </div>
  );
}
