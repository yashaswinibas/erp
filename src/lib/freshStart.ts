// AGENCYOS_FRESH_START: the app starts with no sample data (only login people + settings).
// Runs once per browser when the app works without the database (in database mode the database decides).
const FLAG = 'paa_x_fresh_start_v1';
const KEEP = /^(paa_employees|paa_departments|paa_designations|paa_company|paa_theme|paa_x_credentials|paa_x_session|paa_x_db_.*|paa_x_remember|paa_x_os_perm|paa_x_os_actions|paa_x_os_policy|paa_x_perm_overrides|paa_x_os_org|paa_x_bank|paa_x_statutory|paa_x_payroll_rules|paa_x_salary_structures|paa_x_role_accounts_v1|paa_x_os_sel_.*|paa_x_must_change|paa_x_lockouts|paa_x_failed|paa_leave_balances|paa_x_fresh_start_v1)$|template|tpl|settings/i;
const DATA = ['paa_clients', 'paa_leads', 'paa_invoices', 'paa_payments', 'paa_expenses', 'paa_projects', 'paa_tasks', 'paa_quotations', 'paa_agreements',
  'paa_reimbursements', 'paa_payslips', 'paa_attendance', 'paa_leave_requests', 'paa_field_visits', 'paa_notifications', 'paa_daily_activities', 'paa_regularizations', 'paa_audit_logs'];

try {
  const dbMode = (import.meta as any).env?.VITE_USE_DB === '1';
  if (!dbMode && !localStorage.getItem(FLAG)) {
    const keys = new Set(DATA);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('paa') || KEEP.test(k)) continue;
      try { if (Array.isArray(JSON.parse(localStorage.getItem(k) as string))) keys.add(k); } catch { /* not a list */ }
    }
    keys.forEach((k) => localStorage.setItem(k, '[]'));
    try {
      const lb = JSON.parse(localStorage.getItem('paa_leave_balances') || '[]');
      if (Array.isArray(lb)) localStorage.setItem('paa_leave_balances', JSON.stringify(lb.map((b: any) => ({ ...b, casualLeaveUsed: 0, sickLeaveUsed: 0, privilegeLeaveUsed: 0, compOffUsed: 0 }))));
    } catch { /* ignore */ }
    localStorage.setItem(FLAG, new Date().toISOString());
  }
} catch { /* storage blocked */ }
export {};