'use client';

import { useEffect, useRef } from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { suscripcionesService, gastosService } from '@/services/finanzasService';

export function SubscriptionInjector() {
  const { config } = useAppConfig();
  const hasRun = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasRun.current) return;
    hasRun.current = true;

    if (!config.alertas.inyectarSuscripciones) return;

    // Execute after a short delay to not block initial render
    const timer = setTimeout(() => {
      const subs = suscripcionesService.getAll();
      let modified = false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedSubs = subs.map(sub => {
        if (sub.status !== 'ACTIVA' || !sub.proximaRenovacion) return sub;

        const nextRenewalDate = new Date(sub.proximaRenovacion + 'T00:00:00');
        
        // If the renewal date is today or in the past
        if (nextRenewalDate <= today) {
          // 1. Inject into Gastos
          gastosService.add({
            concepto: `Renovación: ${sub.servicio}`,
            monto: sub.monto,
            moneda: sub.moneda,
            categoria: 'TECNOLOGIA_SAAS',
            esDeducible: true, // Typical for business SaaS
            esRecurrente: true,
            fecha: sub.proximaRenovacion // Use the actual renewal date as expense date
          });

          // 2. Calculate next renewal date for the subscription
          const nextDateStr = suscripcionesService.calcularProximaFecha(sub.proximaRenovacion, sub.ciclo);
          
          modified = true;
          return { ...sub, proximaRenovacion: nextDateStr };
        }

        return sub;
      });

      if (modified) {
        suscripcionesService.save(updatedSubs);
        // Dispatch an event to notify other components (like Dashboard) to refresh data
        window.dispatchEvent(new Event('financeDataChanged'));
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [config.alertas.inyectarSuscripciones]);

  return null;
}
