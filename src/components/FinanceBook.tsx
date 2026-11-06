// Business Finance / Cash Book: every rupee in and out (automatic + manual entries),
// owner capital, loans, withdrawals, profit, reimbursement pool and downloadable statements.
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, FileDown, RefreshCw, Plus, Trash2, Search, Settings2, ExternalLink, Link2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useShared, readKey, uid, nowStamp } from '../lib/sharedStore';
import { PayrollRun } from '../lib/hrTypes';
import { Installment, InstallmentPayment } from '../lib/crmTypes';
import { inr, round2 } from '../lib/money';
import { localDate, fmtDate, addDaysIso } from '../lib/dates';
import { printHtml } from '../lib/print';
import { inputCls, btnPrimary, btnGhost, Field, Modal } from './ui2';
import { PoolEntry } from './ClientReimbursementModule';
import { ROLE_LABEL, canAccess } from '../lib/rbac';

type ManualType = 'reimb_in' | 'reimb_out' | 'capital' | 'loan_in' | 'loan_repay' | 'interest' | 'owner_loan' | 'owner_repay' | 'withdrawal' | 'withdrawal_payback' | 'expense' | 'other_income';
const TYPES: Record<ManualType, { label: string; dir: 'in' | 'out'; help: string }> = {
  capital: { label: 'Owner Funds Added (capital)', dir: 'in', help: 'Money you invest in the business as capital.' },
  owner_loan: { label: 'Owner Loan to Company', dir: 'in', help: 'Money you lend to the company - the company owes it back to you.' },
  owner_repay: { label: 'Company Repaid Owner', dir: 'out', help: 'Company pays back money it owed you.' },
  withdrawal: { label: 'Personal Withdrawal', dir: 'out', help: 'Business money you took for personal use - you owe it to the company.' },
  withdrawal_payback: { label: 'Owner Paid Back Withdrawal', dir: 'in', help: 'You return money taken personally.' },
  loan_in: { label: 'Loan Borrowed (bank / other)', dir: 'in', help: 'Loan taken from a bank or lender.' },
  loan_repay: { label: 'Loan Principal Repaid', dir: 'out', help: 'Repayment of loan principal (not interest).' },
  interest: { label: 'Loan Interest Paid', dir: 'out', help: 'Interest on loans - counted as a business cost.' },
  expense: { label: 'Business Expense', dir: 'out', help: 'Rent, software, utilities, ads for the agency, etc.' },
  other_income: { label: 'Other Income', dir: 'in', help: 'Income that is not from client invoices.' },
  reimb_in: { label: 'Reimbursement Received (client)', dir: 'in', help: 'Client gave money to spend on their behalf. Also shows in Client Reimbursement.' },
  reimb_out: { label: 'Reimbursement Spent (client)', dir: 'out', help: 'Money spent from a client reimbursement pool. Also shows in Client Reimbursement.' },
};
const ACCOUNTS = ['Business Bank', 'Business Cash'];
interface ManualEntry { id: string; type: ManualType; date: string; amount: number; title: string; category: string; party: string; reference: string; mode: string; notes: string; by: string; at: string; account?: string; clientId?: string }
interface Settings { openingBalance: number; openingDate: string; includeReimb?: boolean; includeEmpReimb?: boolean }
interface Row { id: string; date: string; dir: 'in' | 'out'; type: string; category: string; title: string; tag?: string; party: string; ref: string; amount: number; manual?: boolean; kind: string; account: string; src: 'manual' | 'pool' | 'auto'; bal?: number }

const PERIODS: [string, string][] = [['this', 'This Month'], ['1', '1 Month'], ['2', '2 Months'], ['3', '3 Months'], ['4', '4 Months'], ['6', '6 Months'], ['12', '12 Months'], ['fy', 'Financial Year'], ['custom', 'Custom']];

const AddForm: React.FC<{ onClose: () => void; onSave: (e: ManualEntry) => void; by: string; clients: { id: string; companyName: string }[] }> = ({ onClose, onSave, by, clients }) => {
  const [f, setF] = useState({ clientId: '', account: 'Business Bank', type: 'expense' as ManualType, date: localDate(), amount: '', title: '', category: '', party: '', reference: '', mode: 'Bank Transfer', notes: '' });
  const [err, setErr] = useState('');
  const save = () => {
    const amount = round2(Number(f.amount));
    if (!(amount > 0)) return setErr('Enter an amount more than 0.');
    const isR = f.type === 'reimb_in' || f.type === 'reimb_out';
    if (isR && !f.clientId) return setErr('Select the client for this reimbursement.');
    const e: ManualEntry = { id: uid('cb'), type: f.type, date: f.date, amount, title: f.title.trim() || TYPES[f.type].label, category: f.category.trim(), party: f.party.trim(), reference: f.reference.trim(), mode: f.mode, notes: f.notes.trim(), by, at: nowStamp(), account: f.mode === 'Cash' ? 'Business Cash' : f.account, clientId: isR ? f.clientId : undefined };
    onSave(e);
  };
  return (
    <div className="space-y-3">
      <Field label="Transaction type"><select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ManualType })}>{(Object.keys(TYPES) as ManualType[]).map((t) => <option key={t} value={t}>{TYPES[t].dir === 'in' ? 'IN  - ' : 'OUT - '}{TYPES[t].label}</option>)}</select></Field>
      <p className="text-xs text-slate-500 -mt-1">{TYPES[f.type].help}</p>
      {(f.type === 'reimb_in' || f.type === 'reimb_out') && <Field label="Client"><select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}><option value="">Select client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></Field>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Amount"><input type="number" min={0} className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Description"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={TYPES[f.type].label} /></Field>
        <Field label="Category"><input className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder={f.type === 'expense' ? 'Rent, Software, Utilities...' : ''} /></Field>
        <Field label="Party (bank / person / vendor)"><input className={inputCls} value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} /></Field>
        <Field label="Reference / UTR"><input className={inputCls} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
        <Field label="Mode"><select className={inputCls} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>{['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Account"><select className={inputCls} value={f.mode === 'Cash' ? 'Business Cash' : f.account} onChange={(e) => setF({ ...f, account: e.target.value })}>{ACCOUNTS.map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Notes"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      {err && <p className="text-xs text-rose-600 font-semibold">{err}</p>}
      <div className="flex justify-end gap-2"><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={save}>Save transaction</button></div>
    </div>
  );
};
const SettingsForm: React.FC<{ settings: Settings; onClose: () => void; onSave: (s: Settings) => void }> = ({ settings, onClose, onSave }) => {
  const [f, setF] = useState({ ob: String(settings.openingBalance || ''), od: settings.openingDate || localDate() });
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Enter the bank + cash balance the business had before you started recording here. Current cash = this amount + all money in - all money out.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Opening balance"><input type="number" className={inputCls} value={f.ob} onChange={(e) => setF({ ...f, ob: e.target.value })} /></Field>
        <Field label="As on date"><input type="date" className={inputCls} value={f.od} onChange={(e) => setF({ ...f, od: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2"><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={() => onSave({ ...settings, openingBalance: Number(f.ob) || 0, openingDate: f.od })}>Save</button></div>
    </div>
  );
};


export const FinanceBook: React.FC = () => {
  const { payments, invoices, clients, expenses, reimbursements, employees, company, currentUser, currentRole, logAudit, setActiveTab } = useApp();
  const [manual, setManual] = useShared<ManualEntry[]>('paa_x_cashbook', []);
  const [settings, setSettings] = useShared<Settings>('paa_x_cashbook_settings', { openingBalance: 0, openingDate: '' });
  const [pool, setPool] = useShared<PoolEntry[]>('paa_x_client_reimb', []);
  const linkOn = settings.includeReimb !== false;
  const empLinkOn = settings.includeEmpReimb !== false;
  const [modal, setModal] = useState<'add' | 'settings' | null>(null);
  const [period, setPeriod] = useState('this');
  const [custom, setCustom] = useState({ from: addDaysIso(localDate(), -30), to: localDate() });
  const [statement, setStatement] = useState<null | { from: string; to: string }>(null);
  const [q, setQ] = useState('');
  const [dirF, setDirF] = useState<'all' | 'in' | 'out' | 'reimb'>('all');
  const canEdit = ['super_admin', 'admin', 'finance'].includes(currentRole);
  const cname = (id?: string) => clients.find((c) => c.id === id)?.companyName || '';

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const p of payments) {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      out.push({ id: 'pay-' + p.id, date: p.date, dir: 'in', type: 'Service Revenue', category: 'Invoice Payment', title: 'Invoice Payment', party: cname(p.clientId), ref: inv?.invoiceNumber || p.paymentCode, amount: p.amount, kind: 'service', account: 'Business Bank', src: 'auto' });
    }
    const inst = readKey<Installment[]>('paa_x_installments', []);
    for (const p of readKey<InstallmentPayment[]>('paa_x_installment_payments', [])) {
      const nonInvoice = p.allocations.filter((a) => !inst.find((i) => i.id === a.installmentId)?.invoiceId).reduce((s, a) => s + a.amount, 0) + Math.max(0, p.amount - p.allocations.reduce((s, a) => s + a.amount, 0));
      if (nonInvoice > 0.01) out.push({ id: 'ip-' + p.id, date: p.date, dir: 'in', type: 'Service Revenue', category: 'Instalment / Advance', title: 'Client Payment', party: cname(p.clientId), ref: p.receiptNo, amount: round2(nonInvoice), kind: 'service', account: 'Business Bank', src: 'auto' });
    }
    if (linkOn) for (const e of pool) out.push({ id: 'cr-' + e.id, date: e.date, dir: e.type, type: e.type === 'in' ? 'Reimbursement Received' : 'Reimbursement Expense', category: e.type === 'in' ? 'Reimbursement Received' : 'Reimbursement Expense', title: e.title, tag: 'Reimbursement', party: cname(e.clientId), ref: e.type === 'out' ? (e.reference || 'REIMB-' + e.id.slice(-8).toUpperCase()) : '', amount: e.amount, kind: e.type === 'in' ? 'reimb_in' : 'reimb_out', account: e.mode === 'Cash' ? 'Business Cash' : 'Business Bank', src: 'pool' });
    for (const e of expenses) out.push({ id: 'ex-' + e.id, date: e.date, dir: 'out', type: 'Business Expense', category: e.category, title: e.title, party: '', ref: e.expenseCode, amount: e.amount, kind: 'expense', account: 'Business Bank', src: 'auto' });
    if (empLinkOn) for (const r of reimbursements.filter((x) => x.status === 'paid')) out.push({ id: 'er-' + r.id, date: r.paidDate || r.date, dir: 'out', type: 'Business Expense', category: 'Employee Reimbursement', title: `${r.category} claim`, tag: 'Employee Reimb.', party: employees.find((x) => x.id === r.employeeId)?.name || '', ref: r.reimbursementCode, amount: r.amount, kind: 'expense', account: 'Business Bank', src: 'auto' });
    for (const run of readKey<PayrollRun[]>('paa_x_payroll_runs', [])) for (const s of run.slips) if (s.paymentStatus === 'paid' && s.paidOn) out.push({ id: 'sal-' + s.id, date: s.paidOn, dir: 'out', type: 'Business Expense', category: 'Salary', title: 'Salary payment', party: employees.find((x) => x.id === s.employeeId)?.name || '', ref: s.slipNumber, amount: s.net, kind: 'expense', account: 'Business Bank', src: 'auto' });
    for (const m of manual) {
      const t = TYPES[m.type];
      out.push({ id: m.id, date: m.date, dir: t.dir, type: t.label.replace(/ \(.+\)/, ''), category: m.category || t.label, title: m.title || t.label, party: m.party, ref: m.reference, amount: m.amount, manual: true, kind: m.type, account: m.account || (m.mode === 'Cash' ? 'Business Cash' : 'Business Bank'), src: 'manual' });
    }
    out.sort((a, b) => a.date.localeCompare(b.date));
    let bal = settings.openingBalance || 0;
    for (const r of out) { bal = round2(bal + (r.dir === 'in' ? r.amount : -r.amount)); r.bal = bal; }
    return out.reverse();
  }, [payments, invoices, pool, expenses, reimbursements, manual, clients, employees, linkOn, empLinkOn, settings.openingBalance]);
  const del = (r: Row) => {
    if (r.src === 'manual') { if (confirm('Delete this transaction?')) setManual((p) => p.filter((x) => x.id !== r.id)); }
    else if (r.src === 'pool') { if (confirm('Delete this reimbursement entry? It will also be removed from Client Reimbursement.')) setPool((p) => p.filter((x) => 'cr-' + x.id !== r.id)); }
  };
  const saveEntry = (e: ManualEntry) => {
    if (e.type === 'reimb_in' || e.type === 'reimb_out') {
      const pe: PoolEntry = { id: uid('crb'), clientId: e.clientId || '', type: e.type === 'reimb_in' ? 'in' : 'out', date: e.date, amount: e.amount, title: e.title, category: e.category || 'Other', mode: e.mode, reference: e.reference, notes: e.notes, byName: currentUser.name, byRole: ROLE_LABEL[currentRole] || currentRole, createdAt: nowStamp() };
      setPool((p) => [pe, ...p]);
    } else setManual((p) => [e, ...p]);
    logAudit('CASHBOOK_ENTRY', e.title, `${TYPES[e.type].dir} ${e.amount}`);
    setModal(null);
  };

  const sumK = (list: Row[], ...kinds: string[]) => round2(list.filter((r) => kinds.includes(r.kind)).reduce((s, r) => s + r.amount, 0));
  const k = useMemo(() => {
    const service = sumK(rows, 'service'), other = sumK(rows, 'other_income'), rIn = sumK(rows, 'reimb_in'), rOut = sumK(rows, 'reimb_out');
    const business = sumK(rows, 'expense'), interest = sumK(rows, 'interest');
    const capital = sumK(rows, 'capital'), borrowed = sumK(rows, 'loan_in'), repaid = sumK(rows, 'loan_repay');
    const owesYou = round2(sumK(rows, 'owner_loan') - sumK(rows, 'owner_repay'));
    const youOwe = round2(sumK(rows, 'withdrawal') - sumK(rows, 'withdrawal_payback'));
    const incoming = round2(service + other + rIn), outgoing = round2(business + interest + rOut);
    const allIn = round2(rows.filter((r) => r.dir === 'in').reduce((s, r) => s + r.amount, 0));
    const allOut = round2(rows.filter((r) => r.dir === 'out').reduce((s, r) => s + r.amount, 0));
    return { service, other, rIn, rOut, rLeft: round2(rIn - rOut), business, interest, capital, borrowed, repaid, invested: round2(capital + borrowed), owesYou, youOwe, net: round2(owesYou - youOwe),
      incoming, outgoing, profit: round2(service + other - business - interest), cash: round2((settings.openingBalance || 0) + allIn - allOut) };
  }, [rows, settings]);

  const range = (): { from: string; to: string } => {
    const today = localDate(); const [y, m] = today.split('-').map(Number);
    if (period === 'this') return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: today };
    if (period === 'fy') { const fyStart = m >= 4 ? y : y - 1; return { from: `${fyStart}-04-01`, to: today }; }
    if (period === 'custom') return custom;
    const n = Number(period); const d = new Date(y, m - 1 - n, Number(today.slice(8)) + 1);
    return { from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, to: today };
  };
  const build = (from: string, to: string) => {
    const before = rows.filter((r) => r.date < from);
    const opening = round2((settings.openingBalance || 0) + before.reduce((s, r) => s + (r.dir === 'in' ? r.amount : -r.amount), 0));
    const list = rows.filter((r) => r.date >= from && r.date <= to).sort((a, b) => a.date.localeCompare(b.date));
    const tin = round2(list.filter((r) => r.dir === 'in').reduce((s, r) => s + r.amount, 0));
    const tout = round2(list.filter((r) => r.dir === 'out').reduce((s, r) => s + r.amount, 0));
    let bal = opening;
    const lines = list.map((r) => { bal = round2(bal + (r.dir === 'in' ? r.amount : -r.amount)); return { ...r, bal }; });
    return { from, to, opening, tin, tout, closing: round2(opening + tin - tout), lines, profit: round2(sumK(list, 'service', 'other_income') - sumK(list, 'expense', 'interest')) };
  };
  const stmt = statement ? build(statement.from, statement.to) : null;

  const downloadPdf = () => {
    const r = statement || range();
    if (!statement) setStatement(r);
    const s = build(r.from, r.to);
    const tr = s.lines.map((l) => `<tr><td>${fmtDate(l.date)}</td><td>${l.dir === 'in' ? 'In' : 'Out'}</td><td>${l.type}</td><td>${l.title}${l.party ? ' - ' + l.party : ''}</td><td>${l.ref || '-'}</td><td class="r">${l.dir === 'in' ? inr(l.amount) : ''}</td><td class="r">${l.dir === 'out' ? inr(l.amount) : ''}</td><td class="r">${inr(l.bal)}</td></tr>`).join('');
    printHtml(`Statement ${s.from} to ${s.to}`, company, `<h2>Account statement</h2>
<p style="text-align:center;color:#555;margin-top:-8px">${fmtDate(s.from)} to ${fmtDate(s.to)}</p>
<table><tr><th>Opening balance</th><th>Total incoming</th><th>Total outgoing</th><th>Closing balance</th><th>Net profit</th></tr>
<tr><td>${inr(s.opening)}</td><td>${inr(s.tin)}</td><td>${inr(s.tout)}</td><td><b>${inr(s.closing)}</b></td><td>${inr(s.profit)}</td></tr></table>
<table><tr><th>Date</th><th>Dir</th><th>Type</th><th>Description</th><th>Ref</th><th class="r">In</th><th class="r">Out</th><th class="r">Balance</th></tr>${tr || '<tr><td colspan="8">No transactions in this period.</td></tr>'}</table>
<p class="muted">Generated ${nowStamp()} by ${currentUser.name}. Reimbursements are client pass-through money and are excluded from profit.</p>`);
  };

  const Kpi: React.FC<{ label: string; value: number; sub?: string; tone?: 'green' | 'red' | 'amber' | 'auto' }> = ({ label, value, sub, tone }) => {
    const c = tone === 'green' ? 'text-emerald-600' : tone === 'red' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-500' : tone === 'auto' ? (value < 0 ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-900 dark:text-white';
    return (
      <div className="min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-center" title={inr(value)}>
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500 leading-5">{label}</div>
        <div className={`mt-2 text-2xl font-bold truncate ${c}`}>{inr(value)}</div>
        {sub && <div className="text-xs text-slate-500 mt-1.5 leading-5">{sub}</div>}
      </div>
    );
  };
  const poolByClient = useMemo(() => {
    const m = new Map<string, { inS: number; outS: number; n: number }>();
    for (const e of pool) { const g = m.get(e.clientId) || { inS: 0, outS: 0, n: 0 }; if (e.type === 'in') g.inS += e.amount; else g.outS += e.amount; g.n++; m.set(e.clientId, g); }
    return [...m.entries()].map(([id, g]) => ({ id, name: cname(id) || 'Unknown client', ...g, left: round2(g.inS - g.outS) })).sort((a, b) => b.left - a.left);
  }, [pool, clients]);
  const empStat = useMemo(() => {
    const sum = (f: (s: string) => boolean) => { const l = reimbursements.filter((r) => f(r.status)); return { n: l.length, amt: round2(l.reduce((a, r) => a + r.amount, 0)) }; };
    return { pending: sum((s) => ['submitted', 'under_review', 'draft'].includes(s)), approved: sum((s) => s === 'approved'), paid: sum((s) => s === 'paid'), rejected: sum((s) => s === 'rejected') };
  }, [reimbursements]);
  const recentClaims = [...reimbursements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const go = (tab: string) => { if (canAccess(currentRole, tab)) setActiveTab(tab); else alert('You do not have access to that screen.'); };
  const Switch: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({ on, onClick, label }) => (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none">
      {label}
      <button type="button" role="switch" aria-checked={on} disabled={!canEdit} onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${canEdit ? 'cursor-pointer' : 'opacity-60'} ${on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} /></button>
      <span className={on ? 'text-emerald-600' : 'text-slate-400'}>{on ? 'ON' : 'OFF'}</span>
    </label>
  );
  const shown = rows.filter((r) => (dirF === 'all' || (dirF === 'reimb' ? !!r.tag : r.dir === dirF)) && (!q || `${r.type} ${r.category} ${r.title} ${r.party} ${r.ref}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Finance</h2><p className="text-base text-slate-500 mt-2">Cash, profit, owner funds, loans and every transaction</p></div>
        {canEdit && <div className="flex gap-2">
          <button onClick={() => setModal('settings')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold cursor-pointer"><Settings2 className="w-4 h-4" />Opening balance</button>
          <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"><Plus className="w-4 h-4" />Add transaction</button>
        </div>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Kpi label="Current Business Cash" value={k.cash} sub="Bank + business cash" tone="auto" />
        <Kpi label="Company Owes You" value={k.owesYou} sub="Business owes you" />
        <Kpi label="You Owe Company" value={k.youOwe} sub="Personal withdrawals to settle" />
        <Kpi label="Net Owner Position" value={k.net} sub={k.net >= 0 ? 'Company owes you' : 'You owe company'} tone="amber" />
        <Kpi label="Loan Interest" value={k.interest} sub="Included in business loss" />
        <Kpi label="Total Incoming" value={k.incoming} tone="green" sub="Service + other + reimbursement" />
        <Kpi label="Total Outgoing" value={k.outgoing} tone="red" sub="Business + interest + reimbursement" />
        <Kpi label="Service Revenue" value={k.service} />
        <Kpi label="Net Profit" value={k.profit} sub="Service + Other - Business - Interest" tone="auto" />
        <Kpi label="Reimbursement Received" value={k.rIn} />
        <Kpi label="Reimbursement Spent" value={k.rOut} />
        <Kpi label="Reimbursement Remaining" value={k.rLeft} />
        <Kpi label="Business Expenses" value={k.business} sub="Expenses + salaries + staff claims" />
        <Kpi label="Capital Invested" value={k.invested} sub={`Capital Added ${inr(k.capital)} \u00B7 Borrowed ${inr(k.borrowed)}`} />
        <Kpi label="Personal Withdrawn" value={k.youOwe} sub="Withdrawals minus paybacks" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-slate-500"><FileDown className="w-4 h-4" />Downloadable statement</div>
        <div className="flex flex-wrap gap-2">{PERIODS.map(([kk, l]) => <button key={kk} onClick={() => { setPeriod(kk); setStatement(null); }} className={`px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer ${period === kk ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{l}</button>)}</div>
        {period === 'custom' && <div className="flex flex-wrap gap-3 items-end"><Field label="From"><input type="date" className={inputCls} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></Field><Field label="To"><input type="date" className={inputCls} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></Field></div>}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setStatement(range())} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold cursor-pointer"><RefreshCw className="w-4 h-4" />Generate</button>
          <button onClick={downloadPdf} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"><FileDown className="w-4 h-4" />Download PDF</button>
        </div>
        {stmt && <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm pt-2">
          {[['Period', `${fmtDate(stmt.from)} - ${fmtDate(stmt.to)}`], ['Opening', inr(stmt.opening)], ['Incoming', inr(stmt.tin)], ['Outgoing', inr(stmt.tout)], ['Closing', inr(stmt.closing)]].map(([a, b]) => <div key={a} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3"><div className="text-[11px] uppercase tracking-wider text-slate-500">{a}</div><div className="font-bold text-slate-900 dark:text-white">{b}</div></div>)}
          <div className="col-span-2 md:col-span-5 text-xs text-slate-500">{stmt.lines.length} transaction(s). Net profit in period: {inr(stmt.profit)}. Click Download PDF to save or print.</div>
        </div>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-slate-500 mr-auto"><Link2 className="w-4 h-4" />Client Reimbursement</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${linkOn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{linkOn ? 'LINKED TO LEDGER' : 'NOT IN LEDGER'}</span>
            <button onClick={() => go('client_reimbursements')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 cursor-pointer">Open <ExternalLink className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">{[['Received', k.rIn || round2(pool.filter((e) => e.type === 'in').reduce((a, e) => a + e.amount, 0)), 'text-emerald-600'], ['Spent', k.rOut || round2(pool.filter((e) => e.type === 'out').reduce((a, e) => a + e.amount, 0)), 'text-rose-600'], ['Remaining', round2(pool.reduce((a, e) => a + (e.type === 'in' ? e.amount : -e.amount), 0)), 'text-slate-900 dark:text-white']].map(([l, v, c]) => <div key={l as string} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 min-w-0"><div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div><div className={`font-bold truncate ${c}`}>{inr(v as number)}</div></div>)}</div>
          <table className="w-full text-sm"><thead><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="py-2">Client</th><th className="py-2 text-right">Received</th><th className="py-2 text-right">Spent</th><th className="py-2 text-right">Remaining</th></tr></thead>
            <tbody>{poolByClient.slice(0, 6).map((g) => <tr key={g.id} className="border-t border-slate-100 dark:border-slate-800"><td className="py-2 uppercase text-slate-700 dark:text-slate-300">{g.name}</td><td className="py-2 text-right text-emerald-600">{inr(g.inS)}</td><td className="py-2 text-right text-rose-600">{inr(g.outS)}</td><td className={`py-2 text-right font-bold ${g.left < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{inr(g.left)}</td></tr>)}</tbody></table>
          {poolByClient.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">No client reimbursements yet.</p>}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-slate-500 mr-auto"><Link2 className="w-4 h-4" />Employee Reimbursement</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${empLinkOn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{empLinkOn ? 'LINKED TO LEDGER' : 'NOT IN LEDGER'}</span>
            <button onClick={() => go('reimbursements')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 cursor-pointer">Open <ExternalLink className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">{([['Pending', empStat.pending, 'text-amber-500'], ['Approved (to pay)', empStat.approved, 'text-blue-600'], ['Paid', empStat.paid, 'text-emerald-600'], ['Rejected', empStat.rejected, 'text-slate-500']] as const).map(([l, v, c]) => <div key={l} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 min-w-0"><div className="text-[10px] uppercase tracking-wider text-slate-500">{l} ({v.n})</div><div className={`font-bold truncate ${c}`}>{inr(v.amt)}</div></div>)}</div>
          <table className="w-full text-sm"><thead><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500"><th className="py-2">Date</th><th className="py-2">Employee</th><th className="py-2">Claim</th><th className="py-2">Status</th><th className="py-2 text-right">Amount</th></tr></thead>
            <tbody>{recentClaims.map((r) => <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800"><td className="py-2 text-slate-500 whitespace-nowrap">{fmtDate(r.date)}</td><td className="py-2 text-slate-700 dark:text-slate-300">{employees.find((e) => e.id === r.employeeId)?.name || '-'}</td><td className="py-2 text-slate-700 dark:text-slate-300">{r.category}</td><td className="py-2"><span className={`text-[10px] font-bold uppercase ${r.status === 'paid' ? 'text-emerald-600' : r.status === 'approved' ? 'text-blue-600' : r.status === 'rejected' ? 'text-slate-400' : 'text-amber-500'}`}>{r.status.replace('_', ' ')}</span></td><td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{inr(r.amount)}</td></tr>)}</tbody></table>
          {recentClaims.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">No employee claims yet.</p>}
          <p className="text-[11px] text-slate-400 mt-3">Only paid claims go into the ledger as money out. Pending and approved claims are shown here so you know what is coming.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-500 mr-auto">Finance History (Ledger) &middot; {shown.length} records</div>
          <Switch label="Client reimb." on={linkOn} onClick={() => setSettings({ ...settings, includeReimb: !linkOn })} />
          <Switch label="Employee reimb." on={empLinkOn} onClick={() => setSettings({ ...settings, includeEmpReimb: !empLinkOn })} />
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-semibold">{(['all', 'in', 'out', 'reimb'] as const).map((d) => <button key={d} onClick={() => setDirF(d)} className={`px-3 py-1.5 cursor-pointer ${dirF === d ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>{d === 'all' ? 'All' : d === 'in' ? 'Incoming' : d === 'out' ? 'Outgoing' : 'Reimbursements'}</button>)}</div>
          <div className="relative w-56"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" /><input className={`${inputCls} pl-9`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[1250px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-slate-500 bg-blue-50/60 dark:bg-slate-800/60">{['Date', 'Type', 'Kind', 'Category', 'Description', 'Client', 'Ref / Link', 'Money In', 'Money Out', 'Account', 'Balance', ''].map((h, i) => <th key={i} className={`px-4 py-4 font-semibold whitespace-nowrap ${['Money In', 'Money Out', 'Balance'].includes(h) ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody>{shown.slice(0, 500).map((r) => (
            <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
              <td className="px-4 py-5 text-slate-500 whitespace-nowrap">{fmtDate(r.date)}</td>
              <td className="px-4 py-5 whitespace-nowrap text-slate-900 dark:text-white"><span className="inline-flex items-center gap-1">{r.dir === 'in' ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-rose-600" />}{r.dir === 'in' ? 'Incoming' : 'Outgoing'}</span></td>
              <td className="px-4 py-5 text-slate-900 dark:text-white">{r.type}</td>
              <td className="px-4 py-5 text-slate-500">{r.category}</td>
              <td className="px-4 py-5"><div className="font-semibold text-slate-900 dark:text-white">{r.title}</div>{r.tag && <span className="inline-block mt-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] tracking-[0.14em] uppercase text-slate-500">{r.tag}</span>}</td>
              <td className="px-4 py-5 uppercase text-slate-600 dark:text-slate-300">{r.party || '\u2014'}</td>
              <td className="px-4 py-5 text-slate-500 break-all">{r.ref || '\u2014'}</td>
              <td className="px-4 py-5 text-right font-semibold whitespace-nowrap text-emerald-600">{r.dir === 'in' ? inr(r.amount) : ''}</td>
              <td className="px-4 py-5 text-right font-semibold whitespace-nowrap text-rose-600">{r.dir === 'out' ? inr(r.amount) : ''}</td>
              <td className="px-4 py-5 whitespace-nowrap text-slate-900 dark:text-white">{r.account}</td>
              <td className={`px-4 py-5 text-right font-bold whitespace-nowrap ${(r.bal || 0) < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{inr(r.bal || 0)}</td>
              <td className="px-3 py-5">{r.src !== 'auto' && canEdit ? <button title="Delete" className="text-slate-400 hover:text-rose-600 cursor-pointer" onClick={() => del(r)}><Trash2 className="w-4 h-4" /></button> : <span title="Added automatically from another module" className="text-[10px] text-slate-300">auto</span>}</td>
            </tr>))}</tbody></table></div>
        {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No transactions yet.</p>}
        <p className="px-6 py-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">Invoice payments, expenses, paid employee claims and paid salaries are added automatically ("auto"). Client reimbursements are linked both ways: add them here or in Client Reimbursement, they show in both places. Use the two switches to turn client / employee reimbursements ON or OFF in the ledger and totals.</p>
      </div>

      {modal === 'add' && <Modal title="Add transaction" onClose={() => setModal(null)}><AddForm by={currentUser.name} onClose={() => setModal(null)} clients={clients} onSave={saveEntry} /></Modal>}
      {modal === 'settings' && <Modal title="Opening balance" onClose={() => setModal(null)}><SettingsForm settings={settings} onClose={() => setModal(null)} onSave={(s) => { setSettings(s); setModal(null); }} /></Modal>}
    </div>
  );
};
