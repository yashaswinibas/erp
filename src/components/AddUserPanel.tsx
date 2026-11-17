// AGENCYOS_ADD_USER: Founder / Admin / HR add a new login with department, designation, role and password.
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Employee } from '../types';
import { OS_ROLES } from '../os/osConfig';
import { DEFAULT_PASSWORD, hashPassword, Credential, CRED_KEY, ROLE_LABEL } from '../lib/rbac';
import { useShared, nowStamp } from '../lib/sharedStore';
import { localDate } from '../lib/dates';
import { inputCls, btnPrimary, btnGhost } from './ui2';

const NEW = '__new__';
const pwRule = (p: string) => (p.length < 8 ? 'Password: at least 8 characters.' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Password: use letters and numbers.' : '');

export const AddUserPanel: React.FC<{ onDone?: (msg: string) => void }> = ({ onDone }) => {
  const { employees, departments, designations, addEmployee, addDepartment, addDesignation, currentRole, currentUser, logAudit } = useApp();
  const [, setCreds] = useShared<Credential[]>(CRED_KEY, []);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const blank = { name: '', email: '', phone: '', dept: '', newDept: '', desig: '', newDesig: '', role: 'employee', joining: localDate(), type: 'Full-time', pw: '', pw2: '', mustChange: true };
  const [f, setF] = useState(blank);
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const roles = OS_ROLES.filter((r) => r.id !== 'super_admin' || currentRole === 'super_admin');
  const desigList = designations.filter((d) => !f.dept || f.dept === NEW || d.departmentId === f.dept);

  const nextCode = () => {
    const nums = employees.map((e) => Number(String(e.employeeId).match(/(\d+)$/)?.[1] || 0));
    return 'PAA-EMP-' + String(Math.max(100, ...nums) + 1).padStart(3, '0');
  };

  const save = async () => {
    setErr('');
    const email = f.email.trim().toLowerCase();
    if (!f.name.trim()) return setErr('Enter the full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Enter a valid email (this is the login).');
    if (employees.some((e) => String(e.email).toLowerCase() === email)) return setErr('A user with this email already exists.');
    if (!f.dept || (f.dept === NEW && !f.newDept.trim())) return setErr('Choose or type a department.');
    if (!f.desig || (f.desig === NEW && !f.newDesig.trim())) return setErr('Choose or type a designation.');
    if (f.pw) { const r = pwRule(f.pw); if (r) return setErr(r); if (f.pw !== f.pw2) return setErr('Passwords do not match.'); }

    const stamp = Date.now();
    let deptId = f.dept;
    if (deptId === NEW) {
      deptId = `dept-${stamp}`;
      addDepartment({ id: deptId, name: f.newDept.trim(), code: f.newDept.trim().replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'DEPT', description: '' } as any);
    }
    let desigId = f.desig;
    if (desigId === NEW) {
      desigId = `desig-${stamp}`;
      addDesignation({ id: desigId, title: f.newDesig.trim(), departmentId: deptId, level: 'Staff' } as any);
    }
    const id = `emp-${stamp}`;
    const code = nextCode();
    const emp: Employee = {
      id, employeeId: code, name: f.name.trim(), email, phone: f.phone.trim(), dateOfBirth: '', joiningDate: f.joining,
      departmentId: deptId, designationId: desigId, employmentType: f.type as Employee['employmentType'], assignedProjectIds: [],
      salary: { basic: 0, hra: 0, allowances: 0, incentives: 0, bonus: 0, deductions: 0, netSalary: 0 },
      workLocation: 'Bengaluru', workMode: 'office', skills: [], experienceYears: 0, role: f.role as UserRole, status: 'active',
    };
    addEmployee(emp as any);
    const pw = f.pw || DEFAULT_PASSWORD;
    const hash = await hashPassword(pw);
    // saved a moment later so the new person reaches the database first
    window.setTimeout(() => setCreds((p) => [{ employeeId: id, hash, mustChange: f.mustChange || !f.pw, updatedAt: nowStamp() }, ...p.filter((c) => c.employeeId !== id)]), 2500);
    logAudit('USER_CREATED', code, `${emp.name} (${ROLE_LABEL[emp.role] || emp.role}) added by ${currentUser.name}`);
    setF(blank); setOpen(false);
    onDone?.(`${emp.name} added as ${code}. Login: ${email} / ${f.pw ? 'the password you set' : DEFAULT_PASSWORD}${f.mustChange || !f.pw ? ' (must change at first login)' : ''}.`);
  };

  if (!open) return <div className="mb-3"><button className={btnPrimary} onClick={() => setOpen(true)}>+ Add user</button></div>;
  const L = (label: string, el: React.ReactNode, wide = false) => <label className={`block ${wide ? 'sm:col-span-2' : ''}`}><span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</span>{el}</label>;
  return (
    <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
      <div className="font-bold text-sm text-slate-900 dark:text-white mb-3">Add a new user</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {L('Full name *', <input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rahul Verma" />)}
        {L('Work email (login) *', <input className={inputCls} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="name@priorityadsagency.com" />)}
        {L('Phone', <input className={inputCls} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 ..." />)}
        {L('Department *', <select className={inputCls} value={f.dept} onChange={(e) => { set('dept', e.target.value); set('desig', ''); }}>
          <option value="">Choose...</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}<option value={NEW}>+ New department...</option></select>)}
        {f.dept === NEW && L('New department name *', <input className={inputCls} value={f.newDept} onChange={(e) => set('newDept', e.target.value)} placeholder="e.g. Performance Marketing" />)}
        {L('Designation *', <select className={inputCls} value={f.desig} onChange={(e) => set('desig', e.target.value)}>
          <option value="">Choose...</option>{desigList.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}<option value={NEW}>+ New designation...</option></select>)}
        {f.desig === NEW && L('New designation *', <input className={inputCls} value={f.newDesig} onChange={(e) => set('newDesig', e.target.value)} placeholder="e.g. Meta Ads Specialist" />)}
        {L('Role (what they can open) *', <select className={inputCls} value={f.role} onChange={(e) => set('role', e.target.value)}>{roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>)}
        {L('Employment type', <select className={inputCls} value={f.type} onChange={(e) => set('type', e.target.value)}>{['Full-time', 'Contract', 'Probation', 'Intern'].map((t) => <option key={t}>{t}</option>)}</select>)}
        {L('Joining date', <input type="date" className={inputCls} value={f.joining} onChange={(e) => set('joining', e.target.value)} />)}
        {L('Password', <input type="password" className={inputCls} value={f.pw} onChange={(e) => set('pw', e.target.value)} placeholder={`Leave empty for ${DEFAULT_PASSWORD}`} autoComplete="new-password" />)}
        {L('Confirm password', <input type="password" className={inputCls} value={f.pw2} onChange={(e) => set('pw2', e.target.value)} autoComplete="new-password" />)}
      </div>
      <label className="flex items-center gap-2 text-xs mt-3 text-slate-600 dark:text-slate-300"><input type="checkbox" checked={f.mustChange} onChange={(e) => set('mustChange', e.target.checked)} /> Ask them to set their own password at first login</label>
      {err && <div className="text-xs font-semibold text-rose-600 mt-2">{err}</div>}
      <div className="flex gap-2 mt-3"><button className={btnPrimary} onClick={save}>Create user</button><button className={btnGhost} onClick={() => { setOpen(false); setErr(''); }}>Cancel</button></div>
    </div>
  );
};