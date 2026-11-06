// Shows on both reimbursement screens: is this data linked into the Finance ledger? ON/OFF switch + jump to Finance.
import React from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useShared } from '../lib/sharedStore';
import { canAccess } from '../lib/rbac';
import { inr, round2 } from '../lib/money';

interface Settings { openingBalance: number; openingDate: string; includeReimb?: boolean; includeEmpReimb?: boolean }
interface PoolLite { type: 'in' | 'out'; amount: number }

export const FinanceLinkBar: React.FC<{ kind: 'client' | 'employee' }> = ({ kind }) => {
  const { currentRole, reimbursements, setActiveTab, logAudit } = useApp();
  const [settings, setSettings] = useShared<Settings>('paa_x_cashbook_settings', { openingBalance: 0, openingDate: '' });
  const [pool] = useShared<PoolLite[]>('paa_x_client_reimb', []);
  if (!canAccess(currentRole, 'business_finance')) return null;
  const canEdit = ['super_admin', 'admin', 'finance'].includes(currentRole);
  const on = kind === 'client' ? settings.includeReimb !== false : settings.includeEmpReimb !== false;
  const flip = () => {
    setSettings(kind === 'client' ? { ...settings, includeReimb: !on } : { ...settings, includeEmpReimb: !on });
    logAudit('FINANCE_LINK', kind === 'client' ? 'Client reimbursement' : 'Employee reimbursement', on ? 'OFF' : 'ON');
  };
  let line = '';
  if (kind === 'client') {
    const i = round2(pool.filter((e) => e.type === 'in').reduce((a, e) => a + e.amount, 0));
    const o = round2(pool.filter((e) => e.type === 'out').reduce((a, e) => a + e.amount, 0));
    line = `${pool.length} entries \u00B7 In ${inr(i)} \u00B7 Out ${inr(o)}`;
  } else {
    const paid = reimbursements.filter((r) => r.status === 'paid');
    line = `${paid.length} paid claims (${inr(round2(paid.reduce((a, r) => a + r.amount, 0)))}) go to the ledger as money out`;
  }
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${on ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'}`}>
      <Link2 className={`w-4 h-4 ${on ? 'text-emerald-600' : 'text-slate-400'}`} />
      <div className="mr-auto min-w-0">
        <div className="text-sm font-bold text-slate-900 dark:text-white">{on ? 'Linked to Finance & Cash Book' : 'Not linked to Finance (switched off)'}</div>
        <div className="text-xs text-slate-500 truncate">{line}</div>
      </div>
      <button type="button" role="switch" aria-checked={on} disabled={!canEdit} onClick={flip} title={on ? 'Click to turn OFF' : 'Click to turn ON'} className={`relative w-11 h-6 rounded-full transition-colors ${canEdit ? 'cursor-pointer' : 'opacity-60'} ${on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} /></button>
      <span className={`text-xs font-bold ${on ? 'text-emerald-600' : 'text-slate-400'}`}>{on ? 'ON' : 'OFF'}</span>
      <button onClick={() => setActiveTab('business_finance')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">Open Finance ledger <ExternalLink className="w-3.5 h-3.5" /></button>
    </div>
  );
};
