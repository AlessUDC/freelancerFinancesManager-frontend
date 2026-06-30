'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchRates, convertAmount, fmtWithCurrency } from '@/services/currencyService';

interface CurrencyContextType {
  baseCurrency: string;
  rates: Record<string, number>;
  loading: boolean;
  convert: (amount: number, from: string) => number;
  fmt: (amount: number, from?: string) => string;
  setBaseCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  baseCurrency: 'USD',
  rates: {},
  loading: true,
  convert: (a) => a,
  fmt: (a) => `$${a.toFixed(2)}`,
  setBaseCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrencyState] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Leer moneda base del perfil guardado
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u.monedaBase) setBaseCurrencyState(u.monedaBase);
      } catch {}
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRates(baseCurrency).then((data) => {
      setRates(data.rates);
      setLoading(false);
    });
  }, [baseCurrency]);

  const convert = (amount: number, from: string) =>
    convertAmount(amount, from, baseCurrency, rates);

  const fmt = (amount: number, from = baseCurrency) => {
    const converted = convert(amount, from);
    return fmtWithCurrency(converted, baseCurrency);
  };

  const setBaseCurrency = (code: string) => {
    setBaseCurrencyState(code);
    // Persistir en el usuario local
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        u.monedaBase = code;
        localStorage.setItem('usuario', JSON.stringify(u));
      } catch {}
    }
  };

  return (
    <CurrencyContext.Provider value={{ baseCurrency, rates, loading, convert, fmt, setBaseCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
