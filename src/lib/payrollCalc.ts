// Pure payroll & attendance calculations (no React, no storage) so they can be tested.
import { round2 } from './money';
import { SalaryLine, StatutorySettings, PayLine } from './hrTypes';

export type DayKind = 'present' | 'half_day' | 'absent' | 'paid_leave' | 'unpaid_leave' | 'off';

export interface MonthInput {
  year: number;
  month: number;
  daysInMonth: number;
  days: Record<string, { kind: DayKind; late?: boolean }>;
  holidays: Set<string>;
  weeklyOffs: number[];
  basis: 'fixed' | 'calendar' | 'calendar_minus_offs';
  fixedWorkingDays: number;
  latesPerHalfDay: number;
  joiningDate?: string;
  countUntil?: string;
}

export interface MonthResult {
  workingDays: number;
  presentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidDays: number;
  lateMarks: number;
  payableDays: number;
}

export function summariseMonth(i: MonthInput): MonthResult {
  const pad = (n: number) => String(n).padStart(2, '0');
  let present = 0, half = 0, paidLeave = 0, unpaid = 0, lates = 0, calendarWorking = 0;
  for (let d = 1; d <= i.daysInMonth; d++) {
    const iso = `${i.year}-${pad(i.month)}-${pad(d)}`;
    const dow = new Date(i.year, i.month - 1, d).getDay();
    const isOff = i.weeklyOffs.includes(dow) || i.holidays.has(iso);
    if (!isOff) calendarWorking++;
    if (i.joiningDate && iso < i.joiningDate) {
      if (i.basis === 'calendar' || !isOff) unpaid += 1;
      continue;
    }
    const rec = i.days[iso];
    if (rec?.late) lates++;
    const kind = rec?.kind ?? (isOff ? 'off' : undefined);
    switch (kind) {
      case 'present': present++; break;
      case 'half_day': half++; unpaid += 0.5; break;
      case 'paid_leave': paidLeave++; break;
      case 'absent': case 'unpaid_leave': unpaid += 1; break;
      case 'off': break;
      default:
        if (!i.countUntil || iso <= i.countUntil) unpaid += 1;
    }
  }
  if (i.latesPerHalfDay > 0) unpaid += Math.floor(lates / i.latesPerHalfDay) * 0.5;
  const workingDays = i.basis === 'fixed' ? i.fixedWorkingDays : i.basis === 'calendar' ? i.daysInMonth : calendarWorking;
  const unpaidCapped = Math.min(unpaid, workingDays);
  return { workingDays, presentDays: present, halfDays: half, paidLeaveDays: paidLeave, unpaidDays: unpaidCapped, lateMarks: lates, payableDays: Math.max(0, round2(workingDays - unpaidCapped)) };
}

export interface PayslipInput {
  month: number;
  lines: SalaryLine[];
  workingDays: number;
  payableDays: number;
  statutory: StatutorySettings;
  employee: { pfApplicable: boolean; esiApplicable: boolean; ptApplicable: boolean; monthlyTds: number; hasBank: boolean };
  adjustments: { name: string; kind: 'earning' | 'deduction'; amount: number }[];
}

export interface PayslipResult {
  lines: PayLine[];
  gross: number;
  totalDeductions: number;
  net: number;
  employerPf: number;
  employerEsi: number;
  lossOfPay: number;
  exceptions: string[];
}

export function calculatePayslip(i: PayslipInput): PayslipResult {
  const exceptions: string[] = [];
  const ratio = i.workingDays > 0 ? Math.min(1, i.payableDays / i.workingDays) : 0;
  const basicLine = i.lines.find((l) => l.code === 'BASIC');
  if (!basicLine) exceptions.push('Salary structure has no BASIC component');
  const monthlyBasic = basicLine?.value ?? 0;
  const monthlyOf = (l: SalaryLine) => (l.calc === 'percent_of_basic' ? (monthlyBasic * l.value) / 100 : l.value);

  const out: PayLine[] = [];
  let fullGross = 0, earnedBasic = 0;
  for (const l of i.lines.filter((x) => x.kind === 'earning')) {
    const monthly = monthlyOf(l);
    fullGross += monthly;
    const amt = round2(l.prorate ? (monthly / (i.workingDays || 1)) * i.payableDays : monthly);
    if (l.code === 'BASIC') earnedBasic = amt;
    out.push({ code: l.code, name: l.name, kind: 'earning', amount: i.workingDays ? amt : 0 });
  }
  const earnedStructure = out.reduce((s, l) => s + l.amount, 0);
  for (const a of i.adjustments.filter((x) => x.kind === 'earning')) out.push({ code: 'ADJ', name: a.name, kind: 'earning', amount: round2(a.amount) });
  const gross = round2(out.reduce((s, l) => s + l.amount, 0));

  const s = i.statutory;
  let employerPf = 0, employerEsi = 0;
  if (s.pfEnabled && i.employee.pfApplicable) {
    const pfWage = s.pfApplyCeiling ? Math.min(earnedBasic, s.pfWageCeiling) : earnedBasic;
    const pf = Math.round((pfWage * s.pfRate) / 100);
    employerPf = Math.round((pfWage * s.pfEmployerRate) / 100);
    if (pf > 0) out.push({ code: 'PF', name: 'Provident Fund', kind: 'deduction', amount: pf });
  }
  if (s.esiEnabled && i.employee.esiApplicable && fullGross <= s.esiWageLimit) {
    const esi = Math.ceil((gross * s.esiEmployeeRate) / 100);
    employerEsi = Math.ceil((gross * s.esiEmployerRate) / 100);
    if (esi > 0) out.push({ code: 'ESI', name: 'ESI', kind: 'deduction', amount: esi });
  }
  if (s.ptEnabled && i.employee.ptApplicable) {
    const slab = s.ptSlabs.find((p) => gross >= p.min && (p.max === null || gross <= p.max));
    if (slab) {
      const pt = i.month === 2 && slab.febAmount !== undefined ? slab.febAmount : slab.amount;
      if (pt > 0) out.push({ code: 'PT', name: 'Professional Tax', kind: 'deduction', amount: pt });
    }
  }
  if (s.tdsEnabled && i.employee.monthlyTds > 0) out.push({ code: 'TDS', name: 'Income Tax (TDS)', kind: 'deduction', amount: round2(i.employee.monthlyTds) });
  for (const l of i.lines.filter((x) => x.kind === 'deduction')) {
    const amt = round2(l.prorate ? monthlyOf(l) * ratio : monthlyOf(l));
    if (amt > 0) out.push({ code: l.code, name: l.name, kind: 'deduction', amount: amt });
  }
  for (const a of i.adjustments.filter((x) => x.kind === 'deduction')) out.push({ code: 'ADJ', name: a.name, kind: 'deduction', amount: round2(a.amount) });

  const totalDeductions = round2(out.filter((l) => l.kind === 'deduction').reduce((t, l) => t + l.amount, 0));
  const net = round2(gross - totalDeductions);
  if (net < 0) exceptions.push('Net pay is negative');
  if (!i.employee.hasBank) exceptions.push('Bank details missing');
  return { lines: out, gross, totalDeductions, net, employerPf, employerEsi, lossOfPay: round2(fullGross - earnedStructure), exceptions };
}

export function countLeaveDays(fromIso: string, toIso: string, weeklyOffs: number[], holidays: Set<string>, halfDay: boolean): number {
  if (halfDay) return 0.5;
  let n = 0;
  const [y, m, d] = fromIso.split('-').map(Number);
  for (let dt = new Date(y, m - 1, d); ; dt.setDate(dt.getDate() + 1)) {
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    if (iso > toIso) break;
    if (!weeklyOffs.includes(dt.getDay()) && !holidays.has(iso)) n++;
  }
  return n;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000, r = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
