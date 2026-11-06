// Login page: choose role, then sign in. Each role has its own login and dashboard.
import React, { useState } from 'react';
import { Crown, Building2, Users, Briefcase, Wallet, User, Eye, EyeOff, Mail, Lock, ShieldCheck, CalendarCheck, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PORTALS, LoginPortal, ROLE_LABEL, DEFAULT_PASSWORD, hashPassword, Credential, LoginEvent, ResetRequest, CRED_KEY, LOGIN_LOG_KEY, RESET_KEY } from '../lib/rbac';
import { readKey, writeKey, uid, nowStamp } from '../lib/sharedStore';

const ICONS: Record<LoginPortal, React.ElementType> = { super_admin: Crown, admin: Building2, hr: Users, manager: Briefcase, finance: Wallet, employee: User };
const ACCENT: Record<LoginPortal, [string, string]> = {
  super_admin: ['#7c3aed', '#4f46e5'], admin: ['#2563eb', '#0891b2'], hr: ['#db2777', '#e11d48'],
  manager: ['#f59e0b', '#ea580c'], finance: ['#10b981', '#0d9488'], employee: ['#334155', '#0f172a'],
};

export const RoleLogin: React.FC = () => {
  const { employees, company, login } = useApp();
  const [portal, setPortal] = useState<LoginPortal>('employee');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const p = PORTALS.find((x) => x.id === portal)!;
  const [c1, c2] = ACCENT[portal];

  const log = (e: Omit<LoginEvent, 'id' | 'at'>) => writeKey(LOGIN_LOG_KEY, [{ ...e, id: uid('lg'), at: nowStamp() }, ...readKey<LoginEvent[]>(LOGIN_LOG_KEY, [])].slice(0, 2000));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErr(''); setInfo('');
    const key = id.trim().toLowerCase();
    if (!key || !pw) return setErr('Enter your email / employee ID and password.');
    const emp = employees.find((e) => e.email.toLowerCase() === key || e.employeeId.toLowerCase() === key);
    if (!emp) return setErr('No account found with this email or employee ID.');
    const cutoff = Date.now() - 15 * 60 * 1000;
    const lockedUntil = readKey<Record<string, number>>('paa_x_lockouts', {})[emp.id] || 0;
    if (lockedUntil > Date.now()) return setErr('Too many wrong attempts. Try again after 15 minutes or ask HR/Admin to reset your password.');
    if (emp.status === 'inactive') { log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: p.id, ok: false, reason: 'inactive' }); return setErr('This account is deactivated. Contact HR.'); }
    if (!p.roles.includes(emp.role)) {
      log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: p.id, ok: false, reason: 'wrong portal' });
      const right = PORTALS.find((x) => x.roles.includes(emp.role));
      return setErr(`This is a ${ROLE_LABEL[emp.role] || emp.role} account. Select "${right?.title || ROLE_LABEL[emp.role]}" above.`);
    }
    setBusy(true);
    const cred = readKey<Credential[]>(CRED_KEY, []).find((c) => c.employeeId === emp.id);
    const expected = cred?.hash ?? (await hashPassword(DEFAULT_PASSWORD));
    const ok = (await hashPassword(pw)) === expected;
    setBusy(false);
    if (!ok) {
      log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: p.id, ok: false, reason: 'wrong password' });
      const fails = readKey<Record<string, number[]>>('paa_x_failed', {});
      const list = [...(fails[emp.id] || []).filter((t) => t > cutoff), Date.now()];
      fails[emp.id] = list; writeKey('paa_x_failed', fails);
      if (list.length >= 5) { const l = readKey<Record<string, number>>('paa_x_lockouts', {}); l[emp.id] = Date.now() + 15 * 60 * 1000; writeKey('paa_x_lockouts', l); }
      return setErr(`Wrong password. ${Math.max(0, 5 - list.length)} attempt(s) left before a 15-minute lock.`);
    }
    const fails = readKey<Record<string, number[]>>('paa_x_failed', {}); delete fails[emp.id]; writeKey('paa_x_failed', fails);
    log({ employeeId: emp.id, name: emp.name, role: emp.role, portal: p.id, ok: true });
    if (!cred || cred.mustChange) sessionStorage.setItem('paa_x_must_change', '1');
    login(emp.email, emp.role);
  };

  const requestReset = () => {
    const key = id.trim().toLowerCase();
    if (!key) return setErr('Type your email or employee ID first, then click "Forgot password?".');
    const emp = employees.find((e) => e.email.toLowerCase() === key || e.employeeId.toLowerCase() === key);
    writeKey(RESET_KEY, [{ id: uid('rst'), login: id.trim(), employeeId: emp?.id, at: nowStamp(), status: 'open' } as ResetRequest, ...readKey<ResetRequest[]>(RESET_KEY, [])]);
    setErr('');
    setInfo('Reset request sent to HR / Admin. They will reset your password and tell you the temporary password.');
  };

  const field = 'w-full h-12 pl-11 pr-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-[15px] placeholder:text-slate-400 focus:outline-none transition';
  const focusStyle = (e: React.FocusEvent<HTMLInputElement>, on: boolean) => { e.currentTarget.style.borderColor = on ? c1 : ''; e.currentTarget.style.boxShadow = on ? `0 0 0 4px ${c1}22` : ''; };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* LEFT: brand showcase */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden text-white" style={{ background: 'radial-gradient(circle at 18% 12%, rgba(245,158,11,0.35) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(37,99,235,0.55) 0%, transparent 45%), linear-gradient(135deg, #0b0f17 0%, #1f2937 55%, #111827 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-4">
            <img src="/logo-wide.png" alt={company.name} data-x="AGENCYOS_V2_PART18" className="h-28 w-auto bg-white rounded-2xl px-4 py-2 shadow-lg" />
          </div>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-blue-100 backdrop-blur"><ShieldCheck className="w-3.5 h-3.5" /> Secure role-based workspace</div>
            <h2 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">Run your agency<br /><span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-sky-400 bg-clip-text text-transparent">from one place.</span></h2>
            <p className="mt-5 text-base text-slate-300 leading-relaxed">Attendance, payroll, projects, clients and finance, with a separate dashboard for every role in your team.</p>

            {/* floating preview cards */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/[0.08] border border-white/10 backdrop-blur p-4 shadow-xl">
                <div className="flex items-center gap-2 text-xs text-slate-300"><CalendarCheck className="w-4 h-4 text-sky-300" /> Today's attendance</div>
                <div className="mt-2 text-2xl font-bold">96%</div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-sky-400" style={{ width: '96%' }} /></div>
              </div>
              <div className="rounded-2xl bg-white/[0.08] border border-white/10 backdrop-blur p-4 shadow-xl translate-y-4">
                <div className="flex items-center gap-2 text-xs text-slate-300"><TrendingUp className="w-4 h-4 text-emerald-300" /> Collections</div>
                <div className="mt-2 text-2xl font-bold">+18%</div>
                <div className="mt-2 flex items-end gap-1 h-6">{[40, 55, 35, 70, 60, 85, 100].map((h, i) => <div key={i} className="flex-1 rounded-sm bg-emerald-400/80" style={{ height: `${h}%` }} />)}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            {['Attendance & payroll', 'Projects & tasks', 'Finance & GST'].map((t) => <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{t}</span>)}
          </div>
        </div>
      </div>

      {/* RIGHT: sign in */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo-wide.png" alt={company.name} data-x="AGENCYOS_V2_PART18" className="h-20 w-auto mx-auto" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-[15px] text-slate-500">Choose your role and sign in to your dashboard.</p>

          <div className="mt-7 text-xs font-bold uppercase tracking-wider text-slate-400">I am signing in as</div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {PORTALS.map((x) => {
              const Icon = ICONS[x.id];
              const on = x.id === portal;
              const [a, b] = ACCENT[x.id];
              return (
                <button key={x.id} type="button" onClick={() => { setPortal(x.id); setErr(''); setInfo(''); }}
                  className={`relative flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all cursor-pointer ${on ? 'shadow-lg -translate-y-0.5' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                  style={on ? { borderColor: a, background: `${a}0d` } : undefined}>
                  {on && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4" style={{ color: a }} />}
                  <span className="h-10 w-10 rounded-xl flex items-center justify-center" style={on ? { backgroundImage: `linear-gradient(135deg, ${a}, ${b})`, color: '#fff' } : { background: '#f1f5f9', color: '#64748b' }}><Icon className="w-5 h-5" /></span>
                  <span className={`text-[12px] font-bold text-center leading-tight ${on ? 'text-slate-900' : 'text-slate-600'}`}>{x.title}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">Email or Employee ID</label>
              <div className="relative mt-2"><Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input className={field} value={id} onChange={(e) => setId(e.target.value)} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} autoComplete="username" placeholder="you@company.com or PAA-EMP-001" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between"><label className="text-sm font-semibold text-slate-700">Password</label>
                <button type="button" onClick={requestReset} className="text-sm font-semibold cursor-pointer hover:underline" style={{ color: c1 }}>Forgot password?</button></div>
              <div className="relative mt-2"><Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input className={`${field} pr-12`} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} onFocus={(e) => focusStyle(e, true)} onBlur={(e) => focusStyle(e, false)} autoComplete="current-password" placeholder="Enter your password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
            </div>
            {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">{err}</div>}
            {info && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 font-medium">{info}</div>}
            <button disabled={busy} className="group w-full h-12 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-60 cursor-pointer transition-all" style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 10px 25px -8px ${c1}aa` }}>
              {busy ? 'Signing in...' : <>Sign in as {p.title} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            New here? Your first password is given by HR - you will set your own after signing in.
            <div className="mt-2">&copy; {new Date().getFullYear()} {company.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
