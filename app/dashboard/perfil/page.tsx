'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { UpdateUserPayload } from '@/types';

export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
    }
  }, [usuario]);

  if (!usuario) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: UpdateUserPayload = { nombre, email };
      if (password.trim()) payload.password = password;
      const updated = await authService.updateUser(usuario.id, payload);
      localStorage.setItem('usuario', JSON.stringify(updated));
      setMsg({ text: '¡Perfil actualizado correctamente!', type: 'success' });
      setEditing(false);
      setPassword('');
    } catch {
      setMsg({ text: 'Error al actualizar el perfil.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente todos tus datos financieros.')) return;
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.08)] overflow-hidden mb-6">
        {/* Header gradient */}
        <div className="h-24 bg-gradient-to-r from-[#4e73df] to-[#6f8ef5]"></div>
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 rounded-full bg-[#4e73df] flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-3">
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-gray-800" id="displayNombreHeader">{usuario.nombre}</h2>
          <p className="text-gray-500 text-sm" id="displayEmailHeader">{usuario.email}</p>
        </div>
      </div>

      {/* Feedback message */}
      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {msg.text}
        </div>
      )}

      {/* Info / Edit section */}
      <div className="bg-white rounded-2xl shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.08)] p-6">
        {!editing ? (
          /* View mode */
          <div id="infoView">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">Información Personal</h3>
              <button id="btnShowEdit" onClick={() => { setEditing(true); setMsg(null); }}
                className="flex items-center gap-2 text-sm text-[#4e73df] border border-[#4e73df] px-3 py-1.5 rounded-lg hover:bg-[#4e73df] hover:text-white transition">
                <i className="fas fa-pencil-alt"></i> Editar
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <i className="fas fa-user w-5 text-center text-[#4e73df]"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Nombre</p>
                  <p id="viewNombre" className="font-semibold text-gray-800">{usuario.nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <i className="fas fa-envelope w-5 text-center text-[#4e73df]"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Correo</p>
                  <p id="viewEmail" className="font-semibold text-gray-800">{usuario.email}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit mode */
          <div id="editSection">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">Editar Perfil</h3>
              <button id="btnCancelEdit" onClick={() => { setEditing(false); setMsg(null); setNombre(usuario.nombre); setEmail(usuario.email); setPassword(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition">
                <i className="fas fa-times mr-1"></i> Cancelar
              </button>
            </div>
            <form id="profileForm" onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input id="nombre" type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df] transition text-sm" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Correo</label>
                <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df] transition text-sm" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña <span className="text-gray-400 font-normal">(dejar en blanco para no cambiar)</span>
                </label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4e73df] transition text-sm" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-[#4e73df] hover:bg-[#3d5fc9] text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Guardando...</> : <><i className="fas fa-save"></i> Guardar cambios</>}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-white rounded-2xl shadow-[0_0.15rem_1.75rem_rgba(58,59,69,0.08)] p-6 border border-red-100">
        <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i> Zona de Peligro
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Eliminar tu cuenta es una acción irreversible. Perderás todos tus datos financieros permanentemente.
        </p>
        <button id="btnDelete" onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-2 text-sm text-red-500 border border-red-400 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition disabled:opacity-60">
          {deleting ? <><i className="fas fa-spinner fa-spin"></i> Eliminando...</> : <><i className="fas fa-trash-alt"></i> Eliminar mi cuenta</>}
        </button>
      </div>
    </div>
  );
}
