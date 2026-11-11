// AGENCYOS_RESET: clean the database for a fresh start.
// KEEPS : employees (all login people) + their passwords, departments, designations, org chart,
//         permissions / role settings, company settings, payroll & statutory settings,
//         salary structures, bank details, templates. Leave balances stay but "used" goes back to 0.
// DELETES: leads, clients, projects, tasks, quotations, invoices, payments, expenses, attendance,
//          leaves, reimbursements, payslips, payroll runs, documents, notifications, audit log,
//          login history and every other record.
// A full backup is saved first in the "backups" folder.
//   Check only : node server/reset-data.mjs
//   Really do it: node server/reset-data.mjs --yes
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const E = process.env;
const DO_IT = process.argv.includes('--yes');
const USE_SSL = /^(1|true|yes|require)$/i.test(E.DB_SSL || '') || /supabase/i.test((E.DATABASE_URL || '') + (E.DB_HOST || ''));
const SSL = USE_SSL ? { rejectUnauthorized: false } : undefined;
const DB = { host: E.DB_HOST || 'localhost', port: Number(E.DB_PORT || 5432), user: E.DB_USER || 'postgres', password: E.DB_PASSWORD || '', database: E.DB_NAME || 'agencyos' };
if (!E.DATABASE_URL && !E.DB_PASSWORD) { console.error('Database settings missing in .env'); process.exit(1); }
const pool = new pg.Pool(E.DATABASE_URL && !E.DB_PASSWORD ? { connectionString: E.DATABASE_URL.replace(/[?&]sslmode=[^&]*/, ''), ssl: SSL, max: 2 } : { ...DB, ssl: SSL, max: 2 });

// tables that are wiped completely
const WIPE_TABLES = ['leads', 'clients', 'projects', 'tasks', 'quotations', 'agreements', 'invoices', 'payments', 'expenses',
  'attendance', 'attendance_regularizations', 'daily_activities', 'field_visits', 'reimbursements', 'payslips',
  'leave_requests', 'notifications', 'audit_logs', 'login_events', 'sync_events', 'deleted_records'];
// browser stores that are kept (setup, not activity)
const KEEP_STORE = /^(paa_x_salary_structures|paa_x_credentials)$|template|tpl/i;
// settings that are kept even if they are lists
const KEEP_SETTING = /^(paa_company|paa_x_os_perm|paa_x_os_actions|paa_x_os_policy|paa_x_perm_overrides|paa_x_os_org|paa_x_bank|paa_x_statutory|paa_x_payroll_rules|paa_x_salary_structures|paa_x_deal_settings|paa_x_cashbook_settings)$|template|tpl|settings/i;

const q = (s, a) => pool.query(s, a);
const exists = async (t) => (await q('SELECT to_regclass($1) r', ['public.' + t])).rows[0].r !== null;
const count = async (t) => ((await exists(t)) ? Number((await q(`SELECT count(*)::int n FROM public."${t}"`)).rows[0].n) : 0);

// record pages (Proposals, Recruitment, Contacts ...) show demo rows when empty: give each one an empty list
function recordKinds() {
  const kinds = new Set();
  const walk = (dir) => { for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(f)) {
    const s = fs.readFileSync(p, 'utf8');
    if (!/useRecords|paa_x_os_rec_/.test(s) && !/kind:\s*'/.test(s)) continue;
    for (const m of s.matchAll(/useRecords(?:<[^>]*>)?\(\s*'([\w-]+)'/g)) kinds.add(m[1]);
    if (/RECORDS|cfg\.kind|codePrefix/.test(s)) for (const m of s.matchAll(/\bkind:\s*'([\w-]+)'/g)) kinds.add(m[1]);
  } } };
  walk('src');
  return [...kinds].map((k) => 'paa_x_os_rec_' + k);
}

async function main() {
  console.log('\nAgencyOS database clean-up' + (DO_IT ? '' : '  (CHECK ONLY - nothing is changed)'));
  console.log('Database:', E.DATABASE_URL ? new URL(E.DATABASE_URL).hostname : DB.host, '\n');
  const emps = (await exists('employees')) ? (await q('SELECT data FROM employees ORDER BY pos')).rows.map((r) => r.data) : [];
  console.log(`KEEP   ${emps.length} login people:`);
  for (const e of emps) console.log(`         - ${e.name} (${e.email || e.employeeId}) ${e.role || ''}`);
  console.log('KEEP   departments, designations, org chart, permissions, company & payroll settings, salary structures, bank details, templates');
  console.log('\nDELETE:');
  for (const t of WIPE_TABLES) { const n = await count(t); if (n) console.log(`         ${t}: ${n} rows`); }
  const stores = (await q('SELECT store, count(*)::int n FROM app_records GROUP BY store ORDER BY store')).rows.filter((r) => !KEEP_STORE.test(r.store));
  for (const r of stores) console.log(`         ${r.store}: ${r.n} rows`);
  const sets = (await q('SELECT key, value FROM app_settings ORDER BY key')).rows.filter((r) => Array.isArray(r.value) && r.value.length && !KEEP_SETTING.test(r.key));
  for (const r of sets) console.log(`         ${r.key}: ${r.value.length} items`);

  if (!DO_IT) { console.log('\nNothing changed. To really clean it, run:  node server/reset-data.mjs --yes\n'); return; }

  // 1. full backup
  const backup = { takenAt: new Date().toISOString(), tables: {} };
  for (const t of (await q("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows.map((r) => r.tablename)) backup.tables[t] = (await q(`SELECT * FROM public."${t}"`)).rows;
  fs.mkdirSync('backups', { recursive: true });
  const file = path.join('backups', 'backup-' + new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16) + '.json');
  fs.writeFileSync(file, JSON.stringify(backup));
  let gi = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
  if (!gi.split(/\r?\n/).includes('backups/')) fs.writeFileSync('.gitignore', gi + (gi.endsWith('\n') || !gi ? '' : '\n') + 'backups/\n');
  console.log('\nBackup saved:', file, '(kept off GitHub)');

  // 2. clean
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    for (const t of WIPE_TABLES) {
      if (!(await exists(t))) continue;
      if (t === 'audit_logs') { await c.query('ALTER TABLE audit_logs DISABLE TRIGGER USER'); await c.query('DELETE FROM audit_logs'); await c.query('ALTER TABLE audit_logs ENABLE TRIGGER USER'); }
      else await c.query(`DELETE FROM public."${t}"`);
    }
    if (await exists('leave_balances')) await c.query(`UPDATE leave_balances SET data = data || '{"casualLeaveUsed":0,"sickLeaveUsed":0,"privilegeLeaveUsed":0,"compOffUsed":0}'::jsonb, updated_at = now()`);
    if (await exists('employees')) await c.query(`UPDATE employees SET data = jsonb_set(data, '{assignedProjectIds}', '[]'::jsonb), updated_at = now() WHERE data ? 'assignedProjectIds'`);
    // browser stores -> empty lists (an empty list stops demo rows coming back)
    const emptyKeys = new Set([...stores.map((r) => r.store), ...sets.map((r) => r.key), ...recordKinds()]);
    await c.query("DELETE FROM app_records WHERE NOT (store ~* '^(paa_x_salary_structures|paa_x_credentials)$' OR store ~* 'template' OR store ~* 'tpl')");
    for (const k of emptyKeys) if (!KEEP_SETTING.test(k) && !KEEP_STORE.test(k))
      await c.query("INSERT INTO app_settings (key, value, updated_by) VALUES ($1, '[]'::jsonb, 'reset') ON CONFLICT (key) DO UPDATE SET value='[]'::jsonb, updated_at=now(), updated_by='reset'", [k]);
    await c.query("INSERT INTO sync_events (store, by_employee) VALUES ('paa_reset', 'reset')");
    await c.query('COMMIT');
  } catch (err) { await c.query('ROLLBACK'); throw err; } finally { c.release(); }

  console.log('\nDONE. Only the login people and settings are left.');
  console.log('Next: close every AgencyOS tab, open the website again and sign in. The old data disappears from the browser too.\n');
}
main().catch((e) => { console.error('\nFailed - nothing was changed:', e.message); process.exitCode = 1; }).finally(() => pool.end());