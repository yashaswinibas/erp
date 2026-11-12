// AGENCYOS_HUBS_DONE
// AGENCYOS_HR_OFFER
// AgencyOS v2: Employee onboarding, documents, contracts, salary structure,
// bank details, monthly attendance finalisation, payroll and payslips.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';
import {
  OnboardingRecord, OnboardingItem, EmployeeDocument, EmploymentContract, ContractType, BankDetails,
  SalaryStructure, SalaryLine, StatutorySettings, PayrollRules, AttendanceMonthSummary, PayrollRun, PayrollSlip,
} from '../lib/hrTypes';
import { usePersisted } from '../lib/usePersisted';
import { saveFile, openStoredFile } from '../lib/fileStore';
import { summariseMonth, calculatePayslip, DayKind } from '../lib/payrollCalc';
import { inr, round2 } from '../lib/money';
import { localDate, daysInMonth, MONTH_NAMES, fmtDate, addDaysIso } from '../lib/dates';
import { printPayslip, printLetter } from '../lib/print';
import { TEMPLATES as DOC_TEMPLATES } from '../lib/docTemplates';
import { docHtml } from './DocumentCenter';
import { letterPage, openBrandDoc } from '../lib/brandDocs';

// ---------- small UI helpers (Tailwind, matches the rest of the app) ----------
const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs';
const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50';
const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-700 text-white`;
const btnGhost = `${btn} border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`;
const btnGood = `${btn} bg-emerald-600 hover:bg-emerald-700 text-white`;
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4';
const th = 'px-3 py-2 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold';
const td = 'px-3 py-2 text-xs text-slate-700 dark:text-slate-300 align-top';

const Badge: React.FC<{ v: string }> = ({ v }) => {
  const good = ['completed', 'verified', 'signed', 'paid', 'approved', 'finalised', 'active'];
  const warn = ['pending', 'in_progress', 'sent', 'calculated', 'partially_paid', 'open', 'on_hold', 'draft'];
  const cls = good.includes(v) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : warn.includes(v) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${cls}`}>{v.replace(/_/g, ' ')}</span>;
};

const Field: React.FC<{ label: string; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide }) => (
  <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
    <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</span>{children}
  </label>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
    <div className="w-full max-w-3xl mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className={btnGhost}>Close</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// ---------- defaults ----------
const DEFAULT_CHECKLIST: Omit<OnboardingItem, 'id' | 'done'>[] = [
  { title: 'Offer letter accepted', owner: 'HR', mandatory: true },
  { title: 'ID & address proof uploaded', owner: 'Employee', mandatory: true },
  { title: 'Documents verified', owner: 'HR', mandatory: true },
  { title: 'Employment contract signed', owner: 'HR', mandatory: true },
  { title: 'Bank details added', owner: 'HR', mandatory: true },
  { title: 'Salary structure set', owner: 'HR', mandatory: true },
  { title: 'Email & system access created', owner: 'IT', mandatory: true },
  { title: 'Induction / team introduction', owner: 'Manager', mandatory: false },
];

export const DEFAULT_STATUTORY: StatutorySettings = {
  pfEnabled: false, pfRate: 12, pfEmployerRate: 12, pfWageCeiling: 15000, pfApplyCeiling: true,
  esiEnabled: false, esiEmployeeRate: 0.75, esiEmployerRate: 3.25, esiWageLimit: 21000,
  ptEnabled: false, ptSlabs: [{ min: 0, max: 24999.99, amount: 0 }, { min: 25000, max: null, amount: 200, febAmount: 300 }],
  tdsEnabled: false,
};

export const DEFAULT_RULES: PayrollRules = {
  workingDaysBasis: 'fixed', fixedWorkingDays: 26, weeklyOffs: [0], latesPerHalfDay: 3, holidays: [], includeReimbursements: true,
};

const TEMPLATES: Record<ContractType, string> = {
  'Offer Letter': 'Dear {{name}},\n\nWe are pleased to offer you the position of {{designation}} at {{company}}. Your date of joining will be {{joiningDate}} and your annual cost to company (CTC) will be {{ctc}}.\n\nPlease sign and return a copy of this letter to confirm your acceptance.\n\nWe look forward to working with you.',
  'Employment Contract': 'This Employment Agreement is made between {{company}} and {{name}} (Employee ID {{employeeCode}}).\n\n1. Position: {{designation}}, effective {{joiningDate}}.\n2. Compensation: Annual CTC of {{ctc}}, paid monthly, subject to statutory deductions.\n3. Working hours, leave and conduct follow company policy as amended from time to time.\n4. Confidentiality: The employee will not disclose confidential information of the company or its clients during or after employment.\n5. Notice period: 30 days from either side.',
  'NDA': '{{name}} agrees to keep confidential all non-public information of {{company}} and its clients, during employment and for two years after it ends.',
  'Internship Letter': 'Dear {{name}},\n\nWe are pleased to offer you an internship as {{designation}} at {{company}} starting {{joiningDate}}.',
  'Increment Letter': 'Dear {{name}},\n\nIn recognition of your contribution, your annual CTC is revised to {{ctc}} with effect from the date mentioned in this letter.',
};

const structureFromEmployee = (e: Employee): SalaryStructure => ({
  id: `sal-${e.id}-default`, employeeId: e.id, effectiveFrom: e.joiningDate || '2000-01-01', createdAt: localDate(),
  pfApplicable: true, esiApplicable: true, ptApplicable: true, monthlyTds: 0,
  lines: [
    { code: 'BASIC', name: 'Basic Salary', kind: 'earning', calc: 'fixed', value: e.salary?.basic || 0, prorate: true },
    { code: 'HRA', name: 'House Rent Allowance', kind: 'earning', calc: 'fixed', value: e.salary?.hra || 0, prorate: true },
    { code: 'ATTALLOW', name: 'Attendance Allowance', kind: 'earning', calc: 'fixed', value: 0, prorate: true }, // AGENCYOS_V2_PART5
    { code: 'TRANSPORT', name: 'Transportation Allowance', kind: 'earning', calc: 'fixed', value: e.salary?.allowances || 0, prorate: true },
    { code: 'MEAL', name: 'Meal Allowance', kind: 'earning', calc: 'fixed', value: 0, prorate: true },
    { code: 'PERFBONUS', name: 'Performance Bonus', kind: 'earning', calc: 'fixed', value: (e.salary?.incentives || 0) + (e.salary?.bonus || 0), prorate: false },
    { code: 'OTHERDED', name: 'Other Deductions', kind: 'deduction', calc: 'fixed', value: e.salary?.deductions || 0, prorate: false },
  ].filter((l) => ['BASIC', 'ATTALLOW', 'TRANSPORT', 'MEAL', 'PERFBONUS'].includes(l.code) || l.value > 0) as SalaryLine[],
});

// Maps the app's attendance statuses to payroll day types
const toDayKind = (status: string): { kind: DayKind; late?: boolean } => {
  switch (status) {
    case 'late': return { kind: 'present', late: true };
    case 'present': case 'wfh': case 'field_visit': case 'on_duty': return { kind: 'present' };
    case 'half_day': return { kind: 'half_day' };
    case 'leave': return { kind: 'paid_leave' };
    case 'holiday': case 'week_off': return { kind: 'off' };
    default: return { kind: 'absent' };
  }
};

type Tab = 'onboarding' | 'contracts' | 'salary' | 'attendance' | 'payroll' | 'settings' | 'my_payslips';

export const HrPayrollModule: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'onboarding' }) => {
  const app = useApp();
  const { employees, departments, designations, attendance, reimbursements, company, currentUser, currentRole, updateEmployee, notify, logAudit, setAttendanceRecords, reviewReimbursement } = app;
  const isHR = ['super_admin', 'admin', 'hr'].includes(currentRole);
  const isFin = currentRole === 'finance'; // AGENCYOS_V2_PART4
  const canPay = ['super_admin', 'admin', 'finance'].includes(currentRole);
  const [tab, setTab] = useState<Tab>(isHR ? initialTab : isFin ? 'payroll' : 'my_payslips');

  const [onboarding, setOnboarding] = usePersisted<Record<string, OnboardingRecord>>('paa_x_onboarding', {});
  const [docs, setDocs] = usePersisted<EmployeeDocument[]>('paa_x_employee_docs', []);
  const [contracts, setContracts] = usePersisted<EmploymentContract[]>('paa_x_contracts', []);
  const [bank, setBank] = usePersisted<Record<string, BankDetails>>('paa_x_bank', {});
  const [structures, setStructures] = usePersisted<SalaryStructure[]>('paa_x_salary_structures', []);
  const [statutory, setStatutory] = usePersisted<StatutorySettings>('paa_x_statutory', DEFAULT_STATUTORY);
  const [rules, setRules] = usePersisted<PayrollRules>('paa_x_payroll_rules', DEFAULT_RULES);
  const [months, setMonths] = usePersisted<AttendanceMonthSummary[]>('paa_x_attendance_months', []);
  const [runs, setRuns] = usePersisted<PayrollRun[]>('paa_x_payroll_runs', []);

  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? { y: now.getFullYear() - 1, m: 12 } : { y: now.getFullYear(), m: now.getMonth() };
  const [ym, setYm] = useState(prevMonth);
  const [selEmp, setSelEmp] = useState<string>(employees[0]?.id || '');
  const [modal, setModal] = useState<string | null>(null);

  const emp = (id: string) => employees.find((e) => e.id === id);
  const deptName = (e?: Employee) => departments.find((d) => d.id === e?.departmentId)?.name;
  const desigName = (e?: Employee) => designations.find((d) => d.id === e?.designationId)?.title;
  // full offer letter in the official format, filled from the employee + salary structure
  const printOffer = (c: { id: string; employeeId: string; title: string; body: string; ctcAnnual?: number; startDate?: string; createdAt: string }) => {
    const e = emp(c.employeeId); const t = DOC_TEMPLATES.find((x) => x.id === 'offer_letter');
    if (!e || !t || !t.salary) { printLetter(company, c.title, c.body); return; }
    const s = structureFor(c.employeeId, '9999-12-31');
    const earn = (s?.lines || []).filter((l) => l.kind === 'earning');
    const basic = earn.find((l) => l.code === 'BASIC')?.value || 0;
    const amt = (l: { calc: string; value: number }) => (l.calc === 'percent_of_basic' ? (basic * l.value) / 100 : l.value);
    const pick = (codes: string[]) => earn.filter((l) => codes.includes(l.code)).reduce((a, l) => a + amt(l), 0);
    const hra = pick(['HRA']), conv = pick(['CONV', 'CONVEYANCE', 'TRANSPORT']), med = pick(['MEDICAL', 'MED']), lta = pick(['LTA']), bonus = pick(['PERFBONUS', 'BONUS']);
    const special = earn.reduce((a, l) => a + amt(l), 0) - basic - hra - conv - med - lta - bonus;
    const str = (x: number) => (x > 0 ? String(Math.round(x)) : '');
    const mgr = employees.find((x) => x.id === (e as any).reportingManagerId);
    const v: Record<string, string> = {
      name: e.name, empId: e.employeeId, designation: desigName(e) || ' ', department: deptName(e) || ' ', address: (e as any).address || ' ', phone: e.phone || ' ',
      joiningDate: c.startDate || e.joiningDate || '', location: 'Bengaluru', reportingTo: mgr?.name || 'your reporting manager', acceptBy: addDaysIso(c.createdAt, 7),
      probation: '6', notice: '30', hrName: currentUser.name,
      sBasic: str(basic), sHra: str(hra), sSpecial: str(special), sConv: str(conv), sMedical: str(med), sLta: str(lta), sBonus: str(bonus * 12),
      ctc: c.ctcAnnual ? 'Rs. ' + Math.round(c.ctcAnnual).toLocaleString('en-IN') + ' per annum' : '',
    };
    const ref = 'PAA-HR-' + c.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
    openBrandDoc('Offer Letter - ' + e.name, letterPage(docHtml(t, v, company, 'Offer Letter', c.createdAt, ref, {}), ref, c.createdAt), false);
  };
  // AGENCYOS_PAYROLL_SKIP_TEST: demo role-login accounts (emp-role-*) are not paid and do not block payroll
  const activeEmployees = employees.filter((e) => e.status !== 'inactive' && !String(e.id).startsWith('emp-role-'));

  // ---------- onboarding ----------
  const getOnboarding = (empId: string): OnboardingRecord =>
    onboarding[empId] || { employeeId: empId, status: 'in_progress', items: DEFAULT_CHECKLIST.map((x, i) => ({ ...x, id: `ob-${i}`, done: false })) };
  const tick = (empId: string, title: string, done = true) => {
    setOnboarding((prev) => {
      const rec = prev[empId] || getOnboarding(empId);
      return { ...prev, [empId]: { ...rec, items: rec.items.map((it) => it.title === title ? { ...it, done, doneAt: done ? localDate() : undefined, doneBy: done ? currentUser.name : undefined } : it) } };
    });
  };
  const completeOnboarding = (empId: string) => {
    const rec = getOnboarding(empId);
    const missing = rec.items.filter((i) => i.mandatory && !i.done).map((i) => i.title);
    if (missing.length) { alert('Complete these items first:\n- ' + missing.join('\n- ')); return; }
    setOnboarding((p) => ({ ...p, [empId]: { ...rec, status: 'completed', completedAt: localDate() } }));
    updateEmployee(empId, { status: 'active' });
    logAudit('ONBOARDING_COMPLETED', empId, `Onboarding completed for ${emp(empId)?.name}`);
    notify('Onboarding completed', `${emp(empId)?.name} is now active.`, 'system', 'hr_onboarding');
  };

  // ---------- salary ----------
  const structureFor = (empId: string, onDate = localDate()) => {
    const list = structures.filter((s) => s.employeeId === empId && s.effectiveFrom <= onDate).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    if (list[0]) return list[0];
    const e = emp(empId);
    return e ? structureFromEmployee(e) : undefined;
  };

  // ---------- attendance month summary ----------
  const buildSummary = (empId: string, y: number, m: number): AttendanceMonthSummary => {
    const e = emp(empId);
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    const days: Record<string, { kind: DayKind; late?: boolean }> = {};
    attendance.filter((a) => a.employeeId === empId && a.date.startsWith(prefix)).forEach((a) => { days[a.date] = toDayKind(a.status); });
    const today = localDate();
    const r = summariseMonth({
      year: y, month: m, daysInMonth: daysInMonth(y, m), days, holidays: new Set(rules.holidays.map((h) => h.date)),
      weeklyOffs: rules.weeklyOffs, basis: rules.workingDaysBasis, fixedWorkingDays: rules.fixedWorkingDays, latesPerHalfDay: rules.latesPerHalfDay,
      joiningDate: e?.joiningDate, countUntil: today.startsWith(prefix) ? today : undefined,
    });
    return { employeeId: empId, year: y, month: m, ...r, status: 'open' };
  };
  const monthRow = (empId: string, y: number, m: number) =>
    months.find((x) => x.employeeId === empId && x.year === y && x.month === m && x.status === 'finalised') || buildSummary(empId, y, m);

  const finaliseMonth = (y: number, m: number) => {
    const end = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth(y, m)).padStart(2, '0')}`;
    if (end >= localDate()) { alert('A month can only be finalised after it has ended.'); return; }
    if (!confirm(`Finalise and lock attendance for ${MONTH_NAMES[m - 1]} ${y}? Payroll will use these numbers.`)) return;
    const rows = activeEmployees.map((e) => ({ ...buildSummary(e.id, y, m), status: 'finalised' as const, finalisedAt: localDate(), finalisedBy: currentUser.name }));
    setMonths((prev) => [...prev.filter((x) => !(x.year === y && x.month === m)), ...rows]);
    logAudit('ATTENDANCE_MONTH_FINALISED', `${y}-${m}`, `${rows.length} employees`);
    notify('Attendance finalised', `${MONTH_NAMES[m - 1]} ${y} is locked. Payroll can now be calculated.`, 'payroll', 'hr_payroll');
  };
  const reopenMonth = (empId: string, y: number, m: number) => {
    const reason = prompt('Reason for reopening this month?');
    if (!reason) return;
    setMonths((prev) => prev.filter((x) => !(x.employeeId === empId && x.year === y && x.month === m)));
    setRuns((prev) => prev.map((r) => (r.year === y && r.month === m ? { ...r, needsRecalculation: true } : r)));
    logAudit('ATTENDANCE_MONTH_REOPENED', `${empId} ${y}-${m}`, reason);
  };
  const fillMissing = (empId: string, y: number, m: number) => {
    if (!confirm('Mark every working day with no attendance record as Present for this employee?')) return;
    const e = emp(empId);
    const recs: any[] = [];
    const today = localDate();
    for (let d = 1; d <= daysInMonth(y, m); d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, d).getDay();
      if (iso > today || (e?.joiningDate && iso < e.joiningDate) || rules.weeklyOffs.includes(dow) || rules.holidays.some((h) => h.date === iso)) continue;
      if (attendance.some((a) => a.employeeId === empId && a.date === iso)) continue;
      recs.push({ id: `att-fill-${empId}-${iso}`, employeeId: empId, date: iso, checkIn: '', checkOut: '', workingHours: 0, status: 'present', workMode: 'office', remarks: `Marked present by ${currentUser.name}`, isRegularized: true, regularizedBy: currentUser.name });
    }
    setAttendanceRecords((prev) => [...recs, ...prev]);
    logAudit('ATTENDANCE_BULK_PRESENT', empId, `${recs.length} days marked present for ${y}-${m}`);
  };

  // ---------- payroll ----------
  const runFor = (y: number, m: number) => runs.find((r) => r.year === y && r.month === m);
  const reimbursementsFor = (empId: string, y: number, m: number) => {
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    return reimbursements.filter((r) => r.employeeId === empId && r.status === 'approved' && r.date.startsWith(prefix));
  };
  const calculateRun = (y: number, m: number) => {
    const missing = activeEmployees.filter((e) => !months.some((x) => x.employeeId === e.id && x.year === y && x.month === m && x.status === 'finalised'));
    if (missing.length) { alert(`Finalise attendance for ${MONTH_NAMES[m - 1]} ${y} first. Not finalised: ${missing.map((e) => e.name).join(', ')}`); return; }
    const existing = runFor(y, m);
    if (existing && ['partially_paid', 'paid'].includes(existing.status)) { alert('Salaries for this month are already paid. Add corrections to next month as adjustments.'); return; }
    const adjustments = existing?.adjustments || [];
    const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth(y, m)).padStart(2, '0')}`;
    const slips: PayrollSlip[] = activeEmployees.map((e, i) => {
      const s = structureFor(e.id, monthEnd)!;
      const mr = months.find((x) => x.employeeId === e.id && x.year === y && x.month === m)!;
      const rmb = rules.includeReimbursements ? reimbursementsFor(e.id, y, m).reduce((t, r) => t + r.amount, 0) : 0;
      const adj = [...adjustments.filter((a) => a.employeeId === e.id), ...(rmb ? [{ name: 'Approved reimbursements', kind: 'earning' as const, amount: rmb }] : [])];
      const r = calculatePayslip({
        month: m, lines: s.lines, workingDays: mr.workingDays, payableDays: mr.payableDays, statutory,
        employee: { pfApplicable: s.pfApplicable, esiApplicable: s.esiApplicable, ptApplicable: s.ptApplicable, monthlyTds: s.monthlyTds, hasBank: !!bank[e.id] },
        adjustments: adj,
      });
      return {
        id: `slip-${y}${m}-${e.id}`, slipNumber: `PAA-SLIP-${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`, employeeId: e.id,
        workingDays: mr.workingDays, payableDays: mr.payableDays, unpaidDays: mr.unpaidDays, lines: r.lines, gross: r.gross,
        totalDeductions: r.totalDeductions, net: r.net, employerPf: r.employerPf, employerEsi: r.employerEsi, exceptions: r.exceptions, paymentStatus: 'pending',
      };
    });
    const run: PayrollRun = { id: existing?.id || `run-${y}-${m}`, year: y, month: m, status: 'calculated', needsRecalculation: false, slips, adjustments, calculatedAt: new Date().toLocaleString() };
    setRuns((prev) => [run, ...prev.filter((r) => r.id !== run.id)]);
    logAudit('PAYROLL_CALCULATED', run.id, `${slips.length} payslips, net ${inr(slips.reduce((t, s) => t + s.net, 0))}`);
  };
  const updateRun = (id: string, f: (r: PayrollRun) => PayrollRun) => setRuns((prev) => prev.map((r) => (r.id === id ? f(r) : r)));
  const approveRun = (r: PayrollRun) => {
    if (r.needsRecalculation) { alert('Recalculate before approving.'); return; }
    if (!confirm(`Approve payroll for ${MONTH_NAMES[r.month - 1]} ${r.year}? Payslips become visible to employees.`)) return;
    updateRun(r.id, (x) => ({ ...x, status: 'approved', approvedBy: currentUser.name, approvedAt: new Date().toLocaleString() }));
    logAudit('PAYROLL_APPROVED', r.id, `Approved by ${currentUser.name}`);
    notify('Payslips available', `Payslips for ${MONTH_NAMES[r.month - 1]} ${r.year} are ready.`, 'payroll', 'hr_payroll');
  };
  const paySlips = (r: PayrollRun, ids: string[], mode: string, ref: string, onHold = false) => {
    const paidOn = localDate();
    updateRun(r.id, (x) => {
      const slips = x.slips.map((s) => (ids.includes(s.id) ? { ...s, paymentStatus: onHold ? 'on_hold' as const : 'paid' as const, paidOn: onHold ? undefined : paidOn, paymentMode: mode, paymentRef: ref } : s));
      const paid = slips.filter((s) => s.paymentStatus === 'paid').length;
      return { ...x, slips, status: paid === slips.length ? 'paid' : paid ? 'partially_paid' : 'approved' };
    });
    if (!onHold && rules.includeReimbursements) {
      ids.forEach((sid) => {
        const s = r.slips.find((x) => x.id === sid);
        if (s) reimbursementsFor(s.employeeId, r.year, r.month).forEach((rb) => reviewReimbursement(rb.id, 'paid', `Paid with salary ${MONTH_NAMES[r.month - 1]} ${r.year}`));
      });
    }
    logAudit('PAYROLL_PAYMENT', r.id, `${ids.length} salaries marked ${onHold ? 'on hold' : 'paid'} (${mode} ${ref})`);
  };
  const exportBankCsv = (r: PayrollRun) => {
    const rows = [['Employee ID', 'Name', 'Account holder', 'Account number', 'IFSC', 'Bank', 'Amount', 'Narration']];
    r.slips.filter((s) => s.paymentStatus === 'pending').forEach((s) => {
      const e = emp(s.employeeId); const b = bank[s.employeeId];
      rows.push([e?.employeeId || '', e?.name || '', b?.holderName || '', b?.accountNumber || 'MISSING', b?.ifsc || '', b?.bankName || '', s.net.toFixed(2), `Salary ${MONTH_NAMES[r.month - 1]} ${r.year}`]);
    });
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `salary-${r.year}-${String(r.month).padStart(2, '0')}.csv`;
    a.click();
  };
  const printSlip = (r: PayrollRun, s: PayrollSlip) => {
    const e = emp(s.employeeId);
    printPayslip(company, {
      period: `${MONTH_NAMES[r.month - 1]} ${r.year}`, slipNumber: s.slipNumber,
      employee: { name: e?.name || '', code: e?.employeeId || '', designation: desigName(e), department: deptName(e), bankLast4: bank[s.employeeId]?.accountNumber.slice(-4), bankName: bank[s.employeeId]?.bankName, joiningDate: e?.joiningDate },
      workingDays: s.workingDays, payableDays: s.payableDays, unpaidDays: s.unpaidDays,
      earnings: s.lines.filter((l) => l.kind === 'earning'), deductions: s.lines.filter((l) => l.kind === 'deduction'),
      gross: s.gross, totalDeductions: s.totalDeductions, net: s.net, employerPf: s.employerPf, employerEsi: s.employerEsi,
      paidOn: s.paidOn, paymentMode: s.paymentMode,
    });
  };

  const tabs: [Tab, string][] = isHR
    ? [['onboarding', 'Onboarding & Documents'], ['contracts', 'Offer Letters & Contracts'], ['salary', 'Salary & Bank'], ['attendance', 'Finalise Attendance'], ['payroll', 'Monthly Payroll'], ['settings', 'Payroll Settings'], ['my_payslips', 'My Payslips']]
    : isFin ? [['payroll', 'Monthly Payroll (payments)'], ['my_payslips', 'My Payslips']] : [['my_payslips', 'My Payslips']];

  const MonthPicker = (
    <div className="flex items-center gap-2">
      <select className={inputCls} value={ym.m} onChange={(e) => setYm({ ...ym, m: Number(e.target.value) })}>{MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</select>
      <input className={`${inputCls} w-24`} type="number" value={ym.y} onChange={(e) => setYm({ ...ym, y: Number(e.target.value) })} />
    </div>
  );

  const EmpPicker = (
    <select className={`${inputCls} max-w-xs`} value={selEmp} onChange={(e) => setSelEmp(e.target.value)}>
      {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employeeId}){e.status === 'inactive' ? ' - inactive' : ''}</option>)}
    </select>
  );

  return (
    <div className="space-y-5">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 className="legacy-title text-xl font-bold text-slate-900 dark:text-white">HR, Onboarding & Payroll</h2>
        <p className="legacy-title text-xs text-slate-500">Onboarding checklist, documents, contracts, salary structure, attendance finalisation and monthly payroll.</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`${btn} ${tab === k ? 'bg-slate-900 text-white dark:bg-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* ---------------- ONBOARDING ---------------- */}
      {tab === 'onboarding' && (() => {
        const rec = getOnboarding(selEmp);
        const e = emp(selEmp);
        const myDocs = docs.filter((d) => d.employeeId === selEmp);
        const done = rec.items.filter((i) => i.done).length;
        return (
          <div className="space-y-4">
            <div className={`${card} flex flex-wrap items-center gap-3 justify-between`}>
              <div className="flex items-center gap-3">{EmpPicker}{e && <span className="text-xs text-slate-500">Joined {fmtDate(e.joiningDate)} | {deptName(e)} | {desigName(e)}</span>}</div>
              <div className="flex items-center gap-2"><Badge v={rec.status} />{rec.status !== 'completed' && <button className={btnGood} onClick={() => completeOnboarding(selEmp)}>Complete onboarding</button>}</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={card}>
                <h3 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Checklist ({done}/{rec.items.length})</h3>
                {rec.items.map((it) => (
                  <label key={it.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <input type="checkbox" checked={it.done} onChange={(ev) => tick(selEmp, it.title, ev.target.checked)} />
                    <span className="flex-1 text-slate-800 dark:text-slate-200">{it.title}{it.mandatory && <span className="text-rose-500"> *</span>}</span>
                    <span className="text-slate-400">{it.owner}{it.doneAt ? ` | ${fmtDate(it.doneAt)}` : ''}</span>
                  </label>
                ))}
                <p className="text-[11px] text-slate-400 mt-2">* mandatory. Completing onboarding sets the employee to Active.</p>
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm text-slate-900 dark:text-white">Employee documents</h3><button className={btnPrimary} onClick={() => setModal('doc')}>Upload</button></div>
                {myDocs.length === 0 ? <p className="text-xs text-slate-400">No documents yet.</p> : (
                  <table className="w-full"><thead><tr><th className={th}>Document</th><th className={th}>File</th><th className={th}>Status</th><th className={th}></th></tr></thead>
                    <tbody>{myDocs.map((d) => (
                      <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className={td}>{d.docType}<div className="text-[10px] text-slate-400">{fmtDate(d.uploadedAt)}</div></td>
                        <td className={td}><button className="text-blue-600 hover:underline" onClick={() => openStoredFile(d)}>{d.fileName}</button></td>
                        <td className={td}><Badge v={d.status} />{d.remarks && <div className="text-[10px] text-slate-400">{d.remarks}</div>}</td>
                        <td className={td}>{d.status === 'pending' && <div className="flex gap-1">
                          <button className={btnGood} onClick={() => { setDocs((p) => p.map((x) => x.id === d.id ? { ...x, status: 'verified' } : x)); tick(selEmp, 'Documents verified'); }}>Verify</button>
                          <button className={btnGhost} onClick={() => { const r = prompt('Reason for rejection?') || ''; setDocs((p) => p.map((x) => x.id === d.id ? { ...x, status: 'rejected', remarks: r } : x)); }}>Reject</button></div>}</td>
                      </tr>))}</tbody></table>
                )}
              </div>
            </div>
            <div className={card}>
              <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-white">Onboarding status - all employees</h3>
              <table className="w-full"><thead><tr><th className={th}>Employee</th><th className={th}>Joined</th><th className={th}>Checklist</th><th className={th}>Documents</th><th className={th}>Status</th></tr></thead>
                <tbody>{employees.map((x) => { const r = getOnboarding(x.id); return (
                  <tr key={x.id} className="border-t border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setSelEmp(x.id)}>
                    <td className={td}>{x.name} <span className="text-slate-400">{x.employeeId}</span></td><td className={td}>{fmtDate(x.joiningDate)}</td>
                    <td className={td}>{r.items.filter((i) => i.done).length}/{r.items.length}</td><td className={td}>{docs.filter((d) => d.employeeId === x.id).length}</td><td className={td}><Badge v={r.status} /></td>
                  </tr>); })}</tbody></table>
            </div>
            {modal === 'doc' && <UploadDocModal onClose={() => setModal(null)} onSave={async (docType, file) => {
              const sf = await saveFile(file);
              setDocs((p) => [{ ...sf, id: `doc-${Date.now()}`, employeeId: selEmp, docType, uploadedAt: localDate(), status: 'pending' }, ...p]);
              tick(selEmp, 'ID & address proof uploaded');
              logAudit('EMPLOYEE_DOCUMENT_UPLOADED', selEmp, `${docType}: ${file.name}`);
              setModal(null);
            }} />}
          </div>
        );
      })()}

      {/* ---------------- CONTRACTS ---------------- */}
      {tab === 'contracts' && (() => {
        const list = contracts.filter((c) => c.employeeId === selEmp).sort((a, b) => a.type.localeCompare(b.type) || b.version - a.version);
        const expiring = contracts.filter((c) => c.endDate && c.status === 'signed' && c.endDate <= addDaysIso(localDate(), 30) && c.endDate >= localDate());
        return (
          <div className="space-y-4">
            {expiring.length > 0 && <div className={`${card} border-amber-300`}><b className="text-xs text-amber-700">Contracts ending within 30 days:</b> <span className="text-xs">{expiring.map((c) => `${emp(c.employeeId)?.name} - ${c.type} (${fmtDate(c.endDate)})`).join(', ')}</span></div>}
            <div className={`${card} flex flex-wrap gap-3 justify-between items-center`}>{EmpPicker}<button className={btnPrimary} onClick={() => setModal('contract')}>Generate letter / contract</button></div>
            <div className={card}>
              {list.length === 0 ? <p className="text-xs text-slate-400">No letters or contracts for this employee yet.</p> : (
                <table className="w-full"><thead><tr><th className={th}>Type</th><th className={th}>Version</th><th className={th}>Period</th><th className={th}>Status</th><th className={th}></th></tr></thead>
                  <tbody>{list.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className={td}>{c.type}<div className="text-[10px] text-slate-400">Created {fmtDate(c.createdAt)}</div></td><td className={td}>v{c.version}</td>
                      <td className={td}>{fmtDate(c.startDate)} - {fmtDate(c.endDate)}</td><td className={td}><Badge v={c.status} /></td>
                      <td className={td}><div className="flex flex-wrap gap-1">
                        <button className={btnGhost} onClick={() => (c.type === 'Offer Letter' ? printOffer(c) : printLetter(company, c.title, c.body))}>Print / PDF</button>
                        {c.status === 'draft' && <button className={btnGhost} onClick={() => setContracts((p) => p.map((x) => x.id === c.id ? { ...x, status: 'sent' } : x))}>Mark sent</button>}
                        {c.signedFile ? <button className={btnGhost} onClick={() => openStoredFile(c.signedFile!)}>Signed copy</button>
                          : <label className={`${btnGood} inline-block`}>Upload signed<input type="file" className="hidden" accept=".pdf,image/*" onChange={async (ev) => {
                            const file = ev.target.files?.[0]; if (!file) return;
                            try {
                              const sf = await saveFile(file);
                              setContracts((p) => p.map((x) => x.id === c.id ? { ...x, signedFile: sf, signedAt: localDate(), status: 'signed' } : x));
                              tick(selEmp, c.type === 'Offer Letter' ? 'Offer letter accepted' : 'Employment contract signed');
                              logAudit('CONTRACT_SIGNED', c.id, `${c.type} v${c.version} signed copy uploaded`);
                            } catch (er: any) { alert(er.message); }
                          }} /></label>}
                      </div></td>
                    </tr>))}</tbody></table>
              )}
            </div>
            {modal === 'contract' && <ContractModal employee={emp(selEmp)!} designation={desigName(emp(selEmp))} companyName={company.name} onClose={() => setModal(null)} onSave={(c) => {
              const version = contracts.filter((x) => x.employeeId === selEmp && x.type === c.type).reduce((mx, x) => Math.max(mx, x.version), 0) + 1;
              setContracts((p) => [{ ...c, id: `ctr-${Date.now()}`, employeeId: selEmp, version, status: 'draft', createdAt: localDate() }, ...p]);
              logAudit('CONTRACT_CREATED', selEmp, `${c.type} v${version}`);
              setModal(null);
            }} />}
          </div>
        );
      })()}

      {/* ---------------- SALARY & BANK ---------------- */}
      {tab === 'salary' && (() => {
        const s = structureFor(selEmp, '9999-12-31');
        const history = structures.filter((x) => x.employeeId === selEmp).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
        const b = bank[selEmp];
        const basic = s?.lines.find((l) => l.code === 'BASIC')?.value || 0;
        const gross = (s?.lines || []).filter((l) => l.kind === 'earning').reduce((t, l) => t + (l.calc === 'percent_of_basic' ? (basic * l.value) / 100 : l.value), 0);
        return (
          <div className="space-y-4">
            <div className={card}>{EmpPicker}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={card}>
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm text-slate-900 dark:text-white">Bank details</h3><button className={btnGhost} onClick={() => setModal('bank')}>{b ? 'Update' : 'Add'}</button></div>
                {b ? <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300"><div>Holder: <b>{b.holderName}</b></div><div>Bank: {b.bankName} {b.branch ? `(${b.branch})` : ''}</div><div>Account: XXXX{b.accountNumber.slice(-4)}</div><div>IFSC: {b.ifsc}</div></div> : <p className="text-xs text-rose-500">No bank details. Payroll will show an exception.</p>}
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm text-slate-900 dark:text-white">Current salary structure</h3><button className={btnPrimary} onClick={() => setModal('structure')}>{history.length ? 'Revise' : 'Set structure'}</button></div>
                {!history.length && <p className="text-[11px] text-amber-600 mb-2">Using the salary saved on the employee profile. Click "Set structure" to save it here.</p>}
                <table className="w-full"><tbody>{s?.lines.map((l) => (
                  <tr key={l.code} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{l.name}</td><td className={td}>{l.kind}</td><td className={`${td} text-right`}>{l.calc === 'percent_of_basic' ? `${l.value}% of basic` : inr(l.value)}</td><td className={td}>{l.prorate ? 'by attendance' : 'fixed'}</td></tr>))}</tbody></table>
                <p className="text-xs mt-2 text-slate-600 dark:text-slate-300">Full-month gross: <b>{inr(gross)}</b> | PF {s?.pfApplicable ? 'on' : 'off'} | ESI {s?.esiApplicable ? 'on' : 'off'} | PT {s?.ptApplicable ? 'on' : 'off'} | TDS {inr(s?.monthlyTds)}/month</p>
                {history.length > 1 && <p className="text-[11px] text-slate-400 mt-1">Earlier versions: {history.slice(1).map((h) => fmtDate(h.effectiveFrom)).join(', ')}</p>}
              </div>
            </div>
            {modal === 'bank' && <BankModal initial={b} name={emp(selEmp)?.name || ''} onClose={() => setModal(null)} onSave={(v) => {
              setBank((p) => ({ ...p, [selEmp]: { ...v, employeeId: selEmp } })); tick(selEmp, 'Bank details added');
              logAudit('BANK_DETAILS_SAVED', selEmp, `IFSC ${v.ifsc}, a/c XXXX${v.accountNumber.slice(-4)}`); setModal(null);
            }} />}
            {modal === 'structure' && s && <StructureModal initial={s} onClose={() => setModal(null)} onSave={(v) => {
              setStructures((p) => [...p, { ...v, id: `sal-${Date.now()}`, employeeId: selEmp, createdAt: localDate() }]);
              const bs = v.lines.find((l) => l.code === 'BASIC')?.value || 0;
              const pick = (c: string) => v.lines.find((l) => l.code === c)?.value || 0;
              updateEmployee(selEmp, { salary: { basic: bs, hra: pick('HRA'), allowances: pick('ALLOW') + pick('ATTALLOW') + pick('TRANSPORT') + pick('MEAL'), incentives: pick('INCENTIVE') + pick('PERFBONUS'), bonus: pick('BONUS'), deductions: pick('OTHERDED'), netSalary: v.lines.filter((l) => l.kind === 'earning').reduce((t, l) => t + (l.calc === 'percent_of_basic' ? (bs * l.value) / 100 : l.value), 0) - v.lines.filter((l) => l.kind === 'deduction').reduce((t, l) => t + l.value, 0) } });
              tick(selEmp, 'Salary structure set'); logAudit('SALARY_STRUCTURE_SAVED', selEmp, `effective ${v.effectiveFrom}`); setModal(null);
            }} />}
          </div>
        );
      })()}

      {/* ---------------- ATTENDANCE FINALISATION ---------------- */}
      {tab === 'attendance' && (() => {
        const rows = activeEmployees.map((e) => ({ e, r: monthRow(e.id, ym.y, ym.m) }));
        const allFinal = rows.every((x) => x.r.status === 'finalised');
        return (
          <div className="space-y-4">
            <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              {MonthPicker}
              {!allFinal ? <button className={btnGood} onClick={() => finaliseMonth(ym.y, ym.m)}>Finalise & lock month</button> : <Badge v="finalised" />}
            </div>
            <div className={card}>
              <p className="text-[11px] text-slate-500 mb-2">Payable days = working days - unpaid days. Unpaid days = absences, leave without balance, half days (0.5), every {rules.latesPerHalfDay || '-'} late marks (0.5), and working days with no attendance record. Payroll uses only finalised months.</p>
              <table className="w-full"><thead><tr>{['Employee', 'Working', 'Present', 'Half days', 'Paid leave', 'Late marks', 'Unpaid', 'Payable', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>{rows.map(({ e, r }) => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className={td}>{e.name}</td><td className={td}>{r.workingDays}</td><td className={td}>{r.presentDays}</td><td className={td}>{r.halfDays}</td><td className={td}>{r.paidLeaveDays}</td>
                    <td className={td}>{r.lateMarks}</td><td className={`${td} text-rose-600 font-bold`}>{r.unpaidDays}</td><td className={`${td} font-bold`}>{r.payableDays}</td><td className={td}><Badge v={r.status} /></td>
                    <td className={td}>{r.status === 'finalised'
                      ? <button className={btnGhost} onClick={() => reopenMonth(e.id, ym.y, ym.m)}>Reopen</button>
                      : <button className={btnGhost} onClick={() => fillMissing(e.id, ym.y, ym.m)}>Mark missing days present</button>}</td>
                  </tr>))}</tbody></table>
            </div>
          </div>
        );
      })()}

      {/* ---------------- PAYROLL ---------------- */}
      {tab === 'payroll' && (() => {
        const r = runFor(ym.y, ym.m);
        const sum = (k: 'gross' | 'totalDeductions' | 'net' | 'employerPf' | 'employerEsi') => round2((r?.slips || []).reduce((t, s) => t + s[k], 0));
        return (
          <div className="space-y-4">
            <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">{MonthPicker}{r && <Badge v={r.status} />}</div>
              <div className="flex flex-wrap gap-2">
                {isHR && (!r || ['calculated', 'draft'].includes(r.status) || r.needsRecalculation) && <button className={btnPrimary} onClick={() => calculateRun(ym.y, ym.m)}>{r ? 'Recalculate' : 'Calculate payroll'}</button>}
                {isHR && r && r.status === 'calculated' && <button className={btnGood} onClick={() => approveRun(r)}>Approve payroll</button>}
                {!canPay && r && ['approved', 'partially_paid'].includes(r.status) && <span className="text-[11px] text-slate-500 self-center">Approved. Salary payment is done by Finance / Owner.</span>}
                {canPay && r && ['approved', 'partially_paid'].includes(r.status) && <><button className={btnGhost} onClick={() => exportBankCsv(r)}>Bank transfer CSV</button><button className={btnGood} onClick={() => setModal('pay')}>Mark salaries paid</button></>}
                {isHR && r && ['draft', 'calculated'].includes(r.status) && <button className={btnGhost} onClick={() => setModal('adj')}>Add bonus / deduction</button>}
              </div>
            </div>
            {r?.needsRecalculation && <div className={`${card} text-xs text-rose-600 font-semibold`}>Attendance changed after this payroll was calculated. {['paid', 'partially_paid'].includes(r.status) ? 'Salaries are already paid: add the difference as an adjustment next month.' : 'Recalculate before approving.'}</div>}
            {!r ? <div className={`${card} text-xs text-slate-500`}>No payroll for {MONTH_NAMES[ym.m - 1]} {ym.y} yet. Finalise attendance for the month, then click Calculate payroll.</div> : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[['Gross', sum('gross')], ['Deductions', sum('totalDeductions')], ['Net pay', sum('net')], ['Employer PF', sum('employerPf')], ['Employer ESI', sum('employerEsi')]].map(([l, v]) => (
                    <div key={l as string} className={card}><div className="text-[11px] text-slate-500">{l}</div><div className="text-lg font-black text-slate-900 dark:text-white">{inr(v as number)}</div></div>))}
                </div>
                <div className={`${card} overflow-x-auto`}>
                  <table className="w-full"><thead><tr>{['Employee', 'Payable / working', 'Gross', 'Deductions', 'Net', 'Exceptions', 'Payment', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{r.slips.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className={td}>{emp(s.employeeId)?.name}<div className="text-[10px] text-slate-400">{s.slipNumber}</div></td>
                        <td className={td}>{s.payableDays} / {s.workingDays}</td><td className={td}>{inr(s.gross)}</td><td className={td}>{inr(s.totalDeductions)}</td>
                        <td className={`${td} font-bold`}>{inr(s.net)}</td><td className={`${td} text-rose-600`}>{s.exceptions.join(', ')}</td>
                        <td className={td}><Badge v={s.paymentStatus} />{s.paidOn && <div className="text-[10px] text-slate-400">{fmtDate(s.paidOn)} {s.paymentRef}</div>}</td>
                        <td className={td}><button className={btnGhost} onClick={() => printSlip(r, s)}>Payslip</button></td>
                      </tr>))}</tbody></table>
                </div>
                {r.adjustments.length > 0 && <div className={card}><h3 className="font-bold text-xs mb-2">Adjustments this month</h3>{r.adjustments.map((a) => (
                  <div key={a.id} className="flex justify-between text-xs py-1 border-t border-slate-100 dark:border-slate-800"><span>{emp(a.employeeId)?.name} - {a.name} ({a.kind})</span><span className="flex gap-2">{inr(a.amount)}
                    {['draft', 'calculated'].includes(r.status) && <button className="text-rose-600" onClick={() => updateRun(r.id, (x) => ({ ...x, adjustments: x.adjustments.filter((y) => y.id !== a.id), needsRecalculation: true }))}>remove</button>}</span></div>))}</div>}
              </>
            )}
            {modal === 'adj' && r && <AdjustmentModal employees={activeEmployees} onClose={() => setModal(null)} onSave={(a) => { updateRun(r.id, (x) => ({ ...x, adjustments: [...x.adjustments, { ...a, id: `adj-${Date.now()}` }], needsRecalculation: true })); setModal(null); }} />}
            {modal === 'pay' && r && <PayModal slips={r.slips.filter((s) => s.paymentStatus !== 'paid')} name={(id) => emp(id)?.name || ''} onClose={() => setModal(null)} onSave={(ids, mode, ref, hold) => { paySlips(r, ids, mode, ref, hold); setModal(null); }} />}
          </div>
        );
      })()}

      {/* ---------------- SETTINGS ---------------- */}
      {tab === 'settings' && <SettingsPanel statutory={statutory} setStatutory={setStatutory} rules={rules} setRules={setRules} />}

      {/* ---------------- MY PAYSLIPS ---------------- */}
      {tab === 'my_payslips' && (() => {
        const mine = runs.filter((r) => ['approved', 'partially_paid', 'paid'].includes(r.status)).flatMap((r) => r.slips.filter((s) => s.employeeId === currentUser.id).map((s) => ({ r, s })))
          .sort((a, b) => b.r.year - a.r.year || b.r.month - a.r.month);
        return (
          <div className={card}>
            {mine.length === 0 ? <p className="text-xs text-slate-500">No payslips yet. Payslips appear here after HR approves the monthly payroll.</p> : (
              <table className="w-full"><thead><tr>{['Month', 'Payable days', 'Gross', 'Deductions', 'Net pay', 'Payment', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>{mine.map(({ r, s }) => (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className={td}>{MONTH_NAMES[r.month - 1]} {r.year}</td><td className={td}>{s.payableDays} / {s.workingDays}</td><td className={td}>{inr(s.gross)}</td>
                    <td className={td}>{inr(s.totalDeductions)}</td><td className={`${td} font-bold`}>{inr(s.net)}</td><td className={td}><Badge v={s.paymentStatus} /></td>
                    <td className={td}><button className={btnGhost} onClick={() => printSlip(r, s)}>Download PDF</button></td>
                  </tr>))}</tbody></table>
            )}
          </div>
        );
      })()}
    </div>
  );
};

// ---------------- Modals ----------------
const UploadDocModal: React.FC<{ onClose: () => void; onSave: (docType: string, f: File) => Promise<void> }> = ({ onClose, onSave }) => {
  const [docType, setDocType] = useState('ID proof');
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  return (
    <Modal title="Upload employee document" onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Document type"><select className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value)}>
          {['ID proof', 'Address proof', 'PAN card', 'Aadhaar card', 'Education certificate', 'Previous payslips', 'Relieving letter', 'Photo', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="File (PDF or image, max 10 MB)"><input type="file" accept=".pdf,image/*,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs" /></Field>
      </div>
      {err && <p className="text-rose-600 text-xs mt-2">{err}</p>}
      <div className="flex justify-end mt-4"><button className={btnPrimary} disabled={!file} onClick={async () => { try { await onSave(docType, file!); } catch (e: any) { setErr(e.message); } }}>Upload</button></div>
    </Modal>
  );
};

const ContractModal: React.FC<{ employee: Employee; designation?: string; companyName: string; onClose: () => void; onSave: (c: Omit<EmploymentContract, 'id' | 'employeeId' | 'version' | 'status' | 'createdAt'>) => void }> = ({ employee, designation, companyName, onClose, onSave }) => {
  const [type, setType] = useState<ContractType>('Offer Letter');
  const [ctc, setCtc] = useState(String(((employee.salary?.basic || 0) + (employee.salary?.hra || 0) + (employee.salary?.allowances || 0)) * 12));
  const [startDate, setStart] = useState(employee.joiningDate || localDate());
  const [endDate, setEnd] = useState('');
  const [body, setBody] = useState(TEMPLATES['Offer Letter']);
  const merged = body
    .replace(/{{name}}/g, employee.name).replace(/{{designation}}/g, designation || '').replace(/{{company}}/g, companyName)
    .replace(/{{joiningDate}}/g, fmtDate(employee.joiningDate)).replace(/{{ctc}}/g, inr(Number(ctc) || 0)).replace(/{{employeeCode}}/g, employee.employeeId);
  return (
    <Modal title={`Generate letter for ${employee.name}`} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Type"><select className={inputCls} value={type} onChange={(e) => { const t = e.target.value as ContractType; setType(t); setBody(TEMPLATES[t]); }}>{Object.keys(TEMPLATES).map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Annual CTC"><input className={inputCls} type="number" value={ctc} onChange={(e) => setCtc(e.target.value)} /></Field>
        <Field label="Start date"><input className={inputCls} type="date" value={startDate} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End date (fixed-term only)"><input className={inputCls} type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} /></Field>
        <Field label="Text (merge fields: {{name}} {{designation}} {{joiningDate}} {{ctc}} {{company}} {{employeeCode}})" wide><textarea rows={9} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
      </div>
      <div className="flex justify-end mt-4"><button className={btnPrimary} onClick={() => onSave({ type, title: type, body: merged, ctcAnnual: Number(ctc) || undefined, startDate, endDate: endDate || undefined })}>Save as new version</button></div>
    </Modal>
  );
};

const BankModal: React.FC<{ initial?: BankDetails; name: string; onClose: () => void; onSave: (b: BankDetails) => void }> = ({ initial, name, onClose, onSave }) => {
  const [f, setF] = useState<BankDetails>(initial || { employeeId: '', holderName: name, bankName: '', accountNumber: '', ifsc: '', branch: '' });
  const [err, setErr] = useState('');
  const set = (k: keyof BankDetails, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title="Bank details" onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Account holder"><input className={inputCls} value={f.holderName} onChange={(e) => set('holderName', e.target.value)} /></Field>
        <Field label="Bank name"><input className={inputCls} value={f.bankName} onChange={(e) => set('bankName', e.target.value)} /></Field>
        <Field label="Account number"><input className={inputCls} value={f.accountNumber} onChange={(e) => set('accountNumber', e.target.value.replace(/\s/g, ''))} /></Field>
        <Field label="IFSC"><input className={inputCls} value={f.ifsc} onChange={(e) => set('ifsc', e.target.value.toUpperCase())} /></Field>
        <Field label="Branch"><input className={inputCls} value={f.branch || ''} onChange={(e) => set('branch', e.target.value)} /></Field>
      </div>
      {err && <p className="text-rose-600 text-xs mt-2">{err}</p>}
      <div className="flex justify-end mt-4"><button className={btnPrimary} onClick={() => {
        if (!f.holderName || !f.bankName) return setErr('Holder name and bank name are required.');
        if (!/^\d{6,20}$/.test(f.accountNumber)) return setErr('Account number must be 6 to 20 digits.');
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc)) return setErr('IFSC must look like SBIN0001234.');
        onSave(f);
      }}>Save</button></div>
    </Modal>
  );
};

const StructureModal: React.FC<{ initial: SalaryStructure; onClose: () => void; onSave: (s: Omit<SalaryStructure, 'id' | 'employeeId' | 'createdAt'>) => void }> = ({ initial, onClose, onSave }) => {
  const [lines, setLines] = useState<SalaryLine[]>(initial.lines.map((l) => ({ ...l })));
  const [meta, setMeta] = useState({ effectiveFrom: localDate(), pfApplicable: initial.pfApplicable, esiApplicable: initial.esiApplicable, ptApplicable: initial.ptApplicable, monthlyTds: initial.monthlyTds });
  const [err, setErr] = useState('');
  const upd = (i: number, k: keyof SalaryLine, v: any) => setLines((p) => p.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <Modal title="Salary structure (saves a new version)" onClose={onClose}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3 text-xs">
        <Field label="Effective from"><input className={inputCls} type="date" value={meta.effectiveFrom} onChange={(e) => setMeta({ ...meta, effectiveFrom: e.target.value })} /></Field>
        <Field label="Monthly TDS"><input className={inputCls} type="number" value={meta.monthlyTds} onChange={(e) => setMeta({ ...meta, monthlyTds: Number(e.target.value) })} /></Field>
        {(['pfApplicable', 'esiApplicable', 'ptApplicable'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 mt-5"><input type="checkbox" checked={meta[k]} onChange={(e) => setMeta({ ...meta, [k]: e.target.checked })} />{k.replace('Applicable', '').toUpperCase()} applies</label>))}
      </div>
      <table className="w-full"><thead><tr>{['Code', 'Name', 'Type', 'Calculation', 'Value', 'By attendance', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{lines.map((l, i) => (
          <tr key={i}>
            <td className="p-1"><input className={inputCls} value={l.code} disabled={l.code === 'BASIC'} onChange={(e) => upd(i, 'code', e.target.value.toUpperCase().replace(/\s/g, ''))} /></td>
            <td className="p-1"><input className={inputCls} value={l.name} onChange={(e) => upd(i, 'name', e.target.value)} /></td>
            <td className="p-1"><select className={inputCls} value={l.kind} onChange={(e) => upd(i, 'kind', e.target.value)}><option value="earning">Earning</option><option value="deduction">Deduction</option></select></td>
            <td className="p-1"><select className={inputCls} value={l.calc} onChange={(e) => upd(i, 'calc', e.target.value)}><option value="fixed">Fixed amount</option><option value="percent_of_basic">% of basic</option></select></td>
            <td className="p-1"><input className={inputCls} type="number" value={l.value} onChange={(e) => upd(i, 'value', Number(e.target.value))} /></td>
            <td className="p-1 text-center"><input type="checkbox" checked={l.prorate} onChange={(e) => upd(i, 'prorate', e.target.checked)} /></td>
            <td className="p-1">{l.code !== 'BASIC' && <button className={btnGhost} onClick={() => setLines((p) => p.filter((_, j) => j !== i))}>x</button>}</td>
          </tr>))}</tbody></table>
      <button className={`${btnGhost} mt-2`} onClick={() => setLines((p) => [...p, { code: `ITEM${p.length}`, name: '', kind: 'earning', calc: 'fixed', value: 0, prorate: true }])}>Add component</button>
      <p className="text-[11px] text-slate-500 mt-2">PF, ESI, Professional Tax and TDS are calculated automatically from Payroll Settings. Do not add them here.</p>
      {err && <p className="text-rose-600 text-xs mt-2">{err}</p>}
      <div className="flex justify-end mt-4"><button className={btnPrimary} onClick={() => {
        if (lines.some((l) => !l.code || !l.name)) return setErr('Every component needs a code and a name.');
        if (lines.some((l) => ['PF', 'ESI', 'PT', 'TDS', 'ADJ'].includes(l.code))) return setErr('PF, ESI, PT, TDS and ADJ are reserved codes.');
        if (new Set(lines.map((l) => l.code)).size !== lines.length) return setErr('Component codes must be unique.');
        onSave({ ...meta, lines });
      }}>Save structure</button></div>
    </Modal>
  );
};

const AdjustmentModal: React.FC<{ employees: Employee[]; onClose: () => void; onSave: (a: { employeeId: string; name: string; kind: 'earning' | 'deduction'; amount: number }) => void }> = ({ employees, onClose, onSave }) => {
  const [a, setA] = useState({ employeeId: employees[0]?.id || '', name: '', kind: 'earning' as 'earning' | 'deduction', amount: 0 });
  return (
    <Modal title="One-time bonus or deduction" onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Employee"><select className={inputCls} value={a.employeeId} onChange={(e) => setA({ ...a, employeeId: e.target.value })}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
        <Field label="Type"><select className={inputCls} value={a.kind} onChange={(e) => setA({ ...a, kind: e.target.value as any })}><option value="earning">Earning (bonus, incentive, arrears)</option><option value="deduction">Deduction (advance recovery, other)</option></select></Field>
        <Field label="Description"><input className={inputCls} value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} /></Field>
        <Field label="Amount"><input className={inputCls} type="number" value={a.amount} onChange={(e) => setA({ ...a, amount: Number(e.target.value) })} /></Field>
      </div>
      <div className="flex justify-end mt-4"><button className={btnPrimary} disabled={!a.name || a.amount <= 0} onClick={() => onSave(a)}>Add (then recalculate)</button></div>
    </Modal>
  );
};

const PayModal: React.FC<{ slips: PayrollSlip[]; name: (id: string) => string; onClose: () => void; onSave: (ids: string[], mode: string, ref: string, hold: boolean) => void }> = ({ slips, name, onClose, onSave }) => {
  const [sel, setSel] = useState<string[]>(slips.filter((s) => s.paymentStatus === 'pending').map((s) => s.id));
  const [mode, setMode] = useState('Bank Transfer');
  const [ref, setRef] = useState('');
  return (
    <Modal title="Record salary payment" onClose={onClose}>
      <div className="space-y-1 max-h-60 overflow-y-auto mb-3">{slips.map((s) => (
        <label key={s.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={sel.includes(s.id)} onChange={(e) => setSel((p) => e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id))} />{name(s.employeeId)} - {inr(s.net)} <Badge v={s.paymentStatus} /></label>))}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Mode"><select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value)}>{['Bank Transfer', 'UPI', 'Cheque', 'Cash'].map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Reference / UTR"><input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnGhost} disabled={!sel.length} onClick={() => onSave(sel, mode, ref, true)}>Put on hold</button>
        <button className={btnGood} disabled={!sel.length} onClick={() => onSave(sel, mode, ref, false)}>Mark {sel.length} paid</button>
      </div>
    </Modal>
  );
};

const SettingsPanel: React.FC<{ statutory: StatutorySettings; setStatutory: (s: StatutorySettings) => void; rules: PayrollRules; setRules: (r: PayrollRules) => void }> = ({ statutory, setStatutory, rules, setRules }) => {
  const [s, setS] = useState(statutory);
  const [r, setR] = useState(rules);
  const [hol, setHol] = useState({ date: '', name: '' });
  const num = (v: string) => Number(v) || 0;
  const slabs = useMemo(() => s.ptSlabs, [s.ptSlabs]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={card}>
        <h3 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Statutory deductions</h3>
        <p className="text-[11px] text-rose-600 mb-3">Confirm current PF, ESI and Professional Tax rates with your CA before turning these on.</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.pfEnabled} onChange={(e) => setS({ ...s, pfEnabled: e.target.checked })} />PF enabled</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.pfApplyCeiling} onChange={(e) => setS({ ...s, pfApplyCeiling: e.target.checked })} />Apply PF wage ceiling</label>
          <Field label="Employee PF %"><input className={inputCls} type="number" value={s.pfRate} onChange={(e) => setS({ ...s, pfRate: num(e.target.value) })} /></Field>
          <Field label="Employer PF %"><input className={inputCls} type="number" value={s.pfEmployerRate} onChange={(e) => setS({ ...s, pfEmployerRate: num(e.target.value) })} /></Field>
          <Field label="PF wage ceiling"><input className={inputCls} type="number" value={s.pfWageCeiling} onChange={(e) => setS({ ...s, pfWageCeiling: num(e.target.value) })} /></Field>
          <span />
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.esiEnabled} onChange={(e) => setS({ ...s, esiEnabled: e.target.checked })} />ESI enabled</label>
          <Field label="ESI gross wage limit"><input className={inputCls} type="number" value={s.esiWageLimit} onChange={(e) => setS({ ...s, esiWageLimit: num(e.target.value) })} /></Field>
          <Field label="Employee ESI %"><input className={inputCls} type="number" value={s.esiEmployeeRate} onChange={(e) => setS({ ...s, esiEmployeeRate: num(e.target.value) })} /></Field>
          <Field label="Employer ESI %"><input className={inputCls} type="number" value={s.esiEmployerRate} onChange={(e) => setS({ ...s, esiEmployerRate: num(e.target.value) })} /></Field>
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.ptEnabled} onChange={(e) => setS({ ...s, ptEnabled: e.target.checked })} />Professional Tax enabled</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.tdsEnabled} onChange={(e) => setS({ ...s, tdsEnabled: e.target.checked })} />TDS enabled (monthly amount per employee)</label>
        </div>
        <h4 className="font-bold text-xs mt-4 mb-1">Professional Tax slabs (monthly gross)</h4>
        {slabs.map((p, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 mb-1">
            <input className={inputCls} type="number" placeholder="From" value={p.min} onChange={(e) => setS({ ...s, ptSlabs: slabs.map((x, j) => j === i ? { ...x, min: num(e.target.value) } : x) })} />
            <input className={inputCls} type="number" placeholder="To (blank = no limit)" value={p.max ?? ''} onChange={(e) => setS({ ...s, ptSlabs: slabs.map((x, j) => j === i ? { ...x, max: e.target.value === '' ? null : num(e.target.value) } : x) })} />
            <input className={inputCls} type="number" placeholder="PT" value={p.amount} onChange={(e) => setS({ ...s, ptSlabs: slabs.map((x, j) => j === i ? { ...x, amount: num(e.target.value) } : x) })} />
            <input className={inputCls} type="number" placeholder="February" value={p.febAmount ?? ''} onChange={(e) => setS({ ...s, ptSlabs: slabs.map((x, j) => j === i ? { ...x, febAmount: e.target.value === '' ? undefined : num(e.target.value) } : x) })} />
            <button className={btnGhost} onClick={() => setS({ ...s, ptSlabs: slabs.filter((_, j) => j !== i) })}>x</button>
          </div>))}
        <button className={`${btnGhost} mt-1`} onClick={() => setS({ ...s, ptSlabs: [...slabs, { min: 0, max: null, amount: 0 }] })}>Add slab</button>
        <div className="flex justify-end mt-4"><button className={btnPrimary} onClick={() => { setStatutory(s); alert('Saved'); }}>Save statutory settings</button></div>
      </div>
      <div className={card}>
        <h3 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Working days & holidays</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Working days basis"><select className={inputCls} value={r.workingDaysBasis} onChange={(e) => setR({ ...r, workingDaysBasis: e.target.value as any })}>
            <option value="fixed">Fixed number of days</option><option value="calendar">Calendar days in month</option><option value="calendar_minus_offs">Calendar days minus offs & holidays</option></select></Field>
          <Field label="Fixed working days"><input className={inputCls} type="number" value={r.fixedWorkingDays} onChange={(e) => setR({ ...r, fixedWorkingDays: num(e.target.value) })} /></Field>
          <Field label="Late marks per half-day cut (0 = off)"><input className={inputCls} type="number" value={r.latesPerHalfDay} onChange={(e) => setR({ ...r, latesPerHalfDay: num(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 mt-5"><input type="checkbox" checked={r.includeReimbursements} onChange={(e) => setR({ ...r, includeReimbursements: e.target.checked })} />Pay approved reimbursements with salary</label>
          <Field label="Weekly offs" wide><div className="flex gap-2 flex-wrap">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <label key={d} className="flex items-center gap-1"><input type="checkbox" checked={r.weeklyOffs.includes(i)} onChange={(e) => setR({ ...r, weeklyOffs: e.target.checked ? [...r.weeklyOffs, i] : r.weeklyOffs.filter((x) => x !== i) })} />{d}</label>))}</div></Field>
        </div>
        <h4 className="font-bold text-xs mt-4 mb-1">Holidays</h4>
        <div className="flex gap-2 mb-2"><input className={inputCls} type="date" value={hol.date} onChange={(e) => setHol({ ...hol, date: e.target.value })} /><input className={inputCls} placeholder="Holiday name" value={hol.name} onChange={(e) => setHol({ ...hol, name: e.target.value })} />
          <button className={btnGhost} disabled={!hol.date || !hol.name} onClick={() => { setR({ ...r, holidays: [...r.holidays, hol].sort((a, b) => a.date.localeCompare(b.date)) }); setHol({ date: '', name: '' }); }}>Add</button></div>
        {r.holidays.map((h) => <div key={h.date} className="flex justify-between text-xs py-1 border-t border-slate-100 dark:border-slate-800"><span>{fmtDate(h.date)} - {h.name}</span><button className="text-rose-600" onClick={() => setR({ ...r, holidays: r.holidays.filter((x) => x.date !== h.date) })}>remove</button></div>)}
        <div className="flex justify-end mt-4"><button className={btnPrimary} onClick={() => { setRules(r); alert('Saved'); }}>Save working-day rules</button></div>
      </div>
    </div>
  );
};
