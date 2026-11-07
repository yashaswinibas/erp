// AGENCYOS_V5_P26_DONE
// AGENCYOS_V3_OS: generic record screens (table or board) saved in this browser.
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { uid, nowStamp } from '../lib/sharedStore';
import { DataTable, Pill, OsModal, FormGrid, FieldDef, toast, fmtD, Notice } from './OsUi';
import { useRecords } from './osData';
import { isStaffRole } from './osConfig';

export interface RecordConfig {
  kind: string; codePrefix: string; noun: string; fields: FieldDef[]; cols: [string, string][];
  statuses: string[]; board?: boolean; seed?: any[]; ownOnly?: boolean; note?: React.ReactNode; canEdit?: (role: string) => boolean; dateCol?: string; derive?: (r: any) => any; founderStatus?: string[];
}

export const RecordPage: React.FC<{ cfg: RecordConfig }> = ({ cfg }) => {
  const { currentUser, currentRole, logAudit, employees, clients } = useApp();
  const [items, setItems] = useRecords<any>(cfg.kind, cfg.seed || []);
  const [edit, setEdit] = useState<any | null>(null);
  const editable = cfg.canEdit ? cfg.canEdit(currentRole) : true;
  const own = cfg.ownOnly && isStaffRole(currentRole);
  const list0 = own ? items.filter((r) => r.ownerId === currentUser.id) : items;
  const list = cfg.derive ? list0.map(cfg.derive) : list0;
  const founderBlock = (st: string) => !!cfg.founderStatus?.includes(st) && currentRole !== 'super_admin';
  const fill = (f: FieldDef): FieldDef => f.type === 'select' && f.options?.[0] === '@employees' ? { ...f, options: employees.filter((e) => e.status === 'active').map((e) => e.name) }
    : f.type === 'select' && f.options?.[0] === '@clients' ? { ...f, options: clients.map((c) => c.companyName) } : f;
  const fields = cfg.fields.map(fill);
  const save = () => {
    if (edit && founderBlock(edit.status) && items.find((x) => x.id === edit.id)?.status !== edit.status) return toast(`Only the Founder can set "${edit.status}"`);
    const miss = fields.find((f) => f.required && !String(edit[f.k] ?? '').trim());
    if (miss) return toast(`Enter ${miss.label}`);
    if (edit.id) setItems((p) => p.map((x) => (x.id === edit.id ? { ...edit, updatedAt: nowStamp() } : x)));
    else { const rec = { ...edit, id: uid(cfg.kind), code: `${cfg.codePrefix}-${String(items.length + 1).padStart(3, '0')}`, ownerId: currentUser.id, owner: currentUser.name, createdAt: nowStamp(), status: edit.status || cfg.statuses[0] }; setItems((p) => [rec, ...p]); logAudit(`${cfg.kind.toUpperCase()}_CREATED`, rec.code, rec[cfg.cols[0][0]] || ''); }
    toast(`${cfg.noun} saved`); setEdit(null);
  };
  const del = (r: any) => { if (!confirm(`Delete ${r.code}? This is recorded in the audit trail.`)) return; setItems((p) => p.filter((x) => x.id !== r.id)); logAudit(`${cfg.kind.toUpperCase()}_DELETED`, r.code); };
  const move = (r: any, dir: number) => { const i = cfg.statuses.indexOf(r.status); const n = cfg.statuses[Math.min(cfg.statuses.length - 1, Math.max(0, i + dir))]; if (founderBlock(n)) { toast(`Only the Founder can set "${n}"`); return; } setItems((p) => p.map((x) => (x.id === r.id ? { ...x, status: n } : x))); logAudit(`${cfg.kind.toUpperCase()}_MOVED`, r.code, `${r.status} -> ${n}`); };
  const addBtn = editable && <button className="primary-button" onClick={() => setEdit({ status: cfg.statuses[0] })}>+ Add {cfg.noun}</button>;
  return (<>
    {cfg.note && <Notice>{cfg.note}</Notice>}
    {cfg.board ? (<>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>{addBtn}</div>
      <div className={`kanban ${cfg.statuses.length >= 7 ? 'k7' : cfg.statuses.length === 5 ? 'k5' : ''}`}>{cfg.statuses.map((st) => {
        const lane = list.filter((r) => r.status === st);
        return (<div key={st} className="lane"><div className="lane-head">{st} <span>{lane.length}</span></div>
          {lane.map((r) => (<div key={r.id} className="deal"><b>{r[cfg.cols[0][0]] || r.code}</b><small>{cfg.cols.slice(1, 3).map(([k]) => r[k]).filter(Boolean).join(' \u00B7 ') || r.code}</small>
            <div className="deal-footer"><Pill v={r.code} tone="gray" />{editable && <div className="os-row-actions">
              <button className="outline-button os-mini" title="Move back" onClick={() => move(r, -1)}>{'\u2190'}</button>
              <button className="outline-button os-mini" title="Move forward" onClick={() => move(r, 1)}>{'\u2192'}</button></div>}</div>
            {editable && <button className="outline-button full-width" style={{ marginTop: 10 }} onClick={() => setEdit({ ...r })}>Open Card</button>}</div>))}
          {!lane.length && <div className="tiny-note" style={{ padding: 8 }}>No cards</div>}</div>);
      })}</div></>)
      : <DataTable rows={list} filters={cfg.statuses.slice(0, 4)} top={addBtn}
        cols={[{ h: 'ID', v: (r: any) => r.code }, ...cfg.cols.map(([k, h]) => ({ h, v: (r: any) => (k === cfg.dateCol ? fmtD(r[k]) : r[k] ?? '\u2014'), s: (r: any) => String(r[k] ?? ''), wrap: k === 'notes' || k === 'summary' })), { h: 'Status', v: (r: any) => <Pill v={r.status} />, s: (r: any) => r.status }]}
        actions={editable ? (r: any) => <div className="os-row-actions"><span className="link" onClick={() => setEdit({ ...r })}>Open {'\u2192'}</span><span className="link os-danger" style={{ marginLeft: 10 }} onClick={() => del(r)}>Delete</span></div> : undefined}
        empty={`No ${cfg.noun.toLowerCase()} records yet. Click "+ Add ${cfg.noun}".`} />}
    {edit && <OsModal title={`${edit.id ? 'Edit' : 'New'} ${cfg.noun}${edit.code ? ' \u00B7 ' + edit.code : ''}`} onClose={() => setEdit(null)}
      footer={<>{edit.id && editable && <button className="outline-button os-danger" onClick={() => { del(edit); setEdit(null); }}>Delete</button>}<button className="outline-button" onClick={() => setEdit(null)}>Cancel</button><button className="primary-button" onClick={save}>Save</button></>}>
      <FormGrid fields={[...fields, { k: 'status', label: 'Status', type: 'select', options: cfg.statuses }]} value={edit} onChange={setEdit} />
      {edit.createdAt && <p className="tiny-note" style={{ marginTop: 12 }}>Created {edit.createdAt} by {edit.owner}{edit.updatedAt ? ` \u00B7 updated ${edit.updatedAt}` : ''}</p>}
    </OsModal>}
  </>);
};

const mgr = (r: string) => !isStaffRole(r);
export const RECORDS: Record<string, RecordConfig> = {
  proposals: { kind: 'proposals', codePrefix: 'PR', noun: 'Proposal', statuses: ['Draft', 'Under Review', 'Sent', 'Approved', 'Rejected'], dateCol: 'date',
    fields: [{ k: 'client', label: 'Client / Lead', required: true }, { k: 'service', label: 'Service' }, { k: 'value', label: 'Value (\u20B9)', type: 'number' }, { k: 'date', label: 'Created', type: 'date' }, { k: 'notes', label: 'Scope / notes', type: 'textarea' }],
    cols: [['client', 'Client'], ['service', 'Service'], ['owner', 'Prepared By'], ['value', 'Value'], ['date', 'Created']] },
  creative: { kind: 'creative', codePrefix: 'CR', noun: 'Creative', board: true, statuses: ['Brief Received', 'In Design', 'Internal Review', 'Client Approval', 'Approved'],
    fields: [{ k: 'title', label: 'Deliverable', required: true }, { k: 'client', label: 'Client', type: 'select', options: ['@clients'] }, { k: 'assignee', label: 'Designer / Editor', type: 'select', options: ['@employees'] }, { k: 'version', label: 'Version' }, { k: 'due', label: 'Due date', type: 'date' }, { k: 'notes', label: 'Feedback / notes', type: 'textarea' }],
    cols: [['title', 'Deliverable'], ['client', 'Client'], ['assignee', 'Owner']] },
  'content-calendar': { kind: 'content', codePrefix: 'POST', noun: 'Post', statuses: ['Planned', 'Draft', 'In Review', 'Scheduled', 'Published'], dateCol: 'date',
    fields: [{ k: 'title', label: 'Post / reel title', required: true }, { k: 'client', label: 'Client', type: 'select', options: ['@clients'] }, { k: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'X / Twitter', 'Google Business'] }, { k: 'date', label: 'Publish date', type: 'date', required: true }, { k: 'assignee', label: 'Owner', type: 'select', options: ['@employees'] }, { k: 'notes', label: 'Caption / notes', type: 'textarea' }],
    cols: [['title', 'Post'], ['client', 'Client'], ['platform', 'Platform'], ['date', 'Publish date'], ['assignee', 'Owner']] },
  campaigns: { kind: 'campaigns', codePrefix: 'CMP', noun: 'Campaign', statuses: ['Planned', 'Active', 'In Progress', 'Review', 'Completed', 'Paused'], dateCol: 'start',
    fields: [{ k: 'name', label: 'Campaign', required: true }, { k: 'client', label: 'Client', type: 'select', options: ['@clients'] }, { k: 'platform', label: 'Platform', type: 'select', options: ['Meta Ads', 'Google Ads', 'YouTube', 'LinkedIn', 'SEO', 'Email', 'WhatsApp'] }, { k: 'assignee', label: 'Owner', type: 'select', options: ['@employees'] }, { k: 'start', label: 'Start date', type: 'date' }, { k: 'kpi', label: 'KPI / Goal' }, { k: 'budget', label: 'Ad budget (\u20B9)', type: 'number' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['name', 'Campaign'], ['client', 'Client'], ['platform', 'Platform'], ['assignee', 'Owner'], ['start', 'Start Date'], ['kpi', 'KPI / Goal']] },
  deliverables: { kind: 'deliverables', codePrefix: 'DLV', noun: 'Deliverable', statuses: ['Pending', 'Pending Review', 'Client Review', 'Approved', 'Rework'],
    fields: [{ k: 'name', label: 'Deliverable', required: true }, { k: 'client', label: 'Client', type: 'select', options: ['@clients'] }, { k: 'assignee', label: 'Owner', type: 'select', options: ['@employees'] }, { k: 'version', label: 'Version' }, { k: 'step', label: 'Approval step', type: 'select', options: ['Quality Check', 'Internal Review', 'Client Review', 'Handover'] }, { k: 'proof', label: 'Proof of work (link)' }, { k: 'notes', label: 'QA notes', type: 'textarea' }],
    cols: [['name', 'Deliverable'], ['client', 'Client'], ['assignee', 'Owner'], ['version', 'Version'], ['step', 'Approval Step']] },
  vendors: { kind: 'vendors', codePrefix: 'VND', noun: 'Vendor', statuses: ['Active', 'Review', 'Inactive'], canEdit: mgr, dateCol: 'lastPayment',
    fields: [{ k: 'name', label: 'Vendor', required: true }, { k: 'service', label: 'Service' }, { k: 'contact', label: 'Contact person' }, { k: 'phone', label: 'Phone' }, { k: 'gst', label: 'GSTIN' }, { k: 'lastPayment', label: 'Last payment', type: 'date' }, { k: 'pending', label: 'Pending (\u20B9)', type: 'number' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['name', 'Vendor'], ['service', 'Service'], ['contact', 'Contact Person'], ['lastPayment', 'Last Payment'], ['pending', 'Pending']] },
  recruitment: { kind: 'recruitment', codePrefix: 'CAN', noun: 'Candidate', board: true, statuses: ['Applied', 'Screening', 'Interview', 'Offer', 'Joined', 'Rejected'],
    fields: [{ k: 'name', label: 'Candidate', required: true }, { k: 'role', label: 'Role applied' }, { k: 'phone', label: 'Phone' }, { k: 'email', label: 'Email' }, { k: 'source', label: 'Source', type: 'select', options: ['Naukri', 'LinkedIn', 'Referral', 'Walk-in', 'Website', 'Other'] }, { k: 'interview', label: 'Interview date', type: 'date' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['name', 'Candidate'], ['role', 'Role'], ['source', 'Source']] },
  incidents: { kind: 'incidents', codePrefix: 'INC', noun: 'Case', statuses: ['Open', 'Under Review', 'Resolved', 'Closed'], dateCol: 'opened',
    note: <><strong>Confidential information</strong> HR cases are visible only to HR and the Founder. Every change is recorded in the audit trail.</>,
    fields: [{ k: 'type', label: 'Issue type', type: 'select', options: ['Policy Concern', 'Process Violation', 'Attendance', 'Conduct', 'Warning', 'Other'], required: true }, { k: 'employee', label: 'Employee', type: 'select', options: ['@employees'] }, { k: 'reviewer', label: 'Assigned reviewer' }, { k: 'opened', label: 'Opened', type: 'date' }, { k: 'notes', label: 'Details / evidence / resolution', type: 'textarea' }],
    cols: [['type', 'Issue Type'], ['employee', 'Employee'], ['reviewer', 'Assigned Reviewer'], ['opened', 'Opened']] },
  archives: { kind: 'archives', codePrefix: 'ARC', noun: 'Archived document', statuses: ['Archived', 'Retained', 'Destroyed'], dateCol: 'created',
    fields: [{ k: 'name', label: 'Document', required: true }, { k: 'category', label: 'Category', type: 'select', options: ['Client', 'Finance', 'HR', 'Legal', 'Internal'] }, { k: 'created', label: 'Created', type: 'date' }, { k: 'retention', label: 'Retention', type: 'select', options: ['1 year', '3 years', '7 years', '8 years (GST)', 'Permanent'] }, { k: 'location', label: 'Storage location / link' }, { k: 'notes', label: 'Notes', type: 'textarea' }],
    cols: [['name', 'Document'], ['category', 'Category'], ['created', 'Created'], ['retention', 'Retention']] },
  automation: { kind: 'automation', codePrefix: 'RULE', noun: 'Rule', statuses: ['Active', 'Paused'], canEdit: (r) => r === 'super_admin' || r === 'admin',
    note: <><strong>Built-in rules already running</strong> New lead untouched 1 hour = alert; not handled in 24 hours = escalate to manager; overdue invoices, missed task deadlines, renewals within 7 days and missing attendance appear in Alerts & Escalations automatically.</>,
    seed: [
      { id: 'r1', code: 'RULE-001', rule: 'Untouched Lead', trigger: '1 hour since receipt', ownerRole: 'Sales Manager', next: 'Notify assignee', escalation: '24 hours', status: 'Active' },
      { id: 'r2', code: 'RULE-002', rule: 'Invoice Reminder', trigger: 'Due date approaching', ownerRole: 'Accounts', next: 'Reminder queue', escalation: 'After overdue', status: 'Active' },
      { id: 'r3', code: 'RULE-003', rule: 'Task Overdue', trigger: 'Task past deadline', ownerRole: 'Project Manager', next: 'Escalate to lead', escalation: 'Manager review', status: 'Active' },
      { id: 'r4', code: 'RULE-004', rule: 'Renewal Reminder', trigger: '7 days before expiry', ownerRole: 'Client Relationship', next: 'Notify account manager', escalation: 'Founder if critical', status: 'Active' },
      { id: 'r5', code: 'RULE-005', rule: 'Attendance Missing', trigger: 'No check-in after office start', ownerRole: 'HR Manager', next: 'Notify employee', escalation: 'HR review', status: 'Active' },
    ],
    fields: [{ k: 'rule', label: 'Rule', required: true }, { k: 'trigger', label: 'Trigger' }, { k: 'ownerRole', label: 'Owner' }, { k: 'next', label: 'Next step' }, { k: 'escalation', label: 'Escalation' }],
    cols: [['rule', 'Rule'], ['trigger', 'Trigger'], ['ownerRole', 'Owner'], ['next', 'Next Step'], ['escalation', 'Escalation']] },
};
