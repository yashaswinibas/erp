// Role-based access rules (Phase 1 - browser side). The same table will be
// enforced again on the server when the backend is added.
import { UserRole } from '../types';

export type LoginPortal = 'super_admin' | 'admin' | 'hr' | 'manager' | 'project_manager' | 'finance' | 'employee';

export const PORTALS: { id: LoginPortal; title: string; subtitle: string; roles: UserRole[]; color: string }[] = [
  { id: 'super_admin', title: 'Super Admin', subtitle: 'Complete system control', roles: ['super_admin'], color: 'from-purple-600 to-indigo-600' },
  { id: 'admin', title: 'Owner / Admin', subtitle: 'All company modules', roles: ['admin', 'super_admin'], color: 'from-blue-600 to-cyan-600' },
  { id: 'hr', title: 'HR', subtitle: 'Employees, attendance & payroll', roles: ['hr'], color: 'from-pink-600 to-rose-600' },
  { id: 'manager', title: 'Manager', subtitle: 'Sales, billing, team & all modules', roles: ['manager'], color: 'from-amber-500 to-orange-600' },
  { id: 'project_manager', title: 'Project Manager', subtitle: 'Projects, tasks & delivery', roles: ['project_manager'], color: 'from-sky-500 to-blue-600' },
  { id: 'finance', title: 'Finance', subtitle: 'Collections, expenses & payments', roles: ['finance'], color: 'from-emerald-600 to-teal-600' },
  { id: 'employee', title: 'Employee', subtitle: 'My attendance, tasks & payslips', roles: ['employee'], color: 'from-slate-600 to-slate-800' },
];

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Owner / Admin', hr: 'HR', manager: 'Manager', project_manager: 'Manager (Projects)', finance: 'Finance', employee: 'Employee',
};

const SA = 'super_admin', AD = 'admin', HR = 'hr', MG = 'manager', PM = 'project_manager', FN = 'finance', EM = 'employee';
const ALL = [SA, AD, HR, MG, PM, FN, EM];

/** Which roles may open each screen (activeTab). */
export const TAB_ACCESS: Record<string, string[]> = {
  dashboard: [SA, AD], owner_desk: [SA, AD], analytics: [SA, AD],
  hr_desk: [SA, AD, HR],
  pm_desk: [SA, AD, MG, PM],
  field_force_desk: [SA, AD, MG, PM, EM],
  employee_desk: ALL,
  finance_desk: [SA, AD, FN],
  employees: [SA, AD, HR],
  attendance: [SA, AD, HR, MG, PM, EM],
  leave: [SA, AD, HR, MG, PM, EM],
  hr_onboarding: [SA, AD, HR],
  hr_payroll: ALL,
  crm: [SA, AD, MG, PM, EM], leads: [SA, AD, MG, PM, EM], clients: [SA, AD, MG, PM, FN],
  deals_quotations: [SA, AD, MG, PM, FN], deals_agreements: [SA, AD, MG, PM, FN],
  deals_installments: [SA, AD, FN], deals_settings: [SA, AD, FN],
  deals_sow: [SA, AD, MG, PM], deals_templates: [SA, AD, MG, PM],
  projects: [SA, AD, HR, MG, PM, EM], task_operations: [SA, AD, HR, MG, PM],
  my_tasks: ALL,
  billing: [SA, AD, FN],
  field_force: [SA, AD, MG, PM, EM],
  field_gps: [SA, AD, HR, MG, PM, EM],
  reimbursements: ALL,
  client_reimbursements: [SA, AD, FN, MG, PM],
  audit_settings: [SA, AD],
  access_admin: ALL,
  document_center: [SA, AD, HR, MG, PM, FN],
  business_finance: [SA, AD, FN],
};

// AGENCYOS_V2_PART14: Super Admin can switch screens on / off per role (saved in this browser).
// AGENCYOS_V2_PART20: Manager gets all modules (sales, invoices, quotations, finance...),
// Project Manager only gets project related screens.
const addRole = (role: string, tabs: string[]) => tabs.forEach((t) => { TAB_ACCESS[t] = Array.from(new Set([...(TAB_ACCESS[t] || [SA, AD]), role])); });
const removeRole = (role: string, tabs: string[]) => tabs.forEach((t) => { TAB_ACCESS[t] = (TAB_ACCESS[t] || []).filter((r) => r !== role); });
addRole(MG, Object.keys(TAB_ACCESS).filter((t) => t !== 'audit_settings'));
removeRole(PM, ['crm', 'leads', 'clients', 'deals_quotations', 'deals_agreements', 'deals_installments', 'deals_settings', 'billing', 'client_reimbursements', 'business_finance', 'finance_desk', 'field_force_desk', 'field_force', 'field_gps', 'hr_desk', 'employees', 'hr_onboarding']);
addRole(PM, ['pm_desk', 'projects', 'task_operations', 'my_tasks', 'deals_sow', 'deals_templates', 'document_center', 'employee_desk', 'attendance', 'leave', 'hr_payroll', 'reimbursements', 'access_admin']);
// AGENCYOS_V2_PART23: claim permissions, switchable ON / OFF in Users & Login > Permission matrix.
TAB_ACCESS.approve_claims = [SA];          // approve / reject reimbursement claims
TAB_ACCESS.view_all_claims = [SA, AD, FN]; // see everyone's claims (others see only their own)
// Field screens are only for employees who work in the field.
export const FIELD_TABS = ['field_force_desk', 'field_force', 'field_gps'];
let FIELD_OK = true;
export const setFieldAccess = (ok: boolean) => { FIELD_OK = ok; };
export const PERM_KEY = 'paa_x_perm_overrides';
export const LOCKED_TABS = ['access_admin'];
export const defaultAccess = (tab: string) => TAB_ACCESS[tab] || [SA, AD];
export const readOverrides = (): Record<string, string[]> => { try { return JSON.parse(localStorage.getItem(PERM_KEY) || '{}') || {}; } catch { return {}; } };
export const effectiveAccess = (tab: string, ov: Record<string, string[]> = readOverrides()) => Array.isArray(ov[tab]) ? ov[tab] : defaultAccess(tab);
export const canAccess = (role: string, tab: string) => role === EM && !FIELD_OK && FIELD_TABS.includes(tab) ? false : role === SA || LOCKED_TABS.includes(tab) ? defaultAccess(tab).includes(role) : effectiveAccess(tab).includes(role);

export const homeTab = (role: string, fieldWorker = false) =>
  role === SA || role === AD ? 'owner_desk'
    : role === HR ? 'hr_desk'
    : role === FN ? 'finance_desk'
    : role === MG || role === PM ? 'pm_desk'
    : fieldWorker ? 'field_force_desk' : 'employee_desk';

/** Actions that are not just "can open the screen". */
export const can = {
  manageRoles: (r: string) => r === SA || r === AD,
  resetPasswords: (r: string) => r === SA || r === AD || r === HR,
  preparePayroll: (r: string) => r === SA || r === AD || r === HR,
  paySalaries: (r: string) => r === SA || r === AD || r === FN,
};

// ---- passwords (browser-only for Phase 1; the backend will use bcrypt) ----
export const DEFAULT_PASSWORD = 'Welcome@123';
export async function hashPassword(pw: string) {
  const data = new TextEncoder().encode('paa-salt:' + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
export interface Credential { employeeId: string; hash: string; mustChange: boolean; updatedAt: string }
export interface LoginEvent { id: string; employeeId: string; name: string; role: string; portal: string; at: string; ok: boolean; reason?: string }
export interface ResetRequest { id: string; login: string; employeeId?: string; at: string; status: 'open' | 'done'; doneBy?: string }
export const CRED_KEY = 'paa_x_credentials';
export const LOGIN_LOG_KEY = 'paa_x_login_history';
export const RESET_KEY = 'paa_x_password_resets';
