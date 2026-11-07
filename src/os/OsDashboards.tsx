// AGENCYOS_V3_OS: role dashboards with live data
import React from 'react';
import { useApp } from '../context/AppContext';
import { readKey } from '../lib/sharedStore';
import { Icon } from './icons';
import { Kpi, Rows, Bars, Panel, Activity, Pill, inrS, inrF, today, fmtD, initials, daysBetween } from './OsUi';
import { useAlerts, useApprovalQueue, useCalendarEvents, useRecords, useWeekly } from './osData';
import { osCanAccess, pageById, FULL_ACCESS } from './osConfig';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const last7 = () => Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().slice(0, 10); });

const QuickNav: React.FC<{ ids: string[] }> = ({ ids }) => {
  const { setActiveTab, currentRole } = useApp();
  const list = ids.filter((k) => osCanAccess(currentRole, k)).map((k) => pageById(k)!).filter(Boolean);
  return (<div className="doc-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>{list.map((p) => <button key={p.id} className="outline-button" style={{ whiteSpace: 'normal', minHeight: 53, justifyContent: 'flex-start' }} onClick={() => setActiveTab(p.id)}><Icon name={p.icon} size={16} /> {p.name}</button>)}</div>);
};

const useRecent = () => {
  const { auditLogs } = useApp();
  return (auditLogs || []).slice(0, 5).map((a) => ({ who: initials(a.userName || 'AG'), title: String(a.action || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()), text: `${a.userName || ''}${a.relatedRecord ? ' \u00B7 ' + a.relatedRecord : ''}${a.details ? ' \u00B7 ' + String(a.details).slice(0, 60) : ''}`, time: `${fmtD(a.date)} ${a.time || ''}` }));
};

const collectionsBy = (payments: { date: string; amount: number }[], days: string[]) => days.map((d) => payments.filter((p) => p.date === d).reduce((s, p) => s + p.amount, 0));

// ---------------- Founder Command Center ----------------
export const FounderDashboard: React.FC = () => {
  const { payments, invoices, projects, setActiveTab } = useApp();
  const alerts = useAlerts(); const queue = useApprovalQueue(); const ev = useCalendarEvents();
  const month = today().slice(0, 7);
  const inst = readKey<{ date: string; amount: number }[]>('paa_x_installment_payments', []);
  const allPay = [...payments, ...inst];
  const coll = allPay.filter((p) => (p.date || '').startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const prevMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const prev = allPay.filter((p) => (p.date || '').startsWith(prevMonth)).reduce((s, p) => s + p.amount, 0);
  const trend = prev > 0 ? `${coll >= prev ? '+' : ''}${(((coll - prev) / prev) * 100).toFixed(1)}%` : '';
  const out = invoices.filter((i) => i.status !== 'cancelled' && i.status !== 'draft').reduce((s, i) => s + (i.balanceAmount || 0), 0);
  const overdue = invoices.filter((i) => i.balanceAmount > 0 && i.status !== 'cancelled' && i.dueDate < today());
  const crit = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High');
  const active = projects.filter((p) => p.status === 'active');
  const expPending = queue.filter((q) => q.key.startsWith('ex-') || q.key.startsWith('rmb-'));
  const days = last7();
  const t = today(); const in7 = new Date(); in7.setDate(in7.getDate() + 7); const t7 = in7.toISOString().slice(0, 10);
  const plans = ev.filter((e) => e.date >= t && e.date <= t7).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  return (<>
    <div className="kpis">
      <Kpi name="Collections" value={inrS(coll)} desc="Verified this month" icon="money" trend={trend} />
      <Kpi name="Outstanding" value={inrS(out)} desc="Invoices awaiting payment" icon="receipt" />
      <Kpi name="Critical Problems" value={String(crit.length).padStart(2, '0')} desc="Require attention" icon="bell" />
      <Kpi name="Active Projects" value={String(active.length).padStart(2, '0')} desc="Across delivery teams" icon="briefcase" />
    </div>
    <div className="columns thirds">
      <Panel title="01 / Money" right={<Pill v="Founder only" tone="blue" />}>
        <Rows items={[['Collections & Cash', `${inrF(coll)} received this month`, coll > 0 ? 'On Track' : 'Pending'], ['Pending Payments', `${overdue.length} overdue invoice(s)`, overdue.length ? 'Action Required' : 'On Track'], ['Expense Approvals', `${expPending.length} pending request(s)`, expPending.length ? 'Pending' : 'Approved']]} />
        <button className="outline-button full-width" style={{ marginTop: 14 }} onClick={() => setActiveTab('finance_desk')}>Open Finance</button>
      </Panel>
      <Panel title="02 / Problems" right={<Pill v={`${alerts.length} open`} tone="blue" />}>
        <Rows items={alerts.slice(0, 3).map((a) => [a.title, a.record, a.severity === 'Critical' ? 'Urgent' : a.status])} empty="No problems right now." />
        <button className="outline-button full-width" style={{ marginTop: 14 }} onClick={() => setActiveTab('alerts')}>Open Alerts</button>
      </Panel>
      <Panel title="03 / New Plans" right={<Pill v="This week" tone="blue" />}>
        <Rows items={plans.map((p) => [p.title, fmtD(p.date), p.date === t ? 'Due' : 'Scheduled'])} empty="Nothing planned in the next 7 days." />
        <button className="outline-button full-width" style={{ marginTop: 14 }} onClick={() => setActiveTab('calendar')}>Open Planner</button>
      </Panel>
    </div>
    <div className="columns">
      <Panel title="Weekly collections trend" right={<span className="muted">Last 7 days</span>}><Bars values={collectionsBy(allPay, days)} labels={days.map((d) => DAY[new Date(d + 'T00:00:00').getDay()])} legend="Payments received per day" note={inrF(collectionsBy(allPay, days).reduce((a, b) => a + b, 0)) + ' this week'} /></Panel>
      <Panel title="Founder approvals" right={<span className="link small" onClick={() => setActiveTab('approvals')}>See all</span>}>
        <Rows items={queue.slice(0, 4).map((q) => [q.category, `${q.code} \u00B7 ${q.scope}`, q.status])} empty="No approvals waiting." onClick={() => setActiveTab('approvals')} />
      </Panel>
    </div>
    <div className="columns equal">
      <Panel title="Recent activity" right={<span className="muted">Audit timeline</span>}><Activity items={useRecent()} /></Panel>
      <Panel title="Quick navigation" right={<span className="muted">Role-specific</span>}><QuickNav ids={['leads', 'clients', 'projects', 'approvals', 'employees', 'document_center']} /></Panel>
    </div>
  </>);
};

// ---------------- Operations Dashboard ----------------
export const OpsDashboard: React.FC = () => {
  const { projects, tasks, leads, employees, setActiveTab } = useApp();
  const alerts = useAlerts(); const t = today();
  const due = tasks.filter((k) => k.dueDate === t && k.status !== 'completed');
  const overdue = tasks.filter((k) => k.status !== 'completed' && k.dueDate && k.dueDate < t);
  const open = leads.filter((l) => !['won', 'lost'].includes(l.status));
  const days = last7();
  const name = (id: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  return (<>
    <div className="kpis">
      <Kpi name="Active Projects" value={String(projects.filter((p) => p.status === 'active').length).padStart(2, '0')} desc="Across delivery teams" icon="briefcase" />
      <Kpi name="Tasks Due Today" value={String(due.length).padStart(2, '0')} desc="Assigned team workload" icon="check" />
      <Kpi name="Client Escalations" value={String(alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').length).padStart(2, '0')} desc="Need manager action" icon="bell" />
      <Kpi name="Leads In Progress" value={String(open.length).padStart(2, '0')} desc="Sales pipeline activity" icon="target" />
    </div>
    <div className="columns">
      <Panel title="Weekly project delivery activity" right={<span className="muted">Tasks due per day</span>}><Bars values={days.map((d) => tasks.filter((k) => k.dueDate === d).length)} labels={days.map((d) => DAY[new Date(d + 'T00:00:00').getDay()])} legend="Tasks due" note={`${tasks.filter((k) => k.status === 'completed').length} completed in total`} /></Panel>
      <Panel title="Needs manager action" right={<span className="link small" onClick={() => setActiveTab('alerts')}>See all</span>}>
        <Rows items={[...overdue.slice(0, 3).map((k): [string, string, string] => [k.title, `${name(k.assignedEmployeeId)} \u00B7 due ${fmtD(k.dueDate)}`, 'Overdue']), ...tasks.filter((k) => k.status === 'review').slice(0, 2).map((k): [string, string, string] => [k.title, `${name(k.assignedEmployeeId)} \u00B7 submitted`, 'Review'])]} empty="Team is on track." />
      </Panel>
    </div>
    <div className="columns equal">
      <Panel title="Recent activity" right={<span className="muted">Audit timeline</span>}><Activity items={useRecent()} /></Panel>
      <Panel title="Quick navigation" right={<span className="muted">Role-specific</span>}><QuickNav ids={['projects', 'task_operations', 'leads', 'weekly-reports', 'capacity', 'deliverables']} /></Panel>
    </div>
  </>);
};

// ---------------- My Workspace ----------------
export const MyDashboard: React.FC = () => {
  const { tasks, currentUser, todayAttendance, setActiveTab, projects } = useApp();
  const t = today(); const mine = tasks.filter((k) => k.assignedEmployeeId === currentUser.id);
  const pending = mine.filter((k) => k.status !== 'completed');
  const weekAgo = last7()[0];
  const [weekly] = useWeekly();
  const days = last7();
  return (<>
    <div className="kpis">
      <Kpi name="My Pending Tasks" value={String(pending.length).padStart(2, '0')} desc="Assigned to this account" icon="list" />
      <Kpi name="Due Today" value={String(pending.filter((k) => k.dueDate <= t).length).padStart(2, '0')} desc="Needs attention" icon="clock" />
      <Kpi name="Done This Week" value={String(mine.filter((k) => k.status === 'completed' && (k.dueDate || '') >= weekAgo).length).padStart(2, '0')} desc="Submitted or approved" icon="check" />
      <Kpi name="Today's Check-in" value={todayAttendance?.checkIn || '\u2014'} desc={todayAttendance?.checkOut ? `Checked out ${todayAttendance.checkOut}` : 'Shift in progress'} icon="calendar" />
    </div>
    <div className="columns">
      <Panel title="My productivity overview" right={<span className="muted">Tasks due per day</span>}><Bars values={days.map((d) => mine.filter((k) => k.dueDate === d).length)} labels={days.map((d) => DAY[new Date(d + 'T00:00:00').getDay()])} legend="My tasks" /></Panel>
      <Panel title="Priority actions" right={<span className="link small" onClick={() => setActiveTab('my_tasks')}>See all</span>}>
        <Rows items={pending.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')).slice(0, 5).map((k) => [k.title, `${projects.find((p) => p.id === k.projectId)?.name || 'Internal'} \u00B7 due ${fmtD(k.dueDate)}`, k.dueDate < t ? 'Overdue' : k.status.replace('_', ' ')])} empty="No pending tasks. Great work!" onClick={() => setActiveTab('my_tasks')} />
      </Panel>
    </div>
    <div className="columns equal">
      <Panel title="My weekly reports" right={<span className="link small" onClick={() => setActiveTab('weekly-reports')}>Open</span>}>
        <Rows items={weekly.filter((w) => w.employeeId === currentUser.id).slice(0, 4).map((w) => [`Week ending ${fmtD(w.weekEnding)}`, `${w.done} tasks done \u00B7 ${w.blocked} blocked`, w.status])} empty="No weekly report submitted yet." />
      </Panel>
      <Panel title="Quick navigation" right={<span className="muted">Role-specific</span>}><QuickNav ids={['my_tasks', 'calendar', 'weekly-reports', 'attendance', 'leave', 'reimbursements']} /></Panel>
    </div>
  </>);
};

// ---------------- Sales Overview / Sales Performance ----------------
export const SalesDashboard: React.FC<{ report?: boolean }> = ({ report }) => {
  const { leads, employees, setActiveTab } = useApp();
  const month = today().slice(0, 7); const days = last7();
  const won = leads.filter((l) => l.status === 'won');
  const conv = leads.length ? Math.round((won.length / leads.length) * 100) : 0;
  const bySource = Object.entries(leads.reduce((m: Record<string, number>, l) => { m[l.source || 'Other'] = (m[l.source || 'Other'] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const reps = employees.map((e) => ({ e, n: leads.filter((l) => l.assignedEmployeeId === e.id).length, w: leads.filter((l) => l.assignedEmployeeId === e.id && l.status === 'won').length })).filter((x) => x.n).sort((a, b) => b.w - a.w || b.n - a.n);
  return (<>
    <div className="kpis">
      <Kpi name="New Leads" value={String(leads.filter((l) => (l.createdAt || '').startsWith(month)).length).padStart(2, '0')} desc="This month" icon="target" />
      <Kpi name="Active Follow-ups" value={String(leads.filter((l) => !['won', 'lost'].includes(l.status) && l.followUpDate).length).padStart(2, '0')} desc="Next actions planned" icon="clock" />
      <Kpi name="Qualified Leads" value={String(leads.filter((l) => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length).padStart(2, '0')} desc="In active discussion" icon="check" />
      <Kpi name="Deals Won" value={String(won.length).padStart(2, '0')} desc={`${conv}% conversion`} icon="chart" />
    </div>
    <div className="columns">
      <Panel title="Lead activity & conversions" right={<span className="muted">New leads per day</span>}><Bars values={days.map((d) => leads.filter((l) => (l.createdAt || '').slice(0, 10) === d).length)} labels={days.map((d) => DAY[new Date(d + 'T00:00:00').getDay()])} legend="Leads created" /></Panel>
      <Panel title={report ? 'Lead sources' : 'Priority actions'} right={<span className="link small" onClick={() => setActiveTab(report ? 'leads' : 'followups')}>See all</span>}>
        {report ? <Rows items={bySource.slice(0, 6).map(([s, n]) => [s, `${n} lead(s)`, `${Math.round((n / Math.max(1, leads.length)) * 100)}%`])} empty="No leads yet." />
          : <Rows items={leads.filter((l) => !['won', 'lost'].includes(l.status)).sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || '')).slice(0, 5).map((l) => [l.company || l.name, `${l.serviceRequired} \u00B7 follow-up ${fmtD(l.followUpDate)}`, l.followUpDate && l.followUpDate < today() ? 'Overdue' : l.status])} empty="No open leads." />}
      </Panel>
    </div>
    <div className="columns equal">
      <Panel title="Sales team performance" right={<span className="muted">Won / assigned</span>}><Rows items={reps.slice(0, 6).map((r) => [r.e.name, `${r.n} lead(s) assigned`, `${r.w} won`])} empty="No assigned leads yet." /></Panel>
      <Panel title="Quick navigation" right={<span className="muted">Role-specific</span>}><QuickNav ids={['leads', 'pipeline', 'followups', 'proposals', 'deals_quotations', 'lost']} /></Panel>
    </div>
  </>);
};

// ---------------- HR Overview ----------------
export const HrDashboard: React.FC = () => {
  const { employees, attendance, leaveRequests, regularizations, setActiveTab } = useApp();
  const [cands] = useRecords<any>('recruitment');
  const t = today(); const days = last7();
  const act = employees.filter((e) => e.status === 'active');
  const present = attendance.filter((a) => a.date === t && a.checkIn).length;
  const name = (id: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  return (<>
    <div className="kpis">
      <Kpi name="Employees" value={String(act.length).padStart(2, '0')} desc="Active accounts" icon="users" />
      <Kpi name="Present Today" value={String(present).padStart(2, '0')} desc="Attendance recorded" icon="check" />
      <Kpi name="Leave Requests" value={String(leaveRequests.filter((l) => l.status === 'pending').length).padStart(2, '0')} desc="Pending review" icon="calendar" />
      <Kpi name="Candidates" value={String(cands.filter((c: any) => c.status !== 'Joined' && c.status !== 'Rejected').length).padStart(2, '0')} desc="Hiring pipeline" icon="user" />
    </div>
    <div className="columns">
      <Panel title="Attendance & hiring activity" right={<span className="muted">Present per day</span>}><Bars values={days.map((d) => attendance.filter((a) => a.date === d && a.checkIn).length)} labels={days.map((d) => DAY[new Date(d + 'T00:00:00').getDay()])} legend="Employees present" /></Panel>
      <Panel title="Pending HR actions" right={<span className="link small" onClick={() => setActiveTab('approvals')}>See all</span>}>
        <Rows items={[...leaveRequests.filter((l) => l.status === 'pending').slice(0, 3).map((l): [string, string, string] => ['Leave application', `${name(l.employeeId)} \u00B7 ${l.leaveType}`, 'Pending']), ...regularizations.filter((r) => r.status === 'pending').slice(0, 2).map((r): [string, string, string] => ['Attendance correction', `${name(r.employeeId)} \u00B7 ${fmtD(r.date)}`, 'Review'])]} empty="No pending HR actions." />
      </Panel>
    </div>
    <div className="columns equal">
      <Panel title="Recent activity" right={<span className="muted">Audit timeline</span>}><Activity items={useRecent()} /></Panel>
      <Panel title="Quick navigation" right={<span className="muted">Role-specific</span>}><QuickNav ids={['employees', 'attendance', 'leave', 'recruitment', 'hr_onboarding', 'document_center']} /></Panel>
    </div>
  </>);
};

// ---------------- Team Performance ----------------
export const TeamDashboard: React.FC = () => {
  const { tasks, employees } = useApp(); const t = today(); const days = last7();
  const done = tasks.filter((k) => k.status === 'completed'); const overdue = tasks.filter((k) => k.status !== 'completed' && k.dueDate && k.dueDate < t);
  const act = employees.filter((e) => e.status === 'active');
  const busy = new Set(tasks.filter((k) => k.status === 'in_progress').map((k) => k.assignedEmployeeId)).size;
  const per = act.map((e) => { const m = tasks.filter((k) => k.assignedEmployeeId === e.id); return { e, total: m.length, done: m.filter((k) => k.status === 'completed').length, late: m.filter((k) => k.status !== 'completed' && k.dueDate && k.dueDate < t).length }; }).filter((x) => x.total).sort((a, b) => b.done - a.done);
  return (<>
    <div className="kpis">
      <Kpi name="Tasks Completed" value={String(done.length).padStart(2, '0')} desc="All time" icon="check" />
      <Kpi name="Overdue Tasks" value={String(overdue.length).padStart(2, '0')} desc="Require review" icon="clock" />
      <Kpi name="Team Utilization" value={`${act.length ? Math.round((busy / act.length) * 100) : 0}%`} desc="People with work in progress" icon="chart" />
      <Kpi name="Pending Review" value={String(tasks.filter((k) => k.status === 'review').length).padStart(2, '0')} desc="Manager queue" icon="bell" />
    </div>
    <div className="columns">
      <Panel title="Task deadlines this week" right={<span className="muted">Due per day</span>}><Bars values={days.map((d) => tasks.filter((k) => k.dueDate === d).length)} labels={days.map((d) => DAY[new Date(d + 'T00:00:00').getDay()])} legend="Tasks due" /></Panel>
      <Panel title="Team members" right={<span className="muted">Done / total</span>}><Rows items={per.slice(0, 6).map((x) => [x.e.name, `${x.done} of ${x.total} task(s) done`, x.late ? `${x.late} overdue` : 'On Track'])} empty="No tasks assigned yet." /></Panel>
    </div>
  </>);
};

// ---------------- Company Intelligence ----------------
export const ReportsDashboard: React.FC = () => {
  const { payments, leads, tasks, invoices, expenses, clients, setActiveTab } = useApp();
  const alerts = useAlerts(); const t = today(); const month = t.slice(0, 7);
  const coll = payments.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const onTime = tasks.length ? Math.round((tasks.filter((k) => k.status === 'completed' || !k.dueDate || k.dueDate >= t).length / tasks.length) * 100) : 100;
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); });
  const top = clients.map((c) => ({ c, v: invoices.filter((i) => i.clientId === c.id).reduce((s, i) => s + i.totalAmount, 0) })).sort((a, b) => b.v - a.v).slice(0, 5);
  return (<>
    <div className="kpis">
      <Kpi name="Collections" value={inrS(coll)} desc="This month" icon="money" />
      <Kpi name="Qualified Leads" value={String(leads.filter((l) => ['qualified', 'proposal', 'negotiation', 'won'].includes(l.status)).length).padStart(2, '0')} desc="Sales result" icon="target" />
      <Kpi name="Project Health" value={`${onTime}%`} desc="Tasks on time" icon="chart" />
      <Kpi name="Open Exceptions" value={String(alerts.length).padStart(2, '0')} desc="Founder review" icon="bell" />
    </div>
    <div className="columns">
      <Panel title="Collections vs expenses (6 months)" right={<span className="muted">Navy = collections, gold = expenses</span>}>
        <Bars values={months.flatMap((m) => [payments.filter((p) => p.date.startsWith(m)).reduce((s, p) => s + p.amount, 0), expenses.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0)])} labels={months.flatMap((m) => [new Date(m + '-01T00:00:00').toLocaleString('en-IN', { month: 'short' }), ''])} legend="Monthly totals" />
      </Panel>
      <Panel title="Top clients by billing" right={<span className="link small" onClick={() => setActiveTab('profitability')}>Profitability</span>}><Rows items={top.map((x) => [x.c.companyName, `${inrF(x.v)} billed`, x.c.status])} empty="No invoices yet." /></Panel>
    </div>
    <div className="columns equal">
      <Panel title="Open exceptions" right={<span className="link small" onClick={() => setActiveTab('alerts')}>See all</span>}><Rows items={alerts.slice(0, 5).map((a) => [a.title, a.record, a.severity])} empty="No exceptions." /></Panel>
      <Panel title="Report library" right={<span className="muted">Open a report</span>}><QuickNav ids={['sales-report', 'team-report', 'profitability', 'finance_desk', 'business_finance', 'analytics']} /></Panel>
    </div>
  </>);
};

export const isFounderish = (r: string) => FULL_ACCESS.includes(r);
export { daysBetween };
