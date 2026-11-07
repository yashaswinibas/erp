// Users & Login: change password, roles, password resets, deactivate users, login history, permission matrix.
import { OS_ROLES } from '../os/osConfig';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { PERM_KEY, LOCKED_TABS, defaultAccess, effectiveAccess } from '../lib/rbac'; // AGENCYOS_V2_PART14
import { can, ROLE_LABEL, TAB_ACCESS, DEFAULT_PASSWORD, hashPassword, Credential, LoginEvent, ResetRequest, CRED_KEY, LOGIN_LOG_KEY, RESET_KEY } from '../lib/rbac';
import { useShared, nowStamp } from '../lib/sharedStore';
import { inputCls, btnPrimary, btnGhost, btnGood, btnBad, card, th, td, Badge, Field, Tabs, Empty, Modal } from './ui2';

const ROLES: UserRole[] = OS_ROLES.map((r) => r.id as UserRole); // AGENCYOS_V3_OS
const pwRule = (p: string) => (p.length < 8 ? 'At least 8 characters.' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Use letters and numbers.' : '');

const ChangePassword: React.FC<{ onDone?: () => void; forced?: boolean }> = ({ onDone, forced }) => {
  const { currentUser, logAudit } = useApp();
  const [creds, setCreds] = useShared<Credential[]>(CRED_KEY, []);
  const [f, setF] = useState({ cur: '', nw: '', cf: '' });
  const [msg, setMsg] = useState('');
  const save = async () => {
    const mine = creds.find((c) => c.employeeId === currentUser.id);
    const curHash = await hashPassword(f.cur);
    if (curHash !== (mine?.hash ?? (await hashPassword(DEFAULT_PASSWORD)))) return setMsg('Current password is wrong.');
    const rule = pwRule(f.nw); if (rule) return setMsg(rule);
    if (f.nw !== f.cf) return setMsg('New passwords do not match.');
    if (f.nw === f.cur) return setMsg('New password must be different.');
    const hash = await hashPassword(f.nw);
    setCreds((p) => [{ employeeId: currentUser.id, hash, mustChange: false, updatedAt: nowStamp() }, ...p.filter((c) => c.employeeId !== currentUser.id)]);
    logAudit('PASSWORD_CHANGED', currentUser.employeeId);
    sessionStorage.removeItem('paa_x_must_change');
    setF({ cur: '', nw: '', cf: '' }); setMsg('Password changed.');
    onDone?.();
  };
  return (
    <div className="space-y-3 max-w-sm">
      {forced && <p className="text-xs text-amber-600 font-semibold">You are using a temporary password. Please set your own password now.</p>}
      <Field label="Current password"><input type="password" className={inputCls} value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} /></Field>
      <Field label="New password (8+ characters, letters and numbers)"><input type="password" className={inputCls} value={f.nw} onChange={(e) => setF({ ...f, nw: e.target.value })} /></Field>
      <Field label="Confirm new password"><input type="password" className={inputCls} value={f.cf} onChange={(e) => setF({ ...f, cf: e.target.value })} /></Field>
      {msg && <p className="text-xs font-semibold text-blue-600">{msg}</p>}
      <button className={btnPrimary} onClick={save}>Change password</button>
    </div>
  );
};

/** Shown right after login when the user still has a temporary password. */
export const ForcePasswordChange: React.FC = () => {
  const [open, setOpen] = useState(() => sessionStorage.getItem('paa_x_must_change') === '1');
  if (!open) return null;
  return <Modal title="Set your password" onClose={() => setOpen(false)}><ChangePassword forced onDone={() => setOpen(false)} /></Modal>;
};

export const AccessAdmin: React.FC = () => {
  const { employees, currentUser, currentRole, updateEmployee, logAudit, notify } = useApp();
  const [creds, setCreds] = useShared<Credential[]>(CRED_KEY, []);
  const [history] = useShared<LoginEvent[]>(LOGIN_LOG_KEY, []);
  const [resets, setResets] = useShared<ResetRequest[]>(RESET_KEY, []);
  const [perm, setPerm] = useShared<Record<string, string[]>>(PERM_KEY, {});
  const manage = can.manageRoles(currentRole);
  const resetter = can.resetPasswords(currentRole);
  const [tab, setTab] = useState('me');
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');

  const resetPassword = async (empId: string, reqId?: string) => {
    const e = employees.find((x) => x.id === empId); if (!e) return;
    if (e.role === 'super_admin' && currentRole !== 'super_admin') return setMsg('Only a Super Admin can reset a Super Admin password.');
    const hash = await hashPassword(DEFAULT_PASSWORD);
    setCreds((p) => [{ employeeId: empId, hash, mustChange: true, updatedAt: nowStamp() }, ...p.filter((c) => c.employeeId !== empId)]);
    if (reqId) setResets((p) => p.map((r) => (r.id === reqId ? { ...r, status: 'done', doneBy: currentUser.name } : r)));
    logAudit('PASSWORD_RESET', e.employeeId, `by ${currentUser.name}`);
    setMsg(`Password for ${e.name} reset to the temporary password "${DEFAULT_PASSWORD}". They must change it at next login.`);
  };
  const setRole = (empId: string, role: UserRole) => {
    const e = employees.find((x) => x.id === empId); if (!e) return;
    if (empId === currentUser.id) return setMsg('You cannot change your own role.');
    if ((role === 'super_admin' || e.role === 'super_admin') && currentRole !== 'super_admin') return setMsg('Only a Super Admin can give or remove Super Admin.');
    updateEmployee(empId, { role });
    logAudit('ROLE_CHANGED', e.employeeId, `${e.role} -> ${role} by ${currentUser.name}`);
    notify('Role changed', `${e.name} is now ${ROLE_LABEL[role]}.`, 'system', 'access_admin');
  };
  const toggleActive = (empId: string) => {
    const e = employees.find((x) => x.id === empId); if (!e) return;
    if (empId === currentUser.id) return setMsg('You cannot deactivate yourself.');
    if (e.role === 'super_admin' && currentRole !== 'super_admin') return setMsg('Only a Super Admin can deactivate a Super Admin.');
    const next = e.status === 'inactive' ? 'active' : 'inactive';
    updateEmployee(empId, { status: next });
    logAudit(next === 'inactive' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED', e.employeeId, `by ${currentUser.name}`);
  };

  const tabs: [string, string][] = [['me', 'My password'], ['history', 'Login history']];
  if (resetter) tabs.splice(1, 0, ['users', 'Users & roles'], ['resets', `Reset requests (${resets.filter((r) => r.status === 'open').length})`]);
  // permissions moved to Administration > Permission Matrix
  const visibleHistory = (resetter ? history : history.filter((h) => h.employeeId === currentUser.id)).filter((h) => !q || `${h.name} ${h.role} ${h.portal}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Users & Login</h2>
        <p className="text-xs text-slate-500">Logged in as {currentUser.name} ({ROLE_LABEL[currentRole] || currentRole}).</p></div>
      {msg && <div className="text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg px-3 py-2 flex justify-between"><span>{msg}</span><button className="cursor-pointer" onClick={() => setMsg('')}>x</button></div>}
      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'me' && <div className={card}><ChangePassword /></div>}

      {tab === 'users' && resetter && (
        <div className={card}>
          <input className={`${inputCls} max-w-xs mb-3`} placeholder="Search name / ID / email" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className={th}>Employee</th><th className={th}>Login</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>Password</th><th className={th}>Last login</th><th className={th}>Actions</th></tr></thead>
            <tbody>{employees.filter((e) => !q || `${e.name} ${e.employeeId} ${e.email}`.toLowerCase().includes(q.toLowerCase())).map((e) => {
              const c = creds.find((x) => x.employeeId === e.id);
              const last = history.find((h) => h.employeeId === e.id && h.ok);
              return (
                <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className={td}><b>{e.name}</b><br /><span className="text-slate-400">{e.employeeId}</span></td>
                  <td className={td}>{e.email}</td>
                  <td className={td}>{manage ? (
                    <select className={inputCls} value={e.role} disabled={e.id === currentUser.id} onChange={(ev) => setRole(e.id, ev.target.value as UserRole)}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>) : ROLE_LABEL[e.role] || e.role}</td>
                  <td className={td}><Badge v={e.status === 'inactive' ? 'inactive' : 'active'} /></td>
                  <td className={td}>{!c ? <span className="text-amber-600">Temporary</span> : c.mustChange ? <span className="text-amber-600">Reset - must change</span> : <span className="text-emerald-600">Set {c.updatedAt}</span>}</td>
                  <td className={td}>{last?.at || '-'}</td>
                  <td className={td}><div className="flex flex-wrap gap-1">
                    <button className={btnGhost} onClick={() => { if (confirm(`Reset password for ${e.name}?`)) resetPassword(e.id); }}>Reset password</button>
                    {manage && <button className={e.status === 'inactive' ? btnGood : btnBad} onClick={() => toggleActive(e.id)}>{e.status === 'inactive' ? 'Activate' : 'Deactivate'}</button>}
                  </div></td>
                </tr>);
            })}</tbody></table></div>
          <p className="text-[11px] text-slate-400 mt-2">New employees and reset accounts use the temporary password <b>{DEFAULT_PASSWORD}</b> and must change it at first login.</p>
        </div>
      )}

      {tab === 'resets' && resetter && (
        <div className={card}>
          {resets.length === 0 ? <Empty text="No password reset requests." /> : (
            <table className="w-full"><thead><tr><th className={th}>When</th><th className={th}>Login typed</th><th className={th}>Employee</th><th className={th}>Status</th><th className={th}></th></tr></thead>
              <tbody>{resets.map((r) => { const e = employees.find((x) => x.id === r.employeeId); return (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{r.at}</td><td className={td}>{r.login}</td><td className={td}>{e ? `${e.name} (${e.employeeId})` : <span className="text-rose-600">No matching account</span>}</td>
                  <td className={td}><Badge v={r.status === 'open' ? 'pending' : 'completed'} />{r.doneBy && <div className="text-[10px] text-slate-400">{r.doneBy}</div>}</td>
                  <td className={td}>{r.status === 'open' && (e ? <button className={btnPrimary} onClick={() => resetPassword(e.id, r.id)}>Reset password</button> : <button className={btnGhost} onClick={() => setResets((p) => p.map((y) => (y.id === r.id ? { ...y, status: 'done', doneBy: currentUser.name } : y)))}>Close</button>)}</td></tr>); })}</tbody></table>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className={card}>
          {resetter && <input className={`${inputCls} max-w-xs mb-3`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />}
          {visibleHistory.length === 0 ? <Empty text="No logins recorded yet." /> : (
            <table className="w-full"><thead><tr><th className={th}>When</th><th className={th}>User</th><th className={th}>Role</th><th className={th}>Login page</th><th className={th}>Result</th></tr></thead>
              <tbody>{visibleHistory.slice(0, 300).map((h) => (
                <tr key={h.id} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{h.at}</td><td className={td}>{h.name}</td><td className={td}>{ROLE_LABEL[h.role] || h.role}</td><td className={td}>{ROLE_LABEL[h.portal] || h.portal}</td>
                  <td className={td}>{h.ok ? <Badge v="completed" /> : <span className="text-rose-600 font-semibold">Failed - {h.reason}</span>}</td></tr>))}</tbody></table>
          )}
        </div>
      )}

      {tab === 'matrix' && manage && (
        <div className={`${card} overflow-x-auto`}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="text-xs text-slate-500 mr-auto">Tick a box to turn a screen <b className="text-emerald-600">ON</b> for that role, untick to turn it <b className="text-rose-600">OFF</b>. Changes apply straight away. Super Admin always keeps full access.</p>
            <button className={btnGhost} onClick={() => { if (confirm('Reset all permissions to default?')) { setPerm({}); logAudit('PERMISSIONS_RESET', 'All screens', 'Back to default'); } }}>Reset to default</button>
          </div>
          <table className="w-full"><thead><tr><th className={th}>Screen</th>{ROLES.map((r) => <th key={r} className={`${th} text-center`}>{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>{Object.keys(TAB_ACCESS).map((k) => {
              const roles = effectiveAccess(k, perm);
              const changed = Array.isArray(perm[k]);
              return (
              <tr key={k} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{k.replace(/_/g, ' ')}{changed && <span className="ml-2 text-[9px] uppercase tracking-wider font-bold text-amber-600">changed</span>}</td>
                {ROLES.map((r) => {
                  const locked = r === 'super_admin' || LOCKED_TABS.includes(k);
                  const on = locked ? defaultAccess(k).includes(r) : roles.includes(r);
                  const flip = () => {
                    if (locked) return;
                    const next = on ? roles.filter((x) => x !== r) : [...roles, r];
                    setPerm((p) => ({ ...p, [k]: next }));
                    logAudit('PERMISSION_CHANGED', k, `${ROLE_LABEL[r] || r}: ${on ? 'OFF' : 'ON'}`);
                  };
                  return <td key={r} className={`${td} text-center`}>
                    <button type="button" onClick={flip} disabled={locked} title={locked ? 'Fixed' : on ? 'ON - click to turn off' : 'OFF - click to turn on'}
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors ${on ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400'} ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                    </button></td>;
                })}</tr>);
            })}</tbody></table>
        </div>
      )}
    </div>
  );
};
