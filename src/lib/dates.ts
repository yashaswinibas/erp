// Local-date helpers. Using toISOString() gives the UTC date, which is
// "yesterday" in India between 12:00 AM and 5:30 AM. These use local time.

export const localDate = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDaysIso = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + days));
};

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const fmtDate = (iso?: string) => {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const daysBetween = (fromIso: string, toIso: string) => {
  const [a, b] = [fromIso, toIso].map((s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); });
  return Math.round((b - a) / 86400000);
};

/** Minutes since midnight for "09:45 AM", "9:45", "18:30". */
export const timeToMinutes = (t: string): number => {
  if (!t) return 0;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const p = m[3]?.toUpperCase();
  if (p === 'PM' && h < 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};
