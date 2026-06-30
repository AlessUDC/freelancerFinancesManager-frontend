'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppAlerts {
  renovaciones7Dias: boolean;  // Notify when renewal < 7 days away
  inyectarSuscripciones: boolean; // Auto-inject expired subscriptions into expenses
}

export interface AppConfig {
  taxCow: number;              // % tax reserve (0-50)
  metaIngresoMensual: number;  // Monthly net income goal
  limiteGastos: number;        // Monthly expense alert limit
  alertas: AppAlerts;
}

const DEFAULT_CONFIG: AppConfig = {
  taxCow: 20,
  metaIngresoMensual: 0,
  limiteGastos: 0,
  alertas: {
    renovaciones7Dias: true,
    inyectarSuscripciones: true,
  },
};

const LS_KEY = 'appConfig';

interface AppConfigContextType {
  config: AppConfig;
  setConfig: (partial: Partial<AppConfig>) => void;
  setAlerta: (key: keyof AppAlerts, value: boolean) => void;
}

const AppConfigContext = createContext<AppConfigContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  setAlerta: () => {},
});

function readFromStorage(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfigState(readFromStorage());
  }, []);

  const setConfig = (partial: Partial<AppConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const setAlerta = (key: keyof AppAlerts, value: boolean) => {
    setConfigState((prev) => {
      const next = {
        ...prev,
        alertas: { ...prev.alertas, [key]: value },
      };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppConfigContext.Provider value={{ config, setConfig, setAlerta }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
