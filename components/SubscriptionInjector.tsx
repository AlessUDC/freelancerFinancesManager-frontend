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
    const timer = setTimeout(async () => {
      const subs = await suscripcionesService.getAll();
      let modified = false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedSubs = [];
      for (const sub of subs) {
        if (sub.status !== 'ACTIVA' || !sub.proximaRenovacion) {
          updatedSubs.push(sub);
          continue;
        }

        const nextRenewalDate = new Date(sub.proximaRenovacion + 'T00:00:00');
        
        // If the renewal date is today or in the past
        if (nextRenewalDate <= today) {
          // 1. Inject into Gastos
          try {
            await gastosService.add({
              concepto: `Renovación: ${sub.servicio}`,
              monto: sub.monto,
              moneda: sub.moneda,
              categoria: 'TECNOLOGIA_SAAS',
              esDeducible: true, // Typical for business SaaS
              esRecurrente: true,
              fecha: sub.proximaRenovacion // Use the actual renewal date as expense date
            });
          } catch (e) {
            console.error("Error adding expense for subscription renewal:", e);
          }

          // 2. Calculate next renewal date for the subscription
          const nextDateStr = suscripcionesService.calcularProximaFecha(sub.proximaRenovacion, sub.ciclo);
          
          modified = true;
          updatedSubs.push({ ...sub, proximaRenovacion: nextDateStr });
        } else {
          updatedSubs.push(sub);
        }
      }

      if (modified) {
        for (const sub of updatedSubs) {
           if (sub.id) {
               await suscripcionesService.update(sub.id, { proximaRenovacion: sub.proximaRenovacion });
           }
        }
        window.dispatchEvent(new Event('financeDataChanged'));
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [config.alertas.inyectarSuscripciones]);

  return null;
}
