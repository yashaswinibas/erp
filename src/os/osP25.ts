// AGENCYOS_V5_P26_DONE
// AGENCYOS_V4_P25: org structure, action permissions, team scope, lead rules, task review, exits, guard
import { readKey, writeKey, uid, nowStamp } from '../lib/sharedStore';
import { MODULES, M, FULL_ACCESS, isStaffRole, isTeamLeadRole, DEFAULT_MATRIX, readMatrix, pageById, ALIASES } from './osConfig';
import { toast } from './OsUi';

// ================= ORGANIZATION STRUCTURE =================
export interface OrgPos { name: string; seats: number; role: string }
export interface OrgUnit { key: string; name: string; dept: string; positions: OrgPos[] }
const P = (name: string, seats: number, role: string): OrgPos => ({ name, seats, role });
export const ORG_UNITS: OrgUnit[] = [
  { key: 'leadership', dept: 'Leadership', name: 'Leadership', positions: [P('Founder / Owner / Super Admin', 1, 'super_admin'), P('General Manager', 1, 'manager')] },
  { key: 'hr', dept: 'HR Department', name: 'HR Department', positions: [P('HR Manager', 1, 'hr'), P('Recruiter', 2, 'recruiter'), P('HR Executive', 2, 'hr_executive')] },
  { key: 'finance', dept: 'Accounts & Finance Department', name: 'Accounts & Finance Department', positions: [P('Accounts & Finance Manager', 1, 'finance'), P('Accountant', 2, 'accountant'), P('Billing Executive', 2, 'billing_executive')] },
  { key: 'sales', dept: 'Sales Department', name: 'Sales Department', positions: [P('Sales Manager', 1, 'sales_manager'), P('Sales Team Leader', 1, 'sales_team_leader'), P('Sales Executive', 2, 'sales_executive'), P('Telecaller', 2, 'telecaller')] },
  { key: 'crm', dept: 'Client Relationship Department', name: 'Client Relationship Department', positions: [P('Client Relationship Manager', 1, 'client_relationship_manager'), P('Client Support Executive', 2, 'client_support_executive')] },
  { key: 'ops', dept: 'Operations / Project Department', name: 'Operations / Project Department', positions: [P('Operations / Project Manager', 1, 'operations_manager'), P('Project Coordinator', 2, 'project_coordinator'), P('Team Leader', 0, 'team_leader')] },
  { key: 'perf', dept: 'Service Delivery', name: 'Performance Marketing Team', positions: [P('Team Leader', 1, 'team_leader'), P('Meta Ads Specialist', 2, 'employee'), P('Google Ads Specialist', 2, 'employee'), P('SEO Specialist', 2, 'employee')] },
  { key: 'social', dept: 'Service Delivery', name: 'Social Media Team', positions: [P('Team Leader', 1, 'team_leader'), P('Social Media Manager', 2, 'employee'), P('Content Strategist', 2, 'employee')] },
  { key: 'creative', dept: 'Service Delivery', name: 'Creative Design Team', positions: [P('Team Leader', 1, 'team_leader'), P('Graphic Designer', 2, 'employee'), P('Brand Designer', 2, 'employee')] },
  { key: 'video', dept: 'Service Delivery', name: 'Video & Editing Team', positions: [P('Team Leader', 1, 'team_leader'), P('Video Editor', 2, 'employee'), P('Reels Editor', 2, 'employee')] },
  { key: 'web', dept: 'Service Delivery', name: 'Website Development Team', positions: [P('Team Leader', 1, 'team_leader'), P('Web Developer', 2, 'employee'), P('UI/UX Designer', 2, 'employee')] },
  { key: 'leadgen', dept: 'Service Delivery', name: 'Lead Generation & Automation Team', positions: [P('Team Leader', 1, 'team_leader'), P('Lead Gen Specialist', 2, 'employee'), P('WhatsApp Automation Executive', 2, 'employee')] },
  { key: 'gmb', dept: 'Service Delivery', name: 'GMB / Local Marketing Team', positions: [P('Team Leader', 1, 'team_leader'), P('GMB Specialist', 2, 'employee')] },
  { key: 'creator', dept: 'Service Delivery', name: 'Creator / Influencer Outreach Team', positions: [P('Team Leader', 1, 'team_leader'), P('Outreach Executive', 2, 'employee')] },
  { key: 'strategy', dept: 'Service Delivery', name: 'Business Consulting / Strategy Team', positions: [P('Team Leader', 1, 'team_leader'), P('Strategy Executive', 2, 'employee')] },
  { key: 'external', dept: 'External / Limited Users', name: 'External / Limited Users', positions: [P('Freelancer', 0, 'freelancer'), P('Consultant', 0, 'consultant'), P('Auditor', 0, 'auditor'), P('Vendor', 0, 'vendor')] },
];
export const unitByKey = (k: string) => ORG_UNITS.find((u) => u.key === k);

export interface OrgPlace { unit: string; position: string; reportsTo: string }
export const ORG_KEY = 'paa_x_os_org';
export const readOrg = () => readKey<Record<string, OrgPlace>>(ORG_KEY, {});
export const writeOrg = (v: Record<string, OrgPlace>) => writeKey(ORG_KEY, v);

/** Team of a team leader: people who report to them + people in the same unit (except managers). */
export function teamOf(me: string, employees: { id: string }[]): Set<string> {
  const org = readOrg(); const mine = org[me];
  const ids = new Set<string>([me]);
  for (const e of employees) {
    const p = org[e.id]; if (!p) continue;
    if (p.reportsTo === me) ids.add(e.id);
    if (mine && mine.unit && p.unit === mine.unit && !/manager/i.test(p.position)) ids.add(e.id);
  }
  return ids;
}

/** Applies Team Leader scope (own team only). Used by lib/scope.ts */
export function scopeTeam<T>(a: any): T {
  const me = a.currentUser?.id; const team = teamOf(me, a.employees || []);
  const tasks = (a.tasks || []).filter((t: any) => team.has(t.assignedEmployeeId));
  const pids = new Set(tasks.map((t: any) => t.projectId));
  return {
    ...a,
    employees: (a.employees || []).filter((e: any) => team.has(e.id)),
    tasks,
    projects: (a.projects || []).filter((p: any) => team.has(p.projectManagerId) || (p.assignedEmployeeIds || []).some((x: string) => team.has(x)) || pids.has(p.id)),
    leads: (a.leads || []).filter((l: any) => team.has(l.assignedEmployeeId)),
    fieldVisits: (a.fieldVisits || []).filter((v: any) => team.has(v.employeeId)),
    attendance: (a.attendance || []).filter((r: any) => team.has(r.employeeId)),
  } as T;
}
export { isTeamLeadRole };

// ================= ACTION PERMISSIONS =================
export const ACTIONS: [string, string][] = [['C', 'Create'], ['E', 'Edit'], ['D', 'Delete'], ['A', 'Approve'], ['X', 'Export']];
export const ACT_KEY = 'paa_x_os_actions';
const MANAGERS = ['manager', 'hr', 'finance', 'sales_manager', 'operations_manager', 'project_manager', 'client_relationship_manager'];
const LEADS = ['team_leader', 'sales_team_leader', 'project_coordinator'];

export function defaultActions(role: string, m: number): string {
  const view = (DEFAULT_MATRIX[role] || [])[m] === 1;
  if (role === 'super_admin') return 'CEDAX';
  if (!view) return '';
  if (role === 'admin') return 'CEDAX';
  if (role === 'auditor') return 'X';
  if (isStaffRole(role)) return m === M.CRM ? 'CE' : m === M.TSK ? 'E' : '';
  if (MANAGERS.includes(role)) return 'CEAX';
  if (LEADS.includes(role)) return m === M.TSK || m === M.PRJ ? 'CEA' : 'CE';
  return 'CE';
}
export const readActions = (): Record<string, Record<number, string>> => readKey(ACT_KEY, {});
/** Can this role do action (C/E/D/A/X) in module m?  View = module ON in the Permission Matrix. */
export function osCan(role: string, m: number, act: string): boolean {
  if (role === 'super_admin') return true;
  if (readMatrix()[role]?.[m] !== 1) return false;
  const saved = readActions()[role]?.[m];
  const flags = typeof saved === 'string' ? saved : defaultActions(role, m);
  return flags.includes(act);
}
export const moduleOfTab = (tab: string): number | null => pageById(ALIASES[tab] || tab)?.module ?? null;

// ================= GUARD around AppContext actions =================
type Rule = [number, string, number?];
const RULES: Record<string, Rule> = {
  addLead: [M.CRM, 'C'], updateLeadStatus: [M.CRM, 'E'], convertLeadToClient: [M.CLI, 'C'],
  addClient: [M.CLI, 'C'], updateClient: [M.CLI, 'E'],
  addProject: [M.PRJ, 'C'], updateProject: [M.PRJ, 'E'],
  addTask: [M.TSK, 'C'], updateTask: [M.TSK, 'E'], updateTaskStatus: [M.TSK, 'E'], deleteTask: [M.TSK, 'D'],
  addQuotation: [M.CRM, 'C'], updateQuotation: [M.CRM, 'E'], acceptQuotation: [M.CRM, 'E'],
  addAgreement: [M.CLI, 'C'], updateAgreement: [M.CLI, 'E'],
  addInvoice: [M.FIN, 'C'], addPayment: [M.FIN, 'C'], addExpense: [M.FIN, 'C'],
  addEmployee: [M.HR, 'C'], updateEmployee: [M.HR, 'E', M.PAY], addDepartment: [M.HR, 'C'], addDesignation: [M.HR, 'C'],
  generatePayslipForEmployee: [M.PAY, 'C'], updateCompany: [M.SET, 'E'],
};
const ACT_NAME: Record<string, string> = { C: 'create', E: 'edit', D: 'delete', A: 'approve', X: 'export' };

export function osGuard<T extends Record<string, any>>(v: T): T {
  const role = v.currentRole as string;
  if (!v.isAuthenticated || role === 'super_admin') return wrapLead(v);
  const out: any = { ...v };
  for (const [fn, [m, act, alt]] of Object.entries(RULES)) {
    const orig = v[fn]; if (typeof orig !== 'function') continue;
    out[fn] = (...args: any[]) => {
      const ok = osCan(role, m, act) || (alt !== undefined && (osCan(role, alt, 'E') || osCan(role, alt, 'C')));
      if (!ok) {
        toast(`You don't have permission to ${ACT_NAME[act]} in ${MODULES[m]}. Ask the Founder to allow it.`);
        try { v.logAudit?.('PERMISSION_DENIED', MODULES[m], `${fn} blocked for role ${role}`); } catch { /* ignore */ }
        return undefined;
      }
      if (act === 'D') { try { v.logAudit?.('RECORD_DELETED', MODULES[m], `${fn}(${JSON.stringify(args[0]).slice(0, 80)}) by ${v.currentUser?.name || role}`); } catch { /* ignore */ } }
      return orig(...args);
    };
  }
  return wrapLead(out);
}

// ================= LEAD RULES: duplicates + auto assignment =================
export interface LeadRules { autoAssign: 'off' | 'unassigned' | 'online' | 'always'; duplicateCheck: boolean; fallbackToSales: boolean }
export const LEAD_RULES_KEY = 'paa_x_os_lead_rules';
export const DEFAULT_LEAD_RULES: LeadRules = { autoAssign: 'online', duplicateCheck: true, fallbackToSales: true };
export const readLeadRules = (): LeadRules => ({ ...DEFAULT_LEAD_RULES, ...readKey<Partial<LeadRules>>(LEAD_RULES_KEY, {}) });

export const SERVICE_TEAM: [RegExp, string][] = [
  [/gmb|google business|local seo|local marketing|maps/i, 'gmb'],
  [/meta|facebook|instagram ads|google ads|ppc|search ads|pmax|youtube ads|performance|seo|remarketing|display/i, 'perf'],
  [/social|content|smm|copy|email|reputation/i, 'social'],
  [/video|reel|edit|motion|photo|shoot/i, 'video'],
  [/graphic|design|logo|brand|poster|print|billboard|outdoor|signage/i, 'creative'],
  [/web|website|app|e-?commerce|landing|wordpress|development|api|erp|software/i, 'web'],
  [/lead gen|automation|whatsapp|crm|funnel|telecall/i, 'leadgen'],
  [/influencer|creator|outreach/i, 'creator'],
  [/strategy|consult|gst|itr|registration|training|business/i, 'strategy'],
];
export const teamForService = (s: string) => SERVICE_TEAM.find(([re]) => re.test(s || ''))?.[1] || '';
const ONLINE = /website|web form|meta|facebook|instagram|whatsapp|google|online|form/i;
const digits = (p: string) => (p || '').replace(/\D/g, '').slice(-10);

export function findDuplicates(lead: { phone?: string; phone2?: string; email?: string; company?: string }, leads: any[], clients: any[]) {
  const ph = [digits(lead.phone || ''), digits(lead.phone2 || '')].filter((x) => x.length >= 8);
  const em = (lead.email || '').trim().toLowerCase();
  const hit = (r: any) => (ph.length && [digits(r.phone || ''), digits(r.phone2 || '')].some((x) => x && ph.includes(x))) || (em && (r.email || '').trim().toLowerCase() === em);
  return [...leads.filter(hit).map((l) => `Lead ${l.leadCode} - ${l.company || l.name}`), ...clients.filter(hit).map((c) => `Client ${c.clientCode || ''} - ${c.companyName || c.name || ''}`)];
}

export function pickAssignee(service: string, employees: any[]): { id: string; why: string } | null {
  const org = readOrg(); const rules = readLeadRules();
  const active = employees.filter((e) => e.status === 'active');
  const team = teamForService(service);
  let pool = team ? active.filter((e) => org[e.id]?.unit === team) : [];
  let why = team ? `${unitByKey(team)?.name}` : '';
  if (!pool.length && rules.fallbackToSales) {
    pool = active.filter((e) => org[e.id]?.unit === 'sales' && !/manager/i.test(org[e.id].position));
    if (!pool.length) pool = active.filter((e) => ['sales_executive', 'telecaller', 'sales_team_leader'].includes(e.role));
    why = 'Sales team';
  }
  if (!pool.length) return null;
  pool.sort((a, b) => a.id.localeCompare(b.id));
  const rr = readKey<Record<string, number>>('paa_x_os_rr', {}); const k = team || 'sales';
  const i = (rr[k] || 0) % pool.length; rr[k] = i + 1; writeKey('paa_x_os_rr', rr);
  return { id: pool[i].id, why: `${why} (round-robin)` };
}

function wrapLead<T extends Record<string, any>>(v: T): T {
  const orig = v.addLead; if (typeof orig !== 'function') return v;
  const out: any = v;
  out.addLead = (lead: any, ...rest: any[]) => {
    const rules = readLeadRules();
    if (rules.duplicateCheck) {
      const d = findDuplicates(lead, v.leads || [], v.clients || []);
      if (d.length && !window.confirm(`Possible duplicate found:\n\n${d.slice(0, 5).join('\n')}\n\nAdd this lead anyway?`)) { toast('Lead not added (duplicate).'); return undefined; }
      if (d.length) { try { v.logAudit?.('DUPLICATE_LEAD_ADDED', lead.company || lead.name, d.join('; ')); } catch { /* ignore */ } }
    }
    const want = rules.autoAssign === 'always' || (rules.autoAssign !== 'off' && !lead.assignedEmployeeId) || (rules.autoAssign === 'online' && ONLINE.test(lead.source || ''));
    let next = lead;
    if (want) {
      const pick = pickAssignee(lead.serviceRequired, v.employees || []);
      if (pick) {
        next = { ...lead, assignedEmployeeId: pick.id, status: lead.status === 'new' ? 'assigned' : lead.status };
        const who = (v.employees || []).find((e: any) => e.id === pick.id)?.name || pick.id;
        toast(`Lead auto-assigned to ${who} - ${pick.why}`);
        try { v.logAudit?.('LEAD_AUTO_ASSIGNED', lead.company || lead.name, `${who} - ${pick.why}`); } catch { /* ignore */ }
      }
    }
    if (!next.assignedEmployeeId && v.currentUser?.id) next = { ...next, assignedEmployeeId: v.currentUser.id };
    return orig(next, ...rest);
  };
  return out;
}

// ================= EXPORT GUARD (CSV / Excel / JSON downloads) =================
let exportCtx = { role: '', tab: '' };
export const setExportCtx = (role: string, tab: string) => { exportCtx = { role, tab }; };
let installed = false;
export function installExportGuard() {
  if (installed || typeof window === 'undefined') return; installed = true;
  const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    const name = (this.getAttribute('download') || '').toLowerCase();
    if (name && /\.(csv|xlsx?|json|tsv)$/.test(name) && exportCtx.role && exportCtx.role !== 'super_admin') {
      const m = moduleOfTab(exportCtx.tab);
      const ok = m === null ? true : osCan(exportCtx.role, m, 'X') || osCan(exportCtx.role, M.EXP, 'X') || readMatrix()[exportCtx.role]?.[M.EXP] === 1;
      if (!ok) { toast(`Export is not allowed for your role in ${m !== null ? MODULES[m] : 'this screen'}.`); return; }
    }
    return orig.call(this);
  };
}
export const canExportHere = (role: string, tab: string) => { if (role === 'super_admin') return true; const m = moduleOfTab(tab); return m === null || osCan(role, m, 'X') || readMatrix()[role]?.[M.EXP] === 1; };

// ================= TASK REVIEW (submitted / approved / rework + proof) =================
export interface ProofFile { name: string; url: string; size: number }
export interface TaskReview { state: 'submitted' | 'approved' | 'rework'; note: string; files: ProofFile[]; reworks: number; history: { at: string; by: string; action: string; comment?: string }[] }
export const TASK_REVIEW_KEY = 'paa_x_os_task_review';
export const canReviewTasks = (role: string) => FULL_ACCESS.includes(role) || osCan(role, M.TSK, 'A');

// ================= EXITS =================
export interface ExitCase {
  id: string; code: string; employeeId: string; type: 'Resignation' | 'Termination' | 'Contract End' | 'Retirement' | 'Absconding';
  noticeDate: string; lastDay: string; reason: string;
  status: 'Awaiting Founder Approval' | 'Notice Period' | 'Clearance' | 'Full & Final' | 'Closed' | 'Rejected';
  checks: Record<string, boolean>; notes: string; createdBy: string; at: string; log: { at: string; by: string; text: string }[];
}
export const EXIT_CHECKS: [string, string][] = [['handover', 'Work handover to team leader'], ['clients', 'Client accounts reassigned'], ['assets', 'Laptop / ID card / assets returned'], ['access', 'Logins & tool access disabled'], ['dues', 'Pending claims & advances settled'], ['fnf', 'Full & final settlement paid'], ['letters', 'Experience / relieving letter issued'], ['interview', 'Exit interview done']];
export const EXITS_KEY = 'paa_x_os_exits';
export const newExit = (p: Partial<ExitCase>, by: string): ExitCase => ({
  id: uid('ex'), code: 'PAA-EXIT-' + String(readKey<ExitCase[]>(EXITS_KEY, []).length + 1).padStart(3, '0'), employeeId: '', type: 'Resignation', noticeDate: new Date().toISOString().slice(0, 10), lastDay: '', reason: '',
  status: p.type === 'Termination' ? 'Awaiting Founder Approval' : 'Notice Period', checks: {}, notes: '', createdBy: by, at: nowStamp(), log: [{ at: nowStamp(), by, text: 'Exit case opened' }], ...p,
} as ExitCase);
