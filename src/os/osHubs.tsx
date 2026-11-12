// AGENCYOS_HUBS: simpler menu - related screens are grouped into one menu item with tabs.
// Every screen still exists (same permissions); only the menu is shorter.
import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useShared } from '../lib/sharedStore';
import { PAGES, NAV_GROUPS, ALIASES, osCanAccess, fieldModuleOn, FIELD_MODULE_KEY } from './osConfig';

export interface Hub { id: string; name: string; members: string[]; optional?: boolean }
export const HUBS: Hub[] = [
  { id: 'hub-approvals', name: 'Approvals', members: ['approvals', 'approval-history', 'exceptions'] },
  { id: 'hub-leads', name: 'Leads', members: ['leads', 'pipeline', 'lead-profile', 'lead-import', 'followups', 'calls', 'lost', 'lead-rules'] },
  { id: 'hub-clients', name: 'Clients', members: ['clients', 'client-profile', 'contacts', 'onboarding', 'engagements', 'client-requests', 'client-assets', 'deals_agreements'] },
  { id: 'hub-work', name: 'Work', members: ['projects', 'project-profile', 'milestones', 'task_operations', 'my_tasks', 'task-review', 'time-logs'] },
  { id: 'hub-field', name: 'Field Visits', members: ['field_force_desk', 'field_force', 'field_gps'], optional: true },
  { id: 'hub-invoices', name: 'Invoices', members: ['billing', 'invoice-builder'] },
  { id: 'hub-collections', name: 'Payments & Collections', members: ['payments', 'receivables', 'deals_installments'] },
  { id: 'hub-documents', name: 'Documents', members: ['document_center', 'document-builder', 'templates', 'signatures', 'hr-letters', 'finance-docs', 'archives', 'doc-retention'] },
  { id: 'hub-reports', name: 'Reports', members: ['reports', 'analytics', 'sales-report', 'team-report', 'profitability', 'retention-report', 'lead-analytics', 'report-builder', 'scheduled-reports'] },
];
// short tab names
const LABEL: Record<string, string> = {
  approvals: 'Pending', 'approval-history': 'History', exceptions: 'Exceptions & Overrides',
  leads: 'All Leads', pipeline: 'Pipeline', 'lead-profile': 'Lead 360\u00B0', 'lead-import': 'Add / Import', followups: 'Follow-ups', calls: 'Calls & Activities', lost: 'Lost', 'lead-rules': 'Assignment & Duplicates',
  clients: 'All Clients', 'client-profile': 'Client 360\u00B0', contacts: 'Contacts', onboarding: 'Onboarding', engagements: 'Services Taken', 'client-requests': 'Requests & Complaints', 'client-assets': 'Access & Assets', deals_agreements: 'Contracts & Renewals',
  projects: 'Projects', 'project-profile': 'Project 360\u00B0', milestones: 'Milestones', task_operations: 'All Tasks', my_tasks: 'My Tasks', 'task-review': 'Submissions & Review', 'time-logs': 'Time Logs',
  field_force_desk: 'Overview', field_force: 'Visits', field_gps: 'GPS',
  billing: 'All Invoices', 'invoice-builder': 'New Invoice',
  payments: 'Payments & Receipts', receivables: 'Pending Collections', deals_installments: 'Instalments',
  document_center: 'Library', 'document-builder': 'Generator', templates: 'Templates', signatures: 'Signatures', 'hr-letters': 'HR Letters', 'finance-docs': 'Finance Documents', archives: 'Archive', 'doc-retention': 'Retention',
  reports: 'Company', analytics: 'Analytics', 'sales-report': 'Sales', 'team-report': 'Team', profitability: 'Client Profitability', 'retention-report': 'Client Retention', 'lead-analytics': 'Lead Analytics', 'report-builder': 'Custom Report', 'scheduled-reports': 'Scheduled',
};
const exists = (id: string) => PAGES.some((p) => p.id === id);
export const hubOf = (tab: string) => { const t = ALIASES[tab] || tab; return HUBS.find((h) => h.members.includes(t)); };
const hubVisible = (h: Hub, role: string) => !(h.optional && !fieldModuleOn() && role !== 'super_admin');
export const hubTabs = (h: Hub, role: string) => (hubVisible(h, role) ? h.members.filter((id) => exists(id) && osCanAccess(role, id)) : []);
const LAST = 'paa_x_os_sel_hub';
const lastTab = (h: Hub) => { try { return (JSON.parse(sessionStorage.getItem(LAST) || '{}') || {})[h.id] as string | undefined; } catch { return undefined; } };
const rememberTab = (h: Hub, tab: string) => { try { const m = JSON.parse(sessionStorage.getItem(LAST) || '{}') || {}; m[h.id] = tab; sessionStorage.setItem(LAST, JSON.stringify(m)); } catch { /* ignore */ } };

export interface NavEntry { id: string; name: string; go: string; members?: string[] }
/** Menu for this role: grouped screens become one entry. */
export function buildNav(role: string, q: string) {
  const s = q.toLowerCase().trim();
  return NAV_GROUPS.map((g) => {
    const out: NavEntry[] = []; const done = new Set<string>();
    for (const p of PAGES) {
      if (p.group !== g.key || p.hidden) continue;
      const h = hubOf(p.id);
      if (h) {
        const home = PAGES.find((x) => x.id === h.members.find(exists))?.group;
        if (home !== g.key || done.has(h.id)) continue; done.add(h.id);
        const tabs = hubTabs(h, role); if (!tabs.length) continue;
        const names = [h.name, ...tabs.map((id) => PAGES.find((x) => x.id === id)?.name || '')].join(' ').toLowerCase();
        if (s && !names.includes(s)) continue;
        const last = lastTab(h);
        out.push({ id: h.id, name: h.name, members: h.members, go: last && tabs.includes(last) ? last : tabs[0] });
        continue;
      }
      if (!osCanAccess(role, p.id)) continue;
      if (s && !p.name.toLowerCase().includes(s)) continue;
      out.push({ id: p.id, name: p.name, go: p.id });
    }
    return { ...g, pages: out };
  }).filter((g) => g.pages.length);
}

const OLD = ['dashboard', 'owner_desk', 'hr_desk', 'pm_desk', 'employee_desk', 'crm'];
/** Tab bar shown under the page title when the screen belongs to a group. */
export const HubTabs: React.FC = () => {
  const { activeTab, setActiveTab, currentRole } = useApp();
  const [mods, setMods] = useShared<Record<string, boolean>>(FIELD_MODULE_KEY, {});
  useEffect(() => { if (OLD.includes(activeTab) && ALIASES[activeTab]) setActiveTab(ALIASES[activeTab]); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = hubOf(activeTab);
  const cur = ALIASES[activeTab] || activeTab;
  useEffect(() => { if (h) rememberTab(h, cur); }, [h, cur]);
  if (!h) return null;
  const tabs = hubTabs(h, currentRole);
  const fieldOn = mods.field !== false;
  return (
    <div className="hub-tabs">
      {tabs.length > 1 && tabs.map((id) => (
        <button key={id} className={`hub-tab ${cur === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>{LABEL[id] || PAGES.find((p) => p.id === id)?.name || id}</button>
      ))}
      {h.optional && currentRole === 'super_admin' && (
        <label className="hub-switch" title="Turn the Field Visits module on or off for everyone">
          <input type="checkbox" checked={fieldOn} onChange={(e) => setMods({ ...mods, field: e.target.checked })} />
          <span>Field Visits module {fieldOn ? 'ON' : 'OFF'}</span>
        </label>
      )}
    </div>
  );
};