import { useEffect, useState } from 'react';

export function usePersisted<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved) as T;
    } catch { /* ignore broken JSON */ }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('Could not save', key, e); }
  }, [key, value]);
  return [value, setValue] as const;
}
