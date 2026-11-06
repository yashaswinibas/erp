// Client Reimbursement Pool: money received from a client to spend on their behalf
// (ads budget, printing, travel...), what was spent, and the balance left per client.
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2, Paperclip, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useShared, uid, nowStamp } from '../lib/sharedStore';
import { saveFile, openStoredFile } from '../lib/fileStore';
import { StoredFile } from '../lib/hrTypes';
import { inr, round2 } from '../lib/money';
import { localDate, fmtDate } from '../lib/dates';
import { ROLE_LABEL } from '../lib/rbac';
import { inputCls, btnPrimary, btnGhost, Field, Modal, Empty } from './ui2';

export interface PoolEntry {
  id: string; clientId: string; type: 'in' | 'out'; date: string; amount: number;
  title: string; category: string; mode: string; reference: string; notes: string;
  file?: StoredFile; byName: string; byRole: string; createdAt: string;
}
const KEY = 'paa_x_client_reimb';
const CATEGORIES = ['Ad spend (Meta / Google)', 'Printing', 'Media / Hoarding', 'Travel', 'Event', 'Vendor payment', 'Courier', 'Other'];
const MODES = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'];

export const ClientReimbursementModule: React.FC = () => {
  const { clients, currentUser, currentRole, logAudit, notify } = useApp();
  const [entries, setEntries] = useShared<PoolEntry[]>(KEY, []);
  const [modal, setModal] = useState<'in' | 'out' | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const canDelete = ['super_admin', 'admin', 'finance'].includes(currentRole);
  const cname = (id: string) => clients.find((c) => c.id === id)?.companyName || 'Unknown client';

  const groups = useMemo(() => {
    const m = new Map<string, { inSum: number; outSum: number; list: PoolEntry[] }>();
    for (const e of entries) {
      const g = m.get(e.clientId) || { inSum: 0, outSum: 0, list: [] };
      if (e.type === 'in') g.inSum += e.amount; else g.outSum += e.amount;
      g.list.push(e); m.set(e.clientId, g);
    }
    return [...m.entries()]
      .map(([clientId, g]) => ({ clientId, ...g, list: g.list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)) }))
      .filter((g) => !q || cname(g.clientId).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (b.list[0]?.date || '').localeCompare(a.list[0]?.date || ''));
  }, [entries, q, clients]);

  const totalIn = round2(entries.filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0));
  const totalOut = round2(entries.filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0));
  const balanceOf = (clientId: string) => round2(entries.filter((e) => e.clientId === clientId).reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0));

  const remove = (e: PoolEntry) => {
    if (!confirm(`Delete this ${e.type === 'in' ? 'received' : 'spent'} entry of ${inr(e.amount)}?`)) return;
    setEntries((p) => p.filter((x) => x.id !== e.id));
    logAudit('CLIENT_REIMB_DELETED', cname(e.clientId), `${e.type} ${e.amount} by ${currentUser.name}`);
  };

  const EntryForm: React.FC<{ type: 'in' | 'out' }> = ({ type }) => {
    const [f, setF] = useState({ clientId: '', date: localDate(), amount: '', title: type === 'in' ? 'Reimbursement Received' : 'Reimbursement Spent', category: type === 'in' ? 'Advance from client' : CATEGORIES[0], mode: 'Bank Transfer', reference: '', notes: '' });
    const [file, setFile] = useState<StoredFile | undefined>();
    const [err, setErr] = useState('');
    const bal = f.clientId ? balanceOf(f.clientId) : 0;
    const save = () => {
      const amount = round2(Number(f.amount));
      if (!f.clientId) return setErr('Choose a client.');
      if (!(amount > 0)) return setErr('Enter an amount more than 0.');
      if (!f.date) return setErr('Choose a date.');
      if (type === 'out' && amount > bal && !confirm(`This is more than the available balance of ${inr(bal)} for ${cname(f.clientId)}. The balance will go negative (client owes you). Save anyway?`)) return;
      const e: PoolEntry = { id: uid('crb'), clientId: f.clientId, type, date: f.date, amount, title: f.title.trim() || (type === 'in' ? 'Reimbursement Received' : 'Reimbursement Spent'), category: f.category, mode: f.mode, reference: f.reference.trim(), notes: f.notes.trim(), file, byName: currentUser.name, byRole: ROLE_LABEL[currentRole] || currentRole, createdAt: nowStamp() };
      setEntries((p) => [e, ...p]);
      logAudit(type === 'in' ? 'CLIENT_REIMB_RECEIVED' : 'CLIENT_REIMB_SPENT', cname(f.clientId), `${inr(amount)} by ${currentUser.name}`);
      const newBal = round2(bal + (type === 'in' ? amount : -amount));
      if (type === 'out' && newBal < 0) notify('Client pool negative', `${cname(f.clientId)} reimbursement balance is ${inr(newBal)}. Collect from client.`, 'invoice', 'client_reimbursements');
      setMsg(`${type === 'in' ? 'Received' : 'Expense'} of ${inr(amount)} saved for ${cname(f.clientId)}.`);
      setModal(null);
    };
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Client *"><select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}><option value="">Select client...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></Field>
          <Field label="Date *"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Amount *"><input type="number" min={0} className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0.00" /></Field>
          <Field label={type === 'in' ? 'Received via' : 'Paid via'}><select className={inputCls} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Title"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          {type === 'out'
            ? <Field label="Spent on"><select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            : <Field label="Reference / UTR"><input className={inputCls} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>}
          {type === 'out' && <Field label="Bill / reference no."><input className={inputCls} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>}
          <Field label="Notes" wide><textarea rows={2} className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-blue-600 font-semibold"><Paperclip className="w-4 h-4" />{file ? file.fileName : 'Attach bill / proof'}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => { const x = e.target.files?.[0]; e.target.value = ''; if (!x) return; try { setFile(await saveFile(x)); } catch (er) { setErr((er as Error).message); } }} /></label>
          {f.clientId && <span className="ml-auto text-slate-500">Current balance for this client: <b className={bal < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>{inr(bal)}</b></span>}
        </div>
        {err && <p className="text-xs text-rose-600 font-semibold">{err}</p>}
        <div className="flex justify-end gap-2"><button className={btnGhost} onClick={() => setModal(null)}>Cancel</button><button className={btnPrimary} onClick={save}>{type === 'in' ? 'Save received' : 'Save expense'}</button></div>
      </div>
    );
  };

  const kpi = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6';
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Client Reimbursement</h2>
          <p className="text-sm text-slate-500 mt-2">Track client reimbursement received, spent, and remaining</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal('in')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"><ArrowDownLeft className="w-4 h-4" />Record Incoming</button>
          <button onClick={() => setModal('out')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm cursor-pointer"><ArrowUpRight className="w-4 h-4" />Record Expense</button>
        </div>
      </div>

      {msg && <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg px-4 py-2 flex justify-between"><span>{msg}</span><button className="cursor-pointer" onClick={() => setMsg('')}>x</button></div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={kpi}><div className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">Received</div><div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{inr(totalIn)}</div></div>
        <div className={kpi}><div className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">Spent</div><div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{inr(totalOut)}</div></div>
        <div className={kpi}><div className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">Available Pool</div><div className={`mt-2 text-3xl font-bold ${totalIn - totalOut < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{inr(totalIn - totalOut)}</div></div>
      </div>

      {entries.length > 0 && (
        <div className="relative max-w-sm"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input className={`${inputCls} pl-9 py-2`} placeholder="Search client" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      )}

      {groups.length === 0 ? (
        <div className={kpi}><Empty text="No client reimbursements yet. Use Record Incoming when a client sends money, and Record Expense when you spend it for them." /></div>
      ) : groups.map((g) => {
        const bal = round2(g.inSum - g.outSum);
        return (
          <div key={g.clientId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
              <div>
                <div className="text-lg font-semibold uppercase text-slate-900 dark:text-white">{cname(g.clientId)}</div>
                <div className="text-sm text-slate-500 mt-1">Received {inr(g.inSum)} &middot; Spent {inr(g.outSum)}</div>
              </div>
              <span className={`px-3 py-1.5 rounded-md border text-xs font-semibold tracking-[0.12em] uppercase ${bal < 0 ? 'border-rose-300 text-rose-600' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>Balance {inr(bal)}</span>
            </div>
            {g.list.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                {e.type === 'in' ? <ArrowDownLeft className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0" /> : <ArrowUpRight className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-base font-medium text-slate-900 dark:text-white">{e.title}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {fmtDate(e.date)} &middot; {e.byRole} &middot; {e.type === 'in' ? 'Reimbursement received' : e.category}{e.mode ? ` \u00B7 ${e.mode}` : ''}{e.reference ? ` \u00B7 Ref ${e.reference}` : ''}{e.notes ? ` \u00B7 ${e.notes}` : ''}
                  </div>
                </div>
                {e.file && <button title={e.file.fileName} onClick={() => openStoredFile(e.file!)} className="text-slate-400 hover:text-blue-600 cursor-pointer"><Paperclip className="w-4 h-4" /></button>}
                <div className="text-lg font-semibold whitespace-nowrap text-slate-900 dark:text-white">{e.type === 'out' ? '-' : ''}{inr(e.amount)}</div>
                {canDelete && <button title="Delete" onClick={() => remove(e)} className="text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
        );
      })}

      {modal && <Modal title={modal === 'in' ? 'Record incoming reimbursement' : 'Record reimbursement expense'} onClose={() => setModal(null)}><EntryForm type={modal} /></Modal>}
    </div>
  );
};
