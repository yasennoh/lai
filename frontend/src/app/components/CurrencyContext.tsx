"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'IQD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatAmount: (amount: number | string) => string;
  currencySymbol: string;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRateState] = useState<number>(1450);

  useEffect(() => {
    const saved = localStorage.getItem('currency') as Currency;
    if (saved === 'USD' || saved === 'IQD') {
      setCurrencyState(saved);
    }
    const savedRate = localStorage.getItem('exchangeRate');
    if (savedRate && !isNaN(Number(savedRate))) {
      setExchangeRateState(Number(savedRate));
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate);
    localStorage.setItem('exchangeRate', rate.toString());
  };

  const currencySymbol = currency === 'USD' ? '$' : 'د.ع';

  const formatAmount = (amount: number | string): string => {
    const num = parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;
    if (currency === 'IQD') {
      const converted = num * exchangeRate;
      return `${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ع`;
    }
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, currencySymbol, exchangeRate, setExchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
