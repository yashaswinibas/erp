// Separate Finance dashboard: revenue, collections, pending collections, expenses,
// salary expenditure, net operating margin, pending payments, monthly summary.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { readKey } from '../lib/sharedStore';
import { PayrollRun } from '../lib/hrTypes';
import { Installment, InstallmentPayment } from '../lib/crmTypes';
import { inr, round2 } from '../lib/money';
import { MONTH_NAMES, fmtDate, localDate } from '../lib/dates';
import { card, th, td, inputCls, btnGhost } from './ui2';

const ym = (d?: string) => (d || '').slice(0, 7);
const inrShort = (v: number) => {
  const a = Math.abs(v || 0), s = v < 0 ? '-' : '';
  if (a >= 1e7) return s + '\u20B9' + (a / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Cr';
  if (a >= 1e5) return s + '\u20B9' + (a / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
  return s + '\u20B9' + Math.round(a).toLocaleString('en-IN');
};

export const FinanceDashboard: React.FC<{ onOpen?: (tab: string) => void }> = ({ onOpen }) => {
  const { invoices, payments, expenses, reimbursements, clients } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number>(0);

  const runs = readKey<PayrollRun[]>('paa_x_payroll_runs', []);
  const inst = readKey<Installment[]>('paa_x_installments', []);
  const ipays = readKey<InstallmentPayment[]>('paa_x_installment_payments', []);
  const today = localDate();

  const inPeriod = (d?: string) => !!d && d.startsWith(String(year)) && (!month || ym(d) === `${year}-${String(month).padStart(2, '0')}`);

  const data = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({ m: i + 1, revenue: 0, collected: 0, expenses: 0, salary: 0 }));
    const add = (d: string | undefined, k: 'revenue' | 'collected' | 'expenses' | 'salary', v: number) => {
      if (!d || !d.startsWith(String(year))) return;
      const i = Number(d.slice(5, 7)) - 1; if (i >= 0 && i < 12) months[i][k] += v;
    };
    const validInv = invoices.filter((i) => i.status !== 'cancelled' && i.status !== 'draft');
    validInv.forEach((i) => add(i.issueDate, 'revenue', i.totalAmount));
    payments.forEach((p) => add(p.date, 'collected', p.amount));
    ipays.forEach((p) => p.allocations.forEach((a) => { const it = inst.find((x) => x.id === a.installmentId); if (!it?.invoiceId) add(p.date, 'collected', a.amount); }));
    ipays.forEach((p) => { const unalloc = p.amount - p.allocations.reduce((s, a) => s + a.amount, 0); if (unalloc > 0.01) add(p.date, 'collected', unalloc); });
    expenses.forEach((e) => add(e.date, 'expenses', e.amount));
    reimbursements.filter((r) => r.status === 'paid').forEach((r) => add(r.paidDate || r.date, 'expenses', r.amount));
    runs.forEach((r) => { if (['approved', 'partially_paid', 'paid'].includes(r.status)) { const d = `${r.year}-${String(r.month).padStart(2, '0')}-01`; add(d, 'salary', r.slips.reduce((s, x) => s + x.gross + x.employerPf + x.employerEsi, 0)); } });

    const sel = month ? months.filter((x) => x.m === month) : months;
    const sum = (k: 'revenue' | 'collected' | 'expenses' | 'salary') => round2(sel.reduce((s, x) => s + x[k], 0));
    const pendingCollections = round2(validInv.reduce((s, i) => s + (i.balanceAmount || 0), 0)
      + inst.filter((i) => !i.invoiceId).reduce((s, i) => s + Math.max(0, i.amount - ipays.reduce((t, p) => t + p.allocations.filter((a) => a.installmentId === i.id).reduce((u, a) => u + a.amount, 0), 0)), 0));
    const overdueCollections = round2(validInv.filter((i) => i.balanceAmount > 0 && i.dueDate < today).reduce((s, i) => s + i.balanceAmount, 0));
    const unpaidSalaries = round2(runs.filter((r) => ['approved', 'partially_paid'].includes(r.status)).reduce((s, r) => s + r.slips.filter((x) => x.paymentStatus !== 'paid').reduce((t, x) => t + x.net, 0), 0));
    const unpaidClaims = round2(reimbursements.filter((r) => r.status === 'approved').reduce((s, r) => s + r.amount, 0));
    return { months, revenue: sum('revenue'), collected: sum('collected'), expenses: sum('expenses'), salary: sum('salary'), pendingCollections, overdueCollections, unpaidSalaries, unpaidClaims };
  }, [invoices, payments, expenses, reimbursements, year, month, runs.length, inst.length, ipays.length]);

  const opex = data.expenses + data.salary;
  const margin = round2(data.revenue - opex);
  const marginPct = data.revenue ? Math.round((margin / data.revenue) * 1000) / 10 : 0;

  const tx = [
    ...payments.filter((p) => inPeriod(p.date)).map((p) => ({ d: p.date, type: 'In', what: `Payment ${p.paymentCode} - ${clients.find((c) => c.id === p.clientId)?.companyName || ''}`, amt: p.amount })),
    ...expenses.filter((e) => inPeriod(e.date)).map((e) => ({ d: e.date, type: 'Out', what: `Expense - ${e.title} (${e.category})`, amt: -e.amount })),
    ...runs.flatMap((r) => r.slips.filter((s) => s.paymentStatus === 'paid' && inPeriod(s.paidOn)).map((s) => ({ d: s.paidOn as string, type: 'Out', what: `Salary ${s.slipNumber}`, amt: -s.net }))),
  ].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 25);

  const exportCsv = () => {
    const rows = [['Month', 'Revenue', 'Collected', 'Expenses', 'Salaries', 'Net margin'], ...data.months.map((m) => [`${MONTH_NAMES[m.m - 1]} ${year}`, m.revenue, m.collected, m.expenses, m.salary, round2(m.revenue - m.expenses - m.salary)].map(String))];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `finance-summary-${year}.csv`; a.click();
  };

  const Kpi: React.FC<{ label: string; value: string; sub?: string; tone?: string; go?: string }> = ({ label, value, sub, tone = 'text-slate-900 dark:text-white', go }) => (
    <button onClick={() => go && onOpen?.(go)} title={value} className={`${card} min-w-0 text-left ${go ? 'cursor-pointer hover:border-blue-400' : 'cursor-default'}`}>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-xl xl:text-2xl font-bold mt-1 truncate ${tone}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</div>}
    </button>
  );
  const maxBar = Math.max(1, ...data.months.map((m) => Math.max(m.revenue, m.expenses + m.salary)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Finance Dashboard</h2><p className="text-xs text-slate-500">Revenue, collections, expenses, payroll and payments.</p></div>
        <div className="flex flex-wrap gap-2">
          <select className={inputCls} style={{ width: 100 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>{[0, 1, 2, 3].map((k) => <option key={k} value={now.getFullYear() - k}>{now.getFullYear() - k}</option>)}</select>
          <select className={inputCls} style={{ width: 150 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}><option value={0}>Whole year</option>{MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</select>
          <button className={`${btnGhost} whitespace-nowrap`} onClick={exportCsv}>Export CSV</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total revenue" value={inrShort(data.revenue)} sub="Invoices issued" go="billing" />
        <Kpi label="Collections received" value={inrShort(data.collected)} tone="text-emerald-600" go="billing" />
        <Kpi label="Pending collections" value={inrShort(data.pendingCollections)} sub={`Overdue ${inrShort(data.overdueCollections)}`} tone="text-amber-600" go="deals_installments" />
        <Kpi label="Total expenses" value={inrShort(data.expenses)} sub="Expenses + paid claims" tone="text-rose-600" go="billing" />
        <Kpi label="Salary expenditure" value={inrShort(data.salary)} sub="Gross + employer PF/ESI" go="hr_payroll" />
        <Kpi label="Net operating margin" value={inrShort(margin)} sub={`${marginPct}% of revenue`} tone={margin >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <Kpi label="Salaries to pay" value={inrShort(data.unpaidSalaries)} sub="Approved, not yet paid" tone="text-amber-600" go="hr_payroll" />
        <Kpi label="Claims to pay" value={inrShort(data.unpaidClaims)} sub="Approved reimbursements" tone="text-amber-600" go="reimbursements" />
      </div>
      <div className={card}>
        <div className="flex justify-between mb-2"><p className="text-xs font-bold">Monthly summary {year}</p><span className="text-[11px] text-slate-500"><span className="inline-block w-2 h-2 bg-blue-500 rounded-sm mr-1" />Revenue <span className="inline-block w-2 h-2 bg-rose-400 rounded-sm mx-1 ml-3" />Expenses + salaries</span></div>
        <div className="flex items-end gap-2 h-32 mb-3">{data.months.map((m) => (
          <div key={m.m} className="flex-1 flex flex-col items-center gap-1" title={`${MONTH_NAMES[m.m - 1]}: revenue ${inr(m.revenue)}, costs ${inr(m.expenses + m.salary)}`}>
            <div className="w-full flex items-end gap-0.5 h-28"><div className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(m.revenue / maxBar) * 100}%` }} /><div className="flex-1 bg-rose-400 rounded-t" style={{ height: `${((m.expenses + m.salary) / maxBar) * 100}%` }} /></div>
            <span className="text-[9px] text-slate-500">{MONTH_NAMES[m.m - 1].slice(0, 3)}</span></div>))}</div>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Month', 'Revenue', 'Collected', 'Expenses', 'Salaries', 'Net margin'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>{data.months.map((m) => { const n = round2(m.revenue - m.expenses - m.salary); return (
            <tr key={m.m} className={`border-t border-slate-100 dark:border-slate-800 ${month === m.m ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}><td className={td}>{MONTH_NAMES[m.m - 1]}</td><td className={td}>{inr(m.revenue)}</td><td className={td}>{inr(m.collected)}</td><td className={td}>{inr(m.expenses)}</td><td className={td}>{inr(m.salary)}</td><td className={`${td} font-bold ${n >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{inr(n)}</td></tr>); })}</tbody></table></div>
      </div>
      <div className={card}>
        <p className="text-xs font-bold mb-2">Recent transactions {month ? `(${MONTH_NAMES[month - 1]} ${year})` : `(${year})`}</p>
        {tx.length === 0 ? <p className="text-xs text-slate-500">No transactions in this period.</p> : (
          <table className="w-full"><thead><tr><th className={th}>Date</th><th className={th}>In / Out</th><th className={th}>Details</th><th className={th}>Amount</th></tr></thead>
            <tbody>{tx.map((t, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{fmtDate(t.d)}</td><td className={td}>{t.type}</td><td className={td}>{t.what}</td><td className={`${td} font-bold ${t.amt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{inr(t.amt)}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  );
};
