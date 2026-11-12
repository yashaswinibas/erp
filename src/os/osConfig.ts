// AGENCYOS_HUBS_DONE
// AGENCYOS_V5_P26_DONE
// AGENCYOS_V3_OS: pages, roles and access rules of the Priority Ads Agency OS.
// Layout and defaults follow AgencyOS_UI_Prototype.html + AgencyOS_Easy_Approval_Template.xlsx.

export type PageKind = 'module' | 'dashboard' | 'table' | 'board' | 'detail' | 'calendar' | 'custom';
export interface OsPage { id: string; name: string; subtitle: string; group: string; icon: string; module: number | null; hidden?: boolean }

/** 12 module categories (prototype) + 2 claim rows */
export const MODULES = ['CRM / Leads', 'Clients', 'Projects', 'Tasks', 'Finance', 'Payroll', 'HR Records', 'Private Docs', 'Company Reports', 'Settings', 'Approvals', 'Export Data', 'Approve Expense Claims', 'See All Expense Claims'];
export const M = { CRM: 0, CLI: 1, PRJ: 2, TSK: 3, FIN: 4, PAY: 5, HR: 6, DOC: 7, REP: 8, SET: 9, APP: 10, EXP: 11, CLAIM_APPROVE: 12, CLAIM_ALL: 13 };

type G = [string, string, [string, string, string, number | null][]];
const GROUPS: G[] = [
  ['Workspace', 'grid', [
    ['founder', 'Founder Command Center', 'Everything across the company, organized into money, problems and plans.', M.REP],
    ['ops-dashboard', 'Operations Dashboard', 'Daily team and client delivery overview without private finances.', null],
    ['my-dashboard', 'My Workspace', 'Role-specific tasks, deadlines and personal work summary.', null],
    ['approvals', 'Approval Center', 'Founder and manager approval queues.', M.APP],
    ['alerts', 'Alerts & Escalations', 'Critical events and overdue actions.', null],
    ['calendar', 'Master Calendar', 'A consolidated timeline of work, renewals and deadlines.', null],
    ['tl-dashboard', 'Team Leader Desk', 'Your team members, tasks, delays, quality issues and submissions.', null],
  ]],
  ['CRM & Sales', 'target', [
    ['sales-overview', 'Sales Overview', 'Pipeline health and follow-up conversion at a glance.', M.CRM],
    ['leads', 'All Leads', 'Every lead with owner, source, stage and next action.', M.CRM],
    ['pipeline', 'Lead Pipeline', 'Visual sales stages from new enquiry to won or lost.', M.CRM],
    ['lead-profile', 'Lead 360\u00B0 Profile', 'Complete contact, follow-ups and activity history.', M.CRM],
    ['followups', 'Follow-up Planner', 'Every next action with a responsible person and due time.', M.CRM],
    ['inbox', 'Unified Conversations', 'Central WhatsApp, web and social enquiry management.', M.CRM],
    ['proposals', 'Proposals', 'Draft, review and send service proposals.', M.CRM],
    ['deals_quotations', 'Quotations', 'Price and package quotations with approval history.', M.CRM],
    ['lost', 'Lost Leads', 'Reasons, recovery plans and archived opportunities.', M.CRM],
    ['lead-rules', 'Lead Assignment & Duplicates', 'Auto-assignment by service, round-robin and duplicate detection.', M.CRM],
  ]],
  ['Clients & Services', 'users', [
    ['clients', 'Client Directory', 'Searchable client accounts and service status.', M.CLI],
    ['client-profile', 'Client 360\u00B0', 'All services, work, documents and authorized billing tabs.', M.CLI],
    ['onboarding', 'Client Onboarding', 'Agreement, advance and activation checklist.', M.CLI],
    ['services', 'Services & Packages', 'Agency service catalog with 29 specialties and team seats.', M.CLI],
    ['deals_agreements', 'Contracts & Renewals', 'Active terms, notice periods and upcoming renewals.', M.CLI],
    ['client_reimbursements', 'Client Reimbursement', 'Money received from clients to spend on their behalf.', M.FIN],
  ]],
  ['Operations', 'briefcase', [
    ['projects', 'Projects', 'Service delivery stages and project ownership.', M.PRJ],
    ['project-profile', 'Project 360\u00B0', 'Milestones, deliverables, members and activity.', M.PRJ],
    ['task_operations', 'All Tasks', 'Assignable tasks and deadline tracking.', M.TSK],
    ['my_tasks', 'My Tasks', 'Work assigned to the signed-in employee.', null],
    ['task-review', 'Task Submissions & Review', 'Submit proof of work; team leaders approve or send for rework.', null],
    ['creative', 'Creative Review', 'Draft, internal review, client review and approval.', M.PRJ],
    ['content-calendar', 'Content Calendar', 'Social posts, reels and creative publishing plan.', M.PRJ],
    ['campaigns', 'Campaign Tracking', 'Agency service delivery and campaign status.', M.PRJ],
    ['deliverables', 'Deliverables & QA', 'Quality checks and handover sign-offs.', M.PRJ],
    ['capacity', 'Team Capacity', 'Workload visibility and planned team seats.', M.PRJ],
    ['deals_sow', 'Scope of Work', 'Scopes of work and change requests per project.', M.PRJ],
    ['deals_templates', 'Project Templates', 'Reusable project and task templates.', M.PRJ],
    ['field_force_desk', 'Field Force Desk', 'Field visits, GPS check-ins and travel claims.', M.TSK],
    ['field_force', 'Client Field Visits', 'Every client visit with outcome and expenses.', M.TSK],
    ['field_gps', 'Field Visit GPS', 'Location history of field visits.', M.TSK],
  ]],
  ['Finance & Accounts', 'money', [
    ['finance_desk', 'Financial Overview', 'Collections, invoices, receivables, spend and exceptions.', M.FIN],
    ['billing', 'Invoices', 'Issue, filter and manage client invoices.', M.FIN],
    ['invoice-builder', 'Invoice Builder', 'Create a GST invoice with service lines.', M.FIN],
    ['payments', 'Payments & Receipts', 'Incoming payments, references and verified receipts.', M.FIN],
    ['receivables', 'Pending Collections', 'Ageing, next follow-up and unresolved amounts.', M.FIN],
    ['expenses', 'Expenses & Approvals', 'Proof, amount, verification and founder approval.', M.FIN],
    ['vendors', 'Vendors', 'Supplier profiles and payable history.', M.FIN],
    ['hr_payroll', 'Payroll Register', 'Protected salary processing and payslip status.', M.PAY],
    ['business_finance', 'Finance & Cash Book', 'Cash, profit, owner funds, loans and statements.', M.FIN],
    ['deals_installments', 'Instalments & Receipts', 'Client instalment schedules and receipts.', M.FIN],
    ['reimbursements', 'Expense Claims', 'File and track your own expense claims with proof.', null],
  ]],
  ['People & HR', 'user', [
    ['people-overview', 'HR Overview', 'Hiring, attendance, leave and employee activity.', M.HR],
    ['employees', 'Employee Directory', 'All employees, reporting lines and employment status.', M.HR],
    ['employee-profile', 'Employee Profile', 'Job details, tasks, attendance and permitted documents.', M.HR],
    ['attendance', 'Attendance', 'Daily check-in and manager corrections.', null],
    ['leave', 'Leave Management', 'Leave requests, balances and approvals.', null],
    ['recruitment', 'Recruitment Pipeline', 'Candidate movement from applied to hired.', M.HR],
    ['weekly-reports', 'Weekly Work Reports', 'Employee work summaries and manager review.', null],
    ['incidents', 'Incidents & HR Cases', 'Restricted investigations, evidence and resolution history.', M.HR],
    ['hr_onboarding', 'Onboarding & Contracts', 'Joining checklist, offer and appointment letters.', M.HR],
    ['exits', 'Exit & Separation', 'Resignation, termination, clearance checklist and full & final.', M.HR],
    ['my-payslips', 'My Payslips', 'Your salary slips and payment status.', null],
  ]],
  ['Document Center', 'folder', [
    ['document_center', 'Document Library', 'Client, employee and financial documents on letterhead.', null],
    ['templates', 'Template Library', 'Letterhead-based reusable document templates.', null],
    ['document-builder', 'Document Generator', 'Select record, autofill, A4 preview and generate.', null],
    ['signatures', 'Signatures & Issuance', 'Issued documents, signature collection and final copies.', null],
    ['archives', 'Document Archive', 'Historical and expired documents with retention controls.', null],
  ]],
  ['Reports', 'chart', [
    ['reports', 'Company Intelligence', 'Reports for founder: finance, clients and team.', M.REP],
    ['sales-report', 'Sales Performance', 'Sources, conversion, pipelines and reps.', M.CRM],
    ['team-report', 'Team Performance', 'Task completion, workload and overdue trends.', null],
    ['profitability', 'Client Profitability', 'Income, direct costs and contribution margin.', M.REP],
    ['analytics', 'Analytics', 'Charts across sales, delivery and finance.', M.REP],
  ]],
  ['Administration', 'settings', [
    ['access_admin', 'Users & Accounts', 'Create accounts, reset passwords, roles and login history.', null],
    ['permissions', 'Permission Matrix', 'Switch module access ON / OFF for every role.', M.SET],
    ['permission-actions', 'Action Permissions', 'View, Create, Edit, Delete, Approve and Export for every role and module.', M.SET],
    ['hierarchy', 'Organization Family Tree', 'Owner, General Manager, department heads and delivery teams.', null],
    ['integrations', 'Connected Apps', 'Meta, WhatsApp, website forms, email and banking links.', M.SET],
    ['automation', 'Automation Rules', 'Reminders, assignment, approvals and escalations.', M.SET],
    ['security', 'Security & Sessions', 'Login history, sessions, password resets and safeguards.', M.SET],
    ['audit_settings', 'Audit Trail', 'Searchable action history and sensitive changes.', M.SET],
    ['backups', 'Backups & Recovery', 'Download a full backup and restore it.', M.SET],
    ['company', 'Company & Brand Settings', 'Legal details, branding, invoice numbering and documents.', M.SET],
  ]],
];

export const PAGES: OsPage[] = GROUPS.flatMap(([group, icon, list]) => list.map(([id, name, subtitle, module]) => ({ id, name, subtitle, group, icon, module })));
export const NAV_GROUPS = GROUPS.map(([key, icon]) => ({ key, icon }));
export const pageById = (id: string) => PAGES.find((p) => p.id === id);

/** Old screen ids that still exist inside the app. */
export const ALIASES: Record<string, string> = { dashboard: 'founder', owner_desk: 'founder', hr_desk: 'people-overview', pm_desk: 'ops-dashboard', employee_desk: 'my-dashboard', crm: 'leads', deals_settings: 'deals_quotations' };

// ---------------- roles ----------------
export const OS_ROLES: { id: string; label: string; reports: string }[] = [
  { id: 'super_admin', label: 'Founder / Super Admin', reports: 'Owner' },
  { id: 'admin', label: 'Owner / Admin', reports: 'Founder' },
  { id: 'manager', label: 'General Manager', reports: 'Founder' },
  { id: 'hr', label: 'HR Manager', reports: 'General Manager' },
  { id: 'recruiter', label: 'Recruiter', reports: 'HR Manager' },
  { id: 'hr_executive', label: 'HR Executive', reports: 'HR Manager' },
  { id: 'finance', label: 'Accounts & Finance Manager', reports: 'General Manager' },
  { id: 'accountant', label: 'Accountant', reports: 'Accounts & Finance Manager' },
  { id: 'billing_executive', label: 'Billing Executive', reports: 'Accounts & Finance Manager' },
  { id: 'sales_manager', label: 'Sales Manager', reports: 'General Manager' },
  { id: 'sales_team_leader', label: 'Sales Team Leader', reports: 'Sales Manager' },
  { id: 'sales_executive', label: 'Sales Executive', reports: 'Sales Team Leader' },
  { id: 'telecaller', label: 'Telecaller', reports: 'Sales Team Leader' },
  { id: 'operations_manager', label: 'Operations Manager', reports: 'General Manager' },
  { id: 'project_manager', label: 'Project Manager', reports: 'Operations Manager' },
  { id: 'client_relationship_manager', label: 'Client Relationship Manager', reports: 'General Manager' },
  { id: 'client_support_executive', label: 'Client Support Executive', reports: 'Client Relationship Manager' },
  { id: 'project_coordinator', label: 'Project Coordinator', reports: 'Operations / Project Manager' },
  { id: 'team_leader', label: 'Team Leader', reports: 'Operations Manager' },
  { id: 'employee', label: 'Employee / Specialist', reports: 'Team Leader' },
  { id: 'freelancer', label: 'Freelancer / Contractor', reports: 'Project Manager' },
  { id: 'consultant', label: 'Consultant (Limited)', reports: 'General Manager' },
  { id: 'auditor', label: 'Auditor (Restricted)', reports: 'Founder' },
  { id: 'vendor', label: 'Vendor (Limited)', reports: 'Accounts & Finance Manager' },
];
export const roleLabel = (r: string) => OS_ROLES.find((x) => x.id === r)?.label || r;
export const FULL_ACCESS = ['super_admin', 'admin'];
/** Roles that only ever see their own records. */
export const STAFF_ROLES = ['employee', 'sales_executive', 'telecaller', 'freelancer', 'consultant', 'vendor'];
/** Roles that see only their own team (AGENCYOS_V4_P25). */
export const TEAM_LEAD_ROLES = ['team_leader', 'sales_team_leader'];
export const isTeamLeadRole = (r: string) => TEAM_LEAD_ROLES.includes(r);
export const isStaffRole = (r: string) => STAFF_ROLES.includes(r);

// Default module access (prototype matrix + 2 claim rows). Order = MODULES.
//                         CRM CLI PRJ TSK FIN PAY HR DOC REP SET APP EXP CLA CLV
export const DEFAULT_MATRIX: Record<string, number[]> = {
  super_admin:              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  admin:                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  manager:                  [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  hr:                       [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  finance:                  [0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1],
  sales_manager:            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  sales_executive:          [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  operations_manager:       [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  project_manager:          [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  client_relationship_manager: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  team_leader:              [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  employee:                 [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  freelancer:               [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  auditor:                  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // AGENCYOS_V4_P25 sub-roles
  recruiter:                [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  hr_executive:             [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  accountant:               [0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  billing_executive:        [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  sales_team_leader:        [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  telecaller:               [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  client_support_executive: [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  project_coordinator:      [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  consultant:               [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  vendor:                   [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export const EVERYONE = ['my-dashboard', 'alerts', 'calendar', 'my_tasks', 'task-review', 'attendance', 'leave', 'my-payslips', 'reimbursements', 'access_admin', 'hierarchy', 'weekly-reports'];
const FIELD = ['field_force_desk', 'field_force', 'field_gps'];
export const FIELD_MODULE_KEY = 'paa_x_os_modules';
export const fieldModuleOn = () => { try { return (JSON.parse(localStorage.getItem(FIELD_MODULE_KEY) || '{}') || {}).field !== false; } catch { return true; } };
/** Default screens per role (prototype "allowed" lists). Founder / Owner see everything. */
export const ROLE_PAGES: Record<string, string[]> = {
  manager: ['ops-dashboard', 'approvals', 'sales-overview', 'leads', 'pipeline', 'lead-profile', 'followups', 'inbox', 'proposals', 'deals_quotations', 'lost', 'clients', 'client-profile', 'onboarding', 'services', 'deals_agreements', 'projects', 'project-profile', 'task_operations', 'creative', 'content-calendar', 'campaigns', 'deliverables', 'capacity', 'deals_sow', 'deals_templates', 'employees', 'sales-report', 'team-report', ...FIELD],
  hr: ['approvals', 'people-overview', 'employees', 'employee-profile', 'recruitment', 'incidents', 'hr_onboarding', 'hr_payroll', 'document_center', 'templates', 'document-builder', 'signatures'],
  finance: ['approvals', 'clients', 'finance_desk', 'billing', 'invoice-builder', 'payments', 'receivables', 'expenses', 'vendors', 'hr_payroll', 'business_finance', 'deals_installments', 'client_reimbursements', 'document_center', 'templates', 'document-builder', 'signatures', 'archives'],
  sales_manager: ['sales-overview', 'leads', 'pipeline', 'lead-profile', 'followups', 'inbox', 'proposals', 'deals_quotations', 'lost', 'clients', 'client-profile', 'onboarding', 'deals_agreements', 'sales-report', ...FIELD],
  sales_executive: ['leads', 'pipeline', 'lead-profile', 'followups', 'inbox', 'proposals', ...FIELD],
  operations_manager: ['ops-dashboard', 'approvals', 'clients', 'client-profile', 'onboarding', 'services', 'deals_agreements', 'projects', 'project-profile', 'task_operations', 'creative', 'content-calendar', 'campaigns', 'deliverables', 'capacity', 'deals_sow', 'deals_templates', 'team-report'],
  project_manager: ['approvals', 'clients', 'client-profile', 'projects', 'project-profile', 'task_operations', 'creative', 'content-calendar', 'campaigns', 'deliverables', 'capacity', 'deals_sow', 'deals_templates', 'document_center', 'team-report'],
  client_relationship_manager: ['leads', 'lead-profile', 'followups', 'inbox', 'clients', 'client-profile', 'onboarding', 'deals_agreements', 'projects', 'project-profile', 'task_operations', 'deliverables'],
  team_leader: ['projects', 'project-profile', 'task_operations', 'creative', 'content-calendar', 'deliverables', 'capacity', 'team-report'],
  employee: [...FIELD],
  freelancer: ['projects', 'deliverables'],
  auditor: ['billing', 'payments', 'receivables', 'expenses', 'audit_settings', 'document_center'],
  // AGENCYOS_V4_P25 sub-roles
  recruiter: ['people-overview', 'recruitment', 'hr_onboarding', 'templates', 'document-builder'],
  hr_executive: ['people-overview', 'employees', 'employee-profile', 'recruitment', 'hr_onboarding', 'exits', 'document_center', 'templates', 'document-builder'],
  accountant: ['clients', 'finance_desk', 'billing', 'invoice-builder', 'payments', 'receivables', 'expenses', 'vendors', 'hr_payroll', 'business_finance', 'deals_installments', 'client_reimbursements', 'document_center', 'templates', 'document-builder'],
  billing_executive: ['clients', 'billing', 'invoice-builder', 'payments', 'receivables', 'deals_installments', 'document_center', 'templates', 'document-builder'],
  sales_team_leader: ['tl-dashboard', 'sales-overview', 'leads', 'pipeline', 'lead-profile', 'followups', 'inbox', 'proposals', 'deals_quotations', 'lost', 'clients', 'client-profile', 'sales-report', 'team-report', ...FIELD],
  telecaller: ['leads', 'pipeline', 'lead-profile', 'followups', 'inbox'],
  client_support_executive: ['clients', 'client-profile', 'inbox', 'projects', 'project-profile', 'deliverables'],
  project_coordinator: ['ops-dashboard', 'clients', 'client-profile', 'projects', 'project-profile', 'task_operations', 'creative', 'content-calendar', 'campaigns', 'deliverables', 'capacity', 'deals_sow', 'deals_templates', 'team-report'],
  consultant: ['projects', 'deliverables'],
  vendor: [],
};
ROLE_PAGES.team_leader.push('tl-dashboard');
ROLE_PAGES.hr.push('exits');
ROLE_PAGES.sales_manager.push('lead-rules');
const NOT_FOR_LIMITED = ['leave', 'my-payslips', 'attendance', 'weekly-reports', 'hierarchy'];
const LIMITED = ['freelancer', 'auditor', 'consultant', 'vendor'];

// ---------------- permission matrix (stored in this browser) ----------------
export const OS_PERM_KEY = 'paa_x_os_perm';
export const readMatrix = (): Record<string, number[]> => {
  let saved: Record<string, number[]> = {};
  try { saved = JSON.parse(localStorage.getItem(OS_PERM_KEY) || '{}') || {}; } catch { saved = {}; }
  const out: Record<string, number[]> = {};
  for (const r of OS_ROLES) {
    const d = DEFAULT_MATRIX[r.id] || MODULES.map(() => 0);
    const s = saved[r.id];
    out[r.id] = r.id === 'super_admin' ? d.slice() : MODULES.map((_, i) => (Array.isArray(s) && (s[i] === 0 || s[i] === 1) ? s[i] : d[i] ?? 0));
  }
  return out;
};

let FIELD_OK = true;
export const setOsFieldAccess = (ok: boolean) => { FIELD_OK = ok; };

/** Can this role open this screen? */
export function osCanAccess(role: string, tabIn: string): boolean {
  if (role === 'super_admin') return true;
  if (FIELD.includes(ALIASES[tabIn] || tabIn) && !fieldModuleOn()) return false;
  if (tabIn === 'approve_claims') return readMatrix()[role]?.[M.CLAIM_APPROVE] === 1;
  if (tabIn === 'view_all_claims') return readMatrix()[role]?.[M.CLAIM_ALL] === 1;
  const tab = ALIASES[tabIn] || tabIn;
  const page = pageById(tab);
  if (!page) return FULL_ACCESS.includes(role);
  if (FIELD.includes(tab) && isStaffRole(role) && !FIELD_OK) return false;
  const matrix = readMatrix()[role] || [];
  const def = DEFAULT_MATRIX[role] || [];
  if (page.module !== null) {
    const on = matrix[page.module] === 1, defOn = def[page.module] === 1;
    if (!on) return false;                 // owner switched the module OFF
    if (on && !defOn) return true;         // owner switched the module ON -> all its screens
  }
  if (FULL_ACCESS.includes(role)) return true;
  if (LIMITED.includes(role) && NOT_FOR_LIMITED.includes(tab)) return false;
  return EVERYONE.includes(tab) || (ROLE_PAGES[role] || []).includes(tab);
}

export function osHome(role: string): string {
  if (FULL_ACCESS.includes(role)) return 'founder';
  if (role === 'manager' || role === 'operations_manager') return 'ops-dashboard';
  if (role === 'hr') return 'people-overview';
  if (role === 'finance') return 'finance_desk';
  if (role === 'sales_manager') return 'sales-overview';
  if (role === 'recruiter' || role === 'hr_executive') return 'people-overview';
  if (role === 'accountant') return 'finance_desk';
  if (role === 'billing_executive') return 'billing';
  if (role === 'project_coordinator') return 'ops-dashboard';
  if (TEAM_LEAD_ROLES.includes(role)) return 'tl-dashboard';
  return 'my-dashboard';
}

// ---------------- 29 service specialties (xlsx 04_SERVICE_TEAMS) ----------------
export const TEAM_LEADS: Record<string, string> = { PAID_L: 'Paid Media', ORG_L: 'Organic & Content', GROWTH_L: 'Growth & Automation', TECH_L: 'Technology', CREATIVE_L: 'Creative Studio', BIZ_L: 'Strategy & Business Services' };
export const SERVICES: [string, string, string][] = [
  ['SV01', 'Meta / Facebook / Instagram Ads', 'PAID_L'], ['SV02', 'Google Ads / Search / PMax', 'PAID_L'], ['SV03', 'Display / YouTube / Remarketing Ads', 'PAID_L'], ['SV04', 'Performance Marketing & Analytics', 'PAID_L'],
  ['SV05', 'SEO & Technical SEO', 'ORG_L'], ['SV06', 'Local SEO / Google Business Profile', 'ORG_L'], ['SV07', 'Social Media Management', 'ORG_L'], ['SV08', 'Content Writing & Copywriting', 'ORG_L'], ['SV09', 'Email Marketing', 'ORG_L'], ['SV10', 'Online Reputation Management', 'ORG_L'],
  ['SV11', 'Lead Generation & Funnels', 'GROWTH_L'], ['SV12', 'WhatsApp / CRM Automations', 'GROWTH_L'], ['SV13', 'Influencer & Creator Outreach', 'GROWTH_L'], ['SV14', 'Telecalling Support', 'GROWTH_L'],
  ['SV15', 'Web Design / WordPress', 'TECH_L'], ['SV16', 'Full-Stack Website Development', 'TECH_L'], ['SV17', 'E-commerce Development', 'TECH_L'], ['SV18', 'Landing Pages & CRO', 'TECH_L'], ['SV19', 'Mobile App Development', 'TECH_L'], ['SV20', 'API / CRM / ERP Development', 'TECH_L'],
  ['SV21', 'Graphic / Poster Design', 'CREATIVE_L'], ['SV22', 'Branding / Logo / Print Design', 'CREATIVE_L'], ['SV23', 'Video Editing & Reels', 'CREATIVE_L'], ['SV24', 'AI Video / Motion Graphics', 'CREATIVE_L'], ['SV25', 'Photography / Videography', 'CREATIVE_L'], ['SV26', 'Printing / Outdoor Signage', 'CREATIVE_L'],
  ['SV27', 'Growth Strategy & Consulting', 'BIZ_L'], ['SV28', 'GST / ITR / Business Registrations', 'BIZ_L'], ['SV29', 'Digital Marketing Training', 'BIZ_L'],
];
