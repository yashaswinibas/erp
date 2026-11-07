// AGENCYOS_V5_P26: Enterprise spec - extra roles, extra screens, approval policy (Rs 5,000 rule)
import { readKey } from '../lib/sharedStore';
import { PAGES, NAV_GROUPS, OS_ROLES, DEFAULT_MATRIX, ROLE_PAGES, STAFF_ROLES, EVERYONE, M, FULL_ACCESS, OsPage } from './osConfig';

// ---------------- extra roles (spec section 4) ----------------
const addRole = (id: string, label: string, reports: string, matrix: number[], pages: string[], staff = false) => {
  if (!OS_ROLES.find((r) => r.id === id)) OS_ROLES.push({ id, label, reports });
  DEFAULT_MATRIX[id] = matrix; ROLE_PAGES[id] = pages; if (staff && !STAFF_ROLES.includes(id)) STAFF_ROLES.push(id);
};
//                                                               CRM CLI PRJ TSK FIN PAY HR DOC REP SET APP EXP CLA CLV
addRole('business_development', 'Business Development Executive', 'Sales Manager', [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ['leads', 'pipeline', 'lead-profile', 'followups', 'inbox', 'lead-import', 'calls', 'comm-templates'], true);
addRole('intern', 'Intern / Trainee', 'Team Leader', [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [], true);
addRole('automation_specialist', 'Automation / Integration Specialist', 'Operations Manager', [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], ['integrations', 'automation'], false);

// ---------------- extra screens ----------------
const pg = (id: string, name: string, subtitle: string, group: string, icon: string, module: number | null): OsPage => ({ id, name, subtitle, group, icon, module });
const after = (anchor: string, ...ps: OsPage[]) => {
  for (const p of ps) if (PAGES.find((x) => x.id === p.id)) return;
  const i = PAGES.findIndex((x) => x.id === anchor);
  PAGES.splice(i < 0 ? PAGES.length : i + 1, 0, ...ps);
};
const W = 'Workspace', C = 'CRM & Sales', CL = 'Clients & Services', O = 'Operations', D = 'Service Delivery', H = 'People & HR', DC = 'Document Center', R = 'Reports', A = 'Administration';
if (!NAV_GROUPS.find((g) => g.key === D)) NAV_GROUPS.splice(NAV_GROUPS.findIndex((g) => g.key === O) + 1, 0, { key: D, icon: 'layers' });

after('calendar', pg('global-search', 'Global Search', 'Search leads, clients, projects, tasks, invoices, people and documents you can access.', W, 'grid', null), pg('my-profile', 'My Profile & Sessions', 'Your details, password, sign-in history and active sessions.', W, 'grid', null));
after('approvals', pg('exceptions', 'Exception & Override Register', 'Every founder exception and override with reason and expiry.', W, 'grid', M.APP), pg('approval-history', 'Approval History', 'Every approval and rejection with who, when and why.', W, 'grid', M.APP));
after('leads', pg('lead-import', 'Lead Creation / Import', 'Add one lead or import many from CSV with duplicate check and auto-assignment.', C, 'target', M.CRM));
after('followups', pg('calls', 'Calls & Activities', 'Calls, meetings, WhatsApp and email activity log per lead and client.', C, 'target', M.CRM));
after('lead-rules', pg('sales-targets', 'Sales Targets & Forecast', 'Monthly targets per person and team against won value and pipeline.', C, 'target', M.CRM), pg('comm-templates', 'Communication Templates', 'Approved WhatsApp, email and call scripts.', C, 'target', M.CRM), pg('lead-analytics', 'Lead Source & Conversion', 'Which sources and owners convert, and how fast.', C, 'target', M.CRM));
after('client-profile', pg('contacts', 'Contacts & Stakeholders', 'Decision makers, billing and day-to-day contacts per client.', CL, 'users', M.CLI));
after('services', pg('packages', 'Packages & Pricing Rules', 'Standard packages, price floors and add-ons.', CL, 'users', M.CLI), pg('engagements', 'Service Engagements', 'Which client takes which service, since when, at what fee.', CL, 'users', M.CLI));
after('deals_agreements', pg('client-requests', 'Client Requests & Complaints', 'Client issues with owner, priority, SLA and resolution.', CL, 'users', M.CLI), pg('client-assets', 'Client Access & Asset Register', 'Which client accounts and assets we manage (no passwords stored).', CL, 'users', M.CLI));
after('project-profile', pg('milestones', 'Milestones & Dependencies', 'Project milestones, due dates and what blocks what.', O, 'briefcase', M.PRJ));
after('task-review', pg('time-logs', 'Time & Work Logs', 'Hours spent per task, client and project.', O, 'briefcase', null));
after('capacity', pg('risks', 'Risk & Blocker Register', 'Delivery risks, blockers, owner and mitigation.', O, 'briefcase', M.PRJ));
after('field_gps',
  pg('service-teams', 'Service Teams Directory', 'Every delivery team, its leader, seats, people and live workload.', D, 'layers', M.PRJ),
  pg('campaign-performance', 'Campaign Performance', 'Spend, leads, CPL and ROAS per client campaign.', D, 'layers', M.PRJ),
  pg('web-seo', 'Website & SEO Delivery', 'Website builds, SEO audits, rankings and handovers.', D, 'layers', M.PRJ),
  pg('client-reporting', 'Client Reporting Builder', 'Monthly client reports: build, review and send.', D, 'layers', M.PRJ),
  pg('sla-quality', 'Service Quality & SLA', 'Turnaround targets, misses and quality scores per service.', D, 'layers', M.PRJ),
  pg('outsourcing', 'Outsourcing & Vendor Delivery', 'Work given to vendors and freelancers, cost and quality.', D, 'layers', M.PRJ));
after('people-overview', pg('requisitions', 'Hiring Requisitions', 'Approved openings before recruitment starts.', H, 'user', M.HR));
after('weekly-reports', pg('performance', 'Performance & Development', 'Goals, reviews, ratings and training plans.', H, 'user', M.HR));
after('hr_onboarding', pg('assets-issued', 'Assets & Access Issued', 'Laptops, ID cards, tools and logins given to each person.', H, 'user', M.HR));
after('signatures', pg('hr-letters', 'HR Letter Register', 'Every offer, appointment, warning and relieving letter issued.', DC, 'folder', M.HR), pg('finance-docs', 'Finance Documents Register', 'Invoices, receipts, credit notes and statements issued.', DC, 'folder', M.FIN));
after('archives', pg('doc-retention', 'Access & Retention Policies', 'Who can see each document type and how long it is kept.', DC, 'folder', M.SET));
after('sales-report', pg('retention-report', 'Client Retention Report', 'Renewals, churn and revenue kept per client.', R, 'chart', M.CLI));
after('analytics', pg('report-builder', 'Custom Report Builder', 'Pick data, columns and filters; export to CSV.', R, 'chart', M.REP), pg('scheduled-reports', 'Scheduled Reports', 'Reports to prepare every day, week or month.', R, 'chart', M.REP));
after('permission-actions', pg('approval-policy', 'Approval Policies & Delegation', 'Who may approve what, and the Rs 5,000 manager limit.', A, 'settings', M.SET));

for (const id of ['global-search', 'my-profile', 'time-logs']) if (!EVERYONE.includes(id)) EVERYONE.push(id);
const give = (role: string, ids: string[]) => { const l = ROLE_PAGES[role]; if (l) for (const id of ids) if (!l.includes(id)) l.push(id); };
const DEL = ['service-teams', 'campaign-performance', 'web-seo', 'client-reporting', 'sla-quality', 'outsourcing'];
give('manager', ['lead-import', 'calls', 'sales-targets', 'lead-analytics', 'contacts', 'engagements', 'client-requests', 'milestones', 'risks', ...DEL, 'exceptions', 'approval-history', 'retention-report']);
give('sales_manager', ['lead-import', 'calls', 'sales-targets', 'comm-templates', 'lead-analytics', 'contacts', 'retention-report']);
give('sales_team_leader', ['lead-import', 'calls', 'sales-targets', 'comm-templates', 'lead-analytics']);
give('sales_executive', ['lead-import', 'calls', 'comm-templates']);
give('telecaller', ['lead-import', 'calls', 'comm-templates']);
give('client_relationship_manager', ['contacts', 'engagements', 'client-requests', 'client-assets', 'retention-report', 'client-reporting', 'calls']);
give('client_support_executive', ['contacts', 'client-requests', 'calls']);
for (const r of ['operations_manager', 'project_manager', 'project_coordinator']) give(r, ['milestones', 'risks', ...DEL, 'engagements', 'client-requests']);
give('team_leader', ['milestones', 'risks', 'service-teams', 'campaign-performance', 'web-seo', 'sla-quality']);
give('hr', ['requisitions', 'performance', 'assets-issued', 'hr-letters']);
give('hr_executive', ['requisitions', 'assets-issued', 'hr-letters']);
give('recruiter', ['requisitions']);
give('finance', ['finance-docs', 'exceptions', 'approval-history']);
give('accountant', ['finance-docs']);
give('auditor', ['approval-history', 'finance-docs']);

// ---------------- approval policy: Rs 5,000 rule (spec 4 + WF-11/12) ----------------
export interface ApprovalPolicy { limit: number; delegated: string[] }
export const POLICY_KEY = 'paa_x_os_policy';
export const DEFAULT_POLICY: ApprovalPolicy = { limit: 5000, delegated: ['manager', 'operations_manager'] };
export const readPolicy = (): ApprovalPolicy => ({ ...DEFAULT_POLICY, ...readKey<Partial<ApprovalPolicy>>(POLICY_KEY, {}) });
/** Founder always; a delegated manager only up to the limit and never for their own claim. */
export function canApproveAmount(role: string, amount: number, claimantId: string | undefined, me: string): boolean {
  if (claimantId && claimantId === me && role !== 'super_admin') return false;
  if (FULL_ACCESS.includes(role) && role === 'super_admin') return true;
  const p = readPolicy();
  return p.delegated.includes(role) && Math.round((amount || 0) * 100) <= Math.round(p.limit * 100);
}
export const reviewerFor = (amount: number) => (Math.round((amount || 0) * 100) <= Math.round(readPolicy().limit * 100) ? `Manager (up to \u20B9${readPolicy().limit.toLocaleString('en-IN')}) / Founder` : 'Founder');
/** Founder-only categories regardless of amount. */
export const FOUNDER_ONLY = ['Refund', 'Discount', 'Write-off', 'Vendor Bank Change', 'Owner Money Exception'];
