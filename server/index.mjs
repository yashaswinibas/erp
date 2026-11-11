// AgencyOS server: Express + PostgreSQL. Stores every record of the app in its own table,
// checks logins (bcrypt), sessions (device / IP) and permissions on the server.
// Start:  npm run server     (reads DATABASE_URL, JWT_SECRET, PORT from .env)
import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';

import D from './defaults.json' with { type: 'json' }; // AGENCYOS_VERCEL
const M = D.M;
const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || '';
// AGENCYOS_SERVER_STATUS
const E = process.env;
const DB = { host: E.DB_HOST || 'localhost', port: Number(E.DB_PORT || 5432), user: E.DB_USER || 'postgres', password: E.DB_PASSWORD || '', database: E.DB_NAME || 'agencyos' };
if (!E.DATABASE_URL && !E.DB_PASSWORD) { console.error('Database settings missing in .env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)'); process.exit(1); }
const STARTED = Date.now();
if (SECRET.length < 16) { console.error('JWT_SECRET in .env must be at least 16 characters'); process.exit(1); }
// AGENCYOS_SUPABASE: SSL for cloud databases (DB_SSL=true, or automatic for supabase.com)
const USE_SSL = /^(1|true|yes|require)$/i.test(E.DB_SSL || '') || /supabase/i.test((E.DATABASE_URL || '') + (E.DB_HOST || ''));
const SSL = USE_SSL ? { rejectUnauthorized: false } : undefined;
const pool = new pg.Pool(E.DATABASE_URL && !E.DB_PASSWORD ? { connectionString: E.DATABASE_URL.replace(/[?&]sslmode=[^&]*/, ''), ssl: SSL, max: E.VERCEL ? 3 : 10 } : { ...DB, ssl: SSL, max: E.VERCEL ? 3 : 10 });
const dbInfo = () => { if (E.DATABASE_URL && !E.DB_PASSWORD) { try { const u = new URL(E.DATABASE_URL); return { host: u.hostname, port: u.port || '5432', user: decodeURIComponent(u.username), database: u.pathname.slice(1) }; } catch { return {}; } } return { host: DB.host, port: DB.port, user: DB.user, database: DB.database }; };
const DEFAULT_PASSWORD = 'Welcome@123';
const clientHash = (pw) => crypto.createHash('sha256').update('paa-salt:' + pw).digest('hex'); // same as the browser

// ---------------------------------------------------------------- tables
// key in the app -> table, typed columns [column, field, type], owner field, module
const T = {
  paa_employees: { t: 'employees', cols: [['employee_code', 'employeeId'], ['name', 'name'], ['email', 'email'], ['phone', 'phone'], ['role', 'role'], ['status', 'status']], mod: M.HR, alt: M.PAY },
  paa_departments: { t: 'departments', cols: [['name', 'name']], mod: M.HR },
  paa_designations: { t: 'designations', cols: [['title', 'title'], ['department_id', 'departmentId']], mod: M.HR },
  paa_attendance: { t: 'attendance', cols: [['employee_id', 'employeeId'], ['date', 'date'], ['status', 'status']], own: 'employeeId', team: true },
  paa_regularizations: { t: 'attendance_regularizations', cols: [['employee_id', 'employeeId'], ['date', 'date'], ['status', 'status']], own: 'employeeId', team: true },
  paa_daily_activities: { t: 'daily_activities', cols: [['employee_id', 'employeeId'], ['date', 'date']], own: 'employeeId', team: true },
  paa_leads: { t: 'leads', cols: [['lead_code', 'leadCode'], ['company', 'company'], ['phone', 'phone'], ['email', 'email'], ['source', 'source'], ['status', 'status'], ['assigned_employee_id', 'assignedEmployeeId'], ['estimated_value', 'estimatedValue', 'numeric']], own: 'assignedEmployeeId', mod: M.CRM },
  paa_clients: { t: 'clients', cols: [['client_code', 'clientCode'], ['company_name', 'companyName'], ['phone', 'phone'], ['email', 'email'], ['status', 'status']], mod: M.CLI },
  paa_field_visits: { t: 'field_visits', cols: [['employee_id', 'employeeId'], ['client_id', 'clientId'], ['status', 'status']], own: 'employeeId', mod: M.TSK },
  paa_reimbursements: { t: 'reimbursements', cols: [['code', 'reimbursementCode'], ['employee_id', 'employeeId'], ['date', 'date'], ['amount', 'amount', 'numeric'], ['status', 'status']], own: 'employeeId', team: true },
  paa_projects: { t: 'projects', cols: [['project_code', 'projectCode'], ['name', 'name'], ['client_id', 'clientId'], ['status', 'status'], ['project_manager_id', 'projectManagerId']], mod: M.PRJ },
  paa_tasks: { t: 'tasks', cols: [['task_code', 'taskCode'], ['title', 'title'], ['project_id', 'projectId'], ['assigned_employee_id', 'assignedEmployeeId'], ['status', 'status'], ['due_date', 'dueDate']], own: 'assignedEmployeeId', mod: M.TSK },
  paa_quotations: { t: 'quotations', cols: [['number', 'quotationNumber'], ['client_id', 'clientId'], ['total', 'total', 'numeric'], ['discount', 'discount', 'numeric'], ['status', 'status']], mod: M.CRM },
  paa_agreements: { t: 'agreements', cols: [['number', 'agreementNumber'], ['client_id', 'clientId'], ['status', 'status'], ['end_date', 'endDate']], mod: M.CLI },
  paa_invoices: { t: 'invoices', cols: [['number', 'invoiceNumber'], ['client_id', 'clientId'], ['issue_date', 'issueDate'], ['due_date', 'dueDate'], ['total', 'totalAmount', 'numeric'], ['balance', 'balanceAmount', 'numeric'], ['status', 'status']], mod: M.FIN },
  paa_payments: { t: 'payments', cols: [['code', 'paymentCode'], ['invoice_id', 'invoiceId'], ['date', 'date'], ['amount', 'amount', 'numeric']], mod: M.FIN },
  paa_expenses: { t: 'expenses', cols: [['code', 'expenseCode'], ['date', 'date'], ['category', 'category'], ['amount', 'amount', 'numeric'], ['employee_id', 'employeeId']], mod: M.FIN },
  paa_payslips: { t: 'payslips', cols: [['number', 'payslipNumber'], ['employee_id', 'employeeId'], ['pay_period', 'payPeriod']], own: 'employeeId', mod: M.PAY, ownRead: true },
  paa_notifications: { t: 'notifications', cols: [['user_id', 'userId'], ['title', 'title'], ['read', 'read']], open: true },
  paa_audit_logs: { t: 'audit_logs', cols: [['user_id', 'userId'], ['user_name', 'userName'], ['action', 'action'], ['related_record', 'relatedRecord'], ['date', 'date'], ['time', 'time']], appendOnly: true },
  paa_leave_requests: { t: 'leave_requests', cols: [['code', 'leaveCode'], ['employee_id', 'employeeId'], ['leave_type', 'leaveType'], ['start_date', 'startDate'], ['status', 'status']], own: 'employeeId', team: true },
  paa_leave_balances: { t: 'leave_balances', cols: [['employee_id', 'employeeId']], own: 'employeeId', team: true },
};
const TABLE_KEYS = Object.keys(T);
// browser-only keys never stored on the server
const LOCAL_ONLY = /^(paa_theme|paa_x_session|paa_x_remember|paa_x_failed|paa_x_lockouts|paa_x_must_change|paa_x_os_sel_.*|paa_x_reminders_ran|paa_x_role_accounts_v1|paa_x_os_last_backup|paa_x_db_.*)$/;
const PAYROLL_ROLES = ['super_admin', 'admin', 'hr', 'finance', 'accountant'];
const PAY_KEYS = ['paa_x_payroll_runs', 'paa_x_salary_structures', 'paa_x_bank', 'paa_x_statutory', 'paa_x_payroll_rules'];
const FOUNDER_KEYS = ['paa_x_os_perm', 'paa_x_os_actions', 'paa_x_os_policy', 'paa_x_perm_overrides', 'paa_company'];
const HR_KEYS = ['paa_x_os_exits', 'paa_x_os_rec_incidents', 'paa_x_employee_docs', 'paa_x_onboarding', 'paa_x_contracts'];
const HR_ROLES = ['super_admin', 'admin', 'hr', 'hr_executive'];

// ---------------------------------------------------------------- schema (created automatically)
async function migrate() {
  const sql = [];
  for (const k of TABLE_KEYS) {
    const d = T[k];
    sql.push(`CREATE TABLE IF NOT EXISTS ${d.t} (id text PRIMARY KEY, ${d.cols.map(([c, , ty]) => `${c} ${ty || 'text'}`).join(', ')}, data jsonb NOT NULL, pos double precision NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), updated_by text)`);
    for (const [c] of d.cols.filter(([c]) => /_id$|status|date|email|code|number/.test(c))) sql.push(`CREATE INDEX IF NOT EXISTS ${d.t}_${c}_idx ON ${d.t} (${c})`);
  }
  sql.push(`CREATE TABLE IF NOT EXISTS app_records (store text NOT NULL, id text NOT NULL, data jsonb NOT NULL, pos double precision NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(), updated_by text, PRIMARY KEY (store, id))`);
  sql.push(`CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value jsonb, updated_at timestamptz NOT NULL DEFAULT now(), updated_by text)`);
  sql.push(`CREATE TABLE IF NOT EXISTS user_credentials (employee_id text PRIMARY KEY, password_hash text NOT NULL, must_change boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(), updated_by text)`);
  sql.push(`CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY, employee_id text NOT NULL, ip text, user_agent text, created_at timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz)`);
  sql.push(`CREATE TABLE IF NOT EXISTS login_events (id bigserial PRIMARY KEY, employee_id text, login text, ok boolean NOT NULL, reason text, ip text, user_agent text, at timestamptz NOT NULL DEFAULT now())`);
  sql.push(`CREATE TABLE IF NOT EXISTS sync_events (id bigserial PRIMARY KEY, store text NOT NULL, by_employee text, at timestamptz NOT NULL DEFAULT now())`);
  sql.push(`CREATE TABLE IF NOT EXISTS deleted_records (id bigserial PRIMARY KEY, store text NOT NULL, record_id text NOT NULL, data jsonb, deleted_by text, deleted_at timestamptz NOT NULL DEFAULT now())`);
  // audit trail is append-only: block UPDATE / DELETE even from SQL tools
  sql.push(`CREATE OR REPLACE FUNCTION audit_no_change() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$ LANGUAGE plpgsql`);
  sql.push(`DROP TRIGGER IF EXISTS audit_logs_lock ON audit_logs`);
  sql.push(`CREATE TRIGGER audit_logs_lock BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION audit_no_change()`);
  for (const s of sql) await pool.query(s);
}

// ---------------------------------------------------------------- permissions
const isStaff = (r) => D.staff.includes(r);
const getSetting = async (key, fb) => { const r = await pool.query('SELECT value FROM app_settings WHERE key=$1', [key]); return r.rows[0] ? r.rows[0].value : fb; };
async function matrixFor(role) {
  if (role === 'super_admin') return D.modules.map(() => 1);
  const saved = (await getSetting('paa_x_os_perm', {}))[role];
  const d = D.matrix[role] || D.modules.map(() => 0);
  return d.map((v, i) => (Array.isArray(saved) && (saved[i] === 0 || saved[i] === 1) ? saved[i] : v));
}
function defaultActions(role, m, view) {
  if (role === 'super_admin') return 'CEDAX';
  if (!view) return '';
  if (role === 'admin') return 'CEDAX';
  if (role === 'auditor') return 'X';
  if (isStaff(role)) return m === M.CRM ? 'CE' : m === M.TSK ? 'E' : '';
  if (['manager', 'hr', 'finance', 'sales_manager', 'operations_manager', 'project_manager', 'client_relationship_manager'].includes(role)) return 'CEAX';
  if (['team_leader', 'sales_team_leader', 'project_coordinator'].includes(role)) return m === M.TSK || m === M.PRJ ? 'CEA' : 'CE';
  return 'CE';
}
async function can(role, m, act) {
  if (role === 'super_admin') return true;
  const mx = await matrixFor(role); const view = mx[m] === 1;
  if (!view) return false;
  const saved = ((await getSetting('paa_x_os_actions', {}))[role] || {})[m];
  return (typeof saved === 'string' ? saved : defaultActions(role, m, view)).includes(act);
}
async function canWriteRow(u, key, oldRow, newRow, act) {
  const d = T[key];
  if (u.role === 'super_admin') return true;
  if (d.appendOnly) return act === 'C';
  if (d.open) return act !== 'D' || u.role === 'admin';
  const mine = d.own && (newRow || oldRow) && (newRow ? newRow[d.own] === u.id : true) && (oldRow ? oldRow[d.own] === u.id : true);
  if (mine && act !== 'D') return true;
  if (d.team && !isStaff(u.role) && act !== 'D') return true; // managers / HR approve leave, attendance, claims
  if (d.mod === undefined) return act !== 'D' && !isStaff(u.role);
  if (await can(u.role, d.mod, act)) return true;
  if (d.alt !== undefined && act === 'E' && (await can(u.role, d.alt, 'E') || await can(u.role, d.alt, 'C'))) return true;
  if (d.own && d.mod === M.TSK && mine) return true;
  return false;
}

// ---------------------------------------------------------------- helpers
const row2 = (r) => r.data;
const colVals = (d, rec) => d.cols.map(([, f, ty]) => { const v = rec[f]; if (v === undefined || v === null || v === '') return null; return ty === 'numeric' ? Number(v) || 0 : typeof v === 'object' ? JSON.stringify(v) : String(v); });
async function upsertTable(client, key, rec, pos, by) {
  const d = T[key];
  const cols = d.cols.map(([c]) => c);
  const vals = colVals(d, rec);
  const ph = cols.map((_, i) => `$${i + 4}`);
  await client.query(`INSERT INTO ${d.t} (id, data, pos, ${cols.join(', ')}, updated_by) VALUES ($1, $2, $3, ${ph.join(', ')}, $${cols.length + 4})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, pos = EXCLUDED.pos, ${cols.map((c) => `${c} = EXCLUDED.${c}`).join(', ')}, updated_at = now(), updated_by = EXCLUDED.updated_by`,
  [String(rec.id), rec, pos, ...vals, by]);
}
const stripSalary = (e) => { const { salary, bankDetails, bank, pan, aadhaar, ...rest } = e; return rest; };

async function auth(req, res, next) {
  try {
    const tok = (req.headers.authorization || '').replace(/^Bearer /, '');
    const p = jwt.verify(tok, SECRET);
    const s = await pool.query('SELECT * FROM sessions WHERE id=$1', [p.sid]);
    const sess = s.rows[0];
    if (!sess || sess.revoked_at) return res.status(401).json({ error: 'Session ended. Please sign in again.' });
    if (Date.now() - new Date(sess.last_seen).getTime() > 12 * 3600 * 1000) { await pool.query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [p.sid]); return res.status(401).json({ error: 'Signed out after 12 hours of no activity.' }); }
    const e = await pool.query('SELECT data FROM employees WHERE id=$1', [sess.employee_id]);
    const emp = e.rows[0]?.data;
    if (!emp || emp.status === 'inactive') return res.status(401).json({ error: 'This account is disabled.' });
    await pool.query('UPDATE sessions SET last_seen=now() WHERE id=$1', [p.sid]);
    req.u = { id: emp.id, role: emp.role, name: emp.name, sid: p.sid };
    next();
  } catch { res.status(401).json({ error: 'Please sign in.' }); }
}

// ---------------------------------------------------------------- app
const app = express();
app.use(express.json({ limit: '25mb' }));
app.set('trust proxy', true);
const OPEN = ['/', '/api/server', '/api/status', '/api/health'];
app.use(async (req, res, next) => { if (OPEN.includes(req.path)) return next(); try { await READY; next(); } catch (e) { res.status(503).json({ error: 'Database not reachable: ' + e.message }); } });
const ip = (req) => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
async function status() {
  const out = { server: 'running', port: PORT, startedAt: new Date(STARTED).toLocaleString('en-IN'), uptimeMin: Math.round((Date.now() - STARTED) / 60000), db: { ...dbInfo(), connected: false } };
  try {
    out.db.version = (await pool.query('SHOW server_version')).rows[0].server_version;
    out.db.size = (await pool.query('SELECT pg_size_pretty(pg_database_size(current_database())) s')).rows[0].s;
    out.db.connected = true;
    const t = (await pool.query("SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")).rows;
    out.tables = [];
    for (const r of t) { const c = (await pool.query('SELECT count(*)::int n FROM public.' + '"' + r.name.replace(/"/g, '') + '"')).rows[0].n; out.tables.push({ name: r.name, rows: c }); }
    out.activeSessions = (await pool.query("SELECT count(*)::int n FROM sessions WHERE revoked_at IS NULL AND last_seen > now() - interval '12 hours'")).rows[0].n;
    const ls = (await pool.query('SELECT store, by_employee, at FROM sync_events ORDER BY id DESC LIMIT 1')).rows[0];
    out.lastChange = ls ? { store: ls.store, by: ls.by_employee, at: new Date(ls.at).toLocaleString('en-IN') } : null;
  } catch (e) { out.db.error = String(e.message); }
  return out;
}
app.get('/api/status', async (_q, res) => res.json(await status()));
app.get(['/', '/api/server'], async (_q, res) => {
  const s = await status(); const ok = s.db.connected;
  const row = (k, v) => '<tr><td>' + esc(k) + '</td><td><b>' + esc(v) + '</b></td></tr>';
  res.send('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="10"><title>AgencyOS Server</title><style>body{margin:0;background:#F8F9FB;font:14px Inter,Segoe UI,Arial;color:#111827}main{max-width:900px;margin:32px auto;padding:0 16px}.card{background:#fff;border:1px solid #E5E7EB;border-radius:13px;padding:20px;margin-bottom:16px}h1{color:#0B1738;margin:0 0 4px;font-size:22px}.mark{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#0B1738;color:#fff;font-weight:800;margin-right:10px;vertical-align:middle}.pill{display:inline-block;padding:5px 11px;border-radius:999px;font-weight:700;font-size:12px}.g{background:#E6F6EF;color:#087F59}.r{background:#FEEDEC;color:#B42318}table{width:100%;border-collapse:collapse}td,th{padding:8px 10px;border-bottom:1px solid #F1F2F5;text-align:left;font-size:13px}th{background:#FAFBFC;color:#667085;font-size:11px;text-transform:uppercase}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:700px){.grid{grid-template-columns:1fr}}small{color:#667085}</style></head><body><main>'
    + '<div class="card"><h1><span class="mark">P</span>AgencyOS Server</h1><small>Priority Ads Agency \u00B7 this page refreshes every 10 seconds</small><p><span class="pill g">\u25CF Server running on port ' + esc(s.port) + '</span> <span class="pill ' + (ok ? 'g' : 'r') + '">' + (ok ? '\u25CF PostgreSQL connected' : '\u25CF PostgreSQL NOT connected') + '</span></p>'
    + (ok ? '' : '<p style="color:#B42318"><b>Database error:</b> ' + esc(s.db.error) + '<br>Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME in the .env file, then restart the server.</p>') + '</div>'
    + '<div class="grid"><div class="card"><b>Server</b><table>' + row('Status', 'Running') + row('Address', 'http://localhost:' + s.port) + row('Started', s.startedAt) + row('Running for', s.uptimeMin + ' min') + row('Website', 'http://localhost:3000') + '</table></div>'
    + '<div class="card"><b>PostgreSQL database</b><table>' + row('Connected', ok ? 'Yes' : 'No') + row('Database', s.db.database) + row('Host', s.db.host + ':' + s.db.port) + row('User', s.db.user) + row('Provider', /supabase/i.test(String(s.db.host)) ? 'Supabase (cloud)' : 'PostgreSQL on this computer') + row('SSL', USE_SSL ? 'On' : 'Off') + row('Version', s.db.version || '-') + row('Size', s.db.size || '-') + row('People signed in', s.activeSessions ?? '-') + row('Last change', s.lastChange ? s.lastChange.store + ' by ' + s.lastChange.by + ' at ' + s.lastChange.at : '-') + '</table></div></div>'
    + (s.tables ? '<div class="card"><b>Tables in ' + esc(s.db.database) + '</b> <small>(' + s.tables.length + ' tables, ' + s.tables.reduce((a, t) => a + t.rows, 0) + ' rows)</small><table><tr><th>Table</th><th>Rows</th></tr>' + s.tables.map((t) => '<tr><td>' + esc(t.name) + '</td><td>' + t.rows + '</td></tr>').join('') + '</table></div>' : '')
    + '<small>JSON: <a href="/api/status">/api/status</a> \u00B7 Password is never shown here.</small></main></body></html>');
});
app.get('/api/health', async (_q, res) => { try { await pool.query('SELECT 1'); res.json({ ok: true, db: true }); } catch (e) { res.status(500).json({ ok: false, error: String(e.message) }); } });
app.get('/api/setup/status', async (_q, res) => { const r = await pool.query('SELECT count(*)::int n FROM employees'); res.json({ empty: r.rows[0].n === 0 }); });

// first-time: copy this browser's data into the empty database
app.post('/api/setup/import', async (req, res) => {
  const n = (await pool.query('SELECT count(*)::int n FROM employees')).rows[0].n;
  if (n > 0) return res.status(409).json({ error: 'The database already has data. Import is only allowed once.' });
  const data = req.body?.data || {};
  if (!Array.isArray(data.paa_employees) || !data.paa_employees.length) return res.status(400).json({ error: 'No employees found in this browser.' });
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    for (const [key, val] of Object.entries(data)) {
      if (LOCAL_ONLY.test(key) || key === 'paa_x_credentials') continue;
      if (T[key] && Array.isArray(val)) { let i = 0; for (const rec of val) if (rec && rec.id) await upsertTable(c, key, rec, i++, 'import'); }
      else if (Array.isArray(val) && val.every((x) => x && typeof x === 'object' && typeof x.id === 'string')) { let i = 0; for (const rec of val) await c.query('INSERT INTO app_records (store, id, data, pos, updated_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (store,id) DO UPDATE SET data=EXCLUDED.data', [key, rec.id, rec, i++, 'import']); }
      else await c.query('INSERT INTO app_settings (key, value, updated_by) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [key, JSON.stringify(val), 'import']);
    }
    for (const cr of data.paa_x_credentials || []) if (cr.employeeId && cr.hash) await c.query('INSERT INTO user_credentials (employee_id, password_hash, must_change, updated_by) VALUES ($1,$2,$3,$4) ON CONFLICT (employee_id) DO NOTHING', [cr.employeeId, await bcrypt.hash(cr.hash, 10), !!cr.mustChange, 'import']);
    await c.query('COMMIT');
    res.json({ ok: true, employees: data.paa_employees.length });
  } catch (e) { await c.query('ROLLBACK'); res.status(500).json({ error: String(e.message) }); } finally { c.release(); }
});

app.post('/api/auth/login', async (req, res) => {
  const login = String(req.body?.login || '').trim().toLowerCase(); const pw = String(req.body?.password || '');
  const log = (emp, ok, reason) => pool.query('INSERT INTO login_events (employee_id, login, ok, reason, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6)', [emp?.id || null, login, ok, reason || null, ip(req), String(req.headers['user-agent'] || '').slice(0, 200)]);
  if (!login || !pw) return res.status(400).json({ error: 'Enter your work email / employee ID and password.' });
  const r = await pool.query('SELECT data FROM employees WHERE lower(email)=$1 OR lower(employee_code)=$1 LIMIT 1', [login]);
  const emp = r.rows[0]?.data;
  if (!emp) { await log(null, false, 'unknown login'); return res.status(401).json({ error: 'No account found with this email or employee ID.' }); }
  const fails = (await pool.query("SELECT count(*)::int n FROM login_events WHERE employee_id=$1 AND ok=false AND at > now() - interval '15 minutes'", [emp.id])).rows[0].n;
  if (fails >= 5) return res.status(429).json({ error: 'Too many wrong attempts. Try again after 15 minutes or ask HR / Admin to reset your password.' });
  if (emp.status === 'inactive') { await log(emp, false, 'inactive'); return res.status(403).json({ error: 'This account is suspended. Contact the Founder or HR.' }); }
  const cr = (await pool.query('SELECT * FROM user_credentials WHERE employee_id=$1', [emp.id])).rows[0];
  const ok = cr ? await bcrypt.compare(clientHash(pw), cr.password_hash) : pw === DEFAULT_PASSWORD;
  if (!ok) { await log(emp, false, 'wrong password'); return res.status(401).json({ error: `Wrong password. ${Math.max(0, 4 - fails)} attempt(s) left before a 15-minute lock.` }); }
  const sid = crypto.randomUUID();
  await pool.query('INSERT INTO sessions (id, employee_id, ip, user_agent) VALUES ($1,$2,$3,$4)', [sid, emp.id, ip(req), String(req.headers['user-agent'] || '').slice(0, 200)]);
  await log(emp, true);
  const ev = { id: 'lg-' + Date.now(), employeeId: emp.id, name: emp.name, role: emp.role, portal: 'server', at: new Date().toLocaleString('en-IN'), ok: true, reason: `IP ${ip(req)}` };
  await pool.query("INSERT INTO app_records (store, id, data, pos, updated_by) VALUES ('paa_x_login_history', $1, $2, $3, $4)", [ev.id, ev, -Date.now(), emp.id]);
  res.json({ token: jwt.sign({ sid }, SECRET, { expiresIn: '7d' }), user: { id: emp.id, name: emp.name, email: emp.email, role: emp.role }, mustChange: !cr || cr.must_change });
});

app.post('/api/auth/logout', auth, async (req, res) => { await pool.query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [req.u.sid]); res.json({ ok: true }); });
app.post('/api/auth/logout-others', auth, async (req, res) => { const r = await pool.query('UPDATE sessions SET revoked_at=now() WHERE employee_id=$1 AND id<>$2 AND revoked_at IS NULL', [req.u.id, req.u.sid]); res.json({ ok: true, ended: r.rowCount }); });
app.get('/api/auth/sessions', auth, async (req, res) => { const r = await pool.query('SELECT id, ip, user_agent, created_at, last_seen, revoked_at FROM sessions WHERE employee_id=$1 ORDER BY last_seen DESC LIMIT 20', [req.u.id]); res.json(r.rows.map((s) => ({ ...s, current: s.id === req.u.sid }))); });
app.post('/api/auth/password', auth, async (req, res) => {
  const { current, next } = req.body || {};
  const cr = (await pool.query('SELECT * FROM user_credentials WHERE employee_id=$1', [req.u.id])).rows[0];
  const ok = cr ? await bcrypt.compare(clientHash(String(current || '')), cr.password_hash) : current === DEFAULT_PASSWORD;
  if (!ok) return res.status(400).json({ error: 'Current password is wrong.' });
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(next || ''))) return res.status(400).json({ error: 'Use at least 8 characters with letters and numbers.' });
  await pool.query('INSERT INTO user_credentials (employee_id, password_hash, must_change, updated_by) VALUES ($1,$2,false,$1) ON CONFLICT (employee_id) DO UPDATE SET password_hash=EXCLUDED.password_hash, must_change=false, updated_at=now(), updated_by=EXCLUDED.updated_by', [req.u.id, await bcrypt.hash(clientHash(next), 10)]);
  res.json({ ok: true });
});

// everything this user is allowed to see
app.get('/api/bootstrap', auth, async (req, res) => {
  const u = req.u; const out = {}; const mx = await matrixFor(u.role); const staff = isStaff(u.role);
  const team = new Set([u.id]);
  if (['team_leader', 'sales_team_leader'].includes(u.role)) {
    const org = await getSetting('paa_x_os_org', {}); const mine = org[u.id];
    for (const [id, p] of Object.entries(org)) if (p.reportsTo === u.id || (mine && p.unit === mine.unit && !/manager/i.test(p.position))) team.add(id);
  }
  for (const key of TABLE_KEYS) {
    const d = T[key];
    let rows = (await pool.query(`SELECT data, pos FROM ${d.t} ORDER BY pos, created_at`)).rows.map(row2);
    const view = d.mod === undefined || u.role === 'super_admin' || mx[d.mod] === 1;
    if (key === 'paa_employees') rows = PAYROLL_ROLES.includes(u.role) ? rows : rows.map((e) => (e.id === u.id ? e : stripSalary(e)));
    else if (key === 'paa_audit_logs') rows = staff ? rows.filter((r) => r.userId === u.id) : rows;
    else if (!view) rows = d.ownRead || d.own ? rows.filter((r) => r[d.own] === u.id) : [];
    else if (d.open) rows = rows.filter((r) => !r.userId || r.userId === u.id || u.role === 'super_admin');
    else if (d.own && staff) rows = rows.filter((r) => r[d.own] === u.id);
    else if (d.own && team.size > 1) rows = rows.filter((r) => team.has(r[d.own]));
    out[key] = rows;
  }
  const recs = (await pool.query('SELECT store, data FROM app_records ORDER BY store, pos, updated_at')).rows;
  for (const r of recs) (out[r.store] = out[r.store] || []).push(r.data);
  for (const r of (await pool.query('SELECT key, value FROM app_settings')).rows) out[r.key] = r.value;
  // privacy filters
  if (!PAYROLL_ROLES.includes(u.role)) {
    if (Array.isArray(out.paa_x_payroll_runs)) out.paa_x_payroll_runs = out.paa_x_payroll_runs.filter((x) => ['approved', 'partially_paid', 'paid'].includes(x.status)).map((x) => ({ ...x, slips: (x.slips || []).filter((s) => s.employeeId === u.id) }));
    if (Array.isArray(out.paa_x_salary_structures)) out.paa_x_salary_structures = out.paa_x_salary_structures.filter((x) => x.employeeId === u.id);
    if (out.paa_x_bank && typeof out.paa_x_bank === 'object') out.paa_x_bank = out.paa_x_bank[u.id] ? { [u.id]: out.paa_x_bank[u.id] } : {};
  }
  if (!HR_ROLES.includes(u.role)) for (const k of HR_KEYS) if (Array.isArray(out[k])) out[k] = out[k].filter((x) => x.employeeId === u.id || x.ownerId === u.id);
  if (!['super_admin', 'admin', 'hr'].includes(u.role) && Array.isArray(out.paa_x_login_history)) out.paa_x_login_history = out.paa_x_login_history.filter((x) => x.employeeId === u.id);
  const creds = (await pool.query('SELECT employee_id, must_change, updated_at FROM user_credentials')).rows;
  out.paa_x_credentials = creds.filter((c) => c.employee_id === u.id || ['super_admin', 'admin', 'hr'].includes(u.role)).map((c) => ({ employeeId: c.employee_id, hash: 'server', mustChange: c.must_change, updatedAt: new Date(c.updated_at).toLocaleString('en-IN') }));
  const last = (await pool.query('SELECT coalesce(max(id),0)::bigint id FROM sync_events')).rows[0].id;
  res.json({ me: u, data: out, cursor: String(last) });
});

// save changes: rows (upserts / deletes / order) or a whole value
app.post('/api/sync', auth, async (req, res) => {
  const u = req.u; const { key, upserts = [], deletes = [], order, value, mode } = req.body || {};
  if (!key || LOCAL_ONLY.test(key)) return res.json({ ok: true, skipped: true });
  const c = await pool.connect(); const denied = [];
  try {
    await c.query('BEGIN');
    if (key === 'paa_x_credentials') {
      // password resets by Founder / Admin / HR: the browser sends the hash of the temporary password
      for (const cr of upserts) {
        if (!cr.employeeId || cr.employeeId === u.id || cr.hash === 'server') continue;
        const target = (await c.query('SELECT data FROM employees WHERE id=$1', [cr.employeeId])).rows[0]?.data;
        const ok = ['super_admin', 'admin', 'hr'].includes(u.role) && target && (target.role !== 'super_admin' || u.role === 'super_admin');
        if (!ok) { denied.push(cr.employeeId); continue; }
        await c.query('INSERT INTO user_credentials (employee_id, password_hash, must_change, updated_by) VALUES ($1,$2,$3,$4) ON CONFLICT (employee_id) DO UPDATE SET password_hash=EXCLUDED.password_hash, must_change=EXCLUDED.must_change, updated_at=now(), updated_by=EXCLUDED.updated_by', [cr.employeeId, await bcrypt.hash(cr.hash, 10), !!cr.mustChange, u.id]);
      }
    } else if (T[key] && mode !== 'value') {
      const d = T[key];
      for (const { rec, pos } of upserts) {
        if (!rec || !rec.id) continue;
        const old = (await c.query(`SELECT data FROM ${d.t} WHERE id=$1`, [String(rec.id)])).rows[0]?.data;
        if (!(await canWriteRow(u, key, old, rec, old ? 'E' : 'C'))) { denied.push(rec.id); continue; }
        let next = rec;
        if (key === 'paa_employees' && old && !PAYROLL_ROLES.includes(u.role)) next = { ...rec, salary: old.salary }; // keep hidden salary
        if (key === 'paa_employees' && old && old.role !== rec.role && !['super_admin', 'admin', 'hr'].includes(u.role)) { denied.push(rec.id); continue; }
        if (key === 'paa_employees' && old && (rec.role === 'super_admin') !== (old.role === 'super_admin') && u.role !== 'super_admin') { denied.push(rec.id); continue; }
        if (d.appendOnly && old) continue;
        await upsertTable(c, key, next, Number(pos) || 0, u.id);
      }
      for (const id of deletes) {
        const old = (await c.query(`SELECT data FROM ${d.t} WHERE id=$1`, [String(id)])).rows[0]?.data;
        if (!old) continue;
        if (!(await canWriteRow(u, key, old, null, 'D'))) { denied.push(id); continue; }
        await c.query('INSERT INTO deleted_records (store, record_id, data, deleted_by) VALUES ($1,$2,$3,$4)', [key, String(id), old, u.id]);
        await c.query(`DELETE FROM ${d.t} WHERE id=$1`, [String(id)]);
      }
      if (Array.isArray(order)) for (const [id, p] of order) await c.query(`UPDATE ${d.t} SET pos=$2 WHERE id=$1`, [String(id), p]);
    } else {
      const fo = FOUNDER_KEYS.includes(key) && !(key === 'paa_company' && u.role === 'admin') && u.role !== 'super_admin';
      const pay = PAY_KEYS.includes(key) && !PAYROLL_ROLES.includes(u.role);
      const org = key === 'paa_x_os_org' && !HR_ROLES.includes(u.role);
      if (fo || pay || org) { await c.query('ROLLBACK'); return res.status(403).json({ error: 'Only the Founder (or the responsible department) can change this setting.', denied: [key] }); }
      if (mode === 'value') {
        await c.query('INSERT INTO app_settings (key, value, updated_by) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=EXCLUDED.updated_by', [key, JSON.stringify(value ?? null), u.id]);
        await c.query('DELETE FROM app_records WHERE store=$1', [key]);
      } else {
        for (const { rec, pos } of upserts) if (rec && rec.id) await c.query('INSERT INTO app_records (store, id, data, pos, updated_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (store,id) DO UPDATE SET data=EXCLUDED.data, pos=EXCLUDED.pos, updated_at=now(), updated_by=EXCLUDED.updated_by', [key, String(rec.id), rec, Number(pos) || 0, u.id]);
        for (const id of deletes) { const old = (await c.query('DELETE FROM app_records WHERE store=$1 AND id=$2 RETURNING data', [key, String(id)])).rows[0]; if (old) await c.query('INSERT INTO deleted_records (store, record_id, data, deleted_by) VALUES ($1,$2,$3,$4)', [key, String(id), old.data, u.id]); }
        if (Array.isArray(order)) for (const [id, p] of order) await c.query('UPDATE app_records SET pos=$3 WHERE store=$1 AND id=$2', [key, String(id), p]);
        await c.query('DELETE FROM app_settings WHERE key=$1', [key]);
      }
    }
    await c.query('INSERT INTO sync_events (store, by_employee) VALUES ($1,$2)', [key, u.id]);
    await c.query('COMMIT');
    res.status(denied.length ? 207 : 200).json({ ok: !denied.length, denied });
  } catch (e) { await c.query('ROLLBACK'); console.error('sync', key, e.message); res.status(500).json({ error: String(e.message) }); } finally { c.release(); }
});

// what other people changed since my last look
app.get('/api/changes', auth, async (req, res) => {
  const since = String(req.query.since || '0');
  const r = await pool.query('SELECT store, max(id)::bigint id FROM sync_events WHERE id > $1 AND by_employee <> $2 GROUP BY store', [since, req.u.id]);
  const last = (await pool.query('SELECT coalesce(max(id),0)::bigint id FROM sync_events')).rows[0].id;
  res.json({ stores: r.rows.map((x) => x.store), cursor: String(last) });
});

const READY = migrate();
READY.catch(() => undefined);
if (!E.VERCEL) READY.then(() => app.listen(PORT, async () => { const s = await status(); console.log('\n  ================ AgencyOS Server ================');
  console.log('  Server     : RUNNING on http://localhost:' + PORT);
  console.log('  PostgreSQL : ' + (s.db.connected ? 'CONNECTED' : 'NOT CONNECTED') + ' (' + s.db.user + '@' + s.db.host + ':' + s.db.port + '/' + s.db.database + ', version ' + (s.db.version || '?') + ')');
  console.log('  Tables     : ' + (s.tables || []).length + '   Rows: ' + (s.tables || []).reduce((a, t) => a + t.rows, 0));
  console.log('  Status page: http://localhost:' + PORT + '   (open it in Chrome)');
  console.log('  Website    : http://localhost:3000');
  console.log('  =================================================\n  Keep this window open. Press Ctrl+C to stop the server.\n'); }))
  .catch((e) => { console.error('\n  PostgreSQL NOT CONNECTED: ' + e.message + '\n  Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env and that PostgreSQL is running.\n  Status page still available at http://localhost:' + PORT + '\n'); app.listen(PORT); });

export default app;
