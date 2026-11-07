// AGENCYOS_V4_P25: org structure, team leader desk, lead rules, task review, exits, action permissions
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useShared, nowStamp } from '../lib/sharedStore';
import { scopeForStaff } from '../lib/scope';
import { Icon } from './icons';
import { DataTable, Pill, Panel, Rows, Kpi, Notice, OsModal, FormGrid, toast, today, fmtD, initials } from './OsUi';
import { MODULES, M, OS_ROLES, roleLabel, FULL_ACCESS, readMatrix, OS_PERM_KEY } from './osConfig';
import {
  ORG_UNITS, unitByKey, ORG_KEY, OrgPlace, teamOf, ACTIONS, ACT_KEY, defaultActions, osCan,
  LEAD_RULES_KEY, DEFAULT_LEAD_RULES, LeadRules, SERVICE_TEAM, teamForService, TASK_REVIEW_KEY, TaskReview, ProofFile,
  canReviewTasks, EXITS_KEY, ExitCase, EXIT_CHECKS, newExit,
} from './osP25';

const useOrg = () => useShared<Record<string, OrgPlace>>(ORG_KEY, {});
const empName = (employees: any[], id: string) => employees.find((e) => e.id === id)?.name || '\u2014';

// ===================================================================
// ORGANIZATION FAMILY TREE (real people placed in departments / teams)
// ===================================================================
export const OrgStructurePage: React.FC = () => {
  const { employees, currentRole, currentUser, updateEmployee, logAudit } = useApp();
  const [org, setOrg] = useOrg();
  const [edit, setEdit] = useState<{ emp: string; unit: string; position: string; reportsTo: string; setRole: boolean } | null>(null);
  const canEdit = FULL_ACCESS.includes(currentRole) || currentRole === 'hr' || currentRole === 'hr_executive';
  const active = employees.filter((e) => e.status !== 'inactive');
  const placed = (unit: string, pos: string) => active.filter((e) => org[e.id]?.unit === unit && org[e.id]?.position === pos);
  const open = (emp = '', unit = '', position = '') => setEdit({ emp, unit: unit || org[emp]?.unit || '', position: position || org[emp]?.position || '', reportsTo: org[emp]?.reportsTo || '', setRole: currentRole === 'super_admin' });
  const save = () => {
    if (!edit || !edit.emp || !edit.unit || !edit.position) return toast('Choose person, department / team and position.');
    setOrg((p) => ({ ...p, [edit.emp]: { unit: edit.unit, position: edit.position, reportsTo: edit.reportsTo } }));
    const pos = unitByKey(edit.unit)?.positions.find((x) => x.name === edit.position);
    const e = employees.find((x) => x.id === edit.emp);
    logAudit('ORG_PLACEMENT', e?.name || edit.emp, `${unitByKey(edit.unit)?.name} / ${edit.position}`);
    if (edit.setRole && pos && e && e.role !== pos.role && currentRole === 'super_admin') { updateEmployee(e.id, { role: pos.role as any }); toast(`${e.name} placed and login role set to ${roleLabel(pos.role)}`); }
    else toast(`${e?.name} placed in ${edit.position}`);
    setEdit(null);
  };
  const remove = (id: string) => { setOrg((p) => { const n = { ...p }; delete n[id]; return n; }); logAudit('ORG_REMOVED', empName(employees, id)); };

  const Unit: React.FC<{ u: typeof ORG_UNITS[number] }> = ({ u }) => (
    <div className="card org-unit"><h4>{u.name}</h4><div className="muted" style={{ marginBottom: 8 }}>{u.dept === 'Service Delivery' ? 'Service delivery team' : `Reports to ${u.key === 'external' ? 'Founder / project owner' : 'General Manager'}`}</div>
      {u.positions.map((p) => { const ppl = placed(u.key, p.name); return (
        <div key={p.name} className="org-pos"><div><b style={{ fontSize: 11 }}>{p.name}</b><div>{ppl.length ? ppl.map((e) => <span key={e.id} className="org-person hover-link" title="Edit placement" onClick={() => canEdit && open(e.id)}>{e.name}</span>) : <span className="seat-empty">No one yet</span>}</div></div>
          <div style={{ textAlign: 'right' }}><span className="muted">{p.seats ? `${ppl.length} / ${p.seats}` : ppl.length}</span>{canEdit && <div><button className="outline-button os-mini" style={{ marginTop: 4 }} onClick={() => open('', u.key, p.name)}>+ Add</button></div>}</div></div>); })}
    </div>
  );
  const lead = ORG_UNITS[0]; const core = ORG_UNITS.filter((u) => !['leadership', 'external'].includes(u.key) && u.dept !== 'Service Delivery');
  const delivery = ORG_UNITS.filter((u) => u.dept === 'Service Delivery'); const ext = ORG_UNITS.find((u) => u.key === 'external')!;
  const founders = Array.from(new Set([...placed('leadership', lead.positions[0].name), ...active.filter((e) => e.role === 'super_admin')]));
  const gms = Array.from(new Set([...placed('leadership', 'General Manager'), ...active.filter((e) => e.role === 'manager')]));
  const unplaced = active.filter((e) => !org[e.id]);
  const unit = edit ? unitByKey(edit.unit) : undefined;
  return (<>
    {unplaced.length > 0 && <Notice icon="users" title={`${unplaced.length} people are not placed in the structure yet`} neutral={false}>Click "+ Add" next to a position (or "Assign person") to put them in their department and team. Team Leaders then automatically see only their own team.</Notice>}
    <div className="card panel" style={{ padding: 25 }}>
      <div className="org-root"><b>Founder / Owner / Super Admin</b><small>Top authority {'\u00B7'} Full access</small><div style={{ marginTop: 6 }}>{founders.map((e) => <span key={e.id} className="org-person" style={{ background: '#ffffff22', color: '#fff' }}>{e.name}</span>)}</div></div>
      <div className="org-line" />
      <div className="org-manager">General Manager<br /><small style={{ fontSize: 10, color: '#97793B' }}>Full operations {'\u00B7'} No private finance / owner documents</small><div>{gms.length ? gms.map((e) => <span key={e.id} className="org-person hover-link" onClick={() => canEdit && open(e.id)}>{e.name}</span>) : canEdit && <button className="outline-button os-mini" onClick={() => open('', 'leadership', 'General Manager')}>+ Add General Manager</button>}</div></div>
      <div className="org-line" />
      <div className="org-depts">{core.map((u) => <Unit key={u.key} u={u} />)}</div>
      <div className="eyebrow" style={{ margin: '22px 0 10px' }}>Service Delivery Teams</div>
      <div className="org-depts">{delivery.map((u) => <Unit key={u.key} u={u} />)}</div>
      <div className="eyebrow" style={{ margin: '22px 0 10px' }}>External / Limited Users</div>
      <div className="org-depts"><Unit u={ext} /></div>
    </div>
    <div style={{ marginTop: 16 }}>
      <DataTable rows={active} filters={['Placed', 'Unplaced']} top={canEdit ? <button className="primary-button" onClick={() => open()}><Icon name="plus" size={14} /> Assign person</button> : undefined}
        cols={[{ h: 'Employee', v: (e) => e.name }, { h: 'Login role', v: (e) => roleLabel(e.role) }, { h: 'Department / Team', v: (e) => unitByKey(org[e.id]?.unit || '')?.name || '\u2014' }, { h: 'Position', v: (e) => org[e.id]?.position || '\u2014' }, { h: 'Reports to', v: (e) => (org[e.id]?.reportsTo ? empName(employees, org[e.id].reportsTo) : '\u2014') }, { h: 'Status', v: (e) => <Pill v={org[e.id] ? 'Placed' : 'Unplaced'} tone={org[e.id] ? 'green' : 'yellow'} />, s: (e) => (org[e.id] ? 'Placed' : 'Unplaced') }]}
        actions={canEdit ? (e) => <div className="os-row-actions"><button className="outline-button os-mini" onClick={() => open(e.id)}>Edit</button>{org[e.id] && <button className="outline-button os-mini os-danger" onClick={() => remove(e.id)}>Remove</button>}</div> : undefined} />
    </div>
    <Notice icon="shield" title="Rank is not system access." style={{ marginTop: 16 }}>Placing someone shows them in the tree and builds the team for Team Leaders. The login role (what screens they see) is set from Users & Accounts, or here by the Founder with "Also set login role".</Notice>
    {edit && <OsModal title="Place person in organization" onClose={() => setEdit(null)} footer={<><button className="outline-button" onClick={() => setEdit(null)}>Cancel</button><button className="primary-button" onClick={save}>Save</button></>}>
      <div className="form-grid">
        <div className="form-group wide"><label>Employee *</label><select value={edit.emp} onChange={(e) => { const id = e.target.value; setEdit({ ...edit, emp: id, unit: edit.unit || org[id]?.unit || '', position: edit.position || org[id]?.position || '', reportsTo: org[id]?.reportsTo || edit.reportsTo }); }}><option value="">Select{'\u2026'}</option>{active.map((e) => <option key={e.id} value={e.id}>{e.name} ({roleLabel(e.role)})</option>)}</select></div>
        <div className="form-group"><label>Department / Team *</label><select value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value, position: '' })}><option value="">Select{'\u2026'}</option>{ORG_UNITS.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}</select></div>
        <div className="form-group"><label>Position *</label><select value={edit.position} onChange={(e) => setEdit({ ...edit, position: e.target.value })}><option value="">Select{'\u2026'}</option>{(unit?.positions || []).map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}</select></div>
        <div className="form-group wide"><label>Reports to</label><select value={edit.reportsTo} onChange={(e) => setEdit({ ...edit, reportsTo: e.target.value })}><option value="">{'\u2014'}</option>{active.filter((e) => e.id !== edit.emp).map((e) => <option key={e.id} value={e.id}>{e.name} ({org[e.id]?.position || roleLabel(e.role)})</option>)}</select></div>
        {currentRole === 'super_admin' && edit.position && <div className="form-group wide"><label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={edit.setRole} onChange={(e) => setEdit({ ...edit, setRole: e.target.checked })} /> Also set login role to {roleLabel(unit?.positions.find((p) => p.name === edit.position)?.role || '')}</label></div>}
      </div>
      {currentUser && <p className="muted" style={{ marginTop: 10 }}>Saved in the audit trail.</p>}
    </OsModal>}
  </>);
};

// ===================================================================
// TEAM LEADER DESK
// ===================================================================
export const TeamLeaderDashboard: React.FC = () => {
  const full = useApp(); const app = scopeForStaff(full);
  const { tasks, employees, currentUser, setActiveTab } = app as any;
  const [rev] = useShared<Record<string, TaskReview>>(TASK_REVIEW_KEY, {});
  const t = today();
  const team = teamOf(currentUser.id, full.employees);
  const members = employees.filter((e: any) => e.id !== currentUser.id);
  const open = tasks.filter((k: any) => k.status !== 'completed');
  const late = open.filter((k: any) => k.dueDate && k.dueDate < t);
  const waiting = tasks.filter((k: any) => k.status === 'review');
  const quality = tasks.filter((k: any) => (rev[k.id]?.reworks || 0) > 0);
  return (<>
    {team.size <= 1 && <Notice icon="users" title="Your team is empty" neutral={false}>Ask the Founder or HR to place your team members under you in Organization Family Tree (Reports to = you, or the same team).</Notice>}
    <div className="kpis">
      <Kpi name="Team Members" value={String(members.length).padStart(2, '0')} desc="Reporting to you" icon="users" />
      <Kpi name="Open Tasks" value={String(open.length).padStart(2, '0')} desc="Assigned to your team" icon="list" />
      <Kpi name="Delayed" value={String(late.length).padStart(2, '0')} desc="Past due date" icon="clock" trend={late.length ? '-' + late.length : undefined} />
      <Kpi name="Awaiting Your Review" value={String(waiting.length).padStart(2, '0')} desc="Submitted work" icon="check" />
    </div>
    <div className="columns">
      <Panel title="Team members & work progress" right={<span className="muted">Done / total</span>}>
        <Rows items={members.map((e: any) => { const m = tasks.filter((k: any) => k.assignedEmployeeId === e.id); const d = m.filter((k: any) => k.status === 'completed').length; const l = m.filter((k: any) => k.status !== 'completed' && k.dueDate && k.dueDate < t).length; return [e.name, `${d} of ${m.length} task(s) done`, l ? `${l} overdue` : 'On Track'] as [string, string, string]; })} empty="No team members yet." />
      </Panel>
      <Panel title="Submissions to approve" right={<button className="outline-button os-mini" onClick={() => setActiveTab('task-review')}>Open review</button>}>
        <Rows items={waiting.slice(0, 8).map((k: any) => [k.title, `${empName(full.employees, k.assignedEmployeeId)} \u00B7 due ${fmtD(k.dueDate)}`, 'Pending Review'] as [string, string, string])} empty="Nothing waiting for review." onClick={() => setActiveTab('task-review')} />
      </Panel>
    </div>
    <div className="columns equal">
      <Panel title="Delays"><Rows items={late.slice(0, 8).map((k: any) => [k.title, `${empName(full.employees, k.assignedEmployeeId)} \u00B7 due ${fmtD(k.dueDate)}`, 'Overdue'] as [string, string, string])} empty="No delays. Great work." /></Panel>
      <Panel title="Quality issues (sent for rework)"><Rows items={quality.slice(0, 8).map((k: any) => [k.title, `${empName(full.employees, k.assignedEmployeeId)} \u00B7 ${rev[k.id].reworks} rework(s)`, rev[k.id].state === 'approved' ? 'Approved' : 'Rework'] as [string, string, string])} empty="No rework so far." /></Panel>
    </div>
  </>);
};

// ===================================================================
// TASK SUBMISSIONS & REVIEW  (Pending -> In Progress -> Submitted -> Approved / Rework)
// ===================================================================
const readFile = (f: File) => new Promise<ProofFile>((res, rej) => { const r = new FileReader(); r.onload = () => res({ name: f.name, url: String(r.result), size: f.size }); r.onerror = rej; r.readAsDataURL(f); });
export const TaskReviewPage: React.FC = () => {
  const full = useApp(); const app = scopeForStaff(full) as any;
  const { currentUser, currentRole, updateTaskStatus, logAudit } = full;
  const [rev, setRev] = useShared<Record<string, TaskReview>>(TASK_REVIEW_KEY, {});
  const reviewer = canReviewTasks(currentRole);
  const [tab, setTab] = useState(reviewer ? 'queue' : 'mine');
  const [sub, setSub] = useState<{ id: string; note: string; files: ProofFile[] } | null>(null);
  const [rw, setRw] = useState<{ id: string; note: string } | null>(null);
  const mine = full.tasks.filter((k) => k.assignedEmployeeId === currentUser.id);
  const queue = (app.tasks as any[]).filter((k) => k.status === 'review' && (k.assignedEmployeeId !== currentUser.id || currentRole === 'super_admin'));
  const hist = (id: string, action: string, comment?: string) => ({ at: nowStamp(), by: currentUser.name, action, comment });
  const submit = () => {
    if (!sub) return; if (!sub.note.trim() && !sub.files.length) return toast('Add a short report or attach proof.');
    if (currentRole !== 'super_admin' && !osCan(currentRole, M.TSK, 'E')) return toast('You do not have permission to update tasks.');
    updateTaskStatus(sub.id, 'review');
    setRev((p) => { const o = p[sub.id]; return { ...p, [sub.id]: { state: 'submitted', note: sub.note, files: [...(o?.files || []), ...sub.files], reworks: o?.reworks || 0, history: [...(o?.history || []), hist(sub.id, 'Submitted', sub.note)] } }; });
    logAudit('TASK_SUBMITTED', sub.id, sub.note.slice(0, 80)); toast('Submitted for review'); setSub(null);
  };
  const approve = (id: string) => { updateTaskStatus(id, 'completed'); setRev((p) => ({ ...p, [id]: { ...(p[id] || { note: '', files: [], reworks: 0, history: [] }), state: 'approved', history: [...(p[id]?.history || []), hist(id, 'Approved')] } })); logAudit('TASK_APPROVED', id); toast('Task approved'); };
  const rework = () => { if (!rw || !rw.note.trim()) return toast('Write what needs to change.'); const id = rw.id; updateTaskStatus(id, 'in_progress'); setRev((p) => ({ ...p, [id]: { ...(p[id] || { note: '', files: [], reworks: 0, history: [] }), state: 'rework', reworks: (p[id]?.reworks || 0) + 1, history: [...(p[id]?.history || []), hist(id, 'Sent for rework', rw.note)] } })); logAudit('TASK_REWORK', id, rw.note); toast('Sent back for rework'); setRw(null); };
  const stage = (k: any) => k.status === 'completed' ? 'Approved' : k.status === 'review' ? 'Submitted' : rev[k.id]?.state === 'rework' ? 'Rework' : k.status === 'in_progress' ? 'In Progress' : k.status === 'blocked' ? 'Blocked' : 'Pending';
  const Proof: React.FC<{ id: string }> = ({ id }) => <div className="proof-list">{(rev[id]?.files || []).map((f, i) => <a key={i} href={f.url} download={f.name} target="_blank" rel="noreferrer">{f.name}</a>)}</div>;
  const lastComment = (id: string) => [...(rev[id]?.history || [])].reverse().find((h) => h.comment)?.comment || '';
  const project = (k: any) => full.projects.find((p) => p.id === k.projectId)?.name || '\u2014';
  return (<>
    <div className="tabbar">{(reviewer ? [['queue', `Review queue (${queue.length})`], ['mine', 'My work'], ['history', 'History']] : [['mine', 'My work'], ['history', 'History']]).map(([k, l]) => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'mine' && <DataTable rows={mine.filter((k) => k.status !== 'completed')} filters={['Pending', 'In Progress', 'Submitted', 'Rework']} empty="No open tasks assigned to you."
      cols={[{ h: 'Task', v: (k) => k.title }, { h: 'Project', v: project }, { h: 'Due', v: (k) => fmtD(k.dueDate) }, { h: 'Stage', v: (k) => <Pill v={stage(k)} />, s: stage }, { h: 'Reviewer note', v: (k) => lastComment(k.id) || '\u2014', wrap: true }]}
      actions={(k) => k.status === 'review' ? <span className="muted">Waiting for review</span> : <div className="os-row-actions">{k.status === 'todo' && <button className="outline-button os-mini" onClick={() => updateTaskStatus(k.id, 'in_progress')}>Start</button>}<button className="primary-button os-mini" onClick={() => setSub({ id: k.id, note: '', files: [] })}>Submit with proof</button></div>} />}
    {tab === 'queue' && reviewer && <DataTable rows={queue} empty="Nothing waiting for review."
      cols={[{ h: 'Task', v: (k: any) => k.title }, { h: 'Employee', v: (k: any) => empName(full.employees, k.assignedEmployeeId) }, { h: 'Project', v: project }, { h: 'Due', v: (k: any) => fmtD(k.dueDate) }, { h: 'Report & proof', v: (k: any) => <div><div style={{ whiteSpace: 'normal' }}>{rev[k.id]?.note || '\u2014'}</div><Proof id={k.id} /></div>, wrap: true, s: (k: any) => rev[k.id]?.note || '' }]}
      actions={(k: any) => <div className="os-row-actions"><button className="primary-button os-mini" onClick={() => approve(k.id)}>Approve</button><button className="outline-button os-mini os-danger" onClick={() => setRw({ id: k.id, note: '' })}>Rework</button></div>} />}
    {tab === 'history' && <DataTable rows={(app.tasks as any[]).filter((k) => rev[k.id])} filters={['Approved', 'Rework', 'Submitted']}
      cols={[{ h: 'Task', v: (k: any) => k.title }, { h: 'Employee', v: (k: any) => empName(full.employees, k.assignedEmployeeId) }, { h: 'Stage', v: (k: any) => <Pill v={stage(k)} />, s: stage }, { h: 'Reworks', v: (k: any) => rev[k.id].reworks }, { h: 'Timeline', v: (k: any) => rev[k.id].history.map((h) => `${h.at} ${h.action} by ${h.by}${h.comment ? ': ' + h.comment : ''}`).join(' | '), wrap: true }, { h: 'Proof', v: (k: any) => <Proof id={k.id} />, s: () => '' }]} />}
    <Notice icon="check" title="How it works" style={{ marginTop: 16 }}>Employee works on the task, submits a report with proof (screenshots, files, links). The Team Leader / Manager reviews it and either approves (task completed) or sends it back for rework with a comment. Every step is saved in the audit trail.</Notice>
    {sub && <OsModal title="Submit work for review" onClose={() => setSub(null)} footer={<><button className="outline-button" onClick={() => setSub(null)}>Cancel</button><button className="primary-button" onClick={submit}>Submit</button></>}>
      <FormGrid value={sub} onChange={(v) => setSub({ ...sub, note: v.note })} fields={[{ k: 'note', label: 'What did you complete? (report, links)', type: 'textarea', required: true }]} />
      <div className="form-group" style={{ marginTop: 12 }}><label>Proof of work (images / PDF / files, max 2 MB each)</label>
        <input type="file" multiple onChange={async (e) => { const fs = Array.from(e.target.files || []); const big = fs.filter((f) => f.size > 2 * 1024 * 1024); if (big.length) toast(`${big.length} file(s) over 2 MB skipped`); const ok = await Promise.all(fs.filter((f) => f.size <= 2 * 1024 * 1024).map(readFile)); setSub((s) => (s ? { ...s, files: [...s.files, ...ok] } : s)); }} /></div>
      <div className="proof-list">{sub.files.map((f, i) => <a key={i}>{f.name}</a>)}</div>
    </OsModal>}
    {rw && <OsModal title="Send back for rework" onClose={() => setRw(null)} footer={<><button className="outline-button" onClick={() => setRw(null)}>Cancel</button><button className="primary-button" onClick={rework}>Send for rework</button></>}>
      <FormGrid value={rw} onChange={(v) => setRw({ ...rw, note: v.note })} fields={[{ k: 'note', label: 'What needs to be fixed?', type: 'textarea', required: true }]} />
    </OsModal>}
  </>);
};

// ===================================================================
// LEAD ASSIGNMENT & DUPLICATES
// ===================================================================
export const LeadRulesPage: React.FC = () => {
  const { leads, employees, currentRole, logAudit, setActiveTab } = useApp();
  const [saved, setSaved] = useShared<Partial<LeadRules>>(LEAD_RULES_KEY, {});
  const [org] = useOrg();
  const [test, setTest] = useState('Meta Ads campaign');
  const r: LeadRules = { ...DEFAULT_LEAD_RULES, ...saved };
  const canEdit = FULL_ACCESS.includes(currentRole) || currentRole === 'sales_manager';
  const set = (p: Partial<LeadRules>) => { setSaved({ ...r, ...p }); logAudit('LEAD_RULES_CHANGED', 'Lead rules', JSON.stringify(p)); toast('Lead rules saved'); };
  const teams = Array.from(new Set(SERVICE_TEAM.map((x) => x[1])));
  const members = (k: string) => employees.filter((e) => e.status === 'active' && org[e.id]?.unit === k);
  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const l of leads) for (const key of [(l.phone || '').replace(/\D/g, '').slice(-10), (l.email || '').trim().toLowerCase()]) if (key && key.length >= 6) (map[key] = map[key] || []).push(l);
    const seen = new Set<string>(); const out: { key: string; list: any[] }[] = [];
    for (const [k, list] of Object.entries(map)) { const ids = Array.from(new Set(list.map((x) => x.id))); if (ids.length > 1) { const sig = ids.sort().join(','); if (!seen.has(sig)) { seen.add(sig); out.push({ key: k, list: ids.map((i) => leads.find((x) => x.id === i)) }); } } }
    return out;
  }, [leads]);
  const tName = (k: string) => unitByKey(k)?.name || 'Sales team';
  return (<>
    <div className="kpis">
      <Kpi name="Auto-assignment" value={r.autoAssign === 'off' ? 'OFF' : 'ON'} desc={({ off: 'Manual only', unassigned: 'Only leads with no owner', online: 'Online leads + no owner', always: 'Every new lead' } as any)[r.autoAssign]} icon="zap" />
      <Kpi name="Duplicate check" value={r.duplicateCheck ? 'ON' : 'OFF'} desc="Phone / email match" icon="shield" />
      <Kpi name="Possible duplicates" value={String(groups.length).padStart(2, '0')} desc="Existing lead groups" icon="users" />
      <Kpi name="Teams with people" value={`${teams.filter((k) => members(k).length).length}/${teams.length}`} desc="Placed in org tree" icon="layers" />
    </div>
    <div className="columns equal">
      <Panel title="Rules">
        <div className="form-grid">
          <div className="form-group wide"><label>Automatic lead assignment</label><select disabled={!canEdit} value={r.autoAssign} onChange={(e) => set({ autoAssign: e.target.value as any })}><option value="off">Off - assign manually</option><option value="unassigned">Only when no owner is chosen</option><option value="online">Online leads (Website, Meta, Instagram, Facebook, WhatsApp) + no owner</option><option value="always">Every new lead</option></select></div>
          <div className="form-group"><label>Duplicate detection</label><select disabled={!canEdit} value={r.duplicateCheck ? '1' : '0'} onChange={(e) => set({ duplicateCheck: e.target.value === '1' })}><option value="1">ON - warn before adding</option><option value="0">OFF</option></select></div>
          <div className="form-group"><label>If the service team is empty</label><select disabled={!canEdit} value={r.fallbackToSales ? '1' : '0'} onChange={(e) => set({ fallbackToSales: e.target.value === '1' })}><option value="1">Give to Sales team (round-robin)</option><option value="0">Leave with the person who added it</option></select></div>
        </div>
        {!canEdit && <p className="muted">Only the Founder / Owner or Sales Manager can change these rules.</p>}
        <div className="dept-line" style={{ borderBottom: '1px solid var(--line)', margin: '14px 0' }} />
        <div className="form-group"><label>Test: which team gets this service?</label><input value={test} onChange={(e) => setTest(e.target.value)} /></div>
        <p className="small" style={{ marginTop: 8 }}>{'\u2192'} <b>{tName(teamForService(test))}</b> {'\u00B7'} {(teamForService(test) ? members(teamForService(test)) : []).map((e) => e.name).join(', ') || 'no one placed yet'}</p>
      </Panel>
      <Panel title="Service-based assignment (round-robin inside the team)" right={<button className="outline-button os-mini" onClick={() => setActiveTab('hierarchy')}>Place people</button>}>
        <Rows items={teams.map((k) => [tName(k), members(k).map((e) => e.name).join(', ') || 'No one placed - goes to Sales team', members(k).length ? `${members(k).length} people` : 'Empty'] as [string, string, string])} />
      </Panel>
    </div>
    <DataTable rows={groups} empty="No duplicate leads found." search={false}
      cols={[{ h: 'Matched on', v: (g) => g.key }, { h: 'Leads', v: (g) => g.list.map((l: any) => `${l.leadCode} ${l.company || l.name}`).join('  |  '), wrap: true }, { h: 'Owners', v: (g) => Array.from(new Set(g.list.map((l: any) => empName(employees, l.assignedEmployeeId)))).join(', ') }, { h: 'Count', v: (g) => <Pill v={`${g.list.length} records`} tone="red" /> }]} />
    <Notice icon="zap" title="Escalation rules (already running)" style={{ marginTop: 16 }}>New lead not touched in 1 hour = alert to the owner. Not handled in 24 hours = escalated to the Sales Manager. See Alerts & Escalations.</Notice>
  </>);
};

// ===================================================================
// EXIT & SEPARATION
// ===================================================================
export const ExitsPage: React.FC = () => {
  const { employees, currentRole, currentUser, updateEmployee, logAudit, setActiveTab } = useApp();
  const [cases, setCases] = useShared<ExitCase[]>(EXITS_KEY, []);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [sel, setSel] = useState<string>('');
  const canCreate = osCan(currentRole, M.HR, 'C');
  const founder = currentRole === 'super_admin';
  const upd = (id: string, p: Partial<ExitCase>, text: string) => { setCases((all) => all.map((c) => (c.id === id ? { ...c, ...p, log: [...c.log, { at: nowStamp(), by: currentUser.name, text }] } : c))); logAudit('EXIT_CASE', id, text); };
  const create = () => {
    if (!form?.employeeId || !form.type || !form.lastDay) return toast('Choose employee, type and last working day.');
    const c = newExit({ employeeId: form.employeeId, type: form.type, noticeDate: form.noticeDate || today(), lastDay: form.lastDay, reason: form.reason || '' }, currentUser.name);
    setCases((p) => [c, ...p]); logAudit('EXIT_OPENED', empName(employees, form.employeeId), `${form.type} - last day ${form.lastDay}`);
    toast(form.type === 'Termination' ? 'Termination sent to Founder for approval' : 'Exit case opened'); setForm(null);
  };
  const c = cases.find((x) => x.id === sel);
  const allDone = c ? EXIT_CHECKS.every(([k]) => c.checks[k]) : false;
  const emp = c ? employees.find((e) => e.id === c.employeeId) : undefined;
  return (<>
    <div className="kpis">
      <Kpi name="Open exits" value={String(cases.filter((x) => !['Closed', 'Rejected'].includes(x.status)).length).padStart(2, '0')} desc="In progress" icon="user" />
      <Kpi name="Awaiting Founder" value={String(cases.filter((x) => x.status === 'Awaiting Founder Approval').length).padStart(2, '0')} desc="Terminations" icon="shield" />
      <Kpi name="Leaving this month" value={String(cases.filter((x) => x.lastDay.startsWith(today().slice(0, 7))).length).padStart(2, '0')} desc="Last working day" icon="calendar" />
      <Kpi name="Closed" value={String(cases.filter((x) => x.status === 'Closed').length).padStart(2, '0')} desc="All time" icon="archive" />
    </div>
    <DataTable rows={cases} filters={['Notice Period', 'Clearance', 'Full & Final', 'Awaiting Founder Approval', 'Closed']} empty="No exit cases."
      top={canCreate ? <button className="primary-button" onClick={() => setForm({ type: 'Resignation', noticeDate: today() })}><Icon name="plus" size={14} /> New exit case</button> : undefined}
      cols={[{ h: 'Case', v: (x) => x.code }, { h: 'Employee', v: (x) => empName(employees, x.employeeId) }, { h: 'Type', v: (x) => x.type }, { h: 'Notice', v: (x) => fmtD(x.noticeDate) }, { h: 'Last day', v: (x) => fmtD(x.lastDay) }, { h: 'Checklist', v: (x) => `${EXIT_CHECKS.filter(([k]) => x.checks[k]).length}/${EXIT_CHECKS.length}` }, { h: 'Status', v: (x) => <Pill v={x.status} />, s: (x) => x.status }]}
      actions={(x) => <button className="outline-button os-mini" onClick={() => setSel(x.id)}>Open</button>} />
    {form && <OsModal title="New exit case" onClose={() => setForm(null)} footer={<><button className="outline-button" onClick={() => setForm(null)}>Cancel</button><button className="primary-button" onClick={create}>Open case</button></>}>
      <FormGrid value={form} onChange={setForm} fields={[{ k: 'type', label: 'Exit type', type: 'select', options: ['Resignation', 'Termination', 'Contract End', 'Retirement', 'Absconding'], required: true }, { k: 'noticeDate', label: 'Notice / resignation date', type: 'date' }, { k: 'lastDay', label: 'Last working day', type: 'date', required: true }, { k: 'reason', label: 'Reason', type: 'textarea' }]} />
      <div className="form-group" style={{ marginTop: 12 }}><label>Employee *</label><select value={form.employeeId || ''} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Select{'\u2026'}</option>{employees.filter((e) => e.status !== 'inactive' && e.role !== 'super_admin').map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}</select></div>
      {form.type === 'Termination' && <Notice icon="shield" neutral={false} style={{ marginTop: 12 }}>Terminations need Founder approval before they start.</Notice>}
    </OsModal>}
    {c && <OsModal wide title={`${c.code} \u00B7 ${empName(employees, c.employeeId)} \u00B7 ${c.type}`} onClose={() => setSel('')} footer={<button className="outline-button" onClick={() => setSel('')}>Close</button>}>
      <div className="detail-ident" style={{ marginBottom: 14 }}><div className="detail-logo">{initials(emp?.name || '')}</div><div><h2 style={{ fontSize: 16 }}>{emp?.name}</h2><p>Last day {fmtD(c.lastDay)} {'\u00B7'} Login {emp?.status === 'inactive' ? 'disabled' : 'active'} {'\u00B7'} <Pill v={c.status} /></p></div></div>
      {c.reason && <p className="small">Reason: {c.reason}</p>}
      {c.status === 'Awaiting Founder Approval' ? (founder
        ? <div className="actions" style={{ justifyContent: 'flex-start', margin: '10px 0' }}><button className="primary-button" onClick={() => upd(c.id, { status: 'Notice Period' }, 'Termination approved by Founder')}>Approve termination</button><button className="outline-button os-danger" onClick={() => upd(c.id, { status: 'Rejected' }, 'Termination rejected by Founder')}>Reject</button></div>
        : <Notice icon="shield" neutral={false}>Waiting for Founder approval.</Notice>)
        : <>
          <div className="step-list" style={{ margin: '12px 0' }}>{EXIT_CHECKS.map(([k, l]) => <div key={k} className="step"><button className={`os-check ${c.checks[k] ? 'on' : ''}`} disabled={!canCreate || c.status === 'Closed'} onClick={() => upd(c.id, { checks: { ...c.checks, [k]: !c.checks[k] }, status: c.status === 'Notice Period' ? 'Clearance' : c.status }, `${l}: ${c.checks[k] ? 'undone' : 'done'}`)}>{c.checks[k] && <Icon name="check" size={14} />}</button><div><b>{l}</b></div></div>)}</div>
          {canCreate && c.status !== 'Closed' && c.status !== 'Rejected' && <div className="actions" style={{ justifyContent: 'flex-start' }}>
            {emp?.status !== 'inactive' && <button className="outline-button os-danger" onClick={() => { if (!confirm(`Disable login for ${emp?.name}? They will not be able to sign in.`)) return; updateEmployee(c.employeeId, { status: 'inactive' }); upd(c.id, { checks: { ...c.checks, access: true } }, 'Login disabled'); }}>Disable login</button>}
            <button className="outline-button" onClick={() => setActiveTab('document-builder')}>Generate experience / relieving letter</button>
            <button className="outline-button" onClick={() => upd(c.id, { status: 'Full & Final' }, 'Moved to Full & Final')}>Move to Full & Final</button>
            <button className="primary-button" disabled={!allDone} title={allDone ? '' : 'Finish every checklist item first'} onClick={() => upd(c.id, { status: 'Closed' }, 'Exit closed')}>Close case</button>
          </div>}
        </>}
      <div className="eyebrow" style={{ marginTop: 18 }}>History</div>
      {c.log.slice().reverse().map((l, i) => <div key={i} className="list-row"><div><b>{l.text}</b><small>{l.by}</small></div><span className="muted">{l.at}</span></div>)}
    </OsModal>}
  </>);
};

// ===================================================================
// ACTION PERMISSIONS (View / Create / Edit / Delete / Approve / Export)
// ===================================================================
export const ActionPermissionsPage: React.FC = () => {
  const { currentRole, logAudit, setActiveTab } = useApp();
  const [acts, setActs] = useShared<Record<string, Record<number, string>>>(ACT_KEY, {});
  const [perm] = useShared<Record<string, number[]>>(OS_PERM_KEY, {});
  const [role, setRole] = useState('manager');
  const canEdit = currentRole === 'super_admin';
  const matrix = useMemo(() => readMatrix(), [perm]); // eslint-disable-line react-hooks/exhaustive-deps
  const mods = MODULES.slice(0, 12);
  const flags = (r: string, m: number) => (typeof acts[r]?.[m] === 'string' ? acts[r][m] : defaultActions(r, m));
  const toggle = (m: number, a: string) => {
    if (!canEdit || role === 'super_admin') return;
    const cur = flags(role, m); const next = cur.includes(a) ? cur.replace(a, '') : ACTIONS.map(([k]) => k).filter((k) => cur.includes(k) || k === a).join('');
    setActs((p) => ({ ...p, [role]: { ...(p[role] || {}), [m]: next } }));
    logAudit('ACTION_PERMISSION_CHANGED', roleLabel(role), `${MODULES[m]}: ${ACTIONS.find((x) => x[0] === a)?.[1]} -> ${next.includes(a) ? 'Yes' : 'No'}`);
  };
  const reset = () => { if (!confirm(`Reset ${roleLabel(role)} to recommended defaults?`)) return; setActs((p) => { const n = { ...p }; delete n[role]; return n; }); logAudit('ACTION_PERMISSIONS_RESET', roleLabel(role)); toast('Defaults restored'); };
  return (<>
    <Notice icon="lock" title="Fine-grained permissions">View = the module switch in the Permission Matrix. Here you decide, for each role and module, who can Create, Edit, Delete, Approve and Export. The app blocks the action and writes a "Permission denied" line in the audit trail. Only the Founder can change these.</Notice>
    <div className="card"><div className="toolbar"><div className="toolbar-left"><select className="os-select" value={role} onChange={(e) => setRole(e.target.value)}>{OS_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select><span className="muted">Delete is Founder / Owner only by default (no silent deletion).</span></div>
      <div className="actions"><button className="outline-button" onClick={() => setActiveTab('permissions')}>Module switches</button>{canEdit && role !== 'super_admin' && <button className="outline-button" onClick={reset}>Reset role</button>}</div></div>
      <div className="matrix-wrap"><table className="matrix" style={{ minWidth: 700 }}><thead><tr><th>Module</th><th>View</th>{ACTIONS.map(([k, l]) => <th key={k}>{l}</th>)}</tr></thead>
        <tbody>{mods.map((name, m) => { const view = role === 'super_admin' || matrix[role]?.[m] === 1; const f = flags(role, m); return (
          <tr key={name}><td>{name}</td><td><span className={`permission-toggle ${view ? 'yes' : 'no'} locked`}>{view ? 'Yes' : 'No'}</span></td>
            {ACTIONS.map(([k]) => { const on = view && (role === 'super_admin' || f.includes(k)); return <td key={k}><button className={`permission-toggle ${on ? 'yes' : 'no'} ${!canEdit || role === 'super_admin' || !view ? 'locked' : ''}`} disabled={!canEdit || role === 'super_admin' || !view} onClick={() => toggle(m, k)}>{on ? 'Yes' : 'No'}</button></td>; })}</tr>); })}</tbody></table></div></div>
    <div className="card" style={{ marginTop: 16 }}><div className="toolbar"><b style={{ fontSize: 13 }}>All roles at a glance</b><span className="muted">C Create {'\u00B7'} E Edit {'\u00B7'} D Delete {'\u00B7'} A Approve {'\u00B7'} X Export</span></div>
      <div className="matrix-wrap"><table className="matrix"><thead><tr><th>Role</th>{mods.map((x) => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{OS_ROLES.map((r) => <tr key={r.id} className="hover-link" onClick={() => setRole(r.id)}><td>{r.label}</td>{mods.map((x, m) => { const view = r.id === 'super_admin' || matrix[r.id]?.[m] === 1; return <td key={x}>{view ? <div className="perm-cell">{ACTIONS.map(([k]) => <button key={k} disabled className={r.id === 'super_admin' || flags(r.id, m).includes(k) ? 'on' : ''}>{k}</button>)}</div> : <span className="muted">{'\u2014'}</span>}</td>; })}</tr>)}</tbody></table></div></div>
  </>);
};
