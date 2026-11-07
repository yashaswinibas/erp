// AGENCYOS_V5_P26_DONE
// AGENCYOS_V4_P25_DONE
// AGENCYOS_V3_OS: live data used by the OS screens (alerts, approvals, calendar, local records)
import { useApp } from '../context/AppContext';
import { useShared, uid, nowStamp } from '../lib/sharedStore';
import { QuotationExtra } from '../lib/crmTypes';
import { osCanAccess, FULL_ACCESS } from './osConfig';
import { canApproveAmount, reviewerFor } from './osP26';
import { today, daysBetween, inrF, fmtD } from './OsUi';

// ---------- local record stores ----------
export interface FinRequest { id: string; code: string; category: string; title: string; amount: number; requestedBy: string; requestedById: string; at: string; status: 'Pending' | 'Approved' | 'Rejected'; reviewer?: string; note?: string }
export interface WeeklyReport { id: string; employeeId: string; weekEnding: string; done: number; blocked: number; summary: string; plan: string; status: 'Submitted' | 'Approved' | 'Rework'; reviewer?: string; reviewNote?: string; at: string }
export const useFinRequests = () => useShared<FinRequest[]>('paa_x_os_fin_requests', []);
export const useWeekly = () => useShared<WeeklyReport[]>('paa_x_os_weekly', []);
export const useExpStatus = () => useShared<Record<string, { status: 'Pending' | 'Approved' | 'Rejected'; evidence?: string; by?: string }>>('paa_x_os_exp_status', {});
export const useFollowLog = () => useShared<Record<string, { next?: string; note?: string; log: { at: string; by: string; note: string }[] }>>('paa_x_os_followups', {});
export const useLostReasons = () => useShared<Record<string, string>>('paa_x_os_lost', {});
export const useRecords = <T,>(kind: string, seed: T[] = []) => useShared<T[]>('paa_x_os_rec_' + kind, seed);

const isManagerish = (r: string) => FULL_ACCESS.includes(r) || ['manager', 'hr', 'operations_manager', 'project_manager', 'team_leader', 'sales_team_leader', 'project_coordinator', 'sales_manager', 'finance'].includes(r);

// ---------- approval queue ----------
export interface ApprovalItem { key: string; code: string; by: string; category: string; scope: string; reviewer: string; status: string; date: string; canAct: boolean; approve: (note?: string) => void; reject: (note?: string) => void }

export function useApprovalQueue(): ApprovalItem[] {
  const app = useApp();
  const { currentRole, currentUser, employees, reimbursements, leaveRequests, regularizations, reviewReimbursement, reviewLeave, reviewRegularization, logAudit, clients, quotations, expenses } = app;
  const [fin, setFin] = useFinRequests();
  const [weekly, setWeekly] = useWeekly();
  const [expSt, setExpSt] = useExpStatus();
  const [qx, setQx] = useShared<QuotationExtra[]>('paa_x_quotation_extras', []);
  const name = (id?: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  const out: ApprovalItem[] = [];
  const canClaims = osCanAccess(currentRole, 'approve_claims');
  for (const r of reimbursements.filter((x) => x.status === 'submitted' || x.status === 'under_review')) {
    const mOk = canApproveAmount(currentRole, r.amount, r.employeeId, currentUser.id);
    if (!canClaims && !mOk && r.employeeId !== currentUser.id) continue;
    out.push({ key: 'rmb-' + r.id, code: r.reimbursementCode, by: name(r.employeeId), category: 'Expense Claim \u00B7 ' + r.category, scope: inrF(r.amount), reviewer: reviewerFor(r.amount), status: 'Pending', date: r.date, canAct: (canClaims || mOk) && r.employeeId !== currentUser.id,
      approve: (n) => reviewReimbursement(r.id, 'approved', n || 'Approved in Approval Center'), reject: (n) => reviewReimbursement(r.id, 'rejected', n || 'Rejected in Approval Center') });
  }
  const leaveOk = isManagerish(currentRole);
  for (const l of leaveRequests.filter((x) => x.status === 'pending')) {
    if (!leaveOk && l.employeeId !== currentUser.id) continue;
    out.push({ key: 'lv-' + l.id, code: l.leaveCode, by: name(l.employeeId), category: 'Leave \u00B7 ' + l.leaveType, scope: `${l.daysCount} day(s) \u00B7 ${fmtD(l.startDate)}`, reviewer: 'HR / Manager', status: 'Pending', date: l.appliedAt?.slice(0, 10) || l.startDate, canAct: leaveOk && l.employeeId !== currentUser.id,
      approve: (n) => reviewLeave(l.id, 'approved', n), reject: (n) => reviewLeave(l.id, 'rejected', n) });
  }
  for (const g of regularizations.filter((x) => x.status === 'pending')) {
    if (!leaveOk && g.employeeId !== currentUser.id) continue;
    out.push({ key: 'reg-' + g.id, code: 'ATT-' + g.id.slice(-5).toUpperCase(), by: name(g.employeeId), category: 'Attendance Correction', scope: `${fmtD(g.date)} \u00B7 ${g.correctCheckIn}-${g.correctCheckOut}`, reviewer: 'HR / Manager', status: 'Pending', date: g.date, canAct: leaveOk && g.employeeId !== currentUser.id,
      approve: (n) => reviewRegularization(g.id, 'approved', n), reject: (n) => reviewRegularization(g.id, 'rejected', n) });
  }
  const founder = FULL_ACCESS.includes(currentRole);
  const quoteOk = founder || ['manager', 'sales_manager'].includes(currentRole);
  for (const x of qx.filter((q) => q.approval === 'pending')) {
    const q = quotations.find((y) => y.id === x.quotationId); if (!q) continue;
    if (!quoteOk && !osCanAccess(currentRole, 'deals_quotations')) continue;
    const set = (approval: 'approved' | 'rejected', n?: string) => { setQx((p) => p.map((y) => (y.quotationId === x.quotationId ? { ...y, approval, approvedBy: currentUser.name, approvalNote: n } : y))); logAudit('QUOTATION_' + approval.toUpperCase(), q.quotationNumber, n); };
    out.push({ key: 'qt-' + q.id, code: q.quotationNumber, by: q.createdBy || '\u2014', category: 'Quotation / Discount', scope: inrF(q.total) + ' \u00B7 ' + (clients.find((c) => c.id === q.clientId)?.companyName || ''), reviewer: (q.discount || 0) > 0 ? 'Founder (discount)' : 'Founder / Sales Manager', status: 'Pending', date: q.date, canAct: founder || (quoteOk && !((q.discount || 0) > 0)),
      approve: (n) => set('approved', n), reject: (n) => set('rejected', n) });
  }
  for (const e of expenses.filter((x) => expSt[x.id]?.status === 'Pending')) {
    const set = (status: 'Approved' | 'Rejected', n?: string) => { setExpSt((p) => ({ ...p, [e.id]: { ...p[e.id], status } })); logAudit('EXPENSE_' + status.toUpperCase(), e.expenseCode, n); };
    out.push({ key: 'ex-' + e.id, code: e.expenseCode, by: expSt[e.id]?.by || name(e.employeeId), category: 'Business Expense \u00B7 ' + e.category, scope: inrF(e.amount), reviewer: reviewerFor(e.amount), status: 'Pending', date: e.date, canAct: founder || canApproveAmount(currentRole, e.amount, e.employeeId, currentUser.id),
      approve: (n) => set('Approved', n), reject: (n) => set('Rejected', n) });
  }
  for (const f of fin.filter((x) => x.status === 'Pending')) {
    const opsCat = ['Client Work Exception', 'Document Approval', 'HR Approval'].includes(f.category);
    const can = founder || (opsCat && osCanAccess(currentRole, 'approvals') && f.requestedById !== currentUser.id) || (f.category === 'Expense' && canApproveAmount(currentRole, f.amount, f.requestedById, currentUser.id));
    if (!can && f.requestedById !== currentUser.id && !osCanAccess(currentRole, 'approvals')) continue;
    const set = (status: 'Approved' | 'Rejected', n?: string) => { setFin((p) => p.map((y) => (y.id === f.id ? { ...y, status, reviewer: currentUser.name, note: n } : y))); logAudit('APPROVAL_' + status.toUpperCase(), f.code, `${f.category}: ${f.title}`); };
    out.push({ key: 'fr-' + f.id, code: f.code, by: f.requestedBy, category: f.category, scope: f.amount ? inrF(f.amount) : f.title, reviewer: opsCat ? 'Manager' : f.category === 'Expense' ? reviewerFor(f.amount) : 'Founder', status: 'Pending', date: f.at.slice(0, 10), canAct: can, approve: (n) => set('Approved', n), reject: (n) => set('Rejected', n) });
  }
  const weeklyOk = isManagerish(currentRole);
  for (const w of weekly.filter((x) => x.status === 'Submitted')) {
    if (!weeklyOk && w.employeeId !== currentUser.id) continue;
    const set = (status: 'Approved' | 'Rework', n?: string) => setWeekly((p) => p.map((y) => (y.id === w.id ? { ...y, status, reviewer: currentUser.name, reviewNote: n } : y)));
    out.push({ key: 'wk-' + w.id, code: 'WR-' + w.weekEnding, by: name(w.employeeId), category: 'Weekly Work Report', scope: `${w.done} done \u00B7 ${w.blocked} blocked`, reviewer: 'Team Lead / Manager', status: 'Pending Review', date: w.weekEnding, canAct: weeklyOk && w.employeeId !== currentUser.id,
      approve: (n) => set('Approved', n), reject: (n) => set('Rework', n || 'Please rework') });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export const newFinRequest = (category: string, title: string, amount: number, by: { id: string; name: string }): FinRequest =>
  ({ id: uid('fr'), code: 'REQ-' + Date.now().toString().slice(-5), category, title, amount, requestedBy: by.name, requestedById: by.id, at: nowStamp(), status: 'Pending' });

// ---------- alerts & escalations ----------
export interface AlertItem { severity: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; record: string; owner: string; raised: string; status: string; tab: string }

export function useAlerts(): AlertItem[] {
  const { leads, invoices, tasks, employees, attendance, agreements, leaveRequests, currentRole, currentUser, company, clients } = useApp();
  const [follow] = useFollowLog();
  const t = today();
  const name = (id?: string) => employees.find((e) => e.id === id)?.name || '\u2014';
  const mineOnly = !FULL_ACCESS.includes(currentRole) && !['manager', 'operations_manager', 'sales_manager', 'hr', 'finance', 'project_manager', 'team_leader', 'client_relationship_manager'].includes(currentRole);
  const out: AlertItem[] = [];
  const now = Date.now();
  if (osCanAccess(currentRole, 'leads') || mineOnly) {
    for (const l of leads) {
      if (mineOnly && l.assignedEmployeeId !== currentUser.id) continue;
      if (l.status === 'new' || (l.status as string) === 'assigned') {
        const age = (now - +new Date(l.createdAt)) / 3600000;
        if (age >= 24) out.push({ severity: 'Critical', title: 'Lead not handled in 24 hours \u2014 escalate to manager', record: l.leadCode + ' \u00B7 ' + l.company, owner: name(l.assignedEmployeeId), raised: fmtD(l.createdAt.slice(0, 10)), status: 'Escalated', tab: 'leads' });
        else if (age >= 1) out.push({ severity: 'High', title: 'Lead not contacted within 1 hour', record: l.leadCode + ' \u00B7 ' + l.company, owner: name(l.assignedEmployeeId), raised: fmtD(l.createdAt.slice(0, 10)), status: 'Open', tab: 'leads' });
      }
      const next = follow[l.id]?.next || l.followUpDate;
      if (next && next < t && !['won', 'lost'].includes(l.status)) out.push({ severity: 'Medium', title: 'Follow-up overdue', record: l.leadCode + ' \u00B7 ' + l.company, owner: name(l.assignedEmployeeId), raised: fmtD(next), status: 'Pending', tab: 'followups' });
    }
  }
  if (osCanAccess(currentRole, 'billing') || osCanAccess(currentRole, 'receivables')) {
    for (const i of invoices.filter((x) => x.balanceAmount > 0 && x.status !== 'cancelled' && x.status !== 'draft' && x.dueDate < t))
      out.push({ severity: 'High', title: `Invoice overdue \u2014 ${inrF(i.balanceAmount)} pending`, record: i.invoiceNumber + ' \u00B7 ' + (clients.find((c) => c.id === i.clientId)?.companyName || ''), owner: 'Accounts', raised: fmtD(i.dueDate), status: 'Overdue', tab: 'receivables' });
  }
  for (const k of tasks.filter((x) => x.status !== 'completed' && x.dueDate && x.dueDate < t)) {
    if (mineOnly && k.assignedEmployeeId !== currentUser.id) continue;
    if (!mineOnly && !osCanAccess(currentRole, 'task_operations') && k.assignedEmployeeId !== currentUser.id) continue;
    out.push({ severity: daysBetween(k.dueDate, t) > 3 ? 'High' : 'Medium', title: 'Task deadline missed', record: k.taskCode + ' \u00B7 ' + k.title, owner: name(k.assignedEmployeeId), raised: fmtD(k.dueDate), status: 'Overdue', tab: mineOnly ? 'my_tasks' : 'task_operations' });
  }
  if (FULL_ACCESS.includes(currentRole) || currentRole === 'hr') {
    const start = company.officeStartTime || '09:30';
    const nowHM = new Date().toTimeString().slice(0, 5);
    if (nowHM > start) for (const e of employees.filter((x) => x.status === 'active')) {
      if (!attendance.some((a) => a.employeeId === e.id && a.date === t)) out.push({ severity: 'Low', title: 'Attendance missing today', record: e.employeeId + ' \u00B7 ' + e.name, owner: 'HR', raised: 'Today', status: 'Pending', tab: 'attendance' });
    }
    for (const l of leaveRequests.filter((x) => x.status === 'pending')) out.push({ severity: 'Low', title: 'Leave request awaiting approval', record: l.leaveCode + ' \u00B7 ' + name(l.employeeId), owner: 'HR Manager', raised: fmtD(l.startDate), status: 'Pending', tab: 'approvals' });
  }
  if (osCanAccess(currentRole, 'deals_agreements')) {
    for (const a of agreements.filter((x) => x.status === 'active')) {
      const end = a.renewalDate || a.endDate; if (!end) continue;
      const d = daysBetween(t, end);
      if (d >= 0 && d <= 7) out.push({ severity: 'Medium', title: `Client renewal due in ${d} day(s)`, record: a.agreementNumber + ' \u00B7 ' + (clients.find((c) => c.id === a.clientId)?.companyName || ''), owner: 'Account Manager', raised: fmtD(end), status: 'Due Soon', tab: 'deals_agreements' });
    }
  }
  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// ---------- calendar events ----------
export interface CalEvent { date: string; title: string; tone: '' | 'gold' | 'red'; tab: string }
export function useCalendarEvents(): CalEvent[] {
  const { tasks, invoices, leads, agreements, leaveRequests, projects, employees, currentRole, currentUser, clients } = useApp();
  const [posts] = useRecords<any>('content');
  const [follow] = useFollowLog();
  const own = !FULL_ACCESS.includes(currentRole) && ['employee', 'sales_executive', 'freelancer'].includes(currentRole);
  const ev: CalEvent[] = [];
  for (const k of tasks) if (k.dueDate && (!own || k.assignedEmployeeId === currentUser.id) && (own || osCanAccess(currentRole, 'task_operations') || k.assignedEmployeeId === currentUser.id)) ev.push({ date: k.dueDate, title: (k.status === 'completed' ? '\u2713 ' : '') + k.title, tone: k.status !== 'completed' && k.dueDate < today() ? 'red' : '', tab: own ? 'my_tasks' : 'task_operations' });
  if (osCanAccess(currentRole, 'billing')) for (const i of invoices) if (i.balanceAmount > 0 && i.status !== 'cancelled') ev.push({ date: i.dueDate, title: 'Invoice due \u00B7 ' + i.invoiceNumber, tone: 'red', tab: 'receivables' });
  if (osCanAccess(currentRole, 'leads')) for (const l of leads) { if (own && l.assignedEmployeeId !== currentUser.id) continue; const d = follow[l.id]?.next || l.followUpDate; if (d && !['won', 'lost'].includes(l.status)) ev.push({ date: d, title: 'Follow-up \u00B7 ' + l.company, tone: '', tab: 'followups' }); }
  if (osCanAccess(currentRole, 'deals_agreements')) for (const a of agreements) { const d = a.renewalDate || a.endDate; if (d) ev.push({ date: d, title: 'Renewal \u00B7 ' + (clients.find((c) => c.id === a.clientId)?.companyName || a.agreementNumber), tone: 'gold', tab: 'deals_agreements' }); }
  if (osCanAccess(currentRole, 'projects')) for (const p of projects) { if (p.endDate) ev.push({ date: p.endDate, title: 'Project due \u00B7 ' + p.name, tone: 'gold', tab: 'projects' }); }
  for (const l of leaveRequests.filter((x) => x.status === 'approved' && (!own || x.employeeId === currentUser.id))) ev.push({ date: l.startDate, title: 'Leave \u00B7 ' + (employees.find((e) => e.id === l.employeeId)?.name || ''), tone: '', tab: 'leave' });
  for (const p of posts) if (p.date) ev.push({ date: p.date, title: (p.platform ? p.platform + ' \u00B7 ' : '') + (p.title || 'Post'), tone: 'gold', tab: 'content-calendar' });
  return ev;
}
