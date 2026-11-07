// AGENCYOS_V5_P26B: one login for every role (created once, password Welcome@123, must change at first login)
import { INITIAL_EMPLOYEES } from '../data/initialData';

const FLAG = 'paa_x_role_accounts_v1';
// role, name, email user, org unit, position
const ACCOUNTS: [string, string, string, string, string][] = [
  ['manager', 'Arjun Mehta', 'gm', 'leadership', 'General Manager'],
  ['recruiter', 'Kavya Nair', 'recruiter', 'hr', 'Recruiter'],
  ['hr_executive', 'Divya Rao', 'hrexec', 'hr', 'HR Executive'],
  ['finance', 'Vikram Iyer', 'finance', 'finance', 'Accounts & Finance Manager'],
  ['accountant', 'Sneha Kulkarni', 'accountant', 'finance', 'Accountant'],
  ['billing_executive', 'Rohit Jain', 'billing', 'finance', 'Billing Executive'],
  ['sales_manager', 'Manoj Reddy', 'salesmanager', 'sales', 'Sales Manager'],
  ['sales_team_leader', 'Pooja Shetty', 'salestl', 'sales', 'Sales Team Leader'],
  ['sales_executive', 'Anil Kumar', 'sales', 'sales', 'Sales Executive'],
  ['telecaller', 'Meena Joshi', 'telecaller', 'sales', 'Telecaller'],
  ['business_development', 'Farhan Ali', 'bde', 'sales', 'Sales Executive'],
  ['client_relationship_manager', 'Neha Gupta', 'crm', 'crm', 'Client Relationship Manager'],
  ['client_support_executive', 'Ravi Teja', 'support', 'crm', 'Client Support Executive'],
  ['operations_manager', 'Suresh Babu', 'operations', 'ops', 'Operations / Project Manager'],
  ['project_manager', 'Kiran Rao', 'pm', 'ops', 'Operations / Project Manager'],
  ['project_coordinator', 'Lakshmi Prasad', 'coordinator', 'ops', 'Project Coordinator'],
  ['team_leader', 'Deepak Verma', 'teamlead', 'perf', 'Team Leader'],
  ['employee', 'Sanjay Patil', 'specialist', 'perf', 'Meta Ads Specialist'],
  ['intern', 'Aditi Singh', 'intern', 'creative', 'Graphic Designer'],
  ['automation_specialist', 'Nikhil Bhat', 'automation', 'leadgen', 'WhatsApp Automation Executive'],
  ['freelancer', 'Kiran Das', 'freelancer', 'external', 'Freelancer'],
  ['consultant', 'Prakash Menon', 'consultant', 'external', 'Consultant'],
  ['auditor', 'Ramesh Hegde', 'auditor', 'external', 'Auditor'],
  ['vendor', 'PrintCo Vendor', 'vendor', 'external', 'Vendor'],
  ['admin', 'Owner Admin', 'owner', 'leadership', 'Founder / Owner / Super Admin'],
];

export function seedRoleAccounts() {
  try {
    if (localStorage.getItem(FLAG)) return;
    const emps: any[] = JSON.parse(localStorage.getItem('paa_employees') || 'null') || INITIAL_EMPLOYEES.map((e) => ({ ...e }));
    const org: Record<string, any> = JSON.parse(localStorage.getItem('paa_x_os_org') || '{}') || {};
    const tpl: any = INITIAL_EMPLOYEES.find((e) => e.role === 'employee') || INITIAL_EMPLOYEES[0];
    let n = 101; const used = new Set(emps.map((e) => e.employeeId));
    let tlId = '';
    for (const [role, name, user, unit, position] of ACCOUNTS) {
      const email = `${user}@priorityadsagency.com`;
      let e = emps.find((x) => x.email === email);
      if (!e) {
        while (used.has(`PAA-EMP-${n}`)) n++;
        const employeeId = `PAA-EMP-${n}`; used.add(employeeId); n++;
        e = { ...tpl, id: `emp-role-${role}`, employeeId, name, email, role, status: 'active', assignedProjectIds: [], skills: [], experienceYears: 1, joiningDate: new Date().toISOString().slice(0, 10), photo: undefined,
          salary: { basic: 20000, hra: 8000, allowances: 4000, incentives: 0, bonus: 0, deductions: 0, netSalary: 32000 } };
        emps.push(e);
      }
      if (!org[e.id]) org[e.id] = { unit, position, reportsTo: '' };
      if (role === 'team_leader') tlId = e.id;
    }
    // service team members report to the demo Team Leader so the Team Leader desk shows a team
    for (const e of emps) if (tlId && org[e.id]?.unit === 'perf' && e.id !== tlId && !org[e.id].reportsTo) org[e.id].reportsTo = tlId;
    localStorage.setItem('paa_employees', JSON.stringify(emps));
    localStorage.setItem('paa_x_os_org', JSON.stringify(org));
    localStorage.setItem(FLAG, new Date().toISOString());
  } catch (err) { console.warn('Role accounts not created', err); }
}
seedRoleAccounts();
