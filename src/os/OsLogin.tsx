// AGENCYOS_DB_DONE
// AGENCYOS_V3_OS: login screen (prototype design) with real password check, lockout and reset request
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { readKey, writeKey, uid, nowStamp } from '../lib/sharedStore';
import { DEFAULT_PASSWORD, hashPassword, Credential, LoginEvent, ResetRequest, CRED_KEY, LOGIN_LOG_KEY, RESET_KEY } from '../lib/rbac';
import { Icon } from './icons';
import { roleLabel } from './osConfig';
import { dbEnabled, dbLogin } from '../lib/dbSync';
import { DbSetup } from './DbSetup';

export const OsLogin: React.FC = () => {
  const { employees, login } = useApp();
  const [id, setId] = useState(() => localStorage.getItem('paa_x_remember') || '');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(!!localStorage.getItem('paa_x_remember'));
  const [err, setErr] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  const log = (e: Omit<LoginEvent, 'id' | 'at'>) => writeKey(LOGIN_LOG_KEY, [{ ...e, id: uid('lg'), at: nowStamp() }, ...readKey<LoginEvent[]>(LOGIN_LOG_KEY, [])].slice(0, 2000));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setErr(''); setInfo('');
    if (dbEnabled()) { if (!id.trim() || !pw) return setErr('Enter your work email / employee ID and password.'); if (remember) localStorage.setItem('paa_x_remember', id.trim()); else localStorage.removeItem('paa_x_remember'); setBusy(true); const e = await dbLogin(id.trim(), pw, remember); setBusy(false); if (e) setErr(e); return; }
    const key = id.trim().toLowerCase();
    if (!key || !pw) return setErr('Enter your work email / employee ID and password.');
    const emp = employees.find((e) => e.email.toLowerCase() === key || e.employeeId.toLowerCase() === key);
    if (!emp) return setErr('No account found with this email or employee ID.');
    const lockedUntil = readKey<Record<string, number>>('paa_x_lockouts', {})[emp.id] || 0;
    if (lockedUntil > Date.now()) return setErr('Too many wrong attempts. Try again after 15 minutes or ask HR / Admin to reset your password.');
    if (emp.status === 'inactive') { log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: 'os', ok: false, reason: 'inactive' }); return setErr('This account is suspended. Contact the Founder or HR.'); }
    setBusy(true);
    const cred = readKey<Credential[]>(CRED_KEY, []).find((c) => c.employeeId === emp.id);
    const expected = cred?.hash ?? (await hashPassword(DEFAULT_PASSWORD));
    const ok = (await hashPassword(pw)) === expected;
    setBusy(false);
    if (!ok) {
      log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: 'os', ok: false, reason: 'wrong password' });
      const cutoff = Date.now() - 15 * 60 * 1000;
      const fails = readKey<Record<string, number[]>>('paa_x_failed', {});
      const list = [...(fails[emp.id] || []).filter((t) => t > cutoff), Date.now()];
      fails[emp.id] = list; writeKey('paa_x_failed', fails);
      if (list.length >= 5) { const l = readKey<Record<string, number>>('paa_x_lockouts', {}); l[emp.id] = Date.now() + 15 * 60 * 1000; writeKey('paa_x_lockouts', l); }
      return setErr(`Wrong password. ${Math.max(0, 5 - list.length)} attempt(s) left before a 15-minute lock.`);
    }
    const fails = readKey<Record<string, number[]>>('paa_x_failed', {}); delete fails[emp.id]; writeKey('paa_x_failed', fails);
    log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: 'os', ok: true });
    if (remember) localStorage.setItem('paa_x_remember', id.trim()); else localStorage.removeItem('paa_x_remember');
    if (!cred || cred.mustChange) sessionStorage.setItem('paa_x_must_change', '1');
    login(emp.email, emp.role);
  };

  const requestReset = (e: React.MouseEvent) => {
    e.preventDefault();
    const key = id.trim().toLowerCase();
    if (!key) return setErr('Type your work email or employee ID first, then click "Forgot password?".');
    const emp = employees.find((x) => x.email.toLowerCase() === key || x.employeeId.toLowerCase() === key);
    writeKey(RESET_KEY, [{ id: uid('rst'), login: id.trim(), employeeId: emp?.id, at: nowStamp(), status: 'open' } as ResetRequest, ...readKey<ResetRequest[]>(RESET_KEY, [])]);
    setErr(''); setInfo('Reset request sent to HR / Admin. They will reset your password and tell you the temporary password.');
  };
  const match = employees.find((e) => e.email.toLowerCase() === id.trim().toLowerCase() || e.employeeId.toLowerCase() === id.trim().toLowerCase());

  return (
    <div className="login-screen">
      <div className="login-left">
        <div className="brandline"><div className="mark">P</div><div><strong style={{ color: 'white', fontSize: 18 }}>Priority Ads Agency</strong><small style={{ color: '#B3C0DA' }}>AGENCYOS {'\u00B7'} INTERNAL OPERATIONS</small></div></div>
        <div><div className="demo-tag" style={{ display: 'inline-block', background: '#273656', color: '#F6D77D', borderColor: '#43526B' }}>COMPANY OPERATING SYSTEM</div>
          <h1>One agency.<br /><span className="accent">Total operational clarity.</span></h1>
          <p>Clients, work, people, collections and decisions {'\u2014'} all in one secure company-owned operating system.</p></div>
        <div className="login-legal">Private staff portal {'\u00B7'} Founder-controlled access {'\u00B7'} Separate Priority Ads Agency OS</div>
      </div>
      <div className="login-right">
        <form className="login-form" onSubmit={submit}>
          <div className="eyebrow">AGENCYOS / LOGIN</div>
          <h2>Welcome back</h2>
          <p>Sign in to your authorized company workspace.</p>
          <div className="form-group"><label>Work email / Employee ID</label><input type="text" placeholder="you@priorityadsagency.com" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} /></div>
          <div className="form-group"><label>Password</label><div style={{ position: 'relative' }}><input type={show ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ paddingRight: 64 }} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 8, top: 8, border: 0, background: 'transparent', color: '#2458A6', fontSize: 11, fontWeight: 700 }}>{show ? 'Hide' : 'Show'}</button></div></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#667085', margin: '8px 0 15px' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember this device</label>
            <a href="#" onClick={requestReset} style={{ color: '#2458A6', textDecoration: 'none' }}>Forgot password?</a></div>
          {err && <div className="notice" style={{ background: '#FEEDEC', borderColor: '#F8D5D1', color: '#B42318' }}><Icon name="lock" size={16} /><div>{err}</div></div>}
          {info && <div className="notice neutral"><Icon name="check" size={16} /><div>{info}</div></div>}
          <DbSetup />
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Checking\u2026' : 'Sign In'} <Icon name="arrow" size={15} /></button>
          <div className="role-demo"><small>Your dashboard opens automatically for your role. You only see the screens your role is allowed to use.</small>
            <div className="tiny-note">{match ? <>Account found: <b>{match.name}</b> {'\u00B7'} {roleLabel(match.role)}</> : 'First login password is given by HR. You will set your own password after signing in.'}</div></div>
          <div className="login-footer">Internal agency platform {'\u00B7'} {'\u00A9'} {new Date().getFullYear()} Priority Ads Agency<br />Every sign-in is recorded in the audit trail.</div>
        </form>
      </div>
    </div>
  );
};
