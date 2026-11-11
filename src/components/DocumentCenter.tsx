// AGENCYOS_BRAND_DOCS
// AGENCYOS_V2_PART17
﻿// Document Center: professional templates (client, HR, legal), live preview,
// e-signatures, PDF export, attachments and document storage.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FilePen, Search, Pencil, Download, Eye, Paperclip, PenLine, Trash2, CheckCircle2, Upload, X, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanyConfig, Client, Employee } from '../types';
import { useShared, uid, nowStamp } from '../lib/sharedStore';
import { saveFile, openStoredFile } from '../lib/fileStore';
import { StoredFile } from '../lib/hrTypes';
import { fmtDate, localDate } from '../lib/dates';
import { printHtml } from '../lib/print';
import { letterPage, openBrandDoc } from '../lib/brandDocs';
import { BrandFrame } from './BrandFrame';
import { TEMPLATES, DocTemplate, DocCategory, CAT_LABEL } from '../lib/docTemplates';
import { inputCls, Modal } from './ui2';

interface Sig { name: string; role?: string; image: string; at: string }
export interface SavedDoc {
  id: string; templateId: string; cat: DocCategory; title: string; values: Record<string, string>;
  partyName: string; status: 'draft' | 'partially_signed' | 'signed' | 'final' | 'stored';
  agencySig?: Sig; partySig?: Sig; files: StoredFile[]; createdAt: string; updatedAt: string; createdBy: string; docDate: string;
}
const KEY = 'paa_x_documents';
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const UPLOAD: DocTemplate = { id: 'upload', cat: 'other', name: 'Uploaded document', desc: '', signable: false, party: 'other', partyLabel: 'Party', fields: [], intro: '', sections: [] };
const tpl = (id: string) => TEMPLATES.find((t) => t.id === id) || UPLOAD;

const statusOf = (t: DocTemplate, d: Pick<SavedDoc, 'agencySig' | 'partySig'>): SavedDoc['status'] => {
  if (t.id === 'upload') return 'stored';
  if (!t.signable) return 'final';
  if (d.agencySig && d.partySig) return 'signed';
  if (d.agencySig || d.partySig) return 'partially_signed';
  return 'draft';
};

/** Builds the document HTML used for both the live preview and the PDF. */
export function docHtml(t: DocTemplate, values: Record<string, string>, company: { name: string; address: string; stampUrl?: string }, title: string, docDate: string, ref: string, sigs: { agencySig?: Sig; partySig?: Sig }) {
  const fill = (s: string) => esc(s).replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (k === 'agency') return `<b>${esc(company.name)}</b>`;
    if (k === 'agencyAddress') return esc(company.address);
    const f = t.fields.find((x) => x.k === k);
    const v = values[k];
    if (!v) return `<span style="color:#94a3b8">[${esc(f?.label || k)}]</span>`;
    return `<b>${esc(f?.type === 'date' ? fmtDate(v) : v)}</b>`;
  }).replace(/\n/g, '<br>');
  let n = 0;
  const secs = t.sections.map((s) => {
    const head = s.h ? `<div style="font-weight:700;margin:14px 0 4px">${s.h.startsWith('Subject') || s.h.startsWith('Responsibilities') ? '' : `${++n}. `}${fill(s.h)}</div>` : '';
    return `${head}<div style="line-height:1.65;margin:${s.h ? '0' : '12px'} 0 0">${fill(s.p)}</div>`;
  }).join('');
  const sigBox = (label: string, who: string, sig?: Sig, stamp?: string) => `<div style="flex:1;min-width:200px">
    <div style="height:70px;display:flex;align-items:flex-end;gap:8px">${sig ? `<img src="${sig.image}" style="max-height:64px;max-width:200px">` : ''}${stamp && sig ? `<img src="${esc(stamp)}" style="height:66px;opacity:.85;mix-blend-mode:multiply">` : ''}</div>
    <div style="border-top:1px solid #64748b;padding-top:4px;font-size:12px"><b>${esc(sig?.name || who)}</b>${sig?.role ? `<br>${esc(sig.role)}` : ''}<br><span style="color:#64748b">${esc(label)}${sig ? ` &middot; signed ${esc(sig.at)}` : ''}</span></div></div>`;
  const party = values.company || values.partyCompany || values.name || values.clientName || values.partyName || t.partyLabel;
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:12.5px">
  <div style="display:flex;justify-content:space-between;color:#64748b;font-size:11px;margin-bottom:6px"><span>Ref: ${esc(ref)}</span><span>Date: ${esc(fmtDate(docDate))}</span></div>
  <h2 style="text-align:center;font-size:17px;letter-spacing:.5px;text-transform:uppercase;margin:6px 0 16px">${esc(title || t.name)}</h2>
  <div style="line-height:1.65">${fill(t.intro)}</div>${secs}
  <div style="display:flex;gap:40px;margin-top:44px;flex-wrap:wrap">${sigBox(`For ${company.name}`, 'Authorised Signatory', sigs.agencySig, company.stampUrl)}${t.signable ? sigBox(`${t.partyLabel}${party && party !== t.partyLabel ? ' - ' + party : ''}`, t.partyLabel, sigs.partySig) : ''}</div>
</div>`;
}

// ---------------- signature pad ----------------
const SignaturePad: React.FC<{ onChange: (dataUrl: string) => void; typedName: string }> = ({ onChange, typedName }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState(typedName);
  const drawing = useRef(false);
  const ctx = () => ref.current!.getContext('2d')!;
  const clear = () => { const c = ref.current!; ctx().clearRect(0, 0, c.width, c.height); onChange(''); };
  useEffect(() => { if (mode === 'type') renderTyped(typed); else clear(); /* eslint-disable-next-line */ }, [mode]);
  const renderTyped = (s: string) => { const c = ref.current!; const x = ctx(); x.clearRect(0, 0, c.width, c.height); if (!s.trim()) { onChange(''); return; } x.fillStyle = '#1e3a8a'; x.font = 'italic 44px "Brush Script MT", "Segoe Script", cursive'; x.textBaseline = 'middle'; x.fillText(s, 16, c.height / 2); onChange(c.toDataURL('image/png')); };
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [(e.clientX - r.left) * (ref.current!.width / r.width), (e.clientY - r.top) * (ref.current!.height / r.height)]; };
  return (
    <div>
      <div className="flex gap-1 mb-2 text-xs">
        {(['draw', 'type'] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${mode === m ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{m === 'draw' ? 'Draw' : 'Type'}</button>)}
        <button type="button" onClick={() => (mode === 'type' ? (setTyped(''), renderTyped('')) : clear())} className="ml-auto px-3 py-1 rounded-md text-slate-500 hover:text-rose-600 cursor-pointer">Clear</button>
      </div>
      {mode === 'type' && <input className={`${inputCls} mb-2`} value={typed} onChange={(e) => { setTyped(e.target.value); renderTyped(e.target.value); }} placeholder="Type full name" />}
      <canvas ref={ref} width={520} height={150} className="w-full h-[130px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white touch-none"
        onPointerDown={(e) => { if (mode !== 'draw') return; drawing.current = true; const [x, y] = pos(e); const c = ctx(); c.strokeStyle = '#1e3a8a'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (!drawing.current) return; const [x, y] = pos(e); ctx().lineTo(x, y); ctx().stroke(); }}
        onPointerUp={() => { if (!drawing.current) return; drawing.current = false; onChange(ref.current!.toDataURL('image/png')); }} />
      <p className="text-[11px] text-slate-400 mt-1">{mode === 'draw' ? 'Sign with mouse, finger or stylus.' : 'Your typed name is converted into a signature.'}</p>
    </div>
  );
};

const Badge: React.FC<{ s: SavedDoc['status'] }> = ({ s }) => {
  const m: Record<SavedDoc['status'], [string, string]> = { signed: ['Signed', 'text-emerald-600'], partially_signed: ['Partially signed', 'text-amber-600'], draft: ['Draft', 'text-slate-500'], final: ['Final', 'text-blue-600'], stored: ['Stored', 'text-slate-500'] };
  return <span className={`inline-flex items-center gap-1 text-xs font-bold tracking-[0.12em] uppercase ${m[s][1]}`}><CheckCircle2 className="w-3.5 h-3.5" />{m[s][0]}</span>;
};

interface DCType {
  company: CompanyConfig; clients: Client[]; employees: Employee[]; designations: { id: string }[]; departments: { id: string }[]; currentUser: Employee;
  setDocs: (u: SavedDoc[] | ((p: SavedDoc[]) => SavedDoc[])) => void; setMsg: (s: string) => void;
  setEditor: (v: { t: DocTemplate; doc?: SavedDoc } | null) => void; setSigning: (d: SavedDoc | null) => void; setUploading: (b: boolean) => void;
  logAudit: (a: string, r: string, d?: string) => void; refOf: (d: SavedDoc) => string; nameOf: (list: { id: string }[], id?: string) => string;
}
const DC = React.createContext<DCType>(null as never);

// ---------- editor ----------
const Editor: React.FC<{ t: DocTemplate; doc?: SavedDoc }> = ({ t, doc }) => {
  const { company, clients, employees, designations, departments, currentUser, setDocs, setMsg, setEditor, setSigning, setUploading, logAudit, refOf, nameOf } = React.useContext(DC);
  const init: Record<string, string> = {};
  t.fields.forEach((f) => { if (f.def) init[f.k] = f.def; if (f.type === 'date') init[f.k] = ''; });
  const [title, setTitle] = useState(doc?.title || t.name);
  const [values, setValues] = useState<Record<string, string>>(doc?.values || init);
  const [docDate, setDocDate] = useState(doc?.docDate || localDate());
  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));
  const pickClient = (id: string) => { const c = clients.find((x) => x.id === id); if (!c) return; setValues((p) => ({ ...p, clientName: c.contactPerson, company: c.companyName, address: c.billingAddress || c.address })); };
  const pickEmp = (id: string) => {
    const e = employees.find((x) => x.id === id); if (!e) return;
    const annual = e.salary ? (e.salary.basic + e.salary.hra + e.salary.allowances) * 12 : 0;
    setValues((p) => ({ ...p, name: e.name, empId: e.employeeId, designation: nameOf(designations, e.designationId), department: nameOf(departments, e.departmentId), joiningDate: e.joiningDate || p.joiningDate || '', fromDate: e.joiningDate || p.fromDate || '', ...(annual ? { ctc: 'Rs. ' + annual.toLocaleString('en-IN'), monthlyGross: 'Rs. ' + Math.round(annual / 12).toLocaleString('en-IN') } : {}) }));
  };
  const save = () => {
    const partyName = values.company || values.partyCompany || values.name || values.clientName || values.partyName || '';
    if (doc) {
      setDocs((p) => p.map((x) => (x.id === doc.id ? { ...x, title, values, docDate, partyName, updatedAt: nowStamp(), agencySig: undefined, partySig: undefined, status: statusOf(t, {}) } : x)));
      setMsg(doc.agencySig || doc.partySig ? `"${title}" updated. Signatures were cleared because the content changed - please sign again.` : `"${title}" updated.`);
    } else {
      const d: SavedDoc = { id: uid('doc'), templateId: t.id, cat: t.cat, title, values, partyName, status: statusOf(t, {}), files: [], createdAt: nowStamp(), updatedAt: nowStamp(), createdBy: currentUser.name, docDate };
      setDocs((p) => [d, ...p]); setMsg(`"${title}" saved.${t.signable ? ' Click the pen icon to sign it.' : ''}`);
    }
    logAudit(doc ? 'DOCUMENT_UPDATED' : 'DOCUMENT_CREATED', title, t.name);
    setEditor(null);
  };
  const fake: SavedDoc = { id: doc?.id || 'preview00', templateId: t.id, cat: t.cat, title, values, partyName: '', status: 'draft', files: [], createdAt: '', updatedAt: '', createdBy: '', docDate };
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="h-11 w-11 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"><FilePen className="w-5 h-5" /></span>
          <div><div className="font-bold text-slate-900 dark:text-white">{t.name}</div><div className="text-xs text-slate-500">{t.desc}</div></div>
        </div>
        <div className="flex items-start gap-3"><span className="h-7 w-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <div><div className="font-bold text-slate-900 dark:text-white">Fill document details</div><div className="text-xs text-slate-500">Complete the fields below. The preview updates automatically.</div></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2"><span className="block text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">Document title</span><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          {t.party === 'client' && <label className="block sm:col-span-2"><span className="block text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">Select existing client (optional)</span>
            <div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" /><select className={`${inputCls} pl-8`} defaultValue="" onChange={(e) => pickClient(e.target.value)}><option value="">Choose a client to auto-fill</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></div></label>}
          {t.party === 'employee' && t.id !== 'internship_cert' && <label className="block sm:col-span-2"><span className="block text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">Select employee (optional)</span>
            <div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" /><select className={`${inputCls} pl-8`} defaultValue="" onChange={(e) => pickEmp(e.target.value)}><option value="">Choose an employee to auto-fill</option>{employees.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.employeeId})</option>)}</select></div></label>}
          <label className="block"><span className="block text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">Document date</span><input type="date" className={inputCls} value={docDate} onChange={(e) => setDocDate(e.target.value)} /></label>
          {t.fields.map((f) => (
            <label key={f.k} className={`block ${f.wide || f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
              <span className="block text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-1">{f.label}</span>
              {f.type === 'textarea' ? <textarea rows={3} className={inputCls} value={values[f.k] || ''} placeholder={f.ph} onChange={(e) => set(f.k, e.target.value)} />
                : f.type === 'select' ? <select className={inputCls} value={values[f.k] || ''} onChange={(e) => set(f.k, e.target.value)}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
                : <input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} className={inputCls} value={values[f.k] || ''} placeholder={f.ph || `[${f.label}]`} onChange={(e) => set(f.k, e.target.value)} />}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setEditor(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold cursor-pointer">Cancel</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer">{doc ? 'Save changes' : 'Save document'}</button>
        </div>
      </div>
      <div className="xl:sticky xl:top-2 self-start">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-2">Live preview</div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 max-h-[70vh] overflow-y-auto">
          <BrandFrame landscape={false} page={letterPage(docHtml(t, values, company, title, docDate, refOf(fake), {}), refOf(fake), docDate)} />
        </div>
      </div>
    </div>
  );
};

// ---------- sign ----------
const SignForm: React.FC<{ d: SavedDoc }> = ({ d }) => {
  const { company, clients, employees, designations, departments, currentUser, setDocs, setMsg, setEditor, setSigning, setUploading, logAudit, refOf, nameOf } = React.useContext(DC);
  const t = tpl(d.templateId);
  const [who, setWho] = useState<'agency' | 'party'>(d.agencySig ? 'party' : 'agency');
  const [name, setName] = useState(who === 'agency' ? currentUser.name : d.values.clientName || d.values.name || d.values.partyName || '');
  const [role, setRole] = useState(who === 'agency' ? 'Authorised Signatory' : t.partyLabel);
  const [img, setImg] = useState('');
  const [agree, setAgree] = useState(false);
  useEffect(() => { setName(who === 'agency' ? currentUser.name : d.values.clientName || d.values.name || d.values.partyName || ''); setRole(who === 'agency' ? 'Authorised Signatory' : t.partyLabel); setImg(''); }, [who]);
  const save = () => {
    if (!name.trim() || !img || !agree) return;
    const sig: Sig = { name: name.trim(), role: role.trim(), image: img, at: nowStamp() };
    setDocs((p) => p.map((x) => { if (x.id !== d.id) return x; const n = { ...x, [who === 'agency' ? 'agencySig' : 'partySig']: sig, updatedAt: nowStamp() } as SavedDoc; n.status = statusOf(t, n); return n; }));
    logAudit('DOCUMENT_SIGNED', d.title, `${who} - ${name}`);
    setMsg(`"${d.title}" signed by ${name}.`); setSigning(null);
  };
  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-2">
        {(['agency', 'party'] as const).filter((w) => w === 'agency' || t.signable).map((w) => (
          <button key={w} type="button" onClick={() => setWho(w)} className={`flex-1 px-3 py-2 rounded-lg border-2 text-left cursor-pointer ${who === w ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{w === 'agency' ? `For ${company.name}` : t.partyLabel}</div>
            <div className="text-[11px] text-slate-500">{(w === 'agency' ? d.agencySig : d.partySig) ? `Signed by ${(w === 'agency' ? d.agencySig : d.partySig)!.name} - sign again to replace` : 'Not signed yet'}</div>
          </button>))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Signer name</span><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block"><span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Designation / role</span><input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} /></label>
      </div>
      <SignaturePad key={who} onChange={setImg} typedName={name} />
      <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />I confirm I am {name || 'the signer'} and I agree to sign this document electronically.</label>
      <div className="flex justify-end gap-2"><button onClick={() => setSigning(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer">Cancel</button>
        <button disabled={!img || !agree || !name.trim()} onClick={save} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer disabled:opacity-50">Apply signature</button></div>
    </div>
  );
};

// ---------- upload (Other Documents) ----------
const UploadForm: React.FC = () => {
  const { company, clients, employees, designations, departments, currentUser, setDocs, setMsg, setEditor, setSigning, setUploading, logAudit, refOf, nameOf } = React.useContext(DC);
  const [f, setF] = useState({ title: '', party: '', type: 'Other', docDate: localDate() });
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [err, setErr] = useState('');
  const add = async (l: FileList | null) => { if (!l?.length) return; try { const s: StoredFile[] = []; for (const x of Array.from(l)) s.push(await saveFile(x)); setFiles((p) => [...p, ...s]); if (!f.title) setF((p) => ({ ...p, title: s[0].fileName.replace(/\.[^.]+$/, '') })); } catch (e) { setErr((e as Error).message); } };
  const save = () => {
    if (!files.length) return setErr('Choose at least one file.');
    if (!f.title.trim()) return setErr('Enter a title.');
    const d: SavedDoc = { id: uid('doc'), templateId: 'upload', cat: 'other', title: f.title.trim(), values: { type: f.type }, partyName: f.party, status: 'stored', files, createdAt: nowStamp(), updatedAt: nowStamp(), createdBy: currentUser.name, docDate: f.docDate };
    setDocs((p) => [d, ...p]); setMsg(`"${d.title}" stored.`); setUploading(false);
  };
  return (
    <div className="space-y-3 text-sm">
      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-blue-400">
        <Upload className="w-6 h-6 text-slate-400" /><span className="font-semibold">Click to choose files</span><span className="text-xs text-slate-500">PDF, Word, Excel or images - up to 10 MB each</span>
        <input type="file" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} /></label>
      {files.map((x) => <div key={x.fileId} className="flex items-center gap-2 text-xs"><Paperclip className="w-3.5 h-3.5" />{x.fileName}<button className="ml-auto text-rose-500 cursor-pointer" onClick={() => setFiles((p) => p.filter((y) => y.fileId !== x.fileId))}><X className="w-3.5 h-3.5" /></button></div>)}
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2"><span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Title</span><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="block"><span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Type</span><select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['Company registration', 'GST / Tax', 'Bank', 'Insurance', 'Lease / Rent', 'Licence', 'Other'].map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="block"><span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Date</span><input type="date" className={inputCls} value={f.docDate} onChange={(e) => setF({ ...f, docDate: e.target.value })} /></label>
        <label className="block col-span-2"><span className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Related party (optional)</span><input className={inputCls} value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} /></label>
      </div>
      {err && <p className="text-xs text-rose-600 font-semibold">{err}</p>}
      <div className="flex justify-end gap-2"><button onClick={() => setUploading(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer">Cancel</button><button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer">Save</button></div>
    </div>
  );
};


export const DocumentCenter: React.FC = () => {
  const { company, clients, employees, designations, departments, currentUser, currentRole, logAudit } = useApp();
  const [docs, setDocs] = useShared<SavedDoc[]>(KEY, []);
  const cats = (['client', 'hr', 'legal', 'other'] as DocCategory[]).filter((c) =>
    c === 'hr' ? ['super_admin', 'admin', 'hr'].includes(currentRole)
      : c === 'legal' ? ['super_admin', 'admin', 'finance', 'hr'].includes(currentRole)
      : c === 'client' ? ['super_admin', 'admin', 'manager', 'project_manager', 'finance'].includes(currentRole) : true);
  const [cat, setCat] = useState<DocCategory>(cats[0] || 'other');
  const [q, setQ] = useState('');
  const [editor, setEditor] = useState<{ t: DocTemplate; doc?: SavedDoc } | null>(null);
  const [viewing, setViewing] = useState<SavedDoc | null>(null);
  const [signing, setSigning] = useState<SavedDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const refOf = (d: SavedDoc) => `PAA-DOC-${d.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;
  const nameOf = (list: { id: string }[], id?: string) => { const x = list.find((y) => y.id === id) as { name?: string; title?: string } | undefined; return x?.name || x?.title || ''; };

  const list = docs.filter((d) => d.cat === cat && (!q || `${d.title} ${d.partyName} ${tpl(d.templateId).name}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const templates = TEMPLATES.filter((t) => t.cat === cat && (!q || t.name.toLowerCase().includes(q.toLowerCase())));

  const download = (d: SavedDoc) => {
    const t = tpl(d.templateId);
    if (t.id === 'upload') { if (d.files[0]) openStoredFile(d.files[0]); return; }
    void printHtml; openBrandDoc(d.title, letterPage(docHtml(t, d.values, company, d.title, d.docDate, refOf(d), d), refOf(d), d.docDate), false);
  };
  const remove = (d: SavedDoc) => { if (!confirm(`Delete "${d.title}"? This cannot be undone.`)) return; setDocs((p) => p.filter((x) => x.id !== d.id)); logAudit('DOCUMENT_DELETED', d.title, currentUser.name); };
  const attach = async (d: SavedDoc, files: FileList | null) => {
    if (!files?.length) return;
    try { const s: StoredFile[] = []; for (const f of Array.from(files)) s.push(await saveFile(f)); setDocs((p) => p.map((x) => (x.id === d.id ? { ...x, files: [...x.files, ...s], updatedAt: nowStamp() } : x))); setMsg(`${s.length} file(s) attached to "${d.title}".`); }
    catch (e) { setMsg((e as Error).message); }
  };

  const iconBtn = 'p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer';
  const card = 'flex items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-blue-400 hover:shadow-sm transition cursor-pointer';

  const ctx = { company, clients, employees, designations, departments, currentUser, setDocs, setMsg, setEditor, setSigning, setUploading, logAudit, refOf, nameOf };
  return (
    <DC.Provider value={ctx}>
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Document Center</h2>
        <p className="text-base text-slate-500 mt-2">Professional templates &amp; document storage</p>
      </div>
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`pb-3 px-1 text-sm sm:text-base font-semibold whitespace-nowrap border-b-2 -mb-px cursor-pointer ${cat === c ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{CAT_LABEL[c]}</button>)}
      </div>
      <div className="relative max-w-md"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input className={`${inputCls} pl-9 py-2.5`} placeholder="Search documents..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {msg && <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg px-4 py-2 flex justify-between"><span>{msg}</span><button className="cursor-pointer" onClick={() => setMsg('')}>x</button></div>}

      <div>
        <div className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-500 mb-3">Create new</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setEditor({ t })} className={card}>
              <span className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><FilePen className="w-5 h-5 text-slate-600 dark:text-slate-300" /></span>
              <span><span className="block font-semibold text-slate-900 dark:text-white">{t.name}</span><span className="block text-sm text-slate-500">{t.signable ? 'Signable \u00B7 PDF export' : 'PDF export'}</span></span>
            </button>))}
          {cat === 'other' && (
            <button onClick={() => setUploading(true)} className={card}>
              <span className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Upload className="w-5 h-5 text-slate-600 dark:text-slate-300" /></span>
              <span><span className="block font-semibold text-slate-900 dark:text-white">Upload document</span><span className="block text-sm text-slate-500">Store any file</span></span>
            </button>)}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-500 mb-3">Saved documents</div>
        {list.length === 0 ? <div className="p-8 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">No documents here yet.</div> : (
          <div className="space-y-3">{list.map((d) => {
            const t = tpl(d.templateId);
            return (
              <div key={d.id} className="flex flex-wrap items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3"><span className="font-semibold text-slate-900 dark:text-white">{d.title}</span><Badge s={d.status} /></div>
                  <div className="text-sm text-slate-500 mt-1">{t.id === 'upload' ? d.values.type : t.name}{d.partyName ? ` \u00B7 ${d.partyName}` : ''} &middot; {fmtDate(d.docDate)}</div>
                  {d.files.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{d.files.map((x) => <button key={x.fileId} onClick={() => openStoredFile(x)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-blue-600 cursor-pointer"><Paperclip className="w-3 h-3" />{x.fileName}</button>)}</div>}
                </div>
                <div className="flex items-center gap-1">
                  {t.id !== 'upload' && <button onClick={() => setEditor({ t, doc: d })} className="inline-flex items-center gap-1.5 px-3 py-2 mr-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold cursor-pointer"><Pencil className="w-4 h-4" />Edit</button>}
                  <button title="Download PDF" onClick={() => download(d)} className={iconBtn}><Download className="w-4 h-4" /></button>
                  {t.id !== 'upload' && <button title="View" onClick={() => setViewing(d)} className={iconBtn}><Eye className="w-4 h-4" /></button>}
                  <label title="Attach file (e.g. signed scan)" className={iconBtn}><Paperclip className="w-4 h-4" /><input type="file" multiple className="hidden" onChange={(e) => { attach(d, e.target.files); e.target.value = ''; }} /></label>
                  {t.id !== 'upload' && <button title="Sign" onClick={() => setSigning(d)} className={iconBtn}><PenLine className="w-4 h-4" /></button>}
                  {['super_admin', 'admin', 'hr', 'finance'].includes(currentRole) && <button title="Delete" onClick={() => remove(d)} className={`${iconBtn} hover:!text-rose-600`}><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>);
          })}</div>
        )}
      </div>

      {editor && <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center p-4 pt-8 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditor(null); }}>
        <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800"><h3 className="text-xl font-bold text-slate-900 dark:text-white">{editor.doc ? 'Edit' : 'Create'} {editor.t.name}</h3><button onClick={() => setEditor(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button></div>
          <div className="p-6"><Editor t={editor.t} doc={editor.doc} /></div>
        </div></div>}
      {viewing && <Modal title={viewing.title} onClose={() => setViewing(null)}>
        <div className="bg-white rounded-xl border border-slate-200 p-2">
          <BrandFrame landscape={false} page={letterPage(docHtml(tpl(viewing.templateId), viewing.values, company, viewing.title, viewing.docDate, refOf(viewing), viewing), refOf(viewing), viewing.docDate)} />
        </div>
        <div className="flex justify-end gap-2 mt-4"><button onClick={() => download(viewing)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer"><Download className="w-4 h-4" />Download PDF</button></div>
      </Modal>}
      {signing && <Modal title={`Sign - ${signing.title}`} onClose={() => setSigning(null)}><SignForm d={signing} /></Modal>}
      {uploading && <Modal title="Upload document" onClose={() => setUploading(false)}><UploadForm /></Modal>}
    </div>
    </DC.Provider>
  );
};
