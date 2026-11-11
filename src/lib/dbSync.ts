// AGENCYOS_DB: connects the app to the AgencyOS server (PostgreSQL).
// On sign-in the server sends everything this user may see; every change the app saves is sent
// back to the server row by row. Turn on with VITE_USE_DB=1 in .env.local.
const ON = (import.meta as any).env?.VITE_USE_DB === '1';
const API = '/api';
const TOKEN = 'paa_x_db_token';
const LOCAL_ONLY = /^(paa_theme|paa_x_session|paa_x_remember|paa_x_failed|paa_x_lockouts|paa_x_must_change|paa_x_os_sel_.*|paa_x_reminders_ran|paa_x_role_accounts_v1|paa_x_os_last_backup|paa_x_db_.*)$/;
const NO_ORDER = new Set(['paa_audit_logs', 'paa_x_login_history', 'paa_notifications']);
const synced = (k: string) => k.startsWith('paa') && !LOCAL_ONLY.test(k);

const origSet = Storage.prototype.setItem;
const origRemove = Storage.prototype.removeItem;
let ready = false;
let cursor = '0';
const snapshot: Record<string, any> = {};
const posMap: Record<string, Map<string, number>> = {};
const ordered = new Set<string>();
const timers: Record<string, number> = {};
const pending = new Set<string>();

export const dbEnabled = () => ON;
const token = () => localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN) || '';
const clone = (v: any) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const read = (k: string) => { try { const s = localStorage.getItem(k); return s === null ? undefined : JSON.parse(s); } catch { return undefined; } };

async function api(path: string, body?: any, keepalive = false) {
  const r = await fetch(API + path, { method: body === undefined ? 'GET' : 'POST', keepalive, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: body === undefined ? undefined : JSON.stringify(body) });
  let j: any = {}; try { j = await r.json(); } catch { /* empty */ }
  return { status: r.status, ok: r.ok, j };
}

// ---------------- small banner (works outside React) ----------------
let bannerEl: HTMLDivElement | null = null;
function banner(text: string, action?: { label: string; run: () => void }, tone: 'info' | 'warn' = 'info') {
  if (!bannerEl) { bannerEl = document.createElement('div'); bannerEl.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9999;max-width:420px;border-radius:10px;padding:11px 14px;font:600 12px Inter,Segoe UI,Arial;box-shadow:0 8px 24px #0b173840;display:flex;gap:12px;align-items:center'; document.body.appendChild(bannerEl); }
  bannerEl.style.background = tone === 'warn' ? '#FEEDEC' : '#0B1738'; bannerEl.style.color = tone === 'warn' ? '#B42318' : '#fff';
  bannerEl.innerHTML = ''; const s = document.createElement('span'); s.textContent = text; bannerEl.appendChild(s);
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.style.cssText = 'border:0;border-radius:7px;padding:6px 10px;font:700 11px inherit;cursor:pointer;background:#F5B82E;color:#0B1738'; b.onclick = action.run; bannerEl.appendChild(b); }
  const x = document.createElement('button'); x.textContent = '\u00D7'; x.style.cssText = 'border:0;background:transparent;color:inherit;font-size:16px;cursor:pointer'; x.onclick = () => { bannerEl?.remove(); bannerEl = null; }; bannerEl.appendChild(x);
}
const labelOf = (k: string) => k.replace(/^paa_(x_)?(os_)?(rec_)?/, '').replace(/_/g, ' ');

// ---------------- write server data into the browser ----------------
function writeAll(data: Record<string, any>) {
  for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i)!; if (synced(k) && !(k in data)) origRemove.call(localStorage, k); }
  for (const [k, v] of Object.entries(data)) {
    origSet.call(localStorage, k, JSON.stringify(v));
    snapshot[k] = clone(v);
    if (Array.isArray(v)) posMap[k] = new Map(v.map((r: any, i: number) => [String(r?.id ?? i), i * 1024]));
  }
}

// ---------------- push one key ----------------
const isRows = (v: any) => Array.isArray(v) && v.every((x) => x && typeof x === 'object' && (typeof x.id === 'string' || typeof x.id === 'number'));
async function push(key: string) {
  if (!ready || !token()) return;
  const cur = read(key); const prev = snapshot[key];
  let body: any;
  if (key === 'paa_x_credentials') {
    const pm = new Map((prev || []).map((c: any) => [c.employeeId, JSON.stringify(c)]));
    const ups = (cur || []).filter((c: any) => pm.get(c.employeeId) !== JSON.stringify(c));
    if (!ups.length) { snapshot[key] = clone(cur); return; }
    body = { key, upserts: ups };
  } else if (isRows(cur) && (prev === undefined || isRows(prev))) {
    const pm = new Map<string, string>(((prev || []) as any[]).map((r) => [String(r.id), JSON.stringify(r)]));
    const ids = (cur as any[]).map((r) => String(r.id));
    const changed = (cur as any[]).filter((r) => pm.get(String(r.id)) !== JSON.stringify(r));
    const deletes = [...pm.keys()].filter((id) => !ids.includes(id));
    if (!changed.length && !deletes.length) return;
    const P = posMap[key] || (posMap[key] = new Map());
    let order: [string, number][] | undefined;
    if (!NO_ORDER.has(key)) {
      const existing = ids.filter((id) => P.has(id));
      const inOrder = existing.every((id, i) => i === 0 || (P.get(existing[i - 1]) as number) < (P.get(id) as number));
      if (!ordered.has(key) || !inOrder) { ids.forEach((id, i) => P.set(id, i * 1024)); order = ids.map((id) => [id, P.get(id) as number]); ordered.add(key); }
      else ids.forEach((id, i) => { if (P.has(id)) return; const left = i > 0 ? P.get(ids[i - 1]) : undefined; const nextKnown = ids.slice(i + 1).find((x) => P.has(x)); const right = nextKnown ? P.get(nextKnown) : undefined;
        P.set(id, left === undefined && right === undefined ? 0 : left === undefined ? (right as number) - 1024 : right === undefined ? left + 1024 : (left + (right as number)) / 2); });
    } else ids.forEach((id, i) => { if (!P.has(id)) P.set(id, -Date.now() - (ids.length - i) / 1000); });
    body = { key, upserts: changed.map((rec) => ({ rec, pos: P.get(String(rec.id)) ?? 0 })), deletes, order };
  } else {
    if (JSON.stringify(cur) === JSON.stringify(prev)) return;
    body = { key, mode: 'value', value: cur ?? null };
  }
  try {
    const r = await api('/sync', body);
    if (r.status === 401) { banner('Your session ended. Please sign in again.', { label: 'Sign in', run: () => { sessionStorage.removeItem('paa_x_session'); location.reload(); } }, 'warn'); return; }
    snapshot[key] = clone(cur); pending.delete(key);
    if (r.status === 403 || r.status === 207) banner(`Not saved: you don't have permission to change some ${labelOf(key)}. Refresh to see the saved data.`, { label: 'Refresh', run: () => location.reload() }, 'warn');
    else if (!r.ok) banner(`Could not save ${labelOf(key)}: ${r.j?.error || r.status}`, undefined, 'warn');
  } catch {
    pending.add(key); banner('Server not reachable. Your changes will be saved when it is back.', undefined, 'warn');
  }
}
function schedule(key: string) { pending.add(key); window.clearTimeout(timers[key]); timers[key] = window.setTimeout(() => push(key), 350); }
async function flush() { for (const k of [...pending]) await push(k); }

// ---------------- start-up ----------------
export async function initDb(): Promise<void> {
  if (!ON) return;
  Storage.prototype.setItem = function (k: string, v: string) { origSet.call(this, k, v); if (ready && this === localStorage && synced(k)) schedule(k); };
  Storage.prototype.removeItem = function (k: string) {
    origRemove.call(this, k);
    if (this === sessionStorage && k === 'paa_x_session' && token()) { // sign-out
      flush().finally(() => { api('/auth/logout', {}, true).catch(() => undefined); origRemove.call(localStorage, TOKEN); origRemove.call(sessionStorage, TOKEN); ready = false; });
    }
  };
  window.addEventListener('beforeunload', () => { for (const k of pending) { window.clearTimeout(timers[k]); push(k); } });
  if (!token()) { origRemove.call(sessionStorage, 'paa_x_session'); return; }
  try {
    const r = await api('/bootstrap');
    if (r.status === 401) { origRemove.call(localStorage, TOKEN); origRemove.call(sessionStorage, TOKEN); origRemove.call(sessionStorage, 'paa_x_session'); return; }
    if (!r.ok) throw new Error(r.j?.error || String(r.status));
    writeAll(r.j.data); cursor = r.j.cursor;
    origSet.call(sessionStorage, 'paa_x_session', JSON.stringify({ userId: r.j.me.id }));
    ready = true;
    window.setInterval(async () => {
      if (!ready || document.hidden) return;
      try { const c = await api('/changes?since=' + cursor); if (c.ok) { cursor = c.j.cursor; if (c.j.stores.length) banner(`Your team updated: ${c.j.stores.slice(0, 4).map(labelOf).join(', ')}`, { label: 'Refresh', run: async () => { await flush(); location.reload(); } }); } } catch { /* offline */ }
    }, 20000);
  } catch (e: any) {
    document.body.innerHTML = `<div style="font:14px Inter,Segoe UI,Arial;max-width:520px;margin:12vh auto;padding:28px;border:1px solid #E5E7EB;border-radius:14px;color:#0B1738"><h2 style="margin:0 0 8px">AgencyOS server is not running</h2><p>The app could not reach the database server (${String(e?.message || e)}).</p><p>Open a second PowerShell in the project folder and run:<br><code style="background:#F1F4FA;padding:4px 8px;border-radius:6px;display:inline-block;margin-top:6px">npm.cmd run server</code></p><p>Then refresh this page.</p></div>`;
    throw e;
  }
}

// ---------------- used by the login screen ----------------
export async function dbLogin(login: string, password: string, remember: boolean): Promise<string | null> {
  try {
    const r = await api('/auth/login', { login, password });
    if (!r.ok) return r.j?.error || 'Sign-in failed.';
    origRemove.call(localStorage, TOKEN); origRemove.call(sessionStorage, TOKEN);
    origSet.call(remember ? localStorage : sessionStorage, TOKEN, r.j.token);
    origSet.call(sessionStorage, 'paa_x_session', JSON.stringify({ userId: r.j.user.id }));
    origSet.call(sessionStorage, 'paa_x_db_autologin', r.j.user.email);
    if (r.j.mustChange) origSet.call(sessionStorage, 'paa_x_must_change', '1'); else origRemove.call(sessionStorage, 'paa_x_must_change');
    location.reload();
    return null;
  } catch { return 'Cannot reach the AgencyOS server. Start it with: npm.cmd run server'; }
}
export async function dbChangePassword(current: string, next: string): Promise<string | null> {
  try { const r = await api('/auth/password', { current, next }); return r.ok ? null : r.j?.error || 'Could not change password.'; } catch { return 'Server not reachable.'; }
}
export async function dbSetupStatus(): Promise<{ empty: boolean } | null> {
  try { const r = await fetch(API + '/setup/status'); return r.ok ? await r.json() : null; } catch { return null; }
}
export async function dbImportThisBrowser(): Promise<string> {
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (synced(k) || k === 'paa_x_credentials') { try { data[k] = JSON.parse(localStorage.getItem(k) as string); } catch { /* skip */ } } }
  const r = await fetch(API + '/setup/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
  const j = await r.json().catch(() => ({}));
  return r.ok ? `Copied ${j.employees} people and all records into the database. You can sign in now.` : `Import failed: ${j.error || r.status}`;
}
export async function dbSessions() { const r = await api('/auth/sessions'); return r.ok ? r.j : []; }
export async function dbLogoutOthers() { const r = await api('/auth/logout-others', {}); return r.ok ? r.j.ended : 0; }
