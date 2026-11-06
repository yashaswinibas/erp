// localStorage-backed state shared live between components (same browser tab).
import { useCallback, useEffect, useState } from 'react';

const EVT = 'paa-x-sync';

export function readKey<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); if (s !== null) return JSON.parse(s) as T; } catch { /* ignore */ }
  return fallback;
}

export function writeKey<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('Could not save', key, e); }
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

export function useShared<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readKey(key, fallback));
  useEffect(() => {
    const h = (e: Event) => { if ((e as CustomEvent).detail === key) setValue(readKey(key, fallback)); };
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((u: T | ((prev: T) => T)) => {
    const cur = readKey(key, fallback);
    const next = typeof u === 'function' ? (u as (p: T) => T)(cur) : u;
    writeKey(key, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set] as const;
}

export const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const nowStamp = () => new Date().toLocaleString('en-IN');

export const addMonthsIso = (iso: string, months: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, 1);
  const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  dt.setDate(Math.min(d, last));
  const mm = String(dt.getMonth() + 1).padStart(2, '0'), dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
};
