// AgencyOS v2 Part 3: Quotation desk (addresses, files, revisions, approval, convert),
// Agreements (clauses, versions, signed copy, renewals), Instalments (schedule, invoice,
// payments, receipts, client-wise history), Scope of Work (versions, milestones,
// approval), Project templates and project change history.
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Quotation, QuotationItem, Agreement, Client } from '../types';
import {
  QuotationExtra, AgreementExtra, AgreementClause, Installment, InstallmentPayment, ScopeOfWork, SowContent,
  ProjectTemplate, ProjectChange, DealSettings, DEFAULT_DEAL_SETTINGS, Milestone,
} from '../lib/crmTypes';
import { useShared, uid, nowStamp, addMonthsIso, readKey } from '../lib/sharedStore';
import { saveFile, openStoredFile } from '../lib/fileStore';
import { StoredFile } from '../lib/hrTypes';
import { inr, round2 } from '../lib/money';
import { localDate, fmtDate, addDaysIso, daysBetween } from '../lib/dates';
import { printReceipt, printAgreement, printSow } from '../lib/print2';
import { inputCls, btnPrimary, btnGhost, btnGood, btnBad, card, th, td, Badge, Field, Modal, Tabs, Empty } from './ui2';

export type DealsTab = 'quotations' | 'agreements' | 'installments' | 'sow' | 'templates' | 'settings';

const K = {
  qx: 'paa_x_quotation_extras', ax: 'paa_x_agreement_extras', inst: 'paa_x_installments', pay: 'paa_x_installment_payments',
  sow: 'paa_x_sows', tpl: 'paa_x_project_templates', set: 'paa_x_deal_settings',
};

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  { id: 'tpl-smm', name: 'Social Media Management (monthly)', description: 'Monthly content calendar, creatives, posting and report.', deliverables: ['Monthly content calendar', '12 static creatives', '4 reels', 'Monthly performance report'],
    tasks: [{ title: 'Kick-off call & brand brief', days: 2, hours: 2 }, { title: 'Content calendar', days: 5, hours: 6 }, { title: 'Creatives design', days: 12, hours: 24 }, { title: 'Client review & changes', days: 15, hours: 4 }, { title: 'Scheduling & posting', days: 30, hours: 8 }, { title: 'Monthly report', days: 30, hours: 3 }] },
  { id: 'tpl-web', name: 'Website Development', description: 'Design and build a business website.', deliverables: ['Sitemap & wireframes', 'UI design (5 pages)', 'Responsive website', 'Basic SEO setup', 'Handover & training'],
    tasks: [{ title: 'Requirement gathering', days: 3, hours: 4 }, { title: 'Sitemap & wireframes', days: 7, hours: 10 }, { title: 'UI design', days: 15, hours: 24 }, { title: 'Development', days: 30, hours: 60 }, { title: 'Testing & fixes', days: 35, hours: 12 }, { title: 'Go-live & handover', days: 40, hours: 4 }] },
];

const emptySow = (): SowContent => ({ objectives: '', deliverables: [], exclusions: '', timeline: '', assumptions: '', milestones: [], assignedEmployeeIds: [] });

const instStatus = (i: Installment, paid: number, today: string) =>
  paid >= i.amount - 0.5 ? 'paid' : paid > 0 ? (i.dueDate < today ? 'overdue' : 'partially_paid') : i.dueDate < today ? 'overdue' : daysBetween(today, i.dueDate) <= 7 ? 'due_soon' : 'pending';

export function buildSchedule(total: number, startDate: string, advancePercent: number, count: number, frequency: QuotationExtra['frequency']) {
  const out: { label: string; dueDate: string; amount: number }[] = [];
  let rest = round2(total);
  if (advancePercent > 0) {
    const adv = round2((total * advancePercent) / 100);
    out.push({ label: `Advance (${advancePercent}%)`, dueDate: startDate, amount: adv });
    rest = round2(total - adv);
  }
  const n = frequency === 'one_time' ? 1 : Math.max(1, count);
  const step = frequency === 'quarterly' ? 3 : 1;
  const each = Math.floor((rest / n) * 100) / 100;
  for (let k = 0; k < n && rest > 0; k++) {
    const amt = k === n - 1 ? round2(rest - each * (n - 1)) : each;
    const due = advancePercent > 0 ? addMonthsIso(startDate, step * (k + 1)) : addMonthsIso(startDate, step * k);
    out.push({ label: n === 1 ? 'Balance payment' : `Instalment ${k + 1} of ${n}`, dueDate: due, amount: amt });
  }
  return out;
}

const DCtx = React.createContext<ReturnType<typeof useDealsState>>(null as never);
const useD = () => React.useContext(DCtx);

function useDealsState(initialTab: DealsTab) {
  const app = useApp();
  const { quotations, agreements, clients, projects, employees, invoices, company, currentUser, currentRole,
    updateQuotation, updateAgreement, addAgreement, addProject, addTask, addInvoice, addPayment, notify, logAudit } = app;
  const isFinance = ['super_admin', 'admin', 'manager'].includes(currentRole); // AGENCYOS_V2_PART20
  const canManage = ['super_admin', 'admin', 'manager', 'project_manager', 'hr'].includes(currentRole);
  const today = localDate();

  const [tab, setTab] = useState<string>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);
  const [qx, setQx] = useShared<QuotationExtra[]>(K.qx, []);
  const [ax, setAx] = useShared<AgreementExtra[]>(K.ax, []);
  const [inst, setInst] = useShared<Installment[]>(K.inst, []);
  const [pays, setPays] = useShared<InstallmentPayment[]>(K.pay, []);
  const [sows, setSows] = useShared<ScopeOfWork[]>(K.sow, []);
  const [tpls, setTpls] = useShared<ProjectTemplate[]>(K.tpl, DEFAULT_TEMPLATES);
  const [settings, setSettings] = useShared<DealSettings>(K.set, DEFAULT_DEAL_SETTINGS);
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState<{ kind: string; id?: string } | null>(null);
  const close = () => setModal(null);

  const client = (id?: string): Client | undefined => clients.find((c) => c.id === id);
  const cname = (id?: string) => client(id)?.companyName || '-';
  const empName = (id: string) => employees.find((e) => e.id === id)?.name || id;

  const getQx = (q: Quotation): QuotationExtra => qx.find((x) => x.quotationId === q.id) || {
    quotationId: q.id, clientAddress: client(q.clientId)?.address || '', siteAddress: '', files: [], paymentTerms: q.terms || '',
    advancePercent: 50, installmentCount: 1, frequency: 'one_time', approval: q.total >= settings.approvalThreshold ? 'pending' : 'not_required', revisions: [],
  };
  const saveQx = (x: QuotationExtra) => setQx((p) => [x, ...p.filter((e) => e.quotationId !== x.quotationId)]);
  const getAx = (a: Agreement): AgreementExtra => ax.find((x) => x.agreementId === a.id) || {
    agreementId: a.id, value: quotations.find((q) => q.id === a.quotationId)?.total || 0, clauses: [], versions: [], autoRenew: false, remindersSent: [],
  };
  const saveAx = (x: AgreementExtra) => setAx((p) => [x, ...p.filter((e) => e.agreementId !== x.agreementId)]);
  const paidOn = (i: Installment) => pays.reduce((s, p) => s + p.allocations.filter((a) => a.installmentId === i.id).reduce((t, a) => t + a.amount, 0), 0);

  const createSchedule = (agreementId: string, clientId: string, rows: { label: string; dueDate: string; amount: number }[]) => {
    const existing = inst.filter((i) => i.agreementId === agreementId);
    if (existing.some((i) => paidOn(i) > 0 || i.invoiceId)) { setMsg('This agreement already has invoiced/paid instalments; schedule not replaced.'); return false; }
    const list: Installment[] = rows.map((r, k) => ({ id: uid('ins'), agreementId, clientId, no: k + 1, label: r.label, dueDate: r.dueDate, amount: r.amount }));
    setInst((p) => [...p.filter((i) => i.agreementId !== agreementId), ...list]);
    logAudit('INSTALMENTS_CREATED', agreementId, `${list.length} instalments`);
    return true;
  };

  const convertQuotation = (q: Quotation) => {
    const x = getQx(q);
    if (x.approval === 'pending' || x.approval === 'rejected') return setMsg('This quotation needs finance approval before conversion.');
    if (x.agreementId && x.projectId) return setMsg('Already converted.');
    const start = today;
    let agr = agreements.find((a) => a.quotationId === q.id);
    if (!agr) agr = addAgreement({ quotationId: q.id, clientId: q.clientId, title: q.title, startDate: start, endDate: addDaysIso(addMonthsIso(start, 12), -1), terms: x.paymentTerms || q.terms, status: 'active' });
    const prj = addProject({ name: q.title, clientId: q.clientId, projectManagerId: client(q.clientId)?.accountManagerId || currentUser.id, assignedEmployeeIds: [], startDate: start, endDate: agr.endDate, budget: q.total, status: 'planning', priority: 'medium', description: `Created from quotation ${q.quotationNumber}` });
    updateAgreement(agr.id, { projectId: prj.id });
    saveAx({ ...getAx(agr), value: q.total, agreementId: agr.id });
    createSchedule(agr.id, q.clientId, buildSchedule(q.total, start, x.advancePercent, x.installmentCount, x.frequency));
    const sow: ScopeOfWork = { id: uid('sow'), sowNumber: `PAA-SOW-${String(Date.now()).slice(-5)}`, clientId: q.clientId, projectId: prj.id, agreementId: agr.id, title: q.title, version: 1, status: 'draft',
      content: { ...emptySow(), objectives: q.notes || q.title, deliverables: q.items.map((i) => `${i.description} (${i.quantity} ${i.unit})`) }, history: [] };
    setSows((p) => [sow, ...p]);
    saveQx({ ...x, agreementId: agr.id, projectId: prj.id });
    updateQuotation(q.id, { status: 'converted' });
    notify('Quotation converted', `${q.quotationNumber} -> agreement ${agr.agreementNumber}, project ${prj.projectCode}, SOW ${sow.sowNumber}.`, 'system', 'deals_agreements');
    setMsg(`Converted: agreement ${agr.agreementNumber}, project ${prj.projectCode}, SOW ${sow.sowNumber}, payment schedule created.`);
  };

  const renew = (a: Agreement) => {
    const x = getAx(a);
    const len = Math.max(30, daysBetween(a.startDate, a.endDate));
    const start = addDaysIso(a.endDate, 1);
    const na = addAgreement({ quotationId: a.quotationId, clientId: a.clientId, projectId: a.projectId, title: a.title, startDate: start, endDate: addDaysIso(start, len), terms: a.terms, status: 'active' });
    saveAx({ ...x, agreementId: na.id, versions: [], remindersSent: [], signedFile: undefined, signedOn: undefined, renewedFromId: a.id });
    updateAgreement(a.id, { status: 'expired', renewalDate: start });
    notify('Agreement renewed', `${a.agreementNumber} renewed as ${na.agreementNumber}.`, 'system', 'deals_agreements');
    setMsg(`Renewed as ${na.agreementNumber}. Create its payment schedule with "Schedule".`);
  };

  const [clientFilter, setClientFilter] = useState('all');
  const raiseInvoice = (i: Installment) => {
    const a = agreements.find((y) => y.id === i.agreementId);
    const q = quotations.find((y) => y.id === a?.quotationId);
    const taxPct = q?.taxPercent ?? 0;
    const base = round2(i.amount / (1 + taxPct / 100));
    const inv = addInvoice({ clientId: i.clientId, quotationId: q?.id, projectId: a?.projectId, issueDate: today, dueDate: i.dueDate < today ? today : i.dueDate,
      items: [{ id: uid('ii'), description: `${a?.title || 'Services'} - ${i.label} (${a?.agreementNumber || ''})`, quantity: 1, unitPrice: base, total: base }],
      subtotal: base, taxAmount: round2(i.amount - base), totalAmount: i.amount, paidAmount: 0, balanceAmount: i.amount, status: 'issued', notes: `Instalment ${i.no} of agreement ${a?.agreementNumber || ''}` });
    setInst((p) => p.map((y) => (y.id === i.id ? { ...y, invoiceId: inv.id } : y)));
    setMsg(`Invoice ${inv.invoiceNumber} raised for ${i.label}.`);
  };

  const [changes, setChanges] = useState<ProjectChange[]>(() => readKey<ProjectChange[]>('paa_x_project_changes', []));
  useEffect(() => { const h = () => setChanges(readKey<ProjectChange[]>('paa_x_project_changes', [])); window.addEventListener('paa-project-changes', h); return () => window.removeEventListener('paa-project-changes', h); }, []);
  const [histProject, setHistProject] = useState('');

  return { quotations, agreements, clients, projects, employees, invoices, company, currentUser, currentRole, updateQuotation, updateAgreement, addAgreement, addProject, addTask, addInvoice, addPayment, notify, logAudit, isFinance, canManage, today, tab, setTab, qx, setQx, ax, setAx, inst, setInst, pays, setPays, sows, setSows, tpls, setTpls, settings, setSettings, msg, setMsg, modal, setModal, close, client, cname, empName, getQx, saveQx, getAx, saveAx, paidOn, createSchedule, convertQuotation, renew, clientFilter, setClientFilter, raiseInvoice, changes, histProject, setHistProject };
}

const QuotationsTab = () => {
  const { quotations, currentUser, updateQuotation, logAudit, isFinance, setModal, cname, getQx, saveQx, convertQuotation } = useD();
  return (
  <div className={card}>
    {quotations.length === 0 ? <Empty text="No quotations yet. Create one from Invoices & Collections." /> : (
      <div className="overflow-x-auto"><table className="w-full">
        <thead><tr><th className={th}>Quotation</th><th className={th}>Client</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Approval</th><th className={th}>Rev.</th><th className={th}>Actions</th></tr></thead>
        <tbody>{quotations.map((q) => {
          const x = getQx(q);
          return (
            <tr key={q.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className={td}><b>{q.quotationNumber}</b><br />{q.title}<br /><span className="text-slate-400">{fmtDate(q.date)} - valid {fmtDate(q.validUntil)}</span></td>
              <td className={td}>{cname(q.clientId)}{x.siteAddress && <div className="text-[10px] text-slate-400">Site: {x.siteAddress}</div>}</td>
              <td className={td}>{inr(q.total)}</td>
              <td className={td}><Badge v={q.status} /></td>
              <td className={td}><Badge v={x.approval} />{x.approvedBy && <div className="text-[10px] text-slate-400">{x.approvedBy}</div>}</td>
              <td className={td}>{x.revisions.length}</td>
              <td className={td}><div className="flex flex-wrap gap-1">
                <button className={btnGhost} onClick={() => setModal({ kind: 'q_edit', id: q.id })} disabled={q.status === 'converted'}>Edit</button>
                <button className={btnGhost} onClick={() => setModal({ kind: 'q_details', id: q.id })}>Details & files</button>
                {x.revisions.length > 0 && <button className={btnGhost} onClick={() => setModal({ kind: 'q_revs', id: q.id })}>History</button>}
                {isFinance && x.approval === 'pending' && <>
                  <button className={btnGood} onClick={() => { saveQx({ ...x, approval: 'approved', approvedBy: `${currentUser.name}, ${nowStamp()}` }); logAudit('QUOTATION_APPROVED', q.quotationNumber); }}>Approve</button>
                  <button className={btnBad} onClick={() => { const n = prompt('Reason for rejection?') || ''; saveQx({ ...x, approval: 'rejected', approvalNote: n, approvedBy: `${currentUser.name}, ${nowStamp()}` }); }}>Reject</button></>}
                {['draft', 'viewed'].includes(q.status) && <button className={btnGhost} disabled={x.approval === 'pending' || x.approval === 'rejected'} title={x.approval === 'pending' ? 'Needs approval' : ''} onClick={() => updateQuotation(q.id, { status: 'sent' })}>Mark sent</button>}
                {['sent', 'viewed'].includes(q.status) && <button className={btnGhost} onClick={() => updateQuotation(q.id, { status: 'accepted' })}>Client accepted</button>}
                {q.status === 'accepted' && <button className={btnPrimary} onClick={() => convertQuotation(q)}>Convert to agreement + project</button>}
              </div></td>
            </tr>);
        })}</tbody></table></div>
    )}
  </div>
);
};

const QuoteEdit: React.FC<{ q: Quotation }> = ({ q }) => {
  const { currentUser, updateQuotation, notify, settings, close, getQx, saveQx } = useD();
  const [f, setF] = useState({ title: q.title, validUntil: q.validUntil, discount: q.discount, taxPercent: q.taxPercent, terms: q.terms, notes: q.notes, items: q.items.map((i) => ({ ...i })), note: '' });
  const subtotal = round2(f.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const taxable = Math.max(0, subtotal - f.discount);
  const taxAmount = round2((taxable * f.taxPercent) / 100);
  const total = round2(taxable + taxAmount);
  const setItem = (k: number, patch: Partial<QuotationItem>) => setF((p) => ({ ...p, items: p.items.map((it, j) => (j === k ? { ...it, ...patch } : it)) }));
  const save = () => {
    if (!f.title.trim()) return alert('Title is required');
    if (!f.items.length || f.items.some((i) => !i.description.trim())) return alert('Every item needs a description');
    const x = getQx(q);
    const rev = { rev: x.revisions.length + 1, at: nowStamp(), by: currentUser.name, total: q.total, note: f.note || 'Edited', snapshot: JSON.stringify(q) };
    const items = f.items.map((i) => ({ ...i, total: round2(i.quantity * i.unitPrice) }));
    const needApproval = total >= settings.approvalThreshold;
    saveQx({ ...x, revisions: [rev, ...x.revisions], approval: needApproval ? 'pending' : 'not_required', approvedBy: undefined });
    updateQuotation(q.id, { title: f.title, validUntil: f.validUntil, discount: f.discount, taxPercent: f.taxPercent, terms: f.terms, notes: f.notes, items, subtotal, taxAmount, total, status: q.status === 'accepted' ? 'sent' : q.status });
    if (needApproval) notify('Quotation needs approval', `${q.quotationNumber} revised to ${inr(total)} (above ${inr(settings.approvalThreshold)}).`, 'invoice', 'deals_quotations');
    close();
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" wide><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Valid until"><input type="date" className={inputCls} value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} /></Field>
        <Field label="Revision note"><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="What changed and why" /></Field>
      </div>
      <table className="w-full"><thead><tr><th className={th}>Item</th><th className={th}>Qty</th><th className={th}>Unit</th><th className={th}>Rate</th><th className={th}>Total</th><th className={th}></th></tr></thead>
        <tbody>{f.items.map((it, k) => (
          <tr key={it.id}>
            <td className={td}><input className={inputCls} value={it.description} onChange={(e) => setItem(k, { description: e.target.value })} /></td>
            <td className={td}><input type="number" className={`${inputCls} w-16`} value={it.quantity} onChange={(e) => setItem(k, { quantity: Number(e.target.value) })} /></td>
            <td className={td}><input className={`${inputCls} w-20`} value={it.unit} onChange={(e) => setItem(k, { unit: e.target.value })} /></td>
            <td className={td}><input type="number" className={`${inputCls} w-24`} value={it.unitPrice} onChange={(e) => setItem(k, { unitPrice: Number(e.target.value) })} /></td>
            <td className={td}>{inr(it.quantity * it.unitPrice)}</td>
            <td className={td}><button className={btnBad} onClick={() => setF((p) => ({ ...p, items: p.items.filter((_, j) => j !== k) }))}>x</button></td>
          </tr>))}</tbody></table>
      <button className={btnGhost} onClick={() => setF((p) => ({ ...p, items: [...p.items, { id: uid('qi'), description: '', quantity: 1, unit: 'nos', unitPrice: 0, total: 0 }] }))}>+ Add item</button>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Discount"><input type="number" className={inputCls} value={f.discount} onChange={(e) => setF({ ...f, discount: Number(e.target.value) })} /></Field>
        <Field label="GST %"><input type="number" className={inputCls} value={f.taxPercent} onChange={(e) => setF({ ...f, taxPercent: Number(e.target.value) })} /></Field>
        <div className="text-xs pt-5">Subtotal {inr(subtotal)}<br />Tax {inr(taxAmount)}</div>
        <div className="text-sm font-bold pt-5">Total {inr(total)}</div>
      </div>
      {total >= settings.approvalThreshold && <p className="text-[11px] text-amber-600 font-semibold">Total is above {inr(settings.approvalThreshold)} - finance approval will be required.</p>}
      <Field label="Terms" wide><textarea rows={2} className={inputCls} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} /></Field>
      <Field label="Notes / scope summary" wide><textarea rows={2} className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      <div className="flex justify-end"><button className={btnPrimary} onClick={save}>Save revision</button></div>
    </div>
  );
};

const QuoteDetails: React.FC<{ q: Quotation }> = ({ q }) => {
  const { today, close, getQx, saveQx } = useD();
  const [x, setX] = useState<QuotationExtra>(getQx(q));
  const preview = buildSchedule(q.total, today, x.advancePercent, x.installmentCount, x.frequency);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    try { const s: StoredFile[] = []; for (const f of Array.from(files)) s.push(await saveFile(f)); setX((p) => ({ ...p, files: [...p.files, ...s] })); } catch (e) { alert((e as Error).message); }
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client address"><textarea rows={2} className={inputCls} value={x.clientAddress} onChange={(e) => setX({ ...x, clientAddress: e.target.value })} /></Field>
        <Field label="Site / work address"><textarea rows={2} className={inputCls} value={x.siteAddress} onChange={(e) => setX({ ...x, siteAddress: e.target.value })} /></Field>
        <Field label="Payment terms" wide><textarea rows={2} className={inputCls} value={x.paymentTerms} onChange={(e) => setX({ ...x, paymentTerms: e.target.value })} /></Field>
        <Field label="Advance %"><input type="number" min={0} max={100} className={inputCls} value={x.advancePercent} onChange={(e) => setX({ ...x, advancePercent: Math.min(100, Math.max(0, Number(e.target.value))) })} /></Field>
        <Field label="Balance paid as">
          <select className={inputCls} value={x.frequency} onChange={(e) => setX({ ...x, frequency: e.target.value as QuotationExtra['frequency'] })}>
            <option value="one_time">One payment</option><option value="monthly">Monthly instalments</option><option value="quarterly">Quarterly instalments</option>
          </select></Field>
        {x.frequency !== 'one_time' && <Field label="Number of instalments"><input type="number" min={1} className={inputCls} value={x.installmentCount} onChange={(e) => setX({ ...x, installmentCount: Math.max(1, Number(e.target.value)) })} /></Field>}
      </div>
      <div><p className="text-[11px] font-bold text-slate-500 mb-1">Payment schedule preview (from conversion date)</p>
        <table className="w-full"><tbody>{preview.map((r, k) => <tr key={k}><td className={td}>{r.label}</td><td className={td}>{fmtDate(r.dueDate)}</td><td className={td}>{inr(r.amount)}</td></tr>)}</tbody></table></div>
      <div><p className="text-[11px] font-bold text-slate-500 mb-1">Photos & documents</p>
        {x.files.map((f) => <div key={f.fileId} className="flex items-center gap-2 text-xs"><button className="text-blue-600 underline cursor-pointer" onClick={() => openStoredFile(f)}>{f.fileName}</button><button className="text-rose-500 cursor-pointer" onClick={() => setX({ ...x, files: x.files.filter((y) => y.fileId !== f.fileId) })}>remove</button></div>)}
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="text-xs mt-1" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} /></div>
      {x.approvalNote && <p className="text-xs text-rose-600">Rejection note: {x.approvalNote}</p>}
      <div className="flex justify-end"><button className={btnPrimary} onClick={() => { saveQx(x); close(); }}>Save details</button></div>
    </div>
  );
};

const AgreementsTab = () => {
  const { quotations, agreements, projects, company, updateAgreement, logAudit, canManage, today, inst, setModal, client, cname, getAx, saveAx, renew } = useD();
  return (
  <div className={card}>
    {agreements.length === 0 ? <Empty text="No agreements yet." /> : (
      <div className="overflow-x-auto"><table className="w-full">
        <thead><tr><th className={th}>Agreement</th><th className={th}>Client</th><th className={th}>Period</th><th className={th}>Value</th><th className={th}>Status</th><th className={th}>Signed</th><th className={th}>Links</th><th className={th}>Actions</th></tr></thead>
        <tbody>{agreements.map((a) => {
          const x = getAx(a);
          const left = a.endDate ? daysBetween(today, a.endDate) : 999;
          const q = quotations.find((y) => y.id === a.quotationId);
          const p = projects.find((y) => y.id === a.projectId);
          const sched = inst.filter((i) => i.agreementId === a.id);
          return (
            <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className={td}><b>{a.agreementNumber}</b><br />{a.title}<br /><span className="text-slate-400">v{x.versions.length + 1}{x.renewedFromId ? ' - renewal' : ''}</span></td>
              <td className={td}>{cname(a.clientId)}</td>
              <td className={td}>{fmtDate(a.startDate)} - {fmtDate(a.endDate)}{a.status === 'active' && left <= 30 && <div className={`text-[10px] font-bold ${left < 0 ? 'text-rose-600' : 'text-amber-600'}`}>{left < 0 ? `Ended ${-left} day(s) ago` : `Ends in ${left} day(s)`}</div>}</td>
              <td className={td}>{inr(x.value)}<div className="text-[10px] text-slate-400">{sched.length} instalment(s)</div></td>
              <td className={td}><Badge v={a.status} /></td>
              <td className={td}>{x.signedFile ? <button className="text-blue-600 underline cursor-pointer" onClick={() => openStoredFile(x.signedFile!)}>Signed copy</button> : <span className="text-slate-400">Not uploaded</span>}
                {canManage && <label className="block text-[11px] text-blue-600 cursor-pointer font-semibold">Upload<input type="file" accept=".pdf,image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const s = await saveFile(f); saveAx({ ...x, signedFile: s, signedOn: today }); logAudit('AGREEMENT_SIGNED_UPLOAD', a.agreementNumber); } catch (er) { alert((er as Error).message); } }} /></label>}</td>
              <td className={td}>{q ? <div>Quote {q.quotationNumber}</div> : null}{p ? <div>Project {p.projectCode}</div> : null}</td>
              <td className={td}><div className="flex flex-wrap gap-1">
                {canManage && <button className={btnGhost} onClick={() => setModal({ kind: 'a_edit', id: a.id })}>Edit</button>}
                {x.versions.length > 0 && <button className={btnGhost} onClick={() => setModal({ kind: 'a_vers', id: a.id })}>Versions</button>}
                {canManage && <button className={btnGhost} onClick={() => setModal({ kind: 'a_sched', id: a.id })}>Schedule</button>}
                <button className={btnGhost} onClick={() => printAgreement(company, { number: a.agreementNumber, title: a.title, clientName: cname(a.clientId), clientAddress: client(a.clientId)?.billingAddress || client(a.clientId)?.address, startDate: a.startDate, endDate: a.endDate, value: x.value, terms: a.terms, clauses: x.clauses, version: x.versions.length + 1, schedule: sched.sort((m, n) => m.no - n.no) })}>Print</button>
                {canManage && a.status !== 'terminated' && <button className={btnGood} onClick={() => { if (confirm(`Renew ${a.agreementNumber} for another term?`)) renew(a); }}>Renew</button>}
                {canManage && a.status === 'active' && <button className={btnBad} onClick={() => { if (confirm('Terminate this agreement?')) updateAgreement(a.id, { status: 'terminated' }); }}>Terminate</button>}
              </div></td>
            </tr>);
        })}</tbody></table></div>
    )}
  </div>
);
};

const AgreementEdit: React.FC<{ a: Agreement }> = ({ a }) => {
  const { currentUser, updateAgreement, today, close, getAx, saveAx } = useD();
  const x0 = getAx(a);
  const [f, setF] = useState({ title: a.title, startDate: a.startDate, endDate: a.endDate, terms: a.terms, value: x0.value, autoRenew: x0.autoRenew, clauses: x0.clauses.map((c) => ({ ...c })), note: '' });
  const save = () => {
    if (f.endDate && f.startDate && f.endDate < f.startDate) return alert('End date cannot be before start date');
    const snap = { version: x0.versions.length + 1, at: nowStamp(), by: currentUser.name, note: f.note || 'Edited', title: a.title, startDate: a.startDate, endDate: a.endDate, terms: a.terms, clauses: x0.clauses, value: x0.value };
    saveAx({ ...x0, value: f.value, autoRenew: f.autoRenew, clauses: f.clauses.filter((c) => c.title.trim() || c.text.trim()), versions: [snap, ...x0.versions], remindersSent: f.endDate !== a.endDate ? [] : x0.remindersSent });
    updateAgreement(a.id, { title: f.title, startDate: f.startDate, endDate: f.endDate, terms: f.terms, status: a.status === 'expired' && f.endDate >= today ? 'active' : a.status });
    close();
  };
  const setCl = (k: number, patch: Partial<AgreementClause>) => setF((p) => ({ ...p, clauses: p.clauses.map((c, j) => (j === k ? { ...c, ...patch } : c)) }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" wide><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Start date"><input type="date" className={inputCls} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
        <Field label="End date"><input type="date" className={inputCls} value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
        <Field label="Contract value"><input type="number" className={inputCls} value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></Field>
        <Field label="Change note"><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Why it changed" /></Field>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.autoRenew} onChange={(e) => setF({ ...f, autoRenew: e.target.checked })} /> Auto-renew expected</label>
      </div>
      <Field label="Main terms" wide><textarea rows={4} className={inputCls} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} /></Field>
      <p className="text-[11px] font-bold text-slate-500">Clauses</p>
      {f.clauses.map((c, k) => (
        <div key={c.id} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <input className={inputCls} placeholder="Clause title" value={c.title} onChange={(e) => setCl(k, { title: e.target.value })} />
          <textarea rows={2} className={inputCls} placeholder="Clause text" value={c.text} onChange={(e) => setCl(k, { text: e.target.value })} />
          <button className={btnBad} onClick={() => setF((p) => ({ ...p, clauses: p.clauses.filter((_, j) => j !== k) }))}>Remove</button>
        </div>))}
      <div className="flex flex-wrap gap-2">
        <button className={btnGhost} onClick={() => setF((p) => ({ ...p, clauses: [...p.clauses, { id: uid('cl'), title: '', text: '' }] }))}>+ Add clause</button>
        {['Confidentiality', 'Payment & late fee', 'Termination', 'Intellectual property', 'Jurisdiction'].map((t) => (
          <button key={t} className={btnGhost} onClick={() => setF((p) => ({ ...p, clauses: [...p.clauses, { id: uid('cl'), title: t, text: STD_CLAUSES[t] }] }))}>+ {t}</button>))}
      </div>
      <div className="flex justify-end"><button className={btnPrimary} onClick={save}>Save new version</button></div>
    </div>
  );
};

const ScheduleEditor: React.FC<{ a: Agreement }> = ({ a }) => {
  const { today, inst, close, getAx, saveAx, createSchedule } = useD();
  const x = getAx(a);
  const existing = inst.filter((i) => i.agreementId === a.id).sort((m, n) => m.no - n.no);
  const [cfg, setCfg] = useState({ total: x.value || 0, start: a.startDate || today, adv: 0, count: 12, freq: 'monthly' as QuotationExtra['frequency'] });
  const [rows, setRows] = useState(existing.length ? existing.map((i) => ({ label: i.label, dueDate: i.dueDate, amount: i.amount })) : []);
  const sum = round2(rows.reduce((s, r) => s + r.amount, 0));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
        <Field label="Total"><input type="number" className={inputCls} value={cfg.total} onChange={(e) => setCfg({ ...cfg, total: Number(e.target.value) })} /></Field>
        <Field label="First due"><input type="date" className={inputCls} value={cfg.start} onChange={(e) => setCfg({ ...cfg, start: e.target.value })} /></Field>
        <Field label="Advance %"><input type="number" className={inputCls} value={cfg.adv} onChange={(e) => setCfg({ ...cfg, adv: Number(e.target.value) })} /></Field>
        <Field label="Frequency"><select className={inputCls} value={cfg.freq} onChange={(e) => setCfg({ ...cfg, freq: e.target.value as QuotationExtra['frequency'] })}><option value="one_time">One payment</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></Field>
        <Field label="Count"><input type="number" className={inputCls} value={cfg.count} onChange={(e) => setCfg({ ...cfg, count: Number(e.target.value) })} /></Field>
      </div>
      <button className={btnGhost} onClick={() => setRows(buildSchedule(cfg.total, cfg.start, cfg.adv, cfg.count, cfg.freq))}>Generate</button>
      <table className="w-full"><tbody>{rows.map((r, k) => (
        <tr key={k}>
          <td className={td}><input className={inputCls} value={r.label} onChange={(e) => setRows(rows.map((y, j) => (j === k ? { ...y, label: e.target.value } : y)))} /></td>
          <td className={td}><input type="date" className={inputCls} value={r.dueDate} onChange={(e) => setRows(rows.map((y, j) => (j === k ? { ...y, dueDate: e.target.value } : y)))} /></td>
          <td className={td}><input type="number" className={inputCls} value={r.amount} onChange={(e) => setRows(rows.map((y, j) => (j === k ? { ...y, amount: Number(e.target.value) } : y)))} /></td>
          <td className={td}><button className={btnBad} onClick={() => setRows(rows.filter((_, j) => j !== k))}>x</button></td>
        </tr>))}</tbody></table>
      <div className="flex items-center justify-between">
        <button className={btnGhost} onClick={() => setRows([...rows, { label: `Instalment ${rows.length + 1}`, dueDate: today, amount: 0 }])}>+ Add row</button>
        <span className="text-xs font-bold">Schedule total {inr(sum)} {x.value > 0 && Math.abs(sum - x.value) > 1 && <span className="text-amber-600">(contract value {inr(x.value)})</span>}</span>
        <button className={btnPrimary} disabled={!rows.length} onClick={() => { if (createSchedule(a.id, a.clientId, rows)) { if (!x.value) saveAx({ ...x, value: sum }); close(); } }}>Save schedule</button>
      </div>
    </div>
  );
};

const InstallmentsTab = () => {
  const { agreements, clients, invoices, company, canManage, today, inst, pays, setModal, client, cname, paidOn, clientFilter, setClientFilter, raiseInvoice } = useD();
  const list = inst.filter((i) => clientFilter === 'all' || i.clientId === clientFilter).sort((m, n) => m.dueDate.localeCompare(n.dueDate));
  const byClient = useMemo(() => {
    const m = new Map<string, { scheduled: number; received: number; overdue: number }>();
    for (const i of inst) {
      const r = m.get(i.clientId) || { scheduled: 0, received: 0, overdue: 0 };
      const p = paidOn(i);
      r.scheduled += i.amount; r.received += p;
      if (i.dueDate < today) r.overdue += Math.max(0, i.amount - p);
      m.set(i.clientId, r);
    }
    return [...m.entries()];
  }, [inst, pays]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {byClient.slice(0, 6).map(([cid, r]) => (
          <button key={cid} onClick={() => setClientFilter(cid)} className={`${card} text-left cursor-pointer hover:border-blue-400`}>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{cname(cid)}</div>
            <div className="text-[11px] text-slate-500">Scheduled {inr(r.scheduled)} - Received {inr(r.received)}</div>
            <div className="text-[11px] font-bold">Outstanding {inr(r.scheduled - r.received)} {r.overdue > 0 && <span className="text-rose-600">(overdue {inr(r.overdue)})</span>}</div>
          </button>))}
      </div>
      <div className={card}>
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <select className={`${inputCls} max-w-[240px]`} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="all">All clients</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
          {canManage && <button className={btnPrimary} onClick={() => setModal({ kind: 'pay' })}>Record payment</button>}
        </div>
        {list.length === 0 ? <Empty text="No instalments. Convert an accepted quotation, or use Schedule on an agreement." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Due</th><th className={th}>Client</th><th className={th}>Agreement</th><th className={th}>Instalment</th><th className={th}>Amount</th><th className={th}>Paid</th><th className={th}>Status</th><th className={th}>Invoice</th></tr></thead>
            <tbody>{list.map((i) => {
              const p = paidOn(i); const inv = invoices.find((y) => y.id === i.invoiceId);
              return (
                <tr key={i.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className={td}>{fmtDate(i.dueDate)}</td><td className={td}>{cname(i.clientId)}</td>
                  <td className={td}>{agreements.find((a) => a.id === i.agreementId)?.agreementNumber || '-'}</td>
                  <td className={td}>{i.label}</td><td className={td}>{inr(i.amount)}</td><td className={td}>{inr(p)}</td>
                  <td className={td}><Badge v={instStatus(i, p, today)} /></td>
                  <td className={td}>{inv ? <span>{inv.invoiceNumber}<br /><Badge v={inv.status} /></span> : canManage && p < i.amount ? <button className={btnGhost} onClick={() => raiseInvoice(i)}>Raise invoice</button> : '-'}</td>
                </tr>);
            })}</tbody></table></div>
        )}
      </div>
      <div className={card}>
        <p className="text-xs font-bold mb-2">Payment history & receipts</p>
        {pays.filter((p) => clientFilter === 'all' || p.clientId === clientFilter).length === 0 ? <Empty text="No payments recorded yet." /> : (
          <table className="w-full"><thead><tr><th className={th}>Receipt</th><th className={th}>Date</th><th className={th}>Client</th><th className={th}>Mode</th><th className={th}>Amount</th><th className={th}></th></tr></thead>
            <tbody>{pays.filter((p) => clientFilter === 'all' || p.clientId === clientFilter).map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className={td}>{p.receiptNo}</td><td className={td}>{fmtDate(p.date)}</td><td className={td}>{cname(p.clientId)}</td><td className={td}>{p.method} {p.reference}</td><td className={td}>{inr(p.amount)}</td>
                <td className={td}><button className={btnGhost} onClick={() => printReceipt(company, { receiptNo: p.receiptNo, date: p.date, clientName: cname(p.clientId), clientAddress: client(p.clientId)?.billingAddress, amount: p.amount, method: p.method, reference: p.reference, recordedBy: p.recordedBy,
                  lines: p.allocations.map((al) => { const i = inst.find((y) => y.id === al.installmentId); return { label: i ? `${i.label} (due ${fmtDate(i.dueDate)})` : 'Advance / unallocated', amount: al.amount }; }) })}>Receipt</button></td>
              </tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
};

const PaymentForm = () => {
  const { clients, currentUser, addPayment, logAudit, today, inst, setPays, setMsg, close, cname, paidOn, clientFilter } = useD();
  const [f, setF] = useState({ clientId: clientFilter !== 'all' ? clientFilter : '', amount: 0, date: today, method: 'Bank Transfer' as InstallmentPayment['method'], reference: '', notes: '' });
  const open = inst.filter((i) => i.clientId === f.clientId).map((i) => ({ i, due: round2(i.amount - paidOn(i)) })).filter((r) => r.due > 0.5).sort((m, n) => m.i.dueDate.localeCompare(n.i.dueDate));
  const [manual, setManual] = useState<Record<string, number>>({});
  const auto = useMemo(() => { let left = f.amount; const out: Record<string, number> = {}; for (const r of open) { const t = Math.min(left, r.due); if (t > 0) { out[r.i.id] = round2(t); left = round2(left - t); } } return out; }, [f.amount, f.clientId, open.length]);
  const alloc = Object.keys(manual).length ? manual : auto;
  const allocated = round2(Object.values(alloc).reduce((s, v) => s + (v || 0), 0));
  const save = () => {
    if (!f.clientId || f.amount <= 0) return alert('Choose client and amount');
    if (allocated > f.amount + 0.01) return alert('Allocated more than the amount received');
    for (const r of open) if ((alloc[r.i.id] || 0) > r.due + 0.01) return alert(`${r.i.label}: allocation is more than the balance`);
    const allocations = Object.entries(alloc).filter(([, v]) => v > 0).map(([installmentId, amount]) => ({ installmentId, amount }));
    const rec: InstallmentPayment = { id: uid('ipay'), receiptNo: `PAA-RCPT-${String(Date.now()).slice(-6)}`, clientId: f.clientId, date: f.date, amount: f.amount, method: f.method, reference: f.reference, notes: f.notes, allocations, recordedBy: currentUser.name };
    setPays((p) => [rec, ...p]);
    for (const al of allocations) {
      const i = inst.find((y) => y.id === al.installmentId);
      if (i?.invoiceId) addPayment({ invoiceId: i.invoiceId, clientId: f.clientId, date: f.date, amount: al.amount, paymentMethod: f.method, transactionRef: f.reference, notes: `Receipt ${rec.receiptNo}`, recordedBy: currentUser.id });
    }
    logAudit('INSTALMENT_PAYMENT', rec.receiptNo, `${inr(f.amount)} from ${cname(f.clientId)}`);
    setMsg(`Payment saved. Receipt ${rec.receiptNo}.`);
    close();
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Client"><select className={inputCls} value={f.clientId} onChange={(e) => { setManual({}); setF({ ...f, clientId: e.target.value }); }}><option value="">Select...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></Field>
        <Field label="Amount received"><input type="number" className={inputCls} value={f.amount} onChange={(e) => { setManual({}); setF({ ...f, amount: Number(e.target.value) }); }} /></Field>
        <Field label="Date"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Mode"><select className={inputCls} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as InstallmentPayment['method'] })}>{['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'].map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Reference / UTR / cheque no."><input className={inputCls} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
        <Field label="Notes"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      {f.clientId && (open.length === 0 ? <p className="text-xs text-slate-500">No pending instalments for this client. The amount will be saved as an unallocated advance.</p> : (
        <table className="w-full"><thead><tr><th className={th}>Instalment</th><th className={th}>Due date</th><th className={th}>Balance</th><th className={th}>Apply</th></tr></thead>
          <tbody>{open.map((r) => (
            <tr key={r.i.id}><td className={td}>{r.i.label}</td><td className={td}>{fmtDate(r.i.dueDate)}</td><td className={td}>{inr(r.due)}</td>
              <td className={td}><input type="number" className={`${inputCls} w-28`} value={alloc[r.i.id] || 0} onChange={(e) => setManual({ ...alloc, [r.i.id]: Number(e.target.value) })} /></td></tr>))}</tbody></table>
      ))}
      <div className="flex justify-between items-center"><span className="text-xs">Allocated {inr(allocated)} of {inr(f.amount)}{f.amount - allocated > 0.01 && ` - ${inr(f.amount - allocated)} kept as advance`}</span>
        <button className={btnPrimary} onClick={save}>Save payment</button></div>
    </div>
  );
};

const SowTab = () => {
  const { projects, company, logAudit, canManage, today, sows, setSows, setModal, cname, empName, changes, histProject, setHistProject } = useD();
  return (
  <div className="space-y-4">
    <div className={card}>
      <div className="flex justify-between mb-3"><p className="text-xs font-bold">Scopes of work</p>{canManage && <button className={btnPrimary} onClick={() => setModal({ kind: 'sow_new' })}>New SOW</button>}</div>
      {sows.length === 0 ? <Empty text="No SOWs yet. They are created when a quotation is converted, or click New SOW." /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <thead><tr><th className={th}>SOW</th><th className={th}>Client / project</th><th className={th}>Version</th><th className={th}>Milestones</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody>{sows.map((s) => {
            const prj = projects.find((p) => p.id === s.projectId);
            const done = s.content.milestones.filter((m) => m.done).length;
            return (
              <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className={td}><b>{s.sowNumber}</b><br />{s.title}</td>
                <td className={td}>{cname(s.clientId)}<br /><span className="text-slate-400">{prj ? `${prj.projectCode} ${prj.name}` : '-'}</span></td>
                <td className={td}>v{s.version}</td><td className={td}>{done}/{s.content.milestones.length}</td>
                <td className={td}><Badge v={s.status} />{s.clientApprovedBy && <div className="text-[10px] text-slate-400">{s.clientApprovedBy}, {fmtDate(s.clientApprovedOn)}</div>}</td>
                <td className={td}><div className="flex flex-wrap gap-1">
                  {canManage && <button className={btnGhost} onClick={() => setModal({ kind: 'sow_edit', id: s.id })}>Edit</button>}
                  {canManage && s.status === 'draft' && <button className={btnGhost} onClick={() => setSows((p) => p.map((y) => (y.id === s.id ? { ...y, status: 'sent' } : y)))}>Mark sent</button>}
                  {canManage && s.status === 'sent' && <>
                    <button className={btnGood} onClick={() => { const n = prompt('Approved by (client name)?'); if (n) { setSows((p) => p.map((y) => (y.id === s.id ? { ...y, status: 'approved', clientApprovedBy: n, clientApprovedOn: today } : y))); logAudit('SOW_APPROVED', s.sowNumber, n); } }}>Client approved</button>
                    <button className={btnBad} onClick={() => setSows((p) => p.map((y) => (y.id === s.id ? { ...y, status: 'rejected' } : y)))}>Rejected</button></>}
                  {s.history.length > 0 && <button className={btnGhost} onClick={() => setModal({ kind: 'sow_hist', id: s.id })}>History</button>}
                  <button className={btnGhost} onClick={() => printSow(company, { number: s.sowNumber, title: s.title, clientName: cname(s.clientId), projectName: prj?.name, version: s.version, status: s.status, content: s.content, team: s.content.assignedEmployeeIds.map(empName), approvedBy: s.clientApprovedBy, approvedOn: s.clientApprovedOn })}>Print</button>
                </div></td>
              </tr>);
          })}</tbody></table></div>
      )}
    </div>
    <div className={card}>
      <div className="flex flex-wrap gap-2 items-center mb-2"><p className="text-xs font-bold">Project change history</p>
        <select className={`${inputCls} max-w-[260px]`} value={histProject} onChange={(e) => setHistProject(e.target.value)}><option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.projectCode} {p.name}</option>)}</select></div>
      {changes.filter((c) => !histProject || c.projectId === histProject).length === 0 ? <Empty text="No project changes recorded yet." /> : (
        <table className="w-full"><thead><tr><th className={th}>When</th><th className={th}>Project</th><th className={th}>Field</th><th className={th}>From</th><th className={th}>To</th><th className={th}>By</th></tr></thead>
          <tbody>{changes.filter((c) => !histProject || c.projectId === histProject).slice(0, 100).map((c) => (
            <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{c.at}</td><td className={td}>{projects.find((p) => p.id === c.projectId)?.projectCode || '-'}</td><td className={td}>{c.field}</td><td className={`${td} max-w-[200px] break-words`}>{c.oldValue}</td><td className={`${td} max-w-[200px] break-words`}>{c.newValue}</td><td className={td}>{c.by}</td></tr>))}</tbody></table>
      )}
    </div>
  </div>
);
};

const SowEditor: React.FC<{ s?: ScopeOfWork }> = ({ s }) => {
  const { clients, projects, employees, currentUser, today, setSows, close } = useD();
  const [meta, setMeta] = useState({ title: s?.title || '', clientId: s?.clientId || '', projectId: s?.projectId || '', agreementId: s?.agreementId || '', note: '' });
  const [c, setC] = useState<SowContent>(s ? JSON.parse(JSON.stringify(s.content)) : emptySow());
  const save = () => {
    if (!meta.title.trim() || !meta.clientId) return alert('Title and client are required');
    const c2 = { ...c, deliverables: c.deliverables.map((d) => d.trim()).filter(Boolean) };
    if (s) {
      const changed = JSON.stringify(s.content) !== JSON.stringify(c2);
      setSows((p) => p.map((y) => (y.id === s.id ? { ...y, ...meta, content: c2, version: changed ? y.version + 1 : y.version, status: changed && y.status === 'approved' ? 'draft' : y.status,
        history: changed ? [{ version: y.version, at: nowStamp(), by: currentUser.name, note: meta.note || 'Edited', content: y.content }, ...y.history] : y.history } : y)));
    } else {
      setSows((p) => [{ id: uid('sow'), sowNumber: `PAA-SOW-${String(Date.now()).slice(-5)}`, ...meta, version: 1, status: 'draft', content: c2, history: [] }, ...p]);
    }
    close();
  };
  const setMs = (k: number, patch: Partial<Milestone>) => setC((p) => ({ ...p, milestones: p.milestones.map((m, j) => (j === k ? { ...m, ...patch } : m)) }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title" wide><input className={inputCls} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></Field>
        <Field label="Client"><select className={inputCls} value={meta.clientId} onChange={(e) => setMeta({ ...meta, clientId: e.target.value })}><option value="">Select...</option>{clients.map((x) => <option key={x.id} value={x.id}>{x.companyName}</option>)}</select></Field>
        <Field label="Project"><select className={inputCls} value={meta.projectId} onChange={(e) => setMeta({ ...meta, projectId: e.target.value })}><option value="">None</option>{projects.filter((p) => !meta.clientId || p.clientId === meta.clientId).map((p) => <option key={p.id} value={p.id}>{p.projectCode} {p.name}</option>)}</select></Field>
        {s && <Field label="Change note" wide><input className={inputCls} value={meta.note} onChange={(e) => setMeta({ ...meta, note: e.target.value })} /></Field>}
      </div>
      <Field label="Objectives" wide><textarea rows={2} className={inputCls} value={c.objectives} onChange={(e) => setC({ ...c, objectives: e.target.value })} /></Field>
      <Field label="Deliverables (one per line)" wide><textarea rows={4} className={inputCls} value={c.deliverables.join('\n')} onChange={(e) => setC({ ...c, deliverables: e.target.value.split('\n') })} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Timeline"><textarea rows={2} className={inputCls} value={c.timeline} onChange={(e) => setC({ ...c, timeline: e.target.value })} /></Field>
        <Field label="Assumptions"><textarea rows={2} className={inputCls} value={c.assumptions} onChange={(e) => setC({ ...c, assumptions: e.target.value })} /></Field>
        <Field label="Out of scope"><textarea rows={2} className={inputCls} value={c.exclusions} onChange={(e) => setC({ ...c, exclusions: e.target.value })} /></Field>
      </div>
      <p className="text-[11px] font-bold text-slate-500">Milestones</p>
      {c.milestones.map((m, k) => (
        <div key={m.id} className="grid grid-cols-[2fr_1fr_1fr_auto_auto] gap-2 items-center">
          <input className={inputCls} value={m.title} placeholder="Milestone" onChange={(e) => setMs(k, { title: e.target.value })} />
          <input type="date" className={inputCls} value={m.dueDate} onChange={(e) => setMs(k, { dueDate: e.target.value })} />
          <input type="number" className={inputCls} value={m.amount} placeholder="Amount" onChange={(e) => setMs(k, { amount: Number(e.target.value) })} />
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={m.done} onChange={(e) => setMs(k, { done: e.target.checked })} />Done</label>
          <button className={btnBad} onClick={() => setC((p) => ({ ...p, milestones: p.milestones.filter((_, j) => j !== k) }))}>x</button>
        </div>))}
      <button className={btnGhost} onClick={() => setC((p) => ({ ...p, milestones: [...p.milestones, { id: uid('ms'), title: '', dueDate: today, amount: 0, done: false }] }))}>+ Milestone</button>
      <p className="text-[11px] font-bold text-slate-500">Assigned team</p>
      <div className="flex flex-wrap gap-2">{employees.filter((e) => e.status !== 'inactive').map((e) => (
        <label key={e.id} className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"><input type="checkbox" checked={c.assignedEmployeeIds.includes(e.id)} onChange={(ev) => setC((p) => ({ ...p, assignedEmployeeIds: ev.target.checked ? [...p.assignedEmployeeIds, e.id] : p.assignedEmployeeIds.filter((x) => x !== e.id) }))} />{e.name}</label>))}</div>
      <div className="flex justify-end"><button className={btnPrimary} onClick={save}>Save SOW</button></div>
    </div>
  );
};

const TemplatesTab = () => {
  const { canManage, tpls, setTpls, setModal } = useD();
  return (
  <div className={card}>
    <div className="flex justify-between mb-3"><p className="text-xs font-bold">Project templates</p>{canManage && <button className={btnPrimary} onClick={() => setModal({ kind: 'tpl_edit' })}>New template</button>}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{tpls.map((t) => (
      <div key={t.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs space-y-1">
        <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
        <div className="text-slate-500">{t.description}</div>
        <div>{t.tasks.length} tasks - {t.tasks.reduce((s, x) => s + x.hours, 0)} est. hours - {t.deliverables.length} deliverables</div>
        {canManage && <div className="flex gap-1 pt-1">
          <button className={btnPrimary} onClick={() => setModal({ kind: 'tpl_use', id: t.id })}>Create project</button>
          <button className={btnGhost} onClick={() => setModal({ kind: 'tpl_edit', id: t.id })}>Edit</button>
          <button className={btnBad} onClick={() => { if (confirm('Delete template?')) setTpls((p) => p.filter((x) => x.id !== t.id)); }}>Delete</button></div>}
      </div>))}</div>
  </div>
);
};

const TemplateEditor: React.FC<{ t?: ProjectTemplate }> = ({ t }) => {
  const { setTpls, close } = useD();
  const [f, setF] = useState({ name: t?.name || '', description: t?.description || '', tasks: (t?.tasks || []).map((x) => `${x.title} | ${x.days} | ${x.hours}`).join('\n'), deliverables: (t?.deliverables || []).join('\n') });
  const save = () => {
    if (!f.name.trim()) return alert('Name is required');
    const tasks = f.tasks.split('\n').map((l) => l.split('|').map((s) => s.trim())).filter((p) => p[0]).map((p) => ({ title: p[0], days: Number(p[1]) || 7, hours: Number(p[2]) || 4 }));
    const rec: ProjectTemplate = { id: t?.id || uid('tpl'), name: f.name, description: f.description, tasks, deliverables: f.deliverables.split('\n').map((s) => s.trim()).filter(Boolean) };
    setTpls((p) => [rec, ...p.filter((x) => x.id !== rec.id)]);
    close();
  };
  return (
    <div className="space-y-3">
      <Field label="Template name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Description"><input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Tasks - one per line: Title | due after N days | hours"><textarea rows={6} className={`${inputCls} font-mono`} value={f.tasks} onChange={(e) => setF({ ...f, tasks: e.target.value })} /></Field>
      <Field label="Deliverables (one per line)"><textarea rows={4} className={inputCls} value={f.deliverables} onChange={(e) => setF({ ...f, deliverables: e.target.value })} /></Field>
      <div className="flex justify-end"><button className={btnPrimary} onClick={save}>Save template</button></div>
    </div>
  );
};

const UseTemplate: React.FC<{ t: ProjectTemplate }> = ({ t }) => {
  const { clients, employees, currentUser, addProject, addTask, today, setSows, setMsg, close } = useD();
  const [f, setF] = useState({ name: t.name, clientId: '', pmId: currentUser.id, assigneeId: currentUser.id, start: today, budget: 0 });
  const go = () => {
    if (!f.name.trim() || !f.clientId) return alert('Project name and client are required');
    const maxDays = Math.max(7, ...t.tasks.map((x) => x.days));
    const prj = addProject({ name: f.name, clientId: f.clientId, projectManagerId: f.pmId, assignedEmployeeIds: [f.assigneeId], startDate: f.start, endDate: addDaysIso(f.start, maxDays), budget: f.budget, status: 'planning', priority: 'medium', description: `From template: ${t.name}. ${t.description}` });
    for (const x of t.tasks) addTask({ projectId: prj.id, clientId: f.clientId, title: x.title, description: `Template task (${t.name})`, assignedEmployeeId: f.assigneeId, managerId: f.pmId, projectManagerId: f.pmId, priority: 'medium', status: 'todo', startDate: f.start, dueDate: addDaysIso(f.start, x.days), estimatedHours: x.hours, actualHours: 0 });
    setSows((p) => [{ id: uid('sow'), sowNumber: `PAA-SOW-${String(Date.now()).slice(-5)}`, clientId: f.clientId, projectId: prj.id, title: f.name, version: 1, status: 'draft', content: { ...emptySow(), objectives: t.description, deliverables: t.deliverables, assignedEmployeeIds: [f.assigneeId] }, history: [] }, ...p]);
    setMsg(`Project ${prj.projectCode} created with ${t.tasks.length} tasks and a draft SOW.`);
    close();
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Project name" wide><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Client"><select className={inputCls} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}><option value="">Select...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></Field>
      <Field label="Start date"><input type="date" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
      <Field label="Project manager"><select className={inputCls} value={f.pmId} onChange={(e) => setF({ ...f, pmId: e.target.value })}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      <Field label="Assign tasks to"><select className={inputCls} value={f.assigneeId} onChange={(e) => setF({ ...f, assigneeId: e.target.value })}>{employees.filter((e) => e.status !== 'inactive').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      <Field label="Budget"><input type="number" className={inputCls} value={f.budget} onChange={(e) => setF({ ...f, budget: Number(e.target.value) })} /></Field>
      <div className="sm:col-span-2 flex justify-end"><button className={btnPrimary} onClick={go}>Create project</button></div>
    </div>
  );
};

const SettingsTab = () => {
  const { isFinance, settings, setSettings, setMsg } = useD();
  const [f, setF] = useState({ thr: settings.approvalThreshold, days: settings.reminderDays.join(', ') });
  return (
    <div className={`${card} space-y-3 max-w-xl`}>
      <Field label="Quotations at or above this total need finance approval"><input type="number" className={inputCls} value={f.thr} onChange={(e) => setF({ ...f, thr: Number(e.target.value) })} /></Field>
      <Field label="Agreement renewal reminders (days before end, comma separated)"><input className={inputCls} value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></Field>
      <button className={btnPrimary} disabled={!isFinance} onClick={() => { setSettings({ approvalThreshold: Math.max(0, f.thr), reminderDays: f.days.split(',').map((s) => Number(s.trim())).filter((n) => n > 0) }); setMsg('Settings saved.'); }}>Save</button>
      {!isFinance && <p className="text-[11px] text-slate-500">Only Admin / Super Admin can change these.</p>}
    </div>
  );
};

export const DealsModule: React.FC<{ initialTab?: DealsTab }> = ({ initialTab = 'quotations' }) => {
  const D = useDealsState(initialTab);
  const { quotations, agreements, sows, tpls, tab, setTab, msg, setMsg, modal, close, getQx, getAx } = D;
  const q = modal?.id ? quotations.find((y) => y.id === modal.id) : undefined;
  const a = modal?.id ? agreements.find((y) => y.id === modal.id) : undefined;
  const s = modal?.id ? sows.find((y) => y.id === modal.id) : undefined;
  const t = modal?.id ? tpls.find((y) => y.id === modal.id) : undefined;

  return (
    <DCtx.Provider value={D}>
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Deals, Agreements & Delivery</h2>
        <p className="text-xs text-slate-500">Quotation revisions and approval, agreements, payment instalments, scope of work and project templates.</p>
      </div>
      {msg && <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-3 py-2 flex justify-between"><span>{msg}</span><button className="cursor-pointer" onClick={() => setMsg('')}>x</button></div>}
      <Tabs value={tab} onChange={setTab} tabs={[['quotations', 'Quotations'], ['agreements', 'Agreements'], ['installments', 'Instalments & Receipts'], ['sow', 'Scope of Work'], ['templates', 'Project Templates'], ['settings', 'Settings']]} />
      {tab === 'quotations' && <QuotationsTab />}
      {tab === 'agreements' && <AgreementsTab />}
      {tab === 'installments' && <InstallmentsTab />}
      {tab === 'sow' && <SowTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'settings' && <SettingsTab />}

      {modal?.kind === 'q_edit' && q && <Modal title={`Edit ${q.quotationNumber}`} onClose={close}><QuoteEdit q={q} /></Modal>}
      {modal?.kind === 'q_details' && q && <Modal title={`${q.quotationNumber} - details`} onClose={close}><QuoteDetails q={q} /></Modal>}
      {modal?.kind === 'q_revs' && q && <Modal title={`${q.quotationNumber} - revision history`} onClose={close}>
        <table className="w-full"><thead><tr><th className={th}>Rev</th><th className={th}>When</th><th className={th}>By</th><th className={th}>Previous total</th><th className={th}>Note</th></tr></thead>
          <tbody>{getQx(q).revisions.map((r) => <tr key={r.rev}><td className={td}>{r.rev}</td><td className={td}>{r.at}</td><td className={td}>{r.by}</td><td className={td}>{inr(r.total)}</td><td className={td}>{r.note}</td></tr>)}</tbody></table></Modal>}
      {modal?.kind === 'a_edit' && a && <Modal title={`Edit ${a.agreementNumber}`} onClose={close}><AgreementEdit a={a} /></Modal>}
      {modal?.kind === 'a_sched' && a && <Modal title={`Payment schedule - ${a.agreementNumber}`} onClose={close}><ScheduleEditor a={a} /></Modal>}
      {modal?.kind === 'a_vers' && a && <Modal title={`${a.agreementNumber} - earlier versions`} onClose={close}>
        <div className="space-y-2">{getAx(a).versions.map((v) => <div key={v.version} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs"><b>Version {v.version}</b> - {v.at} by {v.by} - {v.note}<br />{fmtDate(v.startDate)} to {fmtDate(v.endDate)}, value {inr(v.value)}, {v.clauses.length} clause(s)<pre className="whitespace-pre-wrap mt-1 text-slate-500">{v.terms}</pre></div>)}</div></Modal>}
      {modal?.kind === 'pay' && <Modal title="Record client payment" onClose={close}><PaymentForm /></Modal>}
      {modal?.kind === 'sow_new' && <Modal title="New scope of work" onClose={close}><SowEditor /></Modal>}
      {modal?.kind === 'sow_edit' && s && <Modal title={`Edit ${s.sowNumber} (v${s.version})`} onClose={close}><SowEditor s={s} /></Modal>}
      {modal?.kind === 'sow_hist' && s && <Modal title={`${s.sowNumber} - versions`} onClose={close}>
        <div className="space-y-2">{s.history.map((h) => <div key={h.version} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs"><b>v{h.version}</b> - {h.at} by {h.by} - {h.note}<br />Deliverables: {h.content.deliverables.join('; ') || '-'}<br />Milestones: {h.content.milestones.map((m) => m.title).join('; ') || '-'}</div>)}</div></Modal>}
      {modal?.kind === 'tpl_edit' && <Modal title={t ? 'Edit template' : 'New template'} onClose={close}><TemplateEditor t={t} /></Modal>}
      {modal?.kind === 'tpl_use' && t && <Modal title={`Create project from "${t.name}"`} onClose={close}><UseTemplate t={t} /></Modal>}
    </div>
    </DCtx.Provider>
  );
};

const STD_CLAUSES: Record<string, string> = {
  'Confidentiality': 'Both parties will keep confidential all non-public information received from the other party and use it only for this engagement.',
  'Payment & late fee': 'Invoices are payable within 7 days of issue. Delayed payments may attract interest at 1.5% per month, and work may be paused until dues are cleared.',
  'Termination': 'Either party may terminate this agreement with 30 days written notice. Fees for work completed up to the termination date remain payable.',
  'Intellectual property': 'On full payment, final approved deliverables are owned by the client. The agency may show the work in its portfolio unless the client objects in writing.',
  'Jurisdiction': 'This agreement is governed by the laws of India, and courts at the agency registered city have exclusive jurisdiction.',
};
