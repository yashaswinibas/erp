// AGENCYOS_V5_P26_DONE
// AGENCYOS_V4_P25_DONE
// AGENCYOS_V3_OS: work screens (approvals, alerts, calendar, CRM, clients, finance, HR, documents, admin)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useShared, readKey, uid, nowStamp } from '../lib/sharedStore';
import { TEMPLATES, CAT_LABEL } from '../lib/docTemplates';
import { LOGIN_LOG_KEY, RESET_KEY } from '../lib/rbac';
import { Icon } from './icons';
import { DataTable, Pill, Panel, Rows, Kpi, Notice, OsModal, FormGrid, toast, inrF, inrS, today, fmtD, daysBetween, initials, pad2 } from './OsUi';
import { useAlerts, useApprovalQueue, useCalendarEvents, useFinRequests, useFollowLog, useLostReasons, useWeekly, useRecords, newFinRequest, CalEvent } from './osData';
import { MODULES, OS_ROLES, DEFAULT_MATRIX, OS_PERM_KEY, readMatrix, osCanAccess, roleLabel, SERVICES, TEAM_LEADS, FULL_ACCESS, isStaffRole } from './osConfig';
import { RecordPage, RECORDS } from './OsRecords';

const useSel = (key: string, first?: string) => {
  const [v, setV] = useState<string>(() => sessionStorage.getItem('paa_x_os_sel_' + key) || first || '');
  useEffect(() => { if (!v && first) setV(first); }, [first]); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, (x: string) => { sessionStorage.setItem('paa_x_os_sel_' + key, x); setV(x); }] as const;
};
export const openRecord = (key: string, id: string, setTab: (t: string) => void, tab: string) => { sessionStorage.setItem('paa_x_os_sel_' + key, id); setTab(tab); };
const csv = (name: string, head: string[], rows: (string | number)[][]) => {
  const body = [head, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = name + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const ExportBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => { const { currentRole } = useApp(); return osCanAccess(currentRole, 'export') || FULL_ACCESS.includes(currentRole) || readMatrix()[currentRole]?.[11] === 1 ? <button className="outline-button" onClick={onClick}><Icon name="download" size={14} /> Export</button> : null; };

// ============ APPROVAL CENTER ============
export const ApprovalsPage: React.FC = () => {
  const { currentUser } = useApp();
  const queue = useApprovalQueue();
  const [fin, setFin] = useFinRequests();
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const act = (q: typeof queue[number], ok: boolean) => { const n = prompt(ok ? 'Approval note (optional)' : 'Reason for rejection') ?? undefined; if (n === null) return; ok ? q.approve(n) : q.reject(n); toast(`${q.code} ${ok ? 'approved' : 'rejected'}`); };
  const decided = fin.filter((f) => f.status !== 'Pending');
  return (<>
    <DataTable rows={queue} filters={['Expense Claim', 'Leave', 'Quotation', 'Weekly']}
      top={<button className="primary-button" onClick={() => setForm({ category: 'Discount' })}>+ Raise Request</button>}
      cols={[{ h: 'Request', v: (q) => q.code }, { h: 'Requested By', v: (q) => q.by }, { h: 'Category', v: (q) => q.category }, { h: 'Amount / Scope', v: (q) => q.scope }, { h: 'Reviewer', v: (q) => q.reviewer }, { h: 'Status', v: (q) => <Pill v={q.status} />, s: (q) => q.status }]}
      actions={(q) => q.canAct ? <div className="os-row-actions"><button className="outline-button os-mini" onClick={() => act(q, true)}>Approve</button><button className="outline-button os-mini os-danger" onClick={() => act(q, false)}>{q.key.startsWith('wk-') ? 'Rework' : 'Reject'}</button></div> : <span className="muted">Waiting</span>}
      empty="No approvals waiting. Everything is cleared." />
    <div style={{ marginTop: 16 }}><Panel title="Decided requests" right={<span className="muted">Audit history</span>}>
      <Rows items={decided.slice(0, 8).map((f) => [`${f.code} \u00B7 ${f.category}`, `${f.title} \u00B7 ${f.amount ? inrF(f.amount) + ' \u00B7 ' : ''}by ${f.requestedBy} \u00B7 reviewed by ${f.reviewer || '\u2014'}${f.note ? ' \u00B7 ' + f.note : ''}`, f.status])} empty="No decided requests yet." />
    </Panel></div>
    <p className="foot-note"><b>Financial control workflow:</b> employee submits {'\u2192'} manager verifies {'\u2192'} Founder approves required categories (discounts, refunds, write-offs, expenses) {'\u2192'} Accounts posts the transaction {'\u2192'} audit trail saved. Who can approve expense claims is set in the Permission Matrix.</p>
    {form && <OsModal title="Raise approval request" onClose={() => setForm(null)} footer={<><button className="outline-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" onClick={() => { if (!form.title) return toast('Enter what needs approval'); setFin((p) => [newFinRequest(form.category, form.title, Number(form.amount) || 0, { id: currentUser.id, name: currentUser.name }), ...p]); setForm(null); toast('Request sent for approval'); }}>Send for approval</button></>}>
      <FormGrid value={form} onChange={setForm} fields={[{ k: 'category', label: 'Category', type: 'select', options: ['Expense', 'Refund', 'Discount', 'Write-off', 'Vendor Bank Change', 'Owner Money Exception', 'Client Work Exception', 'Document Approval', 'HR Approval'] }, { k: 'amount', label: 'Amount (\u20B9)', type: 'number' }, { k: 'title', label: 'What needs approval?', type: 'textarea', required: true }]} />
    </OsModal>}
  </>);
};

// ============ ALERTS ============
export const AlertsPage: React.FC = () => {
  const { setActiveTab } = useApp(); const alerts = useAlerts();
  return (<>
    <div className="stat-strip">{(['Critical', 'High', 'Medium'] as const).map((s) => <div key={s} className="card mini-stat"><b>{alerts.filter((a) => a.severity === s).length}</b><small>{s} alerts</small></div>)}</div>
    <DataTable rows={alerts} filters={['Critical', 'High', 'Medium', 'Low']}
      cols={[{ h: 'Severity', v: (a) => <Pill v={a.severity} tone={a.severity === 'Critical' ? 'red' : a.severity === 'High' ? 'yellow' : 'blue'} />, s: (a) => a.severity }, { h: 'Alert', v: (a) => a.title, s: (a) => a.title }, { h: 'Related Record', v: (a) => a.record }, { h: 'Owner', v: (a) => a.owner }, { h: 'Raised', v: (a) => a.raised }, { h: 'Status', v: (a) => <Pill v={a.status} />, s: (a) => a.status }]}
      actions={(a) => <span className="link" onClick={() => setActiveTab(a.tab)}>Open {'\u2192'}</span>} empty="No alerts. Everything is on track." />
  </>);
};

// ============ CALENDAR ============
export const CalendarView: React.FC<{ events: CalEvent[]; title?: string }> = ({ events, title }) => {
  const { setActiveTab } = useApp();
  const [ym, setYm] = useState(() => today().slice(0, 7));
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1); const startPad = (first.getDay() + 6) % 7; const daysIn = new Date(y, m, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startPad + daysIn) / 7) * 7 }, (_, i) => i - startPad + 1);
  const shift = (d: number) => { const n = new Date(y, m - 1 + d, 1); setYm(`${n.getFullYear()}-${pad2(n.getMonth() + 1)}`); };
  const t = today();
  return (<div className="card panel"><div className="panel-title"><h3>{title || first.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</h3>
    <div className="actions"><button className="outline-button" onClick={() => shift(-1)}>{'\u2190'} Previous</button><button className="outline-button" onClick={() => setYm(t.slice(0, 7))}>Today</button><button className="outline-button" onClick={() => shift(1)}>Next {'\u2192'}</button></div></div>
    <div style={{ overflow: 'auto' }}><div className="calendar-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="calendar-head">{d}</div>)}
      {cells.map((d, i) => { const iso = d > 0 && d <= daysIn ? `${ym}-${pad2(d)}` : ''; const ev = iso ? events.filter((e) => e.date === iso) : [];
        return (<div key={i} className={`calendar-day ${!iso ? 'muted-day' : ''} ${iso === t ? 'today' : ''}`}>{iso && <b>{d}</b>}
          {ev.slice(0, 4).map((e, j) => <span key={j} className={`event ${e.tone} hover-link`} onClick={() => setActiveTab(e.tab)} title={e.title}>{e.title}</span>)}
          {ev.length > 4 && <span className="tiny-note">+{ev.length - 4} more</span>}</div>); })}</div></div>
    <p className="muted" style={{ margin: '18px 0 0' }}>{'Gold = renewals, project and content dates \u00B7 Red = overdue or payments due \u00B7 Blue = tasks, follow-ups and leave. Click an item to open it.'}</p></div>);
};
export const CalendarPage: React.FC = () => <CalendarView events={useCalendarEvents()} />;
export const ContentCalendarPage: React.FC = () => { const [posts] = useRecords<any>('content'); return (<><CalendarView events={posts.filter((p: any) => p.date).map((p: any) => ({ date: p.date, title: `${p.platform || ''} \u00B7 ${p.title}`, tone: p.status === 'Published' ? '' : 'gold', tab: 'content-calendar' }))} /><div style={{ marginTop: 16 }}><RecordPage cfg={RECORDS['content-calendar']} /></div></>); };

// ============ CRM ============
const STAGES: [string, string][] = [['new', 'New'], ['assigned', 'Assigned'], ['contacted', 'Contacted'], ['follow_up', 'Follow-up'], ['qualified', 'Qualified'], ['proposal', 'Proposal Sent'], ['negotiation', 'Negotiation'], ['won', 'Won'], ['lost', 'Lost']];
const stageLabel = (s: string) => STAGES.find((x) => x[0] === s)?.[1] || s;

export const PipelinePage: React.FC = () => {
  const { leads, employees, updateLeadStatus, setActiveTab, logAudit } = useApp();
  const name = (id: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  const move = (id: string, cur: string, d: number) => { const i = STAGES.findIndex((x) => x[0] === cur); const n = STAGES[Math.min(STAGES.length - 1, Math.max(0, i + d))][0]; if (n === cur) return; updateLeadStatus(id, n as any); logAudit('LEAD_STAGE', id, `${cur} -> ${n}`); };
  return (<>
    <Notice icon="layers" title="Lead pipeline">Move a lead with the arrows. Every stage change is saved with who changed it and when. Winning a lead lets you convert it to a client from All Leads.</Notice>
    <div className="kanban k9">{STAGES.map(([k, l]) => { const lane = leads.filter((x) => x.status === k);
      return (<div key={k} className="lane"><div className="lane-head">{l} <span>{lane.length}</span></div>
        {lane.map((x) => (<div key={x.id} className="deal"><b>{x.company || x.name}</b><small>{x.source} {'\u00B7'} {x.serviceRequired}<br />Next follow-up {fmtD(x.followUpDate)} {'\u00B7'} {inrS(x.estimatedValue || 0)}</small>
          <div className="deal-footer"><Pill v={x.priority === 'high' ? 'High Priority' : x.priority} /><div className="mini-avatar" title={name(x.assignedEmployeeId)}>{initials(name(x.assignedEmployeeId))}</div></div>
          <div className="os-row-actions" style={{ marginTop: 10, justifyContent: 'space-between' }}><button className="outline-button os-mini" onClick={() => move(x.id, x.status, -1)}>{'\u2190'}</button>
            <button className="outline-button os-mini" onClick={() => openRecord('lead', x.id, setActiveTab, 'lead-profile')}>Open Card</button>
            <button className="outline-button os-mini" onClick={() => move(x.id, x.status, 1)}>{'\u2192'}</button></div></div>))}
        {!lane.length && <div className="tiny-note" style={{ padding: 8 }}>No leads</div>}</div>); })}</div>
  </>);
};

const FollowModal: React.FC<{ leadId: string; onClose: () => void }> = ({ leadId, onClose }) => {
  const { leads, currentUser, updateLeadStatus, logAudit } = useApp();
  const [log, setLog] = useFollowLog();
  const lead = leads.find((l) => l.id === leadId)!;
  const [f, setF] = useState<Record<string, any>>({ next: log[leadId]?.next || lead.followUpDate || today(), status: lead.status, note: '' });
  const save = () => {
    if (!f.note) return toast('Write what happened on this follow-up');
    setLog((p) => ({ ...p, [leadId]: { next: f.next, note: f.note, log: [{ at: nowStamp(), by: currentUser.name, note: f.note }, ...(p[leadId]?.log || [])] } }));
    if (f.status && f.status !== lead.status) updateLeadStatus(leadId, f.status);
    logAudit('FOLLOW_UP_LOGGED', lead.leadCode, f.note); toast('Follow-up saved'); onClose();
  };
  return (<OsModal title={`Log follow-up \u00B7 ${lead.company || lead.name}`} onClose={onClose} footer={<><button className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save}>Save follow-up</button></>}>
    <FormGrid value={f} onChange={setF} fields={[{ k: 'note', label: 'Call / meeting notes', type: 'textarea', required: true }, { k: 'next', label: 'Next follow-up date', type: 'date' }, { k: 'status', label: 'Lead stage', type: 'select', options: STAGES.map((s) => s[0]) }]} />
    {(log[leadId]?.log || []).length > 0 && <div style={{ marginTop: 14 }}><Rows items={(log[leadId]?.log || []).slice(0, 5).map((x) => [x.note, `${x.by} \u00B7 ${x.at}`, 'Logged'])} /></div>}
  </OsModal>);
};

export const FollowupsPage: React.FC = () => {
  const { leads, employees, currentRole, currentUser } = useApp();
  const [log] = useFollowLog(); const [open, setOpen] = useState(''); const t = today();
  const name = (id: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  const rows = leads.filter((l) => !['won', 'lost'].includes(l.status) && (!isStaffRole(currentRole) || l.assignedEmployeeId === currentUser.id)).map((l) => ({ l, next: log[l.id]?.next || l.followUpDate || '' })).sort((a, b) => a.next.localeCompare(b.next));
  return (<>
    <div className="stat-strip"><div className="card mini-stat"><b>{rows.filter((r) => r.next && r.next < t).length}</b><small>Overdue follow-ups</small></div><div className="card mini-stat"><b>{rows.filter((r) => r.next === t).length}</b><small>Due today</small></div><div className="card mini-stat"><b>{rows.filter((r) => r.next > t).length}</b><small>Upcoming</small></div></div>
    <DataTable rows={rows} filters={['Overdue', 'Today', 'Upcoming']}
      cols={[{ h: 'Lead', v: (r) => r.l.company || r.l.name, s: (r) => `${r.l.company} ${r.l.name}` }, { h: 'Next Step', v: (r) => (log[r.l.id]?.note || r.l.notes || 'First contact call').slice(0, 48), wrap: true }, { h: 'Owner', v: (r) => name(r.l.assignedEmployeeId) }, { h: 'Due', v: (r) => fmtD(r.next) }, { h: 'Priority', v: (r) => r.l.priority }, { h: 'Status', v: (r) => <Pill v={r.next < t ? 'Overdue' : r.next === t ? 'Today' : 'Upcoming'} />, s: (r) => (r.next < t ? 'Overdue' : r.next === t ? 'Today' : 'Upcoming') }]}
      actions={(r) => <span className="link" onClick={() => setOpen(r.l.id)}>Log follow-up {'\u2192'}</span>} empty="No open follow-ups." />
    {open && <FollowModal leadId={open} onClose={() => setOpen('')} />}
  </>);
};

export const LostPage: React.FC = () => {
  const { leads, employees, updateLeadStatus } = useApp(); const [reasons, setReasons] = useLostReasons();
  const name = (id: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  return (<DataTable rows={leads.filter((l) => l.status === 'lost')} filters={['Budget', 'No response', 'Timing']}
    cols={[{ h: 'Company', v: (l) => l.company || l.name }, { h: 'Service', v: (l) => l.serviceRequired }, { h: 'Lost Reason', v: (l) => reasons[l.id] || '\u2014', s: (l) => reasons[l.id] || '' }, { h: 'Owner', v: (l) => name(l.assignedEmployeeId) }, { h: 'Last Contact', v: (l) => fmtD(l.followUpDate || l.createdAt?.slice(0, 10)) }, { h: 'Value', v: (l) => inrS(l.estimatedValue || 0) }]}
    actions={(l) => <div className="os-row-actions"><span className="link" onClick={() => { const r = prompt('Why was this lead lost?', reasons[l.id] || ''); if (r !== null) setReasons((p) => ({ ...p, [l.id]: r })); }}>Reason</span><span className="link" style={{ marginLeft: 10 }} onClick={() => { updateLeadStatus(l.id, 'contacted'); toast('Lead reopened'); }}>Reopen</span></div>}
    empty="No lost leads." />);
};
// ============ 360 PROFILES ============
const Banner: React.FC<{ logo: string; title: string; sub: string; status: string; right?: React.ReactNode }> = ({ logo, title, sub, status, right }) => (
  <div className="card detail-banner"><div className="detail-ident"><div className="detail-logo">{logo}</div><div><h2>{title}</h2><p>{sub}</p></div></div><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><Pill v={status} />{right}</div></div>
);
const Tabs: React.FC<{ tabs: string[]; v: string; on: (t: string) => void }> = ({ tabs, v, on }) => <div className="tabbar" role="tablist">{tabs.map((x) => <button key={x} className={`tab ${v === x ? 'active' : ''}`} onClick={() => on(x)}>{x}</button>)}</div>;
const Info: React.FC<{ f: [string, React.ReactNode][] }> = ({ f }) => <div className="info-grid">{f.map(([k, v]) => <div key={k} className="kv"><label>{k}</label><b>{v || '\u2014'}</b></div>)}</div>;
const Picker: React.FC<{ value: string; onChange: (v: string) => void; options: [string, string][]; label: string }> = ({ value, onChange, options, label }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}><span className="muted">{label}</span><select className="os-select" style={{ minWidth: 280 }} value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
);
const useAuditFor = (keys: string[]) => { const { auditLogs } = useApp(); const k = keys.filter(Boolean).map((x) => x.toLowerCase()); return (auditLogs || []).filter((a) => k.some((x) => `${a.relatedRecord} ${a.details || ''}`.toLowerCase().includes(x))).slice(0, 8); };

export const LeadProfile: React.FC = () => {
  const { leads, employees, setActiveTab, currentRole, currentUser } = useApp();
  const list = isStaffRole(currentRole) ? leads.filter((l) => l.assignedEmployeeId === currentUser.id) : leads;
  const [id, setId] = useSel('lead', list[0]?.id); const [tab, setTab] = useState('Overview'); const [fu, setFu] = useState(false);
  const [log] = useFollowLog(); const l = list.find((x) => x.id === id) || list[0];
  const audit = useAuditFor([l?.leadCode, l?.id]);
  const [props] = useRecords<any>('proposals');
  if (!l) return <Notice>No leads yet.</Notice>;
  const owner = employees.find((e) => e.id === l.assignedEmployeeId)?.name;
  return (<>
    <Picker label="Lead" value={l.id} onChange={setId} options={list.map((x) => [x.id, `${x.leadCode} \u00B7 ${x.company || x.name}`])} />
    <Banner logo={initials(l.company || l.name)} title={l.company || l.name} sub={`${l.contactPerson || l.name} \u00B7 ${l.serviceRequired} enquiry \u00B7 Lead Record \u00B7 ${l.leadCode}`} status={stageLabel(l.status)} right={<button className="outline-button" onClick={() => setFu(true)}><Icon name="pencil" size={14} /> Log follow-up</button>} />
    <Tabs tabs={['Overview', 'Follow-ups', 'Proposal', 'Activity']} v={tab} on={setTab} />
    <div className="columns"><div><Panel title={tab === 'Overview' ? 'Record Information' : tab}>
      {tab === 'Overview' && <Info f={[['Lead Source', l.source], ['Assigned Salesperson', owner], ['Interested Service', l.serviceRequired], ['Next Follow-up', fmtD(log[l.id]?.next || l.followUpDate)], ['Lead Stage', stageLabel(l.status)], ['Created', fmtD(l.createdAt?.slice(0, 10))], ['Phone', l.phone], ['Email', l.email], ['Estimated Value', inrF(l.estimatedValue || 0)], ['Priority', l.priority]]} />}
      {tab === 'Follow-ups' && <Rows items={(log[l.id]?.log || []).map((x) => [x.note, `${x.by} \u00B7 ${x.at}`, 'Logged'])} empty="No follow-ups logged yet." />}
      {tab === 'Proposal' && <Rows items={props.filter((p: any) => String(p.client || '').toLowerCase().includes((l.company || l.name).toLowerCase())).map((p: any) => [p.code, `${p.service || ''} \u00B7 ${inrF(Number(p.value) || 0)}`, p.status])} empty="No proposal for this lead yet." />}
      {tab === 'Activity' && <Rows items={audit.map((a) => [a.action.replace(/_/g, ' '), `${a.userName} \u00B7 ${a.date} ${a.time}`, 'Recorded'])} empty="No recorded activity yet." />}
    </Panel>
      <Panel title="Related Actions" right={<span className="muted">Role-restricted</span>} style={{ marginTop: 16 }}><div className="role-guide">
        <button className="outline-button" onClick={() => setFu(true)}>Create follow-up</button><button className="outline-button" onClick={() => setActiveTab('inbox')}>Open messages</button><button className="outline-button" onClick={() => setActiveTab('proposals')}>Prepare proposal</button>{osCanAccess(currentRole, 'deals_quotations') && <button className="outline-button" onClick={() => setActiveTab('deals_quotations')}>Create quotation</button>}</div></Panel></div>
      <Panel title="Notes" right={<span className="muted">From lead record</span>}><p style={{ fontSize: 12, color: '#475467', margin: 0, whiteSpace: 'pre-wrap' }}>{l.notes || 'No notes.'}</p>
        <Notice style={{ marginTop: 12, marginBottom: 0 }}>Changes to important fields keep who changed them, when, and why.</Notice></Panel></div>
    {fu && <FollowModal leadId={l.id} onClose={() => setFu(false)} />}
  </>);
};

export const ClientProfile: React.FC = () => {
  const { clients, employees, projects, tasks, invoices, payments, agreements, currentRole, setActiveTab } = useApp();
  const [id, setId] = useSel('client', clients[0]?.id); const [tab, setTab] = useState('Overview');
  const c = clients.find((x) => x.id === id) || clients[0];
  const docs = readKey<any[]>('paa_x_documents', []);
  const audit = useAuditFor([c?.clientCode, c?.companyName]);
  if (!c) return <Notice>No clients yet.</Notice>;
  const billing = osCanAccess(currentRole, 'billing');
  const inv = invoices.filter((i) => i.clientId === c.id); const pj = projects.filter((p) => p.clientId === c.id);
  const ag = agreements.filter((a) => a.clientId === c.id && a.status === 'active')[0];
  return (<>
    <Picker label="Client" value={c.id} onChange={setId} options={clients.map((x) => [x.id, `${x.clientCode} \u00B7 ${x.companyName}`])} />
    <Banner logo={initials(c.companyName)} title={c.companyName} sub={`Agency client \u00B7 ${c.services.join(', ') || 'No services yet'} \u00B7 Client Record \u00B7 ${c.clientCode}`} status={c.status} />
    <Tabs tabs={['Overview', 'Services', 'Projects', 'Tasks', 'Documents', billing ? 'Billing' : 'Billing (restricted)', 'Activity']} v={tab} on={setTab} />
    <div className="columns"><div><Panel title={tab === 'Overview' ? 'Record Information' : tab}>
      {tab === 'Overview' && <Info f={[['Client ID', c.clientCode], ['Account Manager', employees.find((e) => e.id === c.accountManagerId)?.name], ['Services', c.services.join(', ')], ['Agreement', ag ? `${ag.agreementNumber} (active)` : 'None active'], ['Next Renewal', fmtD(ag?.renewalDate || ag?.endDate)], ['Contact', `${c.contactPerson} \u00B7 ${c.phone}`], ['Email', c.email], ['GSTIN', c.gstNumber]]} />}
      {tab === 'Services' && <div className="service-tags">{c.services.length ? c.services.map((s) => <span key={s}>{s}</span>) : <span>No services recorded</span>}</div>}
      {tab === 'Projects' && <Rows items={pj.map((p) => [p.name, `${p.projectCode} \u00B7 due ${fmtD(p.endDate)}`, p.status])} empty="No projects." onClick={(i) => openRecord('project', pj[i].id, setActiveTab, 'project-profile')} />}
      {tab === 'Tasks' && <Rows items={tasks.filter((k) => k.clientId === c.id || pj.some((p) => p.id === k.projectId)).map((k) => [k.title, `${employees.find((e) => e.id === k.assignedEmployeeId)?.name || ''} \u00B7 due ${fmtD(k.dueDate)}`, k.status.replace('_', ' ')])} empty="No tasks." />}
      {tab === 'Documents' && <Rows items={docs.filter((d) => String(d.partyName || '').toLowerCase().includes(c.companyName.toLowerCase().slice(0, 8))).map((d) => [d.title, `${d.docDate || ''} \u00B7 ${d.createdBy || ''}`, d.status])} empty="No documents for this client yet." />}
      {tab.startsWith('Billing') && (billing ? <Rows items={[...inv.map((i): [string, string, string] => [i.invoiceNumber, `${inrF(i.totalAmount)} \u00B7 balance ${inrF(i.balanceAmount)} \u00B7 due ${fmtD(i.dueDate)}`, i.status.replace('_', ' ')]), ...payments.filter((p) => p.clientId === c.id).map((p): [string, string, string] => [p.paymentCode, `${inrF(p.amount)} \u00B7 ${p.paymentMethod} \u00B7 ${fmtD(p.date)}`, 'Verified'])]} empty="No billing yet." />
        : <Notice icon="lock">This tab is not available to your role.</Notice>)}
      {tab === 'Activity' && <Rows items={audit.map((a) => [a.action.replace(/_/g, ' '), `${a.userName} \u00B7 ${a.date} ${a.time}`, 'Recorded'])} empty="No recorded activity yet." />}
    </Panel>
      <Panel title="Related Actions" right={<span className="muted">Role-restricted</span>} style={{ marginTop: 16 }}><div className="role-guide">
        {osCanAccess(currentRole, 'projects') && <button className="outline-button" onClick={() => setActiveTab('projects')}>Create project</button>}<button className="outline-button" onClick={() => setActiveTab('onboarding')}>Onboarding checklist</button>{osCanAccess(currentRole, 'deals_agreements') && <button className="outline-button" onClick={() => setActiveTab('deals_agreements')}>View agreement</button>}</div></Panel></div>
      <Panel title="Account summary" right={<span className="muted">Live</span>}><Rows items={[['Projects', `${pj.filter((p) => p.status === 'active').length} active of ${pj.length}`, pj.length ? 'Active' : 'None'], ...(billing ? [['Billed', inrF(inv.reduce((s, i) => s + i.totalAmount, 0)), 'Billing'] as [string, string, string], ['Outstanding', inrF(inv.reduce((s, i) => s + i.balanceAmount, 0)), inv.some((i) => i.balanceAmount > 0 && i.dueDate < today()) ? 'Overdue' : 'On Track'] as [string, string, string]] : [])]} /></Panel></div>
  </>);
};

export const ProjectProfile: React.FC = () => {
  const { projects, tasks, employees, clients, currentRole, currentUser, setActiveTab } = useApp();
  const list = isStaffRole(currentRole) ? projects.filter((p) => p.assignedEmployeeIds?.includes(currentUser.id) || tasks.some((k) => k.projectId === p.id && k.assignedEmployeeId === currentUser.id)) : projects;
  const [id, setId] = useSel('project', list[0]?.id); const [tab, setTab] = useState('Overview');
  const p = list.find((x) => x.id === id) || list[0];
  const [dl] = useRecords<any>('deliverables');
  const audit = useAuditFor([p?.projectCode, p?.name]);
  if (!p) return <Notice>No projects yet.</Notice>;
  const pt = tasks.filter((k) => k.projectId === p.id); const done = pt.filter((k) => k.status === 'completed').length;
  const cl = clients.find((c) => c.id === p.clientId); const name = (eid: string) => employees.find((e) => e.id === eid)?.name || '\u2014';
  return (<>
    <Picker label="Project" value={p.id} onChange={setId} options={list.map((x) => [x.id, `${x.projectCode} \u00B7 ${x.name}`])} />
    <Banner logo={initials(p.name)} title={p.name} sub={`${cl?.companyName || 'Internal'} \u00B7 Project Record \u00B7 ${p.projectCode}`} status={p.status.replace('_', ' ')} />
    <Tabs tabs={['Overview', 'Tasks', 'Deliverables', 'Milestones', 'Team', 'Activity']} v={tab} on={setTab} />
    <div className="columns"><Panel title={tab === 'Overview' ? 'Record Information' : tab}>
      {tab === 'Overview' && <Info f={[['Client', cl?.companyName], ['Project Manager', name(p.projectManagerId)], ['Start Date', fmtD(p.startDate)], ['Due Date', fmtD(p.endDate)], ['Status', p.status], ['Priority', p.priority], ['Progress', `${done} of ${pt.length} tasks done`], ['Budget', FULL_ACCESS.includes(currentRole) ? inrF(p.budget) : 'Restricted']]} />}
      {tab === 'Tasks' && <Rows items={pt.map((k) => [k.title, `${name(k.assignedEmployeeId)} \u00B7 due ${fmtD(k.dueDate)}`, k.status.replace('_', ' ')])} empty="No tasks." />}
      {tab === 'Deliverables' && <Rows items={dl.filter((d: any) => d.client === cl?.companyName).map((d: any) => [d.name, `${d.assignee || ''} \u00B7 ${d.step || ''} \u00B7 v${d.version || 1}`, d.status])} empty="No deliverables logged for this client." />}
      {tab === 'Milestones' && <Rows items={[...pt].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')).map((k) => [fmtD(k.dueDate) + ' \u00B7 ' + k.title, name(k.assignedEmployeeId), k.status === 'completed' ? 'Completed' : k.dueDate < today() ? 'Overdue' : 'Scheduled'])} empty="No milestones." />}
      {tab === 'Team' && <Rows items={Array.from(new Set([p.projectManagerId, ...(p.assignedEmployeeIds || []), ...pt.map((k) => k.assignedEmployeeId)])).filter(Boolean).map((eid) => [name(eid), eid === p.projectManagerId ? 'Project Manager' : `${pt.filter((k) => k.assignedEmployeeId === eid).length} task(s)`, 'Active'])} />}
      {tab === 'Activity' && <Rows items={audit.map((a) => [a.action.replace(/_/g, ' '), `${a.userName} \u00B7 ${a.date} ${a.time}`, 'Recorded'])} empty="No recorded activity yet." />}
    </Panel>
      <Panel title="Delivery health" right={<span className="muted">Live</span>}>
        <div className="progress" style={{ marginBottom: 12 }}><span style={{ width: `${pt.length ? (done / pt.length) * 100 : 0}%` }} /></div>
        <Rows items={[['Completed', `${done} task(s)`, 'Completed'], ['In progress', `${pt.filter((k) => k.status === 'in_progress').length} task(s)`, 'In Progress'], ['Overdue', `${pt.filter((k) => k.status !== 'completed' && k.dueDate < today()).length} task(s)`, pt.some((k) => k.status !== 'completed' && k.dueDate < today()) ? 'Overdue' : 'On Track']]} />
        <div className="role-guide">{osCanAccess(currentRole, 'task_operations') && <button className="outline-button" onClick={() => setActiveTab('task_operations')}>Assign task</button>}<button className="outline-button" onClick={() => setActiveTab('deliverables')}>Upload deliverable</button></div></Panel></div>
  </>);
};

export const EmployeeProfile: React.FC = () => {
  const { employees, tasks, attendance, departments, designations, currentRole } = useApp();
  const [id, setId] = useSel('employee', employees[0]?.id); const [tab, setTab] = useState('Overview');
  const e = employees.find((x) => x.id === id) || employees[0];
  const [weekly] = useWeekly(); const audit = useAuditFor([e?.employeeId, e?.name]);
  if (!e) return <Notice>No employees yet.</Notice>;
  const mt = tasks.filter((k) => k.assignedEmployeeId === e.id);
  const mgr = employees.find((x) => x.id === e.reportingManagerId)?.name;
  return (<>
    <Picker label="Employee" value={e.id} onChange={setId} options={employees.map((x) => [x.id, `${x.employeeId} \u00B7 ${x.name}`])} />
    <Banner logo={initials(e.name)} title={e.name} sub={`${designations.find((d) => d.id === e.designationId)?.title || e.designationId} \u00B7 ${departments.find((d) => d.id === e.departmentId)?.name || ''} \u00B7 Employee Record \u00B7 ${e.employeeId}`} status={e.status} />
    <Tabs tabs={['Overview', 'Tasks', 'Attendance', 'Work Reports', 'HR Documents (restricted)', 'Activity']} v={tab} on={setTab} />
    <Panel title={tab === 'Overview' ? 'Record Information' : tab}>
      {tab === 'Overview' && <Info f={[['Department', departments.find((d) => d.id === e.departmentId)?.name], ['Reports To', mgr], ['Employment Type', e.employmentType], ['Join Date', fmtD(e.joiningDate)], ['System Role', roleLabel(e.role)], ['Work Mode', e.workMode], ['Email', e.email], ['Phone', e.phone]]} />}
      {tab === 'Tasks' && <Rows items={mt.map((k) => [k.title, `due ${fmtD(k.dueDate)}`, k.status.replace('_', ' ')])} empty="No tasks." />}
      {tab === 'Attendance' && <Rows items={attendance.filter((a) => a.employeeId === e.id).slice(0, 10).map((a) => [fmtD(a.date), `${a.checkIn || '\u2014'} \u2192 ${a.checkOut || '\u2014'} \u00B7 ${a.workingHours || 0} h`, a.status.replace('_', ' ')])} empty="No attendance records." />}
      {tab === 'Work Reports' && <Rows items={weekly.filter((w) => w.employeeId === e.id).map((w) => [`Week ending ${fmtD(w.weekEnding)}`, w.summary.slice(0, 70), w.status])} empty="No weekly reports." />}
      {tab.startsWith('HR Documents') && (FULL_ACCESS.includes(currentRole) || currentRole === 'hr' ? <Notice icon="folder">Open HR documents for {e.name} in <b>Onboarding & Contracts</b> or the <b>Document Library</b>.</Notice> : <Notice icon="lock">This tab is not available to your role.</Notice>)}
      {tab === 'Activity' && <Rows items={audit.map((a) => [a.action.replace(/_/g, ' '), `${a.userName} \u00B7 ${a.date} ${a.time}`, 'Recorded'])} empty="No recorded activity yet." />}
    </Panel>
  </>);
};

// ============ CLIENT ONBOARDING ============
const STEPS: [string, string][] = [['Lead marked Won', 'Sales handover and client verification'], ['Agreement accepted', 'Terms, deliverables and validity checked'], ['Advance verified', 'Independent payment verification required'], ['Client record confirmed', 'Contact, billing and key stakeholders'], ['Project generated', 'Create service project and deadlines'], ['Team allocated', 'Manager, lead and specialists assigned'], ['Kickoff approved', 'Begin service work; exceptions require Founder approval']];
export const OnboardingPage: React.FC = () => {
  const { clients, agreements, payments, projects, employees, currentUser, currentRole } = useApp();
  const [id, setId] = useSel('client', clients[0]?.id);
  const [state, setState] = useShared<Record<string, boolean[]>>('paa_x_os_onboarding', {});
  const [, setFin] = useFinRequests(); const [fin] = useFinRequests();
  const c = clients.find((x) => x.id === id) || clients[0];
  if (!c) return <Notice>No clients yet.</Notice>;
  const auto = [!!c.convertedFromLeadId || true, agreements.some((a) => a.clientId === c.id && a.status !== 'terminated'), payments.some((p) => p.clientId === c.id), !!(c.email && c.phone && c.billingAddress), projects.some((p) => p.clientId === c.id), projects.some((p) => p.clientId === c.id && (p.assignedEmployeeIds || []).length > 0), false];
  const manual = state[c.id] || [];
  const done = STEPS.map((_, i) => manual[i] ?? auto[i]);
  const exception = fin.find((f) => f.category === 'Client Work Exception' && f.title.includes(c.clientCode) && f.status === 'Approved');
  const blocked = !(done[1] && done[2]) && !exception;
  const toggle = (i: number) => { if (i === 6 && blocked) return toast('Agreement and advance must be verified first, or ask the Founder for an exception.'); setState((p) => { const cur = STEPS.map((_, j) => (p[c.id]?.[j] ?? auto[j])); cur[i] = !cur[i]; return { ...p, [c.id]: cur }; }); };
  const proj = projects.find((p) => p.clientId === c.id);
  return (<>
    <Picker label="Client" value={c.id} onChange={setId} options={clients.map((x) => [x.id, `${x.clientCode} \u00B7 ${x.companyName}`])} />
    <div className="columns"><Panel title="Onboarding Checklist" right={<Pill v={`${done.filter(Boolean).length} of 7 steps`} />}>
      <div className="step-list">{STEPS.map((s, i) => <div key={i} className="step"><button className={`os-check ${done[i] ? 'on' : ''}`} onClick={() => toggle(i)} title="Mark done / not done">{done[i] ? <Icon name="check" size={15} /> : <span style={{ color: '#0B1738', fontSize: 11, fontWeight: 800 }}>{pad2(i + 1)}</span>}</button><div style={{ flex: 1 }}><b>{s[0]}</b><p>{s[1]}</p></div><Pill v={done[i] ? 'Completed' : 'Pending'} /></div>)}</div></Panel>
      <Panel title="Client Activation Record"><div className="form-grid">{[['Client Name', c.companyName], ['Service Package', c.services.join(', ') || '\u2014'], ['Assigned Manager', employees.find((e) => e.id === c.accountManagerId)?.name || '\u2014'], ['Agreement ID', agreements.find((a) => a.clientId === c.id)?.agreementNumber || 'Not yet'], ['Project', proj ? `${proj.projectCode} \u00B7 ${proj.name}` : 'Not yet']].map(([k, v]) => <div key={k} className="form-group wide"><label>{k}</label><input value={v} readOnly /></div>)}</div>
        <div className="notice" style={{ marginTop: 20 }}><Icon name="lock" size={18} /><div><strong>Work-start guardrail</strong>{blocked ? 'Work cannot start: agreement accepted and advance verified are both required. The Founder can allow a documented exception.' : exception ? `Founder exception approved (${exception.code}).` : 'Agreement and advance verified \u2014 work can start.'}
          {blocked && <div style={{ marginTop: 10 }}><button className="soft-button" onClick={() => { setFin((p) => [newFinRequest('Client Work Exception', `Start work for ${c.clientCode} ${c.companyName} before agreement/advance`, 0, { id: currentUser.id, name: currentUser.name }), ...p]); toast('Exception request sent to the Founder'); }}>Request Founder exception</button></div>}</div></div>
        {FULL_ACCESS.includes(currentRole) && <p className="tiny-note">Tick boxes to override any automatic step.</p>}</Panel></div>
  </>);
};

// ============ SERVICES (29 specialties) ============
export const ServicesPage: React.FC = () => {
  const { employees, currentRole } = useApp();
  const [seats, setSeats] = useShared<Record<string, { seats: string[]; off?: boolean }>>('paa_x_os_seats', {});
  const can = FULL_ACCESS.includes(currentRole) || ['manager', 'operations_manager', 'hr'].includes(currentRole);
  const act = employees.filter((e) => e.status === 'active');
  const set = (sv: string, i: number, v: string) => setSeats((p) => { const cur = p[sv]?.seats?.slice() || ['', '']; cur[i] = v; return { ...p, [sv]: { ...p[sv], seats: cur } }; });
  return (<>
    <Notice icon="users" title="Staffing foundation">29 service specialties, each with two planned seats under its team lead. Vacant seats stay unassigned until someone is hired. Roles and services are independent: an employee can hold a role and work in one or more services.</Notice>
    <div className="doc-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>{Object.entries(TEAM_LEADS).map(([lead, title]) => { const list = SERVICES.filter((s) => s[2] === lead);
      return (<div key={lead} className="card panel"><div className="panel-title"><h3>{title}</h3><span className="pill gray">{list.length} specialties</span></div>
        <div style={{ display: 'grid', gap: 9 }}>{list.map(([sv, name]) => { const s = seats[sv] || { seats: ['', ''] }; return (
          <div key={sv} style={{ border: '1px solid var(--line)', borderRadius: 9, padding: 11, opacity: s.off ? 0.55 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 9 }}><b style={{ fontSize: 11 }}>{sv} {'\u00B7'} {name}</b>
              {can ? <button className="outline-button os-mini" onClick={() => setSeats((p) => ({ ...p, [sv]: { ...(p[sv] || { seats: ['', ''] }), off: !s.off } }))}>{s.off ? 'Inactive' : 'Active'}</button> : <span className="muted">{s.off ? 'Inactive' : '2 seats'}</span>}</div>
            <div className="slot-grid">{[0, 1].map((i) => <div key={i} className="slot os-seat"><span><b>Seat 0{i + 1}</b> {'\u00B7'} {s.seats?.[i] ? employees.find((e) => e.id === s.seats[i])?.name : 'Vacant'}</span>
              {can && <select value={s.seats?.[i] || ''} onChange={(e) => set(sv, i, e.target.value)}><option value="">Vacant</option>{act.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>}</div>)}</div></div>); })}</div></div>);
    })}</div>
  </>);
};

// ============ TEAM CAPACITY ============
export const CapacityPage: React.FC = () => {
  const { employees, tasks, departments } = useApp(); const t = today();
  const [seats] = useShared<Record<string, { seats: string[] }>>('paa_x_os_seats', {});
  const rows = employees.filter((e) => e.status === 'active').map((e) => { const m = tasks.filter((k) => k.assignedEmployeeId === e.id && k.status !== 'completed'); const next = m.map((k) => k.dueDate).filter(Boolean).sort()[0];
    const svc = SERVICES.filter(([sv]) => seats[sv]?.seats?.includes(e.id)).map((s) => s[1]); return { e, open: m.length, prog: m.filter((k) => k.status === 'in_progress').length, late: m.filter((k) => k.dueDate && k.dueDate < t).length, next, svc }; });
  return (<>
    <div className="stat-strip"><div className="card mini-stat"><b>{SERVICES.length * 2}</b><small>Planned service seats</small></div><div className="card mini-stat"><b>{Object.values(seats).reduce((s, x) => s + (x.seats || []).filter(Boolean).length, 0)}</b><small>Seats filled</small></div><div className="card mini-stat"><b>{rows.filter((r) => r.open >= 5).length}</b><small>People at capacity</small></div></div>
    <DataTable rows={rows} filters={['At capacity', 'Available']}
      cols={[{ h: 'Employee', v: (r) => r.e.name }, { h: 'Department', v: (r) => departments.find((d) => d.id === r.e.departmentId)?.name || '\u2014' }, { h: 'Services', v: (r) => r.svc.join(', ') || '\u2014', wrap: true }, { h: 'Open Tasks', v: (r) => r.open }, { h: 'In Progress', v: (r) => r.prog }, { h: 'Overdue', v: (r) => r.late }, { h: 'Next Deadline', v: (r) => fmtD(r.next) }, { h: 'Availability', v: (r) => <Pill v={r.open >= 5 ? 'At capacity' : r.open >= 3 ? 'Busy' : 'Available'} />, s: (r) => (r.open >= 5 ? 'At capacity' : r.open >= 3 ? 'Busy' : 'Available') }]} />
  </>);
};

// ============ ORGANIZATION FAMILY TREE ============
// old tree kept (replaced by OrgStructurePage in Part 25)
export const HierarchyPage: React.FC = () => {
  const { employees } = useApp();
  const who = (roles: string[]) => employees.filter((e) => roles.includes(e.role) && e.status !== 'inactive');
  const People: React.FC<{ roles: string[] }> = ({ roles }) => <>{who(roles).map((e) => <span key={e.id} className="org-person">{e.name}</span>)}</>;
  const dept: [string, [string, string[]][]][] = [
    ['Human Resources', [['HR Manager', ['hr']], ['Recruitment Executives \u00D72', []], ['HR Executives \u00D72', []]]],
    ['Accounts & Finance', [['Accounts & Finance Manager', ['finance']], ['Accountants \u00D72', []], ['Billing Executives \u00D72', []]]],
    ['Sales & Growth', [['Sales Manager', ['sales_manager']], ['Sales Team Lead', []], ['Sales Executives / Telecallers', ['sales_executive']]]],
    ['Client Relationships', [['Client Relationship Manager', ['client_relationship_manager']], ['Client Support Executives \u00D72', []]]],
    ['Operations & Projects', [['Operations Manager', ['operations_manager']], ['Project Managers / Coordinators', ['project_manager']], ['Team Leaders', ['team_leader']]]],
    ['Service Delivery Teams', Object.entries(TEAM_LEADS).map(([k, v]) => [`${v} / ${SERVICES.filter((s) => s[2] === k).length} specialties`, []])],
  ];
  return (<>
    <div className="card panel" style={{ padding: 25 }}>
      <div className="org-root"><b>Founder / Owner</b><small>Super Admin {'\u00B7'} All system access</small><div style={{ marginTop: 6 }}>{who(['super_admin', 'admin']).map((e) => <span key={e.id} className="org-person" style={{ background: '#ffffff22', color: '#fff' }}>{e.name}</span>)}</div></div>
      <div className="org-line" />
      <div className="org-manager">General Manager<br /><small style={{ fontSize: 10, color: '#97793B' }}>Operations only {'\u00B7'} No private finance</small><div><People roles={['manager']} /></div></div>
      <div className="org-line" />
      <div className="org-depts">{dept.map(([d, rows]) => <div key={d} className="card org-dept"><strong>{d}</strong><div className="dept-line" />{rows.map(([r, roles]) => <div key={r}><p>{'\u2022'} {r}</p>{roles.length > 0 && <div style={{ marginLeft: 10 }}><People roles={roles} /></div>}</div>)}</div>)}</div>
      <div className="org-depts" style={{ marginTop: 13 }}><div className="card org-dept"><strong>Employees / Specialists</strong><div className="dept-line" /><People roles={['employee']} /></div><div className="card org-dept"><strong>External / Limited Users</strong><div className="dept-line" /><p>{'\u2022'} Freelancer / Contractor</p><People roles={['freelancer']} /><p>{'\u2022'} Auditor (restricted)</p><People roles={['auditor']} /></div></div>
    </div>
    <Notice icon="shield" title="Organizational rank is not system access." style={{ marginTop: 16 }}>Department heads are peer roles. Accounts & Finance report directly to the Founder for confidential matters even when daily operations are coordinated by the General Manager. Change someone's role in Users & Accounts.</Notice>
  </>);
};

// ============ PERMISSION MATRIX ============
export const PermissionsPage: React.FC = () => {
  const { currentRole, logAudit } = useApp();
  const [, force] = useState(0);
  const [saved, setSaved] = useShared<Record<string, number[]>>(OS_PERM_KEY, {});
  const m = useMemo(() => readMatrix(), [saved]); // eslint-disable-line react-hooks/exhaustive-deps
  const canEdit = currentRole === 'super_admin';
  const toggle = (r: string, j: number) => { if (!canEdit || r === 'super_admin') return; const row = m[r].slice(); row[j] = row[j] ? 0 : 1; setSaved((p) => ({ ...p, [r]: row })); logAudit('PERMISSION_CHANGED', roleLabel(r), `${MODULES[j]} -> ${row[j] ? 'Yes' : 'No'}`); toast(`${roleLabel(r)} \u00B7 ${MODULES[j]} \u2192 ${row[j] ? 'Yes' : 'No'}`); force((x) => x + 1); };
  const exp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ system: 'Priority Ads Agency OS', modules: MODULES, roles: Object.fromEntries(OS_ROLES.map((r) => [r.label, m[r.id]])), exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' })); a.download = 'AgencyOS_Permissions.json'; a.click(); };
  return (<>
    <Notice icon="shield" title="Live permission switches">Click Yes / No to switch a module ON or OFF for a role. It works immediately for everyone with that role on this computer. Founder permissions are locked. Only the Founder / Super Admin can change access.</Notice>
    <div className="card"><div className="toolbar"><div className="toolbar-left"><b style={{ fontSize: 13 }}>Role {'\u00D7'} Module Access</b><span className="muted">{OS_ROLES.length} roles {'\u00B7'} {MODULES.length} module categories</span></div>
      <div className="actions">{canEdit && <button className="outline-button" onClick={() => { if (confirm('Reset all roles to the recommended defaults?')) { setSaved({}); logAudit('PERMISSIONS_RESET', 'All roles'); } }}>Reset Defaults</button>}<button className="primary-button" onClick={exp}><Icon name="download" size={14} /> Export JSON</button></div></div>
      <div className="matrix-wrap"><table className="matrix"><thead><tr><th>System Role</th>{MODULES.map((x) => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{OS_ROLES.map((r) => <tr key={r.id}><td>{r.label}</td>{MODULES.map((x, j) => { const on = m[r.id][j] === 1; const changed = (DEFAULT_MATRIX[r.id]?.[j] ?? 0) !== m[r.id][j];
          return <td key={x}><button className={`permission-toggle ${on ? 'yes' : 'no'} ${r.id === 'super_admin' || !canEdit ? 'locked' : ''}`} disabled={r.id === 'super_admin' || !canEdit} onClick={() => toggle(r.id, j)} title={changed ? 'Changed from default' : 'Default'} style={changed ? { outline: '2px solid #F5B82E' } : undefined}>{on ? 'Yes' : 'No'}</button></td>; })}</tr>)}</tbody></table></div></div>
    <div className="columns equal" style={{ marginTop: 16 }}><Panel title="How the switches work"><Rows items={[['Module switched ON (gold outline)', 'The role sees every screen of that module', 'Allowed'], ['Module switched OFF', 'All screens of that module disappear for the role', 'Denied'], ['Approve Expense Claims', 'Who can approve or reject employee claims', 'Restricted'], ['See All Expense Claims', "Without it a person sees only their own claims", 'Restricted']]} /></Panel>
      <Panel title="Non-negotiable separation"><Rows items={[['Founder', 'All actions and records', 'Allowed'], ['General Manager', 'Finance, payroll & owner documents', 'Denied'], ['Employees', 'Only allocated records', 'Restricted'], ['Audit trail', 'Every permission change is logged', 'Required']]} /></Panel></div>
  </>);
};
// ============ FINANCE ============
export const PaymentsPage: React.FC = () => {
  const { payments, invoices, clients } = useApp();
  const inst = readKey<any[]>('paa_x_installment_payments', []);
  const rows = [...payments.map((p) => ({ code: p.paymentCode, client: clients.find((c) => c.id === p.clientId)?.companyName || '\u2014', inv: invoices.find((i) => i.id === p.invoiceId)?.invoiceNumber || '\u2014', method: p.paymentMethod, ref: p.transactionRef, amount: p.amount, date: p.date })),
    ...inst.map((p) => ({ code: p.receiptNo, client: clients.find((c) => c.id === p.clientId)?.companyName || '\u2014', inv: 'Instalment', method: p.method || p.mode || '\u2014', ref: p.reference || '', amount: p.amount, date: p.date }))].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return (<>
    <div className="stat-strip"><div className="card mini-stat"><b>{inrS(rows.filter((r) => (r.date || '').startsWith(today().slice(0, 7))).reduce((s, r) => s + r.amount, 0))}</b><small>Received this month</small></div><div className="card mini-stat"><b>{rows.length}</b><small>Receipts recorded</small></div><div className="card mini-stat"><b>{inrS(rows.reduce((s, r) => s + r.amount, 0))}</b><small>Total received</small></div></div>
    <DataTable rows={rows} filters={['UPI', 'Bank Transfer', 'Cash']} top={<ExportBtn onClick={() => csv('payments', ['Receipt', 'Client', 'Invoice', 'Method', 'Reference', 'Amount', 'Date'], rows.map((r) => [r.code, r.client, r.inv, r.method, r.ref, r.amount, r.date]))} />}
      cols={[{ h: 'Receipt', v: (r) => r.code }, { h: 'Client', v: (r) => r.client }, { h: 'Invoice', v: (r) => r.inv }, { h: 'Method', v: (r) => r.method }, { h: 'Reference', v: (r) => r.ref || '\u2014' }, { h: 'Amount', v: (r) => inrF(r.amount) }, { h: 'Date', v: (r) => fmtD(r.date) }, { h: 'Status', v: () => <Pill v="Verified" /> }]} />
  </>);
};

export const ReceivablesPage: React.FC<{ openAddModal: (t: string, d?: any) => void }> = ({ openAddModal }) => {
  const { invoices, clients } = useApp(); const t = today();
  const rows = invoices.filter((i) => i.balanceAmount > 0 && i.status !== 'cancelled' && i.status !== 'draft').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const age = (d: string) => daysBetween(d, t);
  return (<>
    <div className="stat-strip"><div className="card mini-stat"><b>{inrS(rows.reduce((s, i) => s + i.balanceAmount, 0))}</b><small>Total outstanding</small></div><div className="card mini-stat"><b>{inrS(rows.filter((i) => i.dueDate < t).reduce((s, i) => s + i.balanceAmount, 0))}</b><small>Overdue</small></div><div className="card mini-stat"><b>{rows.filter((i) => age(i.dueDate) > 30).length}</b><small>Older than 30 days</small></div></div>
    <DataTable rows={rows} filters={['Overdue', 'Not due']}
      cols={[{ h: 'Client', v: (i) => clients.find((c) => c.id === i.clientId)?.companyName || '\u2014' }, { h: 'Invoice', v: (i) => i.invoiceNumber }, { h: 'Outstanding', v: (i) => inrF(i.balanceAmount) }, { h: 'Due Date', v: (i) => fmtD(i.dueDate) }, { h: 'Days Overdue', v: (i) => (age(i.dueDate) > 0 ? `${age(i.dueDate)} days` : 'Not due'), s: (i) => (age(i.dueDate) > 0 ? 'Overdue' : 'Not due') }, { h: 'Next Action', v: (i) => (age(i.dueDate) > 0 ? 'Call today' : `Remind ${fmtD(i.dueDate)}`) }, { h: 'Status', v: (i) => <Pill v={age(i.dueDate) > 0 ? 'Overdue' : 'Pending'} /> }]}
      actions={(i) => <span className="link" onClick={() => openAddModal('payment', { invoiceId: i.id })}>Record payment {'\u2192'}</span>} empty="No pending collections." />
  </>);
};

export const ExpensesPage: React.FC = () => {
  const { expenses, currentUser, currentRole, addExpense, logAudit, setActiveTab } = useApp();
  const [fin, setFin] = useFinRequests(); const [form, setForm] = useState<Record<string, any> | null>(null);
  const reqs = fin.filter((f) => f.category === 'Expense');
  const canPost = FULL_ACCESS.includes(currentRole) || currentRole === 'finance';
  const post = (f: typeof reqs[number]) => { const meta = (f as any).meta || {}; addExpense({ title: f.title.split(' | ')[0], category: meta.category || 'General', amount: f.amount, date: today(), notes: `Approved request ${f.code} by ${f.reviewer || ''}` } as any); setFin((p) => p.map((x) => (x.id === f.id ? { ...x, note: (x.note || '') + ' \u00B7 Posted' , status: 'Approved', posted: true } as any : x))); logAudit('EXPENSE_POSTED', f.code, inrF(f.amount)); toast('Posted to accounts'); };
  return (<>
    <Notice icon="receipt" title="Financial control workflow">Employee submits {'\u2192'} manager verifies {'\u2192'} Founder approves in the Approval Center {'\u2192'} Accounts posts it to the books {'\u2192'} audit trail saved. Staff travel/food claims go through <span className="link" onClick={() => setActiveTab('reimbursements')}>Expense Claims</span>.</Notice>
    <DataTable rows={reqs} filters={['Pending', 'Approved', 'Rejected']} top={<button className="primary-button" onClick={() => setForm({ category: 'Software' })}>+ Submit Expense</button>}
      cols={[{ h: 'Request ID', v: (f) => f.code }, { h: 'Expense', v: (f) => f.title.split(' | ')[0], wrap: true }, { h: 'Submitted By', v: (f) => f.requestedBy }, { h: 'Amount', v: (f) => inrF(f.amount) }, { h: 'Evidence', v: (f) => ((f as any).meta?.evidence ? 'Attached' : 'Missing') }, { h: 'Approval', v: (f) => <Pill v={(f as any).posted ? 'Posted' : f.status} />, s: (f) => f.status }]}
      actions={(f) => f.status === 'Approved' && !(f as any).posted && canPost ? <span className="link" onClick={() => post(f)}>Post to accounts</span> : <span className="muted">{f.status === 'Pending' ? 'Founder review' : f.reviewer || ''}</span>}
      empty="No expense requests yet." />
    <div style={{ marginTop: 16 }}><Panel title="Posted business expenses" right={<span className="muted">{expenses.length} entries {'\u00B7'} {inrF(expenses.reduce((s, e) => s + e.amount, 0))}</span>}>
      <Rows items={expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((e) => [`${e.expenseCode} \u00B7 ${e.title}`, `${e.category} \u00B7 ${fmtD(e.date)}`, inrF(e.amount)])} empty="No expenses posted." /></Panel></div>
    {form && <OsModal title="Submit expense for approval" onClose={() => setForm(null)} footer={<><button className="outline-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" onClick={() => { if (!form.title || !(Number(form.amount) > 0)) return toast('Enter the expense and amount'); const r: any = newFinRequest('Expense', form.title, Number(form.amount), { id: currentUser.id, name: currentUser.name }); r.meta = { category: form.category, evidence: form.evidence }; setFin((p) => [r, ...p]); setForm(null); toast('Sent to the Founder for approval'); }}>Submit</button></>}>
      <FormGrid value={form} onChange={setForm} fields={[{ k: 'title', label: 'Expense', required: true, wide: true }, { k: 'category', label: 'Category', type: 'select', options: ['Software', 'Office Rent', 'Utilities', 'Equipment', 'Marketing', 'Travel', 'Vendor Payment', 'Other'] }, { k: 'amount', label: 'Amount (\u20B9)', type: 'number', required: true }, { k: 'evidence', label: 'Bill / proof link or number', wide: true }]} />
    </OsModal>}
  </>);
};

export const ProfitabilityPage: React.FC = () => {
  const { clients, invoices, payments, expenses, projects } = useApp();
  const pool = readKey<any[]>('paa_x_client_reimb', []);
  const rows = clients.map((c) => { const billed = invoices.filter((i) => i.clientId === c.id && i.status !== 'cancelled').reduce((s, i) => s + i.subtotal, 0); const paid = payments.filter((p) => p.clientId === c.id).reduce((s, p) => s + p.amount, 0);
    const pids = projects.filter((p) => p.clientId === c.id).map((p) => p.id); const cost = expenses.filter((e) => e.projectId && pids.includes(e.projectId)).reduce((s, e) => s + e.amount, 0);
    const reimb = pool.filter((e) => e.clientId === c.id && e.type === 'out').reduce((s, e) => s + e.amount, 0);
    return { c, billed, paid, cost, reimb, contrib: billed - cost, margin: billed ? ((billed - cost) / billed) * 100 : 0 }; }).filter((r) => r.billed || r.cost);
  return (<DataTable rows={rows} filters={['Healthy', 'Low margin']} top={<ExportBtn onClick={() => csv('client_profitability', ['Client', 'Billed', 'Collected', 'Direct cost', 'Contribution', 'Margin %'], rows.map((r) => [r.c.companyName, r.billed, r.paid, r.cost, r.contrib, r.margin.toFixed(1)]))} />}
    cols={[{ h: 'Client', v: (r) => r.c.companyName }, { h: 'Billed Revenue', v: (r) => inrF(r.billed) }, { h: 'Collected', v: (r) => inrF(r.paid) }, { h: 'Direct Cost', v: (r) => inrF(r.cost) }, { h: 'Contribution', v: (r) => inrF(r.contrib) }, { h: 'Margin', v: (r) => `${r.margin.toFixed(1)}%` }, { h: 'Reimb. spent', v: (r) => inrF(r.reimb) }, { h: 'Trend', v: (r) => <Pill v={r.margin >= 40 ? 'Healthy' : 'Low margin'} />, s: (r) => (r.margin >= 40 ? 'Healthy' : 'Low margin') }]}
    empty="No billing yet. Direct cost = business expenses linked to the client's projects (excludes GST and client reimbursements)." />);
};

// ============ HR ============
export const WeeklyReportsPage: React.FC = () => {
  const { currentUser, currentRole, employees, tasks } = useApp();
  const [items, setItems] = useWeekly(); const [form, setForm] = useState<Record<string, any> | null>(null);
  const isMgr = !isStaffRole(currentRole);
  const list = isMgr && currentRole !== 'sales_manager' ? items : items.filter((w) => w.employeeId === currentUser.id);
  const fri = (() => { const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7)); return d.toISOString().slice(0, 10); })();
  const autoDone = tasks.filter((k) => k.assignedEmployeeId === currentUser.id && k.status === 'completed').length;
  return (<>
    <DataTable rows={list} filters={['Submitted', 'Approved', 'Rework']} top={<button className="primary-button" onClick={() => setForm({ weekEnding: fri, done: autoDone, blocked: 0 })}>+ Submit Weekly Report</button>}
      cols={[{ h: 'Employee', v: (w) => employees.find((e) => e.id === w.employeeId)?.name || '\u2014' }, { h: 'Week Ending', v: (w) => fmtD(w.weekEnding) }, { h: 'Tasks Complete', v: (w) => w.done }, { h: 'Blocked', v: (w) => w.blocked }, { h: 'Summary', v: (w) => w.summary.slice(0, 60), wrap: true }, { h: 'Manager Review', v: (w) => w.reviewer || 'Pending' }, { h: 'Status', v: (w) => <Pill v={w.status} />, s: (w) => w.status }]}
      actions={(w) => <span className="link" onClick={() => setForm({ ...w, view: true })}>Open {'\u2192'}</span>} empty="No weekly reports yet. Submit yours every Friday." />
    <p className="foot-note">Managers approve or send reports back for rework from the Approval Center.</p>
    {form && <OsModal title={form.view ? `Weekly report \u00B7 ${fmtD(form.weekEnding)}` : 'Submit weekly work report'} onClose={() => setForm(null)}
      footer={form.view ? <button className="outline-button" onClick={() => setForm(null)}>Close</button> : <><button className="outline-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" onClick={() => { if (!form.summary) return toast('Write a short summary of your week'); setItems((p) => [{ id: uid('wk'), employeeId: currentUser.id, weekEnding: form.weekEnding, done: Number(form.done) || 0, blocked: Number(form.blocked) || 0, summary: form.summary, plan: form.plan || '', status: 'Submitted', at: nowStamp() }, ...p]); setForm(null); toast('Weekly report submitted for review'); }}>Submit</button></>}>
      {form.view ? <><Info f={[['Employee', employees.find((e) => e.id === form.employeeId)?.name], ['Status', form.status], ['Tasks complete', form.done], ['Blocked', form.blocked], ['Reviewer', form.reviewer], ['Review note', form.reviewNote]]} /><p style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}><b>Summary:</b> {form.summary}</p><p style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}><b>Next week:</b> {form.plan || '\u2014'}</p></>
        : <FormGrid value={form} onChange={setForm} fields={[{ k: 'weekEnding', label: 'Week ending', type: 'date' }, { k: 'done', label: 'Tasks completed', type: 'number' }, { k: 'blocked', label: 'Tasks blocked', type: 'number' }, { k: 'summary', label: 'What did you complete? (proof links welcome)', type: 'textarea', required: true }, { k: 'plan', label: 'Plan for next week', type: 'textarea' }]} />}
    </OsModal>}
  </>);
};

// ============ DOCUMENTS ============
export const TemplatesPage: React.FC = () => {
  const { setActiveTab } = useApp();
  return (<>{(Object.keys(CAT_LABEL) as (keyof typeof CAT_LABEL)[]).map((cat) => { const list = TEMPLATES.filter((t) => t.cat === cat); if (!list.length) return null;
    return (<div key={cat} style={{ marginBottom: 18 }}><div className="nav-heading" style={{ padding: '4px 2px 10px' }}>{CAT_LABEL[cat]}</div><div className="doc-grid">{list.map((t) => <div key={t.id} className="card doc-card"><div className="doc-icon"><Icon name="file" size={19} /></div><b>{t.name}</b><small>{t.desc}</small><small>{t.signable ? 'E-signature \u00B7 ' : ''}Letterhead locked {'\u00B7'} {t.fields.length} fields</small>
      <button className="outline-button" style={{ marginTop: 'auto', alignSelf: 'start' }} onClick={() => { sessionStorage.setItem('paa_x_os_new_doc', t.id); setActiveTab('document_center'); }}>Use Template <Icon name="arrow" size={12} /></button></div>)}</div></div>); })}
    <Notice icon="shield" title="Document isolation">Personal HR files, payroll, bank documents and founder-only files are never shown to the General Manager just because they have operating authority.</Notice></>);
};

export const SignaturesPage: React.FC = () => {
  const { setActiveTab } = useApp();
  const [docs] = useShared<any[]>('paa_x_documents', []);
  const label: Record<string, string> = { draft: 'Draft', partially_signed: 'Awaiting Signature', signed: 'Completed', final: 'Issued', stored: 'Stored' };
  return (<DataTable rows={docs} filters={['Awaiting Signature', 'Completed', 'Issued', 'Draft']}
    cols={[{ h: 'Document', v: (d) => d.title }, { h: 'Related To', v: (d) => d.partyName || '\u2014' }, { h: 'Issued By', v: (d) => d.createdBy || '\u2014' }, { h: 'Date', v: (d) => fmtD(d.docDate) }, { h: 'Agency Signed', v: (d) => (d.agencySig ? 'Yes' : 'No') }, { h: 'Party Signed', v: (d) => (d.partySig ? 'Yes' : 'No') }, { h: 'Signed Copy', v: (d) => (d.files?.length ? 'Uploaded' : 'Pending') }, { h: 'Status', v: (d) => <Pill v={label[d.status] || d.status} />, s: (d) => label[d.status] || d.status }]}
    actions={() => <span className="link" onClick={() => setActiveTab('document_center')}>Open {'\u2192'}</span>} empty="No documents yet. Create one from the Template Library." />);
};

// ============ ADMIN ============
export const SecurityPage: React.FC = () => {
  const { employees, setActiveTab } = useApp();
  const log = readKey<any[]>(LOGIN_LOG_KEY, []); const resets = readKey<any[]>(RESET_KEY, []);
  const fails = log.filter((l) => !l.ok);
  return (<>
    <div className="kpis"><Kpi name="Logins Today" value={String(log.filter((l) => l.ok && String(l.at).includes(new Date().toLocaleDateString('en-IN'))).length).padStart(2, '0')} desc="Successful sign-ins" icon="user" /><Kpi name="Failed Attempts" value={String(fails.length).padStart(2, '0')} desc="5 wrong = 15-minute lock" icon="lock" /><Kpi name="Reset Requests" value={String(resets.filter((r) => r.status === 'open').length).padStart(2, '0')} desc="Waiting for HR / Admin" icon="bell" /><Kpi name="Disabled Accounts" value={String(employees.filter((e) => e.status === 'inactive').length).padStart(2, '0')} desc="Cannot sign in" icon="shield" /></div>
    <div className="columns equal"><Panel title="Account protections"><Rows items={[['Separate login for every user', 'Email / Employee ID + own password', 'Active'], ['Forced password change', 'On first login and after reset', 'Active'], ['Lockout', '5 wrong passwords = 15 minutes', 'Active'], ['Privileged role changes', 'Founder only', 'Restricted'], ['Two-factor (MFA)', 'Needs the backend server', 'Pending']]} /></Panel>
      <Panel title="Financial & document safeguards"><Rows items={[['Approval history', 'Who, when, what, why', 'Active'], ['Posted entries', 'Deletes are recorded in the audit trail', 'Active'], ['Protected documents', 'Role-based screens', 'Active'], ['Backups', 'Download full backup from Backups & Recovery', 'Active'], ['Server-side enforcement', 'Arrives with the backend', 'Pending']]} /></Panel></div>
    <DataTable rows={log} filters={['wrong password', 'inactive']} top={<button className="outline-button" onClick={() => setActiveTab('access_admin')}>Manage users</button>}
      cols={[{ h: 'Time', v: (l) => l.at }, { h: 'User', v: (l) => l.name }, { h: 'Role', v: (l) => roleLabel(l.role) }, { h: 'Result', v: (l) => <Pill v={l.ok ? 'Allowed' : 'Denied'} />, s: (l) => (l.ok ? 'Allowed' : 'Denied ' + (l.reason || '')) }, { h: 'Reason', v: (l) => l.reason || '\u2014' }]} empty="No logins recorded yet." />
  </>);
};

export const BackupsPage: React.FC = () => {
  const { logAudit } = useApp();
  const [last, setLast] = useShared<string>('paa_x_os_last_backup', '');
  const file = useRef<HTMLInputElement>(null);
  const keys = () => Object.keys(localStorage).filter((k) => k.startsWith('paa'));
  const download = () => { const data: Record<string, string | null> = {}; keys().forEach((k) => { data[k] = localStorage.getItem(k); }); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ system: 'Priority Ads Agency OS', at: new Date().toISOString(), data }, null, 1)], { type: 'application/json' })); a.download = `AgencyOS_Backup_${today()}.json`; a.click(); setLast(nowStamp()); logAudit('BACKUP_DOWNLOADED', `${keys().length} data sets`); toast('Backup downloaded'); };
  const restore = async (f: File) => { try { const j = JSON.parse(await f.text()); if (!j?.data) throw new Error('Not an AgencyOS backup file'); if (!confirm(`Restore backup from ${j.at}? Current data on this computer will be replaced.`)) return; Object.entries(j.data).forEach(([k, v]) => { if (k.startsWith('paa') && typeof v === 'string') localStorage.setItem(k, v); }); logAudit('BACKUP_RESTORED', j.at); alert('Backup restored. The page will reload.'); location.reload(); } catch (e) { alert((e as Error).message); } };
  return (<>
    <div className="kpis"><Kpi name="Last Backup" value={last ? last.split(',')[0] : 'Never'} desc={last || 'Download one now'} icon="archive" /><Kpi name="Data Sets" value={String(keys().length)} desc="Saved in this browser" icon="folder" /><Kpi name="Off-site Copy" value="Manual" desc="Keep the file on Drive / pen drive" icon="shield" /><Kpi name="Restore Drill" value="Ready" desc="Test restore on another PC" icon="check" /></div>
    <div className="columns"><Panel title="Backup & restore">
      <p className="muted" style={{ marginTop: 0 }}>All AgencyOS data is stored in this browser until the backend server is added. Download a backup at least once a day and keep it safe. Uploaded files (photos, PDFs) stay in the browser file store and are not inside this backup.</p>
      <div className="bottom-actions" style={{ justifyContent: 'flex-start' }}><button className="primary-button" onClick={download}><Icon name="download" size={14} /> Download Full Backup</button><button className="outline-button" onClick={() => file.current?.click()}>Restore from Backup File</button>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) restore(f); }} /></div></Panel>
      <Panel title="Recovery checklist"><div className="step-list">{[['Download daily backup', 'One click above'], ['Store off-site', 'Google Drive / external disk'], ['Test restore monthly', 'Restore on a spare computer'], ['Record evidence', 'Date, person, result']].map((x, i) => <div key={i} className="step"><div className="step-num">{i + 1}</div><div><b>{x[0]}</b><p>{x[1]}</p></div></div>)}</div></Panel></div>
  </>);
};

export const CompanyPage: React.FC = () => {
  const { company, updateCompany, currentRole, logAudit } = useApp();
  const [f, setF] = useState<Record<string, any>>({ ...company });
  const can = FULL_ACCESS.includes(currentRole);
  return (<div className="columns equal"><Panel title="Business Identity" right={<span className="muted">{can ? 'Editable' : 'View only'}</span>}>
    <FormGrid value={f} onChange={setF} fields={[{ k: 'name', label: 'Agency Legal Name', wide: true }, { k: 'tagline', label: 'Tagline', wide: true }, { k: 'email', label: 'Primary Email' }, { k: 'phone', label: 'Phone' }, { k: 'website', label: 'Website' }, { k: 'gstNumber', label: 'GSTIN' }, { k: 'panNumber', label: 'PAN' }, { k: 'currency', label: 'Default Currency' }, { k: 'officeStartTime', label: 'Office start (HH:MM)' }, { k: 'officeEndTime', label: 'Office end (HH:MM)' }, { k: 'address', label: 'Company Address', type: 'textarea' }]} />
    {can && <div className="bottom-actions"><button className="outline-button" onClick={() => setF({ ...company })}>Reset</button><button className="primary-button" onClick={() => { updateCompany(f); logAudit('COMPANY_SETTINGS', 'Company profile'); toast('Company settings saved'); }}>Save</button></div>}</Panel>
    <Panel title="Letterhead & Brand Preview" right={<span className="muted">Used on every PDF</span>} style={{ background: '#F4F6FA' }}><img src="/letterhead.webp" alt="Letterhead" style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto', boxShadow: '0 5px 20px #17264313', border: '1px solid #E2E4E8' }} /></Panel></div>);
};

export const IntegrationsPage: React.FC = () => {
  const [st, setSt] = useShared<Record<string, string>>('paa_x_os_integrations', {});
  const { currentRole } = useApp(); const can = FULL_ACCESS.includes(currentRole);
  const cards: [string, string, string, string][] = [['META', 'Meta Lead Ads', 'Receive authorized form leads; deduplicate by platform lead ID', 'meta'], ['WA', 'WhatsApp Business Platform', 'Official API, inbox, opt-in, templates and response windows', 'wa'], ['WEB', 'Website Forms', 'Connect website enquiry forms and source attribution', 'web'], ['MAIL', 'Company Email', 'Connect supported mailbox for communication history', 'mail'], ['GADS', 'Google Ads Reporting', 'Campaign metrics through approved API permissions', 'gads'], ['PAY', 'Payment Reconciliation', 'Verify transfers against authorized payment records', 'pay']];
  return (<><div className="integration-grid">{cards.map(([sym, t, d, k]) => <div key={k} className="card integration-card"><div className="integ-symbol">{sym}</div><h3>{t}</h3><p>{d}</p><Pill v={st[k] || 'Requires setup'} />
    {can && <div style={{ marginTop: 17 }}><select className="os-select" value={st[k] || 'Requires setup'} onChange={(e) => setSt((p) => ({ ...p, [k]: e.target.value }))}>{['Requires setup', 'In progress', 'Connected', 'Not needed'].map((o) => <option key={o}>{o}</option>)}</select></div>}</div>)}</div>
    <Notice icon="lock" title="Do not put API keys in the browser." style={{ marginTop: 16 }}>Integrations need company-owned accounts with credentials stored on the backend server, webhook verification, retry queues and health checks. Use this page to track setup status.</Notice></>);
};

// ============ UNIFIED CONVERSATIONS ============
interface Conv { id: string; name: string; channel: string; phone: string; status: string; msgs: { me: boolean; text: string; at: string; by: string }[]; leadId?: string }
export const InboxPage: React.FC = () => {
  const { currentUser, addLead, logAudit } = useApp();
  const [convs, setConvs] = useShared<Conv[]>('paa_x_os_inbox', []);
  const [sel, setSel] = useState(convs[0]?.id || ''); const [msg, setMsg] = useState(''); const [q, setQ] = useState(''); const [form, setForm] = useState<Record<string, any> | null>(null);
  const c = convs.find((x) => x.id === sel) || convs[0];
  const send = (me: boolean) => { if (!msg.trim() || !c) return; setConvs((p) => p.map((x) => (x.id === c.id ? { ...x, msgs: [...x.msgs, { me, text: msg.trim(), at: nowStamp(), by: me ? currentUser.name : x.name }] } : x))); setMsg(''); };
  return (<>
    <div className="card os-chat"><div style={{ borderRight: '1px solid var(--line)', padding: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}><input className="field" style={{ flex: 1 }} placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} /><button className="primary-button os-mini" onClick={() => setForm({ channel: 'WhatsApp' })}>+</button></div>
      <div style={{ marginTop: 17 }}>{convs.filter((x) => `${x.name} ${x.channel}`.toLowerCase().includes(q.toLowerCase())).map((x) => <div key={x.id} className="list-row hover-link" onClick={() => setSel(x.id)} style={x.id === c?.id ? { background: '#F7F8FB', margin: '0 -8px', padding: '12px 8px', borderRadius: 8 } : undefined}><div><b>{x.name}</b><small>{x.channel} {'\u00B7'} {x.msgs[x.msgs.length - 1]?.text.slice(0, 26) || 'No messages'}</small></div><Pill v={x.status} /></div>)}
        {!convs.length && <div className="os-empty">No conversations yet. Click + to log an enquiry.</div>}</div></div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{c ? <>
        <div style={{ padding: '17px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><b style={{ fontSize: 13 }}>{c.name} <span className="muted">{c.channel} {'\u00B7'} {c.phone}</span></b>
          <div className="os-row-actions"><select className="os-select" value={c.status} onChange={(e) => setConvs((p) => p.map((x) => (x.id === c.id ? { ...x, status: e.target.value } : x)))}>{['Active', 'Pending', 'Resolved'].map((o) => <option key={o}>{o}</option>)}</select>
            {!c.leadId && <button className="outline-button os-mini" onClick={() => { addLead({ name: c.name, company: c.name, contactPerson: c.name, email: '', phone: c.phone, source: c.channel, serviceRequired: 'To be confirmed', estimatedValue: 0, status: 'new', priority: 'medium', assignedEmployeeId: currentUser.id, followUpDate: today(), notes: c.msgs.map((m) => m.text).join('\n') } as any); setConvs((p) => p.map((x) => (x.id === c.id ? { ...x, leadId: 'created' } : x))); logAudit('LEAD_FROM_CONVERSATION', c.name); toast('Lead created in All Leads'); }}>Convert to Lead</button>}</div></div>
        <div style={{ flex: 1, padding: 22, background: '#FAFBFD', overflow: 'auto', maxHeight: 440 }}>{c.msgs.map((m, i) => <div key={i} className={`os-bubble ${m.me ? 'me' : ''}`}>{m.text}<small>{m.by} {'\u00B7'} {m.at}</small></div>)}{!c.msgs.length && <div className="os-empty">No messages yet.</div>}</div>
        <div style={{ display: 'flex', padding: 14, gap: 9, borderTop: '1px solid var(--line)' }}><input className="field" style={{ flex: 1 }} placeholder="Type the message (reply or client's message)" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(true); }} /><button className="outline-button" onClick={() => send(false)} title="Log a message from the client">Log client msg</button><button className="primary-button" onClick={() => send(true)}>Send</button></div></>
        : <div className="os-empty" style={{ margin: 'auto' }}>Select or add a conversation.</div>}</div></div>
    <p className="foot-note">WhatsApp / Instagram / website messages are logged here by your team. Automatic sync needs the official WhatsApp Business API on the backend (see Connected Apps).</p>
    {form && <OsModal title="New conversation" onClose={() => setForm(null)} footer={<><button className="outline-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" onClick={() => { if (!form.name) return toast('Enter the name'); const id = uid('cv'); setConvs((p) => [{ id, name: form.name, channel: form.channel || 'WhatsApp', phone: form.phone || '', status: 'Active', msgs: form.first ? [{ me: false, text: form.first, at: nowStamp(), by: form.name }] : [] }, ...p]); setSel(id); setForm(null); }}>Add</button></>}>
      <FormGrid value={form} onChange={setForm} fields={[{ k: 'name', label: 'Name / Company', required: true }, { k: 'phone', label: 'Phone / handle' }, { k: 'channel', label: 'Channel', type: 'select', options: ['WhatsApp', 'Instagram', 'Facebook', 'Website', 'Phone Call', 'Email'] }, { k: 'first', label: 'First message', type: 'textarea' }]} />
    </OsModal>}
  </>);
};

const Info2 = Info; export { Info2 as Info };
