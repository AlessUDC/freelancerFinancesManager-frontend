'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Usuario } from '@/types';

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('usuario');

    if (!token || !raw) {
      router.replace('/');
      setLoading(false);
      return;
    }
    try {
      setUsuario(JSON.parse(raw));
    } catch {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    router.replace('/');
  };

  return { usuario, loading, logout };
}
