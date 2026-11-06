// Types for HR onboarding, contracts and payroll (AgencyOS v2)

export type ChecklistOwner = 'HR' | 'IT' | 'Manager' | 'Employee';

export interface OnboardingItem {
  id: string;
  title: string;
  owner: ChecklistOwner;
  mandatory: boolean;
  done: boolean;
  doneAt?: string;
  doneBy?: string;
}

export interface OnboardingRecord {
  employeeId: string;
  items: OnboardingItem[];
  status: 'in_progress' | 'completed';
  completedAt?: string;
}

export interface StoredFile {
  fileId: string;   // key in IndexedDB
  fileName: string;
  mimeType: string;
  size: number;
}

export interface EmployeeDocument extends StoredFile {
  id: string;
  employeeId: string;
  docType: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  remarks?: string;
}

export type ContractType = 'Offer Letter' | 'Employment Contract' | 'NDA' | 'Internship Letter' | 'Increment Letter';

export interface EmploymentContract {
  id: string;
  employeeId: string;
  type: ContractType;
  version: number;
  title: string;
  body: string;
  ctcAnnual?: number;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  createdAt: string;
  signedFile?: StoredFile;
  signedAt?: string;
}

export interface BankDetails {
  employeeId: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
}

export interface SalaryLine {
  code: string;            // BASIC, HRA, CONV ...
  name: string;
  kind: 'earning' | 'deduction';
  calc: 'fixed' | 'percent_of_basic';
  value: number;
  prorate: boolean;        // reduce by unpaid days
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  effectiveFrom: string;   // YYYY-MM-DD
  lines: SalaryLine[];
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  monthlyTds: number;
  createdAt: string;
}

export interface StatutorySettings {
  pfEnabled: boolean;
  pfRate: number;
  pfEmployerRate: number;
  pfWageCeiling: number;
  pfApplyCeiling: boolean;
  esiEnabled: boolean;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  esiWageLimit: number;
  ptEnabled: boolean;
  ptSlabs: { min: number; max: number | null; amount: number; febAmount?: number }[];
  tdsEnabled: boolean;
}

export interface PayrollRules {
  workingDaysBasis: 'fixed' | 'calendar' | 'calendar_minus_offs';
  fixedWorkingDays: number;
  weeklyOffs: number[];          // 0 = Sunday
  latesPerHalfDay: number;       // 0 = off
  holidays: { date: string; name: string }[];
  includeReimbursements: boolean;
}

export interface AttendanceMonthSummary {
  employeeId: string;
  year: number;
  month: number;                 // 1-12
  workingDays: number;
  presentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidDays: number;
  lateMarks: number;
  payableDays: number;
  status: 'open' | 'finalised';
  finalisedAt?: string;
  finalisedBy?: string;
  reopenReason?: string;
}

export interface PayLine {
  code: string;
  name: string;
  kind: 'earning' | 'deduction';
  amount: number;
}

export interface PayrollSlip {
  id: string;
  slipNumber: string;
  employeeId: string;
  workingDays: number;
  payableDays: number;
  unpaidDays: number;
  lines: PayLine[];
  gross: number;
  totalDeductions: number;
  net: number;
  employerPf: number;
  employerEsi: number;
  exceptions: string[];
  paymentStatus: 'pending' | 'paid' | 'on_hold';
  paidOn?: string;
  paymentMode?: string;
  paymentRef?: string;
}

export interface PayrollRun {
  id: string;
  year: number;
  month: number;
  status: 'draft' | 'calculated' | 'approved' | 'partially_paid' | 'paid';
  needsRecalculation: boolean;
  slips: PayrollSlip[];
  adjustments: { id: string; employeeId: string; name: string; kind: 'earning' | 'deduction'; amount: number }[];
  approvedBy?: string;
  approvedAt?: string;
  calculatedAt?: string;
}
