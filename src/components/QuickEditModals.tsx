import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, Task } from '../types';

const input = 'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs';
const label = 'block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs';

// Mobile numbers: keep digits, require 10 digits (with or without +91)
export const cleanMobile = (v: string) => v.replace(/[^\d+]/g, '');
export const isValidMobile = (v?: string) => !v || /^(\+?91)?[6-9]\d{9}$/.test(cleanMobile(v));

const Shell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
    <div className="w-full max-w-2xl mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export const ClientEditModal: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
  const { updateClient, employees } = useApp();
  const [f, setF] = useState<Client>({ ...client });
  const [err, setErr] = useState('');
  const set = (k: keyof Client, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.companyName.trim()) return setErr('Company name is required.');
    if (!isValidMobile(f.phone)) return setErr('Mobile 1 must be a valid 10-digit Indian mobile number.');
    if (f.phone2 && !isValidMobile(f.phone2)) return setErr('Mobile 2 must be a valid 10-digit Indian mobile number.');
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Email is not valid.');
    if (f.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(f.gstNumber.toUpperCase())) return setErr('GSTIN format is not valid (15 characters).');
    updateClient(client.id, { ...f, gstNumber: f.gstNumber?.toUpperCase(), phone2: f.phone2?.trim() ? f.phone2 : undefined });
    onClose();
  };
  return (
    <Shell title={`Edit client - ${client.clientCode}`} onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={label}>Company name *</label><input className={input} value={f.companyName} onChange={e => set('companyName', e.target.value)} /></div>
        <div><label className={label}>Contact person</label><input className={input} value={f.contactPerson} onChange={e => set('contactPerson', e.target.value)} /></div>
        <div><label className={label}>Mobile 1 (Primary) *</label><input className={input} value={f.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div><label className={label}>Mobile 2 (Alternate / WhatsApp)</label><input className={input} value={f.phone2 || ''} onChange={e => set('phone2', e.target.value)} /></div>
        <div><label className={label}>Email</label><input className={input} value={f.email} onChange={e => set('email', e.target.value)} /></div>
        <div><label className={label}>Website</label><input className={input} value={f.website} onChange={e => set('website', e.target.value)} /></div>
        <div><label className={label}>GSTIN</label><input className={input} value={f.gstNumber} onChange={e => set('gstNumber', e.target.value)} /></div>
        <div><label className={label}>Status</label>
          <select className={input} value={f.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option><option value="onboarding">Onboarding</option><option value="dormant">Dormant</option>
          </select></div>
        <div><label className={label}>Account manager</label>
          <select className={input} value={f.accountManagerId} onChange={e => set('accountManagerId', e.target.value)}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select></div>
        <div><label className={label}>Services (comma separated)</label><input className={input} value={f.services.join(', ')} onChange={e => set('services', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} /></div>
        <div className="sm:col-span-2"><label className={label}>Address</label><textarea rows={2} className={input} value={f.address} onChange={e => set('address', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={label}>Billing address</label><textarea rows={2} className={input} value={f.billingAddress} onChange={e => set('billingAddress', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={label}>Notes</label><textarea rows={2} className={input} value={f.notes} onChange={e => set('notes', e.target.value)} /></div>
        {err && <p className="sm:col-span-2 text-rose-600 text-xs font-semibold">{err}</p>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">Save client</button>
        </div>
      </form>
    </Shell>
  );
};

export const TaskEditModal: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
  const { updateTask, deleteTask, employees, projects } = useApp();
  const [f, setF] = useState<Task>({ ...task });
  const [err, setErr] = useState('');
  const set = (k: keyof Task, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return setErr('Task title is required.');
    if (!f.assignedEmployeeId) return setErr('Choose who the task is assigned to.');
    if (f.dueDate && f.startDate && f.dueDate < f.startDate) return setErr('Due date cannot be before the start date.');
    const prj = projects.find(p => p.id === f.projectId);
    updateTask(task.id, { ...f, clientId: prj?.clientId ?? f.clientId, projectManagerId: prj?.projectManagerId ?? f.projectManagerId });
    onClose();
  };
  return (
    <Shell title={`Edit task - ${task.taskCode}`} onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className={label}>Title *</label><input className={input} value={f.title} onChange={e => set('title', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={label}>Description</label><textarea rows={3} className={input} value={f.description} onChange={e => set('description', e.target.value)} /></div>
        <div><label className={label}>Project</label>
          <select className={input} value={f.projectId} onChange={e => set('projectId', e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode} - {p.name}</option>)}
          </select></div>
        <div><label className={label}>Assigned to *</label>
          <select className={input} value={f.assignedEmployeeId} onChange={e => set('assignedEmployeeId', e.target.value)}>
            <option value="">Select...</option>
            {employees.filter(e => e.status !== 'inactive').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select></div>
        <div><label className={label}>Priority</label>
          <select className={input} value={f.priority} onChange={e => set('priority', e.target.value)}>
            {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
          </select></div>
        <div><label className={label}>Status</label>
          <select className={input} value={f.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="blocked">Blocked</option><option value="completed">Completed</option>
          </select></div>
        <div><label className={label}>Start date</label><input type="date" className={input} value={f.startDate} onChange={e => set('startDate', e.target.value)} /></div>
        <div><label className={label}>Due date</label><input type="date" className={input} value={f.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
        <div><label className={label}>Estimated hours</label><input type="number" className={input} value={f.estimatedHours} onChange={e => set('estimatedHours', Number(e.target.value))} /></div>
        <div><label className={label}>Actual hours</label><input type="number" className={input} value={f.actualHours} onChange={e => set('actualHours', Number(e.target.value))} /></div>
        {err && <p className="sm:col-span-2 text-rose-600 text-xs font-semibold">{err}</p>}
        <div className="sm:col-span-2 flex justify-between gap-2">
          <button type="button" onClick={() => { if (confirm('Delete this task?')) { deleteTask(task.id); onClose(); } }} className="px-4 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900 text-xs font-bold cursor-pointer">Delete task</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">Cancel</button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">Save task</button>
          </div>
        </div>
      </form>
    </Shell>
  );
};
