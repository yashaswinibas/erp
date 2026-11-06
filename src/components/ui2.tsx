// Shared small UI pieces for Part 3 screens.
import React from 'react';

export const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs';
const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-700 text-white`;
export const btnGhost = `${btn} border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`;
export const btnGood = `${btn} bg-emerald-600 hover:bg-emerald-700 text-white`;
export const btnBad = `${btn} bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900`;
export const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4';
export const th = 'px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold whitespace-nowrap';
export const td = 'px-3 py-2 text-xs text-slate-700 dark:text-slate-300 align-top';

export const Badge: React.FC<{ v: string }> = ({ v }) => {
  const good = ['completed', 'approved', 'paid', 'active', 'accepted', 'converted', 'signed', 'inside', 'not_required', 'granted'];
  const warn = ['pending', 'in_progress', 'sent', 'partially_paid', 'draft', 'viewed', 'planned', 'due_soon'];
  const cls = good.includes(v) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : warn.includes(v) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize whitespace-nowrap ${cls}`}>{v.replace(/_/g, ' ')}</span>;
};

export const Field: React.FC<{ label: string; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide }) => (
  <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
    <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</span>{children}
  </label>
);

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
    <div className="w-full max-w-3xl mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className={btnGhost}>Close</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export const Tabs: React.FC<{ tabs: [string, string][]; value: string; onChange: (v: string) => void }> = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 mb-4">
    {tabs.map(([k, l]) => (
      <button key={k} onClick={() => onChange(k)} className={`px-3 py-2 text-xs font-bold cursor-pointer border-b-2 -mb-px ${value === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{l}</button>
    ))}
  </div>
);

export const Empty: React.FC<{ text: string }> = ({ text }) => <p className="text-xs text-slate-500 py-6 text-center">{text}</p>;
