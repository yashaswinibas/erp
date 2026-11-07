// AGENCYOS_V5_P26: Enterprise spec screens (search, profile, CRM import/analytics/targets, service teams,
// approval policy/history, report builder, retention) + simple record registers.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useShared, readKey } from '../lib/sharedStore';
import { scopeForStaff } from '../lib/scope';
import { LOGIN_LOG_KEY, LoginEvent } from '../lib/rbac';
import { Icon } from './icons';
import { DataTable, Pill, Panel, Rows, Kpi, Notice, Bars, toast, inrF, inrS, today, fmtD, daysBetween } from './OsUi';
import { RecordConfig } from './OsRecords';
import { OS_ROLES, roleLabel, osCanAccess, FULL_ACCESS, pageById } from './osConfig';
import { ORG_UNITS, ORG_KEY, OrgPlace } from './osP25';
import { POLICY_KEY, DEFAULT_POLICY, ApprovalPolicy, FOUNDER_ONLY } from './osP26';

const csvDownload = (name: string, head: string[], rows: (string | number)[][]) => {
  const body = [head, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = name + '.csv'; a.click();
};
const months = (n: number) => { const out: string[] = []; const d = new Date(); for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`); } return out; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// =============== DASH-09 GLOBAL SEARCH ===============
export const GlobalSearchPage: React.FC = () => {
  const full = useApp(); const a = scopeForStaff(full) as any; const { currentRole, setActiveTab } = full;
  const [q, setQ] = useState('');
  const open = (tab: string, key?: string, id?: string) => { if (key && id) sessionStorage.setItem('paa_x_os_sel_' + key, id); setActiveTab(tab); };
  const sets: { label: string; tab: string; key?: string; rows: { id: string; title: string; sub: string }[] }[] = [
    { label: 'Leads', tab: 'lead-profile', key: 'lead', rows: (a.leads || []).map((l: any) => ({ id: l.id, title: `${l.leadCode} ${l.company || l.name}`, sub: `${l.contactPerson || ''} ${l.phone || ''} ${l.email || ''} ${l.status}` })) },
    { label: 'Clients', tab: 'client-profile', key: 'client', rows: (a.clients || []).map((c: any) => ({ id: c.id, title: `${c.clientCode || ''} ${c.companyName}`, sub: `${c.contactPerson || ''} ${c.phone || ''} ${c.email || ''}` })) },
    { label: 'Projects', tab: 'project-profile', key: 'project', rows: (a.projects || []).map((p: any) => ({ id: p.id, title: `${p.projectCode || ''} ${p.name}`, sub: p.status })) },
    { label: 'Tasks', tab: 'task_operations', rows: (a.tasks || []).map((t: any) => ({ id: t.id, title: `${t.taskCode || ''} ${t.title}`, sub: `${t.status} \u00B7 due ${t.dueDate || '-'}` })) },
    { label: 'Invoices', tab: 'billing', rows: (a.invoices || []).map((i: any) => ({ id: i.id, title: i.invoiceNumber, sub: `${inrF(i.total)} \u00B7 ${i.status}` })) },
    { label: 'Quotations', tab: 'deals_quotations', rows: (a.quotations || []).map((x: any) => ({ id: x.id, title: x.quotationNumber, sub: `${inrF(x.total)} \u00B7 ${x.status}` })) },
    { label: 'People', tab: 'employee-profile', key: 'employee', rows: (a.employees || []).map((e: any) => ({ id: e.id, title: `${e.employeeId} ${e.name}`, sub: `${roleLabel(e.role)} \u00B7 ${e.email}` })) },
  ].filter((s) => osCanAccess(currentRole, s.tab));
  const t = q.trim().toLowerCase();
  const hits = t.length < 2 ? [] : sets.map((s) => ({ ...s, rows: s.rows.filter((r) => `${r.title} ${r.sub}`.toLowerCase().includes(t)).slice(0, 8) })).filter((s) => s.rows.length);
  return (<>
    <div className="card panel"><div className="nav-search" style={{ margin: 0 }}><Icon name="search" size={16} /><input autoFocus placeholder="Type a name, phone, email, code (2+ letters)..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <p className="muted" style={{ marginTop: 8 }}>Searches only what your role is allowed to see: {sets.map((s) => s.label).join(', ') || 'nothing'}.</p></div>
    <div className="columns equal" style={{ marginTop: 16 }}>{hits.map((s) => <Panel key={s.label} title={s.label} right={<span className="muted">{s.rows.length} match(es)</span>}>
      {s.rows.map((r) => <div key={r.id} className="list-row hover-link" onClick={() => open(s.tab, s.key, r.id)}><div><b>{r.title}</b><small>{r.sub}</small></div><Icon name="arrow" size={14} /></div>)}</Panel>)}</div>
    {t.length >= 2 && !hits.length && <div className="card os-empty">No results for "{q}".</div>}
  </>);
};

// =============== ID-04 / ID-05 MY PROFILE & SESSIONS ===============
export const MyProfilePage: React.FC = () => {
  const { currentUser, currentRole, setActiveTab, logout } = useApp();
  const log = readKey<LoginEvent[]>(LOGIN_LOG_KEY, []).filter((l) => l.employeeId === currentUser.id).slice(0, 30);
  const org = readKey<Record<string, OrgPlace>>(ORG_KEY, {})[currentUser.id];
  return (<>
    <div className="card detail-banner"><div className="detail-ident"><div className="detail-logo">{currentUser.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
      <div><h2>{currentUser.name}</h2><p>{currentUser.employeeId} {'\u00B7'} {roleLabel(currentRole)} {'\u00B7'} {currentUser.email}</p></div></div>
      <div className="actions"><button className="outline-button" onClick={() => setActiveTab('access_admin')}><Icon name="lock" size={14} /> Change password</button><button className="primary-button" onClick={logout}><Icon name="logout" size={14} /> Sign out</button></div></div>
    <div className="columns equal">
      <Panel title="My details"><div className="info-grid">
        {[['Phone', currentUser.phone], ['Joined', fmtD(currentUser.joiningDate)], ['Department / Team', org ? (ORG_UNITS.find((u) => u.key === org.unit)?.name || '\u2014') : 'Not placed yet'], ['Position', org?.position || '\u2014'], ['Work mode', (currentUser as any).workMode || 'office'], ['Status', currentUser.status]].map(([k, v]) => <div key={k} className="kv"><label>{k}</label><b>{v || '\u2014'}</b></div>)}
      </div><p className="muted" style={{ marginTop: 12 }}>To correct your details, ask HR. Changes are recorded in the audit trail.</p></Panel>
      <Panel title="This session"><Rows items={[['This browser', navigator.userAgent.replace(/\(.*?\)/g, '').slice(0, 60), 'Active'], ['Remember device', localStorage.getItem('paa_x_remember') ? 'On for this computer' : 'Off', localStorage.getItem('paa_x_remember') ? 'On' : 'Off'], ['Two-step login (MFA)', 'Needs the server (Part 29). Founder and finance will be required to use it.', 'Planned']]} /></Panel>
    </div>
    <DataTable rows={log} search={false} empty="No sign-ins recorded yet."
      cols={[{ h: 'When', v: (l) => l.at }, { h: 'Result', v: (l) => <Pill v={l.ok ? 'Success' : 'Failed'} tone={l.ok ? 'green' : 'red'} />, s: (l) => (l.ok ? 'Success' : 'Failed') }, { h: 'Reason', v: (l) => l.reason || '\u2014' }]} />
  </>);
};

// =============== CRM-03 LEAD CREATION / IMPORT ===============
export const LeadImportPage: React.FC = () => {
  const { addLead, currentUser, logAudit } = useApp();
  const [text, setText] = useState('company,contactPerson,phone,email,source,serviceRequired,estimatedValue\nAcme Interiors,Ravi,+91 9876500001,ravi@acme.in,Website,Meta Ads,50000');
  const [done, setDone] = useState<string[]>([]);
  const parse = () => { const lines = text.trim().split(/\r?\n/).filter(Boolean); const head = lines[0].split(',').map((h) => h.trim()); return lines.slice(1).map((l) => { const c = l.split(','); return Object.fromEntries(head.map((h, i) => [h, (c[i] || '').trim()])); }); };
  const rows = useMemo(() => { try { return parse(); } catch { return []; } }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = () => {
    const ok: string[] = [];
    for (const r of rows) {
      if (!r.company && !r.contactPerson) continue;
      addLead({ name: r.contactPerson || r.company, company: r.company || r.contactPerson, contactPerson: r.contactPerson || '', email: r.email || '', phone: r.phone || '', source: r.source || 'Import', serviceRequired: r.serviceRequired || 'To be confirmed', estimatedValue: Number(r.estimatedValue) || 0, status: 'new', priority: 'medium', assignedEmployeeId: '', followUpDate: today(), notes: 'Imported from CSV' } as any);
      ok.push(r.company || r.contactPerson);
    }
    logAudit('LEADS_IMPORTED', `${ok.length} leads`, `by ${currentUser.name}`); setDone(ok); toast(`${ok.length} lead(s) processed`);
  };
  return (<>
    <Notice icon="zap" title="How import works">Paste CSV with a header row. Columns: company, contactPerson, phone, email, source, serviceRequired, estimatedValue. Every row goes through the duplicate check, then auto-assignment by service team (round-robin) as set in Lead Assignment & Duplicates.</Notice>
    <div className="columns equal">
      <Panel title="Paste CSV"><div className="form-group"><textarea style={{ minHeight: 220, fontFamily: 'monospace' }} value={text} onChange={(e) => setText(e.target.value)} /></div>
        <div className="bottom-actions"><input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} /><button className="primary-button" onClick={run} disabled={!rows.length}>Import {rows.length} lead(s)</button></div></Panel>
      <Panel title="Preview"><Rows items={rows.slice(0, 12).map((r) => [r.company || r.contactPerson || '?', `${r.phone || ''} ${r.email || ''} \u00B7 ${r.serviceRequired || ''}`, r.source || 'Import'] as [string, string, string])} empty="Nothing to import." />
        {done.length > 0 && <p className="small" style={{ marginTop: 10 }}>Last import: {done.join(', ')}</p>}</Panel>
    </div>
  </>);
};

// =============== CRM-10 LEAD SOURCE & CONVERSION ===============
export const LeadAnalyticsPage: React.FC = () => {
  const { leads, employees } = scopeForStaff(useApp()) as any;
  const by = (key: (l: any) => string) => { const m: Record<string, { n: number; won: number; lost: number; value: number }> = {}; for (const l of leads) { const k = key(l) || 'Unknown'; m[k] = m[k] || { n: 0, won: 0, lost: 0, value: 0 }; m[k].n++; if (l.status === 'won') { m[k].won++; m[k].value += l.estimatedValue || 0; } if (l.status === 'lost') m[k].lost++; } return Object.entries(m).sort((a, b) => b[1].n - a[1].n); };
  const src = by((l) => l.source); const own = by((l) => employees.find((e: any) => e.id === l.assignedEmployeeId)?.name || '');
  const ms = months(6); const won = leads.filter((l: any) => l.status === 'won').length;
  const rate = (x: { n: number; won: number }) => (x.n ? Math.round((x.won / x.n) * 100) : 0) + '%';
  return (<>
    <div className="kpis"><Kpi name="Total leads" value={leads.length} desc="In your scope" icon="target" /><Kpi name="Won" value={won} desc="Converted to clients" icon="check" /><Kpi name="Conversion" value={leads.length ? Math.round((won / leads.length) * 100) + '%' : '0%'} desc="Won / all" icon="chart" /><Kpi name="Won value" value={inrS(leads.filter((l: any) => l.status === 'won').reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0))} desc="Estimated" icon="money" /></div>
    <div className="columns"><Panel title="New leads per month"><Bars values={ms.map((m) => leads.filter((l: any) => (l.createdAt || '').startsWith(m)).length)} labels={ms.map((m) => MON[Number(m.slice(5)) - 1])} legend="Leads created" /></Panel>
      <Panel title="Best sources"><Rows items={src.slice(0, 6).map(([k, v]) => [k, `${v.n} leads \u00B7 ${v.won} won \u00B7 ${v.lost} lost`, rate(v)] as [string, string, string])} /></Panel></div>
    <DataTable rows={own} search={false} cols={[{ h: 'Owner', v: (r) => r[0] }, { h: 'Leads', v: (r) => r[1].n }, { h: 'Won', v: (r) => r[1].won }, { h: 'Lost', v: (r) => r[1].lost }, { h: 'Conversion', v: (r) => rate(r[1]) }, { h: 'Won value', v: (r) => inrF(r[1].value) }]} />
  </>);
};

// =============== CRM-11 SALES TARGETS & FORECAST ===============
export const SalesTargetsPage: React.FC = () => {
  const { leads, employees, currentRole, logAudit } = useApp();
  const [targets, setTargets] = useShared<Record<string, number>>('paa_x_os_targets', {});
  const month = today().slice(0, 7);
  const can = FULL_ACCESS.includes(currentRole) || currentRole === 'sales_manager' || currentRole === 'manager';
  const sellers = employees.filter((e) => e.status === 'active' && (leads.some((l) => l.assignedEmployeeId === e.id) || targets[e.id]));
  const row = (e: any) => { const mine = leads.filter((l) => l.assignedEmployeeId === e.id); const wonV = mine.filter((l) => l.status === 'won' && (((l as any).updatedAt || l.createdAt || '') as string).startsWith(month)).reduce((s, l) => s + (l.estimatedValue || 0), 0); const pipe = mine.filter((l) => !['won', 'lost'].includes(l.status)).reduce((s, l) => s + (l.estimatedValue || 0), 0); return { e, t: targets[e.id] || 0, wonV, pipe, forecast: wonV + Math.round(pipe * 0.3) }; };
  const rows = sellers.map(row); const tot = rows.reduce((s, r) => ({ t: s.t + r.t, w: s.w + r.wonV, f: s.f + r.forecast }), { t: 0, w: 0, f: 0 });
  return (<>
    <div className="kpis"><Kpi name="Team target (month)" value={inrS(tot.t)} desc={month} icon="target" /><Kpi name="Won this month" value={inrS(tot.w)} desc="Closed value" icon="check" /><Kpi name="Forecast" value={inrS(tot.f)} desc="Won + 30% of open pipeline" icon="chart" /><Kpi name="Achievement" value={tot.t ? Math.round((tot.w / tot.t) * 100) + '%' : '\u2014'} desc="Won / target" icon="star" /></div>
    <DataTable rows={rows} cols={[{ h: 'Person', v: (r) => r.e.name }, { h: 'Target', v: (r) => can ? <input className="field" style={{ width: 120 }} type="number" defaultValue={r.t || ''} onBlur={(ev) => { const v = Number(ev.target.value) || 0; if (v !== r.t) { setTargets((p) => ({ ...p, [r.e.id]: v })); logAudit('SALES_TARGET_SET', r.e.name, `${month}: ${v}`); } }} /> : inrF(r.t), s: (r) => String(r.t) }, { h: 'Won', v: (r) => inrF(r.wonV) }, { h: 'Open pipeline', v: (r) => inrF(r.pipe) }, { h: 'Forecast', v: (r) => inrF(r.forecast) }, { h: 'Progress', v: (r) => <div style={{ width: 120 }}><div className="progress"><span style={{ width: `${Math.min(100, r.t ? (r.wonV / r.t) * 100 : 0)}%` }} /></div></div>, s: () => '' }]} />
    <Notice icon="chart" style={{ marginTop: 16 }}>Forecast is a simple estimate (won + 30% of open pipeline). Type a target and click outside the box to save.</Notice>
  </>);
};

// =============== DEL-01 SERVICE TEAMS DIRECTORY ===============
export const ServiceTeamsPage: React.FC = () => {
  const { employees, tasks } = useApp(); const org = readKey<Record<string, OrgPlace>>(ORG_KEY, {});
  const t = today(); const teams = ORG_UNITS.filter((u) => u.dept === 'Service Delivery');
  return (<div className="org-depts">{teams.map((u) => { const ppl = employees.filter((e) => e.status !== 'inactive' && org[e.id]?.unit === u.key); const ids = new Set(ppl.map((e) => e.id)); const open = tasks.filter((k) => ids.has(k.assignedEmployeeId) && k.status !== 'completed'); const late = open.filter((k) => k.dueDate && k.dueDate < t); const seats = u.positions.reduce((s, p) => s + p.seats, 0);
    const lead = ppl.find((e) => org[e.id].position === 'Team Leader');
    return (<div key={u.key} className="card org-unit"><h4>{u.name}</h4><div className="muted">Leader: {lead?.name || 'vacant'}</div>
      <div className="stat-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', margin: '12px 0' }}><div className="mini-stat card" style={{ padding: 10 }}><b>{ppl.length}/{seats}</b><small>Seats filled</small></div><div className="mini-stat card" style={{ padding: 10 }}><b>{open.length}</b><small>Open tasks</small></div><div className="mini-stat card" style={{ padding: 10 }}><b style={{ color: late.length ? '#B42318' : undefined }}>{late.length}</b><small>Late</small></div></div>
      <div>{ppl.map((e) => <span key={e.id} className="org-person">{e.name} {'\u00B7'} {org[e.id].position}</span>)}{!ppl.length && <span className="seat-empty muted">No one placed. Use Organization Family Tree.</span>}</div></div>); })}</div>);
};

// =============== APR-04 APPROVAL POLICY & DELEGATION ===============
export const ApprovalPolicyPage: React.FC = () => {
  const { currentRole, logAudit } = useApp();
  const [saved, setSaved] = useShared<Partial<ApprovalPolicy>>(POLICY_KEY, {});
  const p: ApprovalPolicy = { ...DEFAULT_POLICY, ...saved }; const can = currentRole === 'super_admin';
  const set = (v: Partial<ApprovalPolicy>, msg: string) => { setSaved({ ...p, ...v }); logAudit('APPROVAL_POLICY_CHANGED', 'Policy', msg); toast('Policy saved'); };
  const cand = OS_ROLES.filter((r) => !['super_admin', 'employee', 'intern', 'freelancer', 'vendor', 'consultant', 'auditor', 'sales_executive', 'telecaller', 'business_development'].includes(r.id));
  return (<>
    <Notice icon="shield" title="Confirmed rule (spec section 4)">A delegated manager may approve an ordinary expense up to {'\u20B9'}{p.limit.toLocaleString('en-IN')}.00 (tax-inclusive) unless they are the claimant. {'\u20B9'}{(p.limit + 0.01).toLocaleString('en-IN')} and above goes to the Founder. Approval is not posting, payout or reconciliation.</Notice>
    <div className="columns equal">
      <Panel title="Manager approval limit"><div className="form-group"><label>Limit in {'\u20B9'} (inclusive)</label><input type="number" disabled={!can} defaultValue={p.limit} onBlur={(e) => { const v = Math.max(0, Number(e.target.value) || 0); if (v !== p.limit) set({ limit: v }, `limit -> ${v}`); }} /></div>
        <div className="eyebrow" style={{ marginTop: 16 }}>Roles allowed to approve up to the limit</div>
        {cand.map((r) => <label key={r.id} className="list-row" style={{ cursor: can ? 'pointer' : 'default' }}><span>{r.label}</span><input type="checkbox" disabled={!can} checked={p.delegated.includes(r.id)} onChange={(e) => set({ delegated: e.target.checked ? [...p.delegated, r.id] : p.delegated.filter((x) => x !== r.id) }, `${r.label} ${e.target.checked ? 'delegated' : 'removed'}`)} /></label>)}
        {!can && <p className="muted">Only the Founder can change approval policy.</p>}</Panel>
      <Panel title="Founder-only decisions (any amount)"><Rows items={FOUNDER_ONLY.map((x) => [x, 'Even \u20B91 needs the Founder', 'Founder'] as [string, string, string])} />
        <div className="eyebrow" style={{ marginTop: 16 }}>Other rules</div>
        <Rows items={[['Self-approval', 'Nobody approves their own claim', 'Blocked'], ['Amount changed after approval', 'Approval becomes invalid; submit again', 'Required'], ['Quotation with discount', 'Founder only', 'Founder'], ['Leave / attendance', 'HR or reporting manager', 'Manager']]} /></Panel>
    </div>
  </>);
};

// =============== APR-06 APPROVAL HISTORY ===============
export const ApprovalHistoryPage: React.FC = () => {
  const { auditLogs } = useApp();
  const rows = (auditLogs || []).filter((a) => /APPROV|REJECT|REWORK|EXCEPTION|OVERRIDE|PERMISSION|POLICY/.test(a.action));
  return <DataTable rows={rows} filters={['APPROVED', 'REJECTED', 'PERMISSION', 'POLICY']} cols={[{ h: 'When', v: (a) => `${a.date} ${a.time}` }, { h: 'Action', v: (a) => <Pill v={a.action.replace(/_/g, ' ')} />, s: (a) => a.action }, { h: 'Record', v: (a) => a.relatedRecord }, { h: 'By', v: (a) => a.userName }, { h: 'Details', v: (a) => a.details || '\u2014', wrap: true }]} empty="No approval decisions recorded yet." />;
};

// =============== RPT-03 CLIENT RETENTION ===============
export const RetentionReportPage: React.FC = () => {
  const { clients, agreements, invoices, payments } = useApp(); const t = today();
  const rows = clients.map((c) => { const ag = agreements.filter((a) => a.clientId === c.id); const act = ag.find((a) => a.status === 'active'); const end = act?.endDate || ag.map((a) => a.endDate).sort().pop() || ''; const paid = payments.filter((p) => invoices.find((i) => i.id === p.invoiceId)?.clientId === c.id).reduce((s, p) => s + p.amount, 0);
    const left = end ? daysBetween(t, end) : null; const st = !ag.length ? 'No contract' : act ? (left !== null && left <= 30 ? 'Renewal Due' : 'Active') : 'Expired';
    return { c, end, left, paid, st, tenure: c.createdAt ? Math.max(0, Math.round(daysBetween(c.createdAt.slice(0, 10), t) / 30)) : 0 }; });
  const active = rows.filter((r) => r.st === 'Active' || r.st === 'Renewal Due').length;
  return (<>
    <div className="kpis"><Kpi name="Clients" value={rows.length} desc="All accounts" icon="users" /><Kpi name="Active contracts" value={active} desc="Retained" icon="check" /><Kpi name="Renewals in 30 days" value={rows.filter((r) => r.st === 'Renewal Due').length} desc="Act now" icon="calendar" /><Kpi name="Retention" value={rows.length ? Math.round((active / rows.length) * 100) + '%' : '\u2014'} desc="Active / all" icon="chart" /></div>
    <DataTable rows={rows} filters={['Active', 'Renewal Due', 'Expired', 'No contract']} cols={[{ h: 'Client', v: (r) => r.c.companyName }, { h: 'Contract end', v: (r) => fmtD(r.end) }, { h: 'Days left', v: (r) => (r.left === null ? '\u2014' : r.left) }, { h: 'Tenure (months)', v: (r) => r.tenure }, { h: 'Collected', v: (r) => inrF(r.paid) }, { h: 'Status', v: (r) => <Pill v={r.st} />, s: (r) => r.st }]} />
  </>);
};

// =============== RPT-08 CUSTOM REPORT BUILDER ===============
export const ReportBuilderPage: React.FC = () => {
  const full = useApp(); const a = scopeForStaff(full) as any; const { currentRole, logAudit } = full;
  const DS: Record<string, { tab: string; rows: any[] }> = { Leads: { tab: 'leads', rows: a.leads }, Clients: { tab: 'clients', rows: a.clients }, Projects: { tab: 'projects', rows: a.projects }, Tasks: { tab: 'task_operations', rows: a.tasks }, Invoices: { tab: 'billing', rows: a.invoices }, Payments: { tab: 'payments', rows: a.payments }, Expenses: { tab: 'expenses', rows: a.expenses }, Employees: { tab: 'employees', rows: a.employees }, Attendance: { tab: 'attendance', rows: a.attendance } };
  const names = Object.keys(DS).filter((k) => osCanAccess(currentRole, DS[k].tab));
  const [ds, setDs] = useState(names[0] || ''); const [cols, setCols] = useState<string[]>([]); const [f, setF] = useState('');
  const rows: any[] = (DS[ds]?.rows || []);
  const keys = Array.from(new Set(rows.slice(0, 20).flatMap((r) => Object.keys(r).filter((k) => ['string', 'number', 'boolean'].includes(typeof r[k]) && !/password|hash|photo|signature|url/i.test(k)))));
  const use = cols.filter((c) => keys.includes(c)).length ? cols.filter((c) => keys.includes(c)) : keys.slice(0, 6);
  const list = rows.filter((r) => !f || use.some((c) => String(r[c] ?? '').toLowerCase().includes(f.toLowerCase())));
  return (<>
    <div className="card panel"><div className="toolbar-left">
      <select className="os-select" value={ds} onChange={(e) => { setDs(e.target.value); setCols([]); }}>{names.map((n) => <option key={n}>{n}</option>)}</select>
      <input className="field search-field" placeholder="Filter rows..." value={f} onChange={(e) => setF(e.target.value)} />
      <button className="primary-button" onClick={() => { csvDownload(`${ds}_report_${today()}`, use, list.map((r) => use.map((c) => r[c]))); logAudit('REPORT_EXPORTED', ds, `${list.length} rows`); }}><Icon name="download" size={14} /> Export CSV</button></div>
      <div className="service-tags" style={{ marginTop: 12 }}>{keys.map((k) => <span key={k} className="hover-link" style={use.includes(k) ? { background: '#0B1738', color: '#fff' } : undefined} onClick={() => setCols(use.includes(k) ? use.filter((x) => x !== k) : [...use, k])}>{k}</span>)}</div>
      <p className="muted" style={{ marginTop: 8 }}>Click column names to add or remove. Only data your role can see is listed.</p></div>
    <div style={{ marginTop: 16 }}><DataTable rows={list} search={false} cols={use.map((c) => ({ h: c, v: (r: any) => String(r[c] ?? '') }))} /></div>
  </>);
};

// =============== simple registers (generic table / board screens) ===============
const E = ['@employees'], CLI = ['@clients'];
const mgr = (r: string) => !['employee', 'intern', 'freelancer', 'consultant', 'vendor', 'auditor'].includes(r);
const founder = (r: string) => r === 'super_admin' || r === 'admin';
export const RECORDS26: Record<string, RecordConfig> = {
  calls: { kind: 'calls', codePrefix: 'ACT', noun: 'Activity', statuses: ['Planned', 'Done', 'No Answer', 'Follow-up Needed'], dateCol: 'date', ownOnly: true,
    fields: [{ k: 'with', label: 'Lead / client', required: true }, { k: 'type', label: 'Type', type: 'select', options: ['Call', 'Meeting', 'WhatsApp', 'Email', 'Site Visit'] }, { k: 'date', label: 'Date', type: 'date', required: true }, { k: 'duration', label: 'Minutes', type: 'number' }, { k: 'outcome', label: 'Outcome' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['with', 'With'], ['type', 'Type'], ['date', 'Date'], ['outcome', 'Outcome'], ['owner', 'By']] },
  'comm-templates': { kind: 'commtpl', codePrefix: 'TPL', noun: 'Template', statuses: ['Draft', 'Approved', 'Retired'], canEdit: mgr,
    fields: [{ k: 'name', label: 'Template name', required: true }, { k: 'channel', label: 'Channel', type: 'select', options: ['WhatsApp', 'Email', 'Call Script', 'SMS'] }, { k: 'stage', label: 'Use at stage', type: 'select', options: ['New', 'Follow-up', 'Proposal', 'Negotiation', 'Won', 'Lost / Reactivation'] }, { k: 'notes', label: 'Message text (use {name}, {company})', type: 'textarea', required: true }],
    cols: [['name', 'Template'], ['channel', 'Channel'], ['stage', 'Stage'], ['notes', 'Text']] },
  contacts: { kind: 'contacts', codePrefix: 'CON', noun: 'Contact', statuses: ['Active', 'Left Company'],
    fields: [{ k: 'client', label: 'Client', type: 'select', options: CLI, required: true }, { k: 'name', label: 'Name', required: true }, { k: 'role', label: 'Role', type: 'select', options: ['Decision Maker', 'Billing', 'Day-to-day', 'Marketing Head', 'Owner', 'Other'] }, { k: 'phone', label: 'Phone' }, { k: 'email', label: 'Email' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['name', 'Name'], ['client', 'Client'], ['role', 'Role'], ['phone', 'Phone'], ['email', 'Email']] },
  packages: { kind: 'packages', codePrefix: 'PKG', noun: 'Package', statuses: ['Active', 'Inactive'], canEdit: founder,
    fields: [{ k: 'name', label: 'Package', required: true }, { k: 'service', label: 'Service(s)' }, { k: 'price', label: 'List price / month (\u20B9)', type: 'number', required: true }, { k: 'floor', label: 'Minimum price (needs Founder below this)', type: 'number' }, { k: 'billing', label: 'Billing', type: 'select', options: ['Monthly', 'Quarterly', 'One-time', 'Milestone'] }, { k: 'addons', label: 'Add-ons' }, { k: 'notes', label: 'What is included', type: 'textarea' }],
    cols: [['name', 'Package'], ['service', 'Services'], ['price', 'Price'], ['floor', 'Floor'], ['billing', 'Billing']], note: 'Only the Founder / Owner can change prices. Selling below the floor needs Founder approval.' },
  engagements: { kind: 'engagements', codePrefix: 'ENG', noun: 'Engagement', statuses: ['Onboarding', 'Active', 'Paused', 'Ended'], dateCol: 'start',
    fields: [{ k: 'client', label: 'Client', type: 'select', options: CLI, required: true }, { k: 'service', label: 'Service', required: true }, { k: 'fee', label: 'Monthly fee (\u20B9)', type: 'number' }, { k: 'start', label: 'Start', type: 'date' }, { k: 'lead', label: 'Delivery owner', type: 'select', options: E }, { k: 'notes', label: 'Scope', type: 'textarea' }],
    cols: [['client', 'Client'], ['service', 'Service'], ['fee', 'Fee'], ['start', 'Since'], ['lead', 'Owner']] },
  'client-requests': { kind: 'clientreq', codePrefix: 'REQ', noun: 'Request', board: true, statuses: ['New', 'In Progress', 'Waiting on Client', 'Resolved', 'Closed'],
    fields: [{ k: 'title', label: 'Request / complaint', required: true }, { k: 'client', label: 'Client', type: 'select', options: CLI }, { k: 'type', label: 'Type', type: 'select', options: ['Request', 'Complaint', 'Change', 'Billing Query'] }, { k: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] }, { k: 'assignee', label: 'Owner', type: 'select', options: E }, { k: 'due', label: 'Respond by', type: 'date' }, { k: 'notes', label: 'Details / resolution', type: 'textarea' }],
    cols: [['title', 'Request'], ['client', 'Client'], ['priority', 'Priority']] },
  'client-assets': { kind: 'clientassets', codePrefix: 'AST', noun: 'Asset', statuses: ['Access Given', 'Pending Access', 'Revoked'],
    fields: [{ k: 'client', label: 'Client', type: 'select', options: CLI, required: true }, { k: 'asset', label: 'Account / asset', type: 'select', options: ['Meta Business Manager', 'Ad Account', 'Google Ads', 'Google Analytics', 'Search Console', 'Website / Hosting', 'Domain', 'Instagram', 'YouTube', 'Google Business Profile', 'Other'] }, { k: 'idref', label: 'Account ID / URL' }, { k: 'vault', label: 'Where the login is kept (password manager entry)' }, { k: 'holder', label: 'Our access holder', type: 'select', options: E }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['client', 'Client'], ['asset', 'Asset'], ['idref', 'ID / URL'], ['holder', 'Holder'], ['vault', 'Kept in']], note: 'Never type passwords here. Record only where the credential is stored (e.g. the password-manager entry name).' },
  milestones: { kind: 'milestones', codePrefix: 'MS', noun: 'Milestone', statuses: ['Planned', 'In Progress', 'Blocked', 'Done'], dateCol: 'due',
    fields: [{ k: 'project', label: 'Project', required: true }, { k: 'name', label: 'Milestone', required: true }, { k: 'due', label: 'Due date', type: 'date' }, { k: 'depends', label: 'Depends on (milestone code)' }, { k: 'assignee', label: 'Owner', type: 'select', options: E }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['name', 'Milestone'], ['project', 'Project'], ['due', 'Due'], ['depends', 'Depends on'], ['assignee', 'Owner']] },
  'time-logs': { kind: 'timelogs', codePrefix: 'TL', noun: 'Time Log', statuses: ['Logged', 'Approved'], dateCol: 'date', ownOnly: true,
    fields: [{ k: 'date', label: 'Date', type: 'date', required: true }, { k: 'task', label: 'Task / work', required: true }, { k: 'client', label: 'Client', type: 'select', options: CLI }, { k: 'hours', label: 'Hours', type: 'number', required: true }, { k: 'notes', label: 'What was done', type: 'textarea' }],
    cols: [['date', 'Date'], ['task', 'Task'], ['client', 'Client'], ['hours', 'Hours'], ['owner', 'Person']] },
  risks: { kind: 'risks', codePrefix: 'RSK', noun: 'Risk', statuses: ['Open', 'Mitigating', 'Escalated', 'Closed'],
    fields: [{ k: 'title', label: 'Risk / blocker', required: true }, { k: 'project', label: 'Project / client' }, { k: 'impact', label: 'Impact', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }, { k: 'assignee', label: 'Owner', type: 'select', options: E }, { k: 'due', label: 'Resolve by', type: 'date' }, { k: 'notes', label: 'Mitigation plan', type: 'textarea' }],
    cols: [['title', 'Risk'], ['project', 'Project'], ['impact', 'Impact'], ['assignee', 'Owner']] },
  'campaign-performance': { kind: 'campperf', codePrefix: 'CP', noun: 'Performance Entry', statuses: ['On Target', 'Below Target', 'Paused'], dateCol: 'month',
    fields: [{ k: 'client', label: 'Client', type: 'select', options: CLI, required: true }, { k: 'campaign', label: 'Campaign', required: true }, { k: 'platform', label: 'Platform', type: 'select', options: ['Meta Ads', 'Google Ads', 'YouTube', 'LinkedIn', 'Other'] }, { k: 'month', label: 'Period end', type: 'date' }, { k: 'spend', label: 'Spend (\u20B9)', type: 'number' }, { k: 'leads', label: 'Leads / conversions', type: 'number' }, { k: 'revenue', label: 'Client revenue (\u20B9, if known)', type: 'number' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['campaign', 'Campaign'], ['client', 'Client'], ['platform', 'Platform'], ['spend', 'Spend'], ['leads', 'Leads'], ['cpl', 'CPL'], ['roas', 'ROAS']], derive: (r: any) => ({ ...r, cpl: Number(r.leads) ? '\u20B9' + Math.round(Number(r.spend || 0) / Number(r.leads)).toLocaleString('en-IN') : '\u2014', roas: Number(r.spend) && Number(r.revenue) ? (Number(r.revenue) / Number(r.spend)).toFixed(2) + 'x' : '\u2014' }), note: 'CPL = spend / leads, ROAS = revenue / spend are calculated in the table. Live numbers will come from the Meta / Google connectors later.' },
  'web-seo': { kind: 'webseo', codePrefix: 'WEB', noun: 'Web / SEO Job', board: true, statuses: ['Brief', 'Design', 'Development', 'SEO / Content', 'Testing', 'Live'],
    fields: [{ k: 'title', label: 'Website / SEO job', required: true }, { k: 'client', label: 'Client', type: 'select', options: CLI }, { k: 'type', label: 'Type', type: 'select', options: ['New Website', 'Redesign', 'Landing Page', 'SEO Audit', 'Monthly SEO', 'E-commerce'] }, { k: 'assignee', label: 'Owner', type: 'select', options: E }, { k: 'url', label: 'Staging / live URL' }, { k: 'due', label: 'Go-live', type: 'date' }, { k: 'notes', label: 'Checklist / notes', type: 'textarea' }],
    cols: [['title', 'Job'], ['client', 'Client'], ['type', 'Type']] },
  'client-reporting': { kind: 'clientreports', codePrefix: 'RPT', noun: 'Client Report', board: true, statuses: ['To Prepare', 'Drafting', 'Internal Review', 'Sent'],
    fields: [{ k: 'client', label: 'Client', type: 'select', options: CLI, required: true }, { k: 'period', label: 'Period (e.g. Oct 2026)', required: true }, { k: 'assignee', label: 'Prepared by', type: 'select', options: E }, { k: 'link', label: 'Report file / link' }, { k: 'notes', label: 'Highlights', type: 'textarea' }],
    cols: [['client', 'Client'], ['period', 'Period'], ['assignee', 'By']] },
  'sla-quality': { kind: 'sla', codePrefix: 'SLA', noun: 'SLA Entry', statuses: ['Met', 'Missed', 'At Risk'], dateCol: 'date',
    fields: [{ k: 'service', label: 'Service', required: true }, { k: 'client', label: 'Client', type: 'select', options: CLI }, { k: 'target', label: 'Target (e.g. 48h reply)' }, { k: 'actual', label: 'Actual' }, { k: 'score', label: 'Quality score (1-5)', type: 'number' }, { k: 'date', label: 'Date', type: 'date' }, { k: 'notes', label: 'Reason / action', type: 'textarea' }],
    cols: [['service', 'Service'], ['client', 'Client'], ['target', 'Target'], ['actual', 'Actual'], ['score', 'Score'], ['date', 'Date']] },
  outsourcing: { kind: 'outsourcing', codePrefix: 'OUT', noun: 'Outsourced Job', statuses: ['Requested', 'In Progress', 'Delivered', 'Accepted', 'Rejected'],
    fields: [{ k: 'job', label: 'Job', required: true }, { k: 'vendor', label: 'Vendor / freelancer', required: true }, { k: 'client', label: 'For client', type: 'select', options: CLI }, { k: 'cost', label: 'Agreed cost (\u20B9)', type: 'number' }, { k: 'due', label: 'Due', type: 'date' }, { k: 'quality', label: 'Quality (1-5)', type: 'number' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['job', 'Job'], ['vendor', 'Vendor'], ['client', 'Client'], ['cost', 'Cost'], ['due', 'Due'], ['quality', 'Quality']], note: 'Vendor payments are approved and paid from Finance. Changing a vendor\u2019s bank details always needs the Founder.' },
  requisitions: { kind: 'requisitions', codePrefix: 'HRQ', noun: 'Requisition', statuses: ['Draft', 'Awaiting Founder', 'Approved', 'Filled', 'Cancelled'], founderStatus: ['Approved'],
    fields: [{ k: 'position', label: 'Position', required: true }, { k: 'team', label: 'Department / team', type: 'select', options: ORG_UNITS.map((u) => u.name) }, { k: 'count', label: 'Openings', type: 'number' }, { k: 'budget', label: 'Monthly CTC budget (\u20B9)', type: 'number' }, { k: 'reason', label: 'Reason', type: 'select', options: ['New seat', 'Replacement', 'Project demand'] }, { k: 'notes', label: 'Job description', type: 'textarea' }],
    cols: [['position', 'Position'], ['team', 'Team'], ['count', 'Openings'], ['reason', 'Reason'], ['owner', 'Raised by']] },
  performance: { kind: 'performance', codePrefix: 'PRF', noun: 'Review', statuses: ['Goals Set', 'Self Review', 'Manager Review', 'Completed'],
    fields: [{ k: 'employee', label: 'Employee', type: 'select', options: E, required: true }, { k: 'period', label: 'Period (e.g. Q3 2026)', required: true }, { k: 'goals', label: 'Goals / KPIs', type: 'textarea' }, { k: 'rating', label: 'Rating (1-5)', type: 'number' }, { k: 'training', label: 'Training plan' }, { k: 'notes', label: 'Manager comments', type: 'textarea' }],
    cols: [['employee', 'Employee'], ['period', 'Period'], ['rating', 'Rating'], ['training', 'Training']] },
  'assets-issued': { kind: 'assetsissued', codePrefix: 'ISS', noun: 'Asset / Access', statuses: ['Issued', 'Returned', 'Lost / Damaged'], dateCol: 'date',
    fields: [{ k: 'employee', label: 'Employee', type: 'select', options: E, required: true }, { k: 'item', label: 'Item / access', required: true }, { k: 'type', label: 'Type', type: 'select', options: ['Laptop', 'Phone', 'SIM', 'ID Card', 'Software Licence', 'Tool Login', 'Other'] }, { k: 'serial', label: 'Serial / ID' }, { k: 'date', label: 'Issued on', type: 'date' }, { k: 'notes', label: 'Condition / notes', type: 'textarea' }],
    cols: [['employee', 'Employee'], ['item', 'Item'], ['type', 'Type'], ['serial', 'Serial'], ['date', 'Issued']] },
  'hr-letters': { kind: 'hrletters', codePrefix: 'HRL', noun: 'Letter', statuses: ['Draft', 'Issued', 'Acknowledged', 'Cancelled'], dateCol: 'date',
    fields: [{ k: 'employee', label: 'Employee', type: 'select', options: E, required: true }, { k: 'type', label: 'Letter', type: 'select', options: ['Offer', 'Appointment', 'Confirmation', 'Increment', 'Warning', 'Experience', 'Relieving', 'Termination'] }, { k: 'date', label: 'Date', type: 'date' }, { k: 'ref', label: 'Reference no.' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['ref', 'Ref'], ['employee', 'Employee'], ['type', 'Letter'], ['date', 'Date'], ['owner', 'Issued by']] },
  'finance-docs': { kind: 'findocs', codePrefix: 'FD', noun: 'Finance Document', statuses: ['Issued', 'Sent', 'Cancelled'], dateCol: 'date',
    fields: [{ k: 'type', label: 'Type', type: 'select', options: ['Invoice', 'Receipt', 'Credit Note', 'Debit Note', 'Statement', 'Quotation', 'Vendor Bill'] }, { k: 'number', label: 'Document no.', required: true }, { k: 'party', label: 'Client / vendor', required: true }, { k: 'amount', label: 'Amount (\u20B9)', type: 'number' }, { k: 'date', label: 'Date', type: 'date' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['number', 'Doc no.'], ['type', 'Type'], ['party', 'Party'], ['amount', 'Amount'], ['date', 'Date']] },
  'doc-retention': { kind: 'docretention', codePrefix: 'RET', noun: 'Policy', statuses: ['Active', 'Draft'], canEdit: founder,
    seed: [{ id: 'r1', code: 'RET-001', docType: 'Invoices & receipts', who: 'Founder, Finance', keep: '8 years', status: 'Active' }, { id: 'r2', code: 'RET-002', docType: 'Employee files & letters', who: 'Founder, HR', keep: 'Employment + 7 years', status: 'Active' }, { id: 'r3', code: 'RET-003', docType: 'Client agreements', who: 'Founder, CRM, Finance', keep: 'Contract + 8 years', status: 'Active' }, { id: 'r4', code: 'RET-004', docType: 'Founder private documents', who: 'Founder only', keep: 'Permanent', status: 'Active' }],
    fields: [{ k: 'docType', label: 'Document type', required: true }, { k: 'who', label: 'Who can view' }, { k: 'keep', label: 'Keep for' }, { k: 'notes', label: 'Disposal rule', type: 'textarea' }],
    cols: [['docType', 'Document type'], ['who', 'Who can view'], ['keep', 'Keep for']], note: 'Suggested defaults. Confirm retention periods with your CA / lawyer.' },
  exceptions: { kind: 'exceptions', codePrefix: 'EXC', noun: 'Exception', statuses: ['Requested', 'Approved by Founder', 'Rejected', 'Expired'], canEdit: (r) => r !== 'auditor', dateCol: 'expiry', founderStatus: ['Approved by Founder', 'Rejected'],
    fields: [{ k: 'what', label: 'Exception / override', required: true }, { k: 'type', label: 'Type', type: 'select', options: ['Work before advance', 'Price below floor', 'Late payment allowance', 'Permission override', 'Policy waiver', 'Other'] }, { k: 'client', label: 'Client / person' }, { k: 'expiry', label: 'Valid until', type: 'date' }, { k: 'notes', label: 'Reason', type: 'textarea', required: true }],
    cols: [['what', 'Exception'], ['type', 'Type'], ['client', 'For'], ['expiry', 'Valid until'], ['owner', 'Requested by']], note: 'Only the Founder may mark an exception "Approved by Founder". Every change is in the audit trail.' },
  'scheduled-reports': { kind: 'schedreports', codePrefix: 'SCH', noun: 'Schedule', statuses: ['Active', 'Paused'],
    fields: [{ k: 'report', label: 'Report', type: 'select', options: ['Founder Executive Summary', 'Sales Funnel', 'Collections', 'Team Performance', 'Client Retention', 'Delivery SLA'], required: true }, { k: 'freq', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly (Mon)', 'Monthly (1st)'] }, { k: 'to', label: 'Send to (roles / emails)' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['report', 'Report'], ['freq', 'Frequency'], ['to', 'Recipients']], note: 'Automatic sending needs the server (Part 29). Until then this is the list of reports to prepare.' },
};
export const P26_CUSTOM = ['global-search', 'my-profile', 'lead-import', 'lead-analytics', 'sales-targets', 'service-teams', 'approval-policy', 'approval-history', 'retention-report', 'report-builder'];
export const renderP26 = (tab: string, RecordPage: React.FC<{ cfg: RecordConfig }>): React.ReactNode => {
  switch (tab) {
    case 'global-search': return <GlobalSearchPage />;
    case 'my-profile': return <MyProfilePage />;
    case 'lead-import': return <LeadImportPage />;
    case 'lead-analytics': return <LeadAnalyticsPage />;
    case 'sales-targets': return <SalesTargetsPage />;
    case 'service-teams': return <ServiceTeamsPage />;
    case 'approval-policy': return <ApprovalPolicyPage />;
    case 'approval-history': return <ApprovalHistoryPage />;
    case 'retention-report': return <RetentionReportPage />;
    case 'report-builder': return <ReportBuilderPage />;
    default: return RECORDS26[tab] ? <RecordPage key={tab} cfg={RECORDS26[tab]} /> : null;
  }
};
export { pageById };
