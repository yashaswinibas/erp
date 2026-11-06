export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'hr'
  | 'manager'
  | 'project_manager'
  | 'employee'
  | 'finance';

export type WorkMode = 'office' | 'wfh' | 'field' | 'client_site';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'late'
  | 'leave'
  | 'holiday'
  | 'week_off'
  | 'wfh'
  | 'field_visit'
  | 'on_duty';

export interface CompanyConfig {
  name: string;
  tagline: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  currency: string;
  timeZone: string;
  officeStartTime: string; // e.g. "09:30"
  officeEndTime: string;   // e.g. "18:30"
  graceMinutes: number;    // e.g. 15
  minWorkingHoursFullDay: number; // e.g. 8.0
  minWorkingHoursHalfDay: number; // e.g. 4.0
  logoUrl: string;
  stampUrl: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headEmployeeId?: string;
  employeeCount?: number;
  description?: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  level: string;
  description?: string;
}

export interface Employee {
  id: string;
  employeeId: string; // e.g. "PAA-EMP-101"
  name: string;
  email: string;
  phone: string;
  phone2?: string; // Mobile 2 / Alternate / WhatsApp
  photo?: string;
  dateOfBirth: string;
  joiningDate: string;
  departmentId: string;
  designationId: string;
  employmentType: 'Full-time' | 'Contract' | 'Probation' | 'Intern';
  reportingManagerId?: string;
  projectManagerId?: string;
  hrId?: string;
  assignedProjectIds: string[];
  assignedClientId?: string;
  salary: {
    basic: number;
    hra: number;
    allowances: number;
    incentives: number;
    bonus: number;
    deductions: number;
    netSalary: number;
  };
  workLocation: string;
  workMode: WorkMode;
  skills: string[];
  experienceYears: number;
  role: UserRole;
  status: 'active' | 'inactive' | 'on_leave';
}

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Privilege Leave' | 'Compensatory Off';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  leaveCode: string; // e.g. "PAA-LEV-041"
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  halfDayType?: 'first_half' | 'second_half';
  reason: string;
  emergencyContact?: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
}

export interface LeaveBalance {
  employeeId: string;
  casualLeaveTotal: number;
  casualLeaveUsed: number;
  sickLeaveTotal: number;
  sickLeaveUsed: number;
  privilegeLeaveTotal: number;
  privilegeLeaveUsed: number;
  compOffTotal: number;
  compOffUsed: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  checkIn: string; // "HH:MM AM/PM" or empty
  checkOut: string; // "HH:MM AM/PM" or empty
  workingHours: number; // in hours, e.g. 8.5
  status: AttendanceStatus;
  workMode: WorkMode;
  remarks?: string;
  isRegularized?: boolean;
  regularizedBy?: string;
}

export interface AttendanceRegularizationRequest {
  id: string;
  employeeId: string;
  date: string;
  correctCheckIn: string;
  correctCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewRemarks?: string;
  reviewedBy?: string;
  requestedAt: string;
}

export interface DailyActivity {
  id: string;
  employeeId: string;
  date: string;
  projectId?: string;
  clientId?: string;
  taskId?: string;
  completedWork: string;
  workInProgress: string;
  pendingWork: string;
  hoursSpent: number;
  blockers?: string;
  remarks?: string;
  links?: string[];
  createdAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  leadCode: string; // e.g. "PAA-LD-204"
  name: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string; // Mobile 1 (Primary)
  phone2?: string; // Mobile 2 (Alternate / WhatsApp)
  source: string;
  serviceRequired: string;
  estimatedValue: number;
  status: LeadStatus;
  priority: 'low' | 'medium' | 'high';
  assignedEmployeeId: string;
  followUpDate: string;
  notes: string;
  createdAt: string;
  convertedToClientId?: string;
}

export interface Client {
  id: string;
  clientCode: string; // e.g. "PAA-CL-045"
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string; // Mobile 1 (Primary)
  phone2?: string; // Mobile 2 (Alternate / WhatsApp)
  website: string;
  address: string;
  gstNumber: string;
  billingAddress: string;
  accountManagerId: string;
  services: string[];
  status: 'active' | 'onboarding' | 'dormant';
  notes: string;
  createdAt: string;
  convertedFromLeadId?: string;
}

export type FieldVisitType =
  | 'Client Meeting'
  | 'Lead Meeting'
  | 'Sales Visit'
  | 'Project Meeting'
  | 'Site Visit'
  | 'Business Development'
  | 'Payment Collection'
  | 'Support Visit'
  | 'Vendor Meeting'
  | 'Other';

export interface FieldVisit {
  id: string;
  visitCode: string; // e.g. "PAA-VST-310"
  employeeId: string;
  date: string;
  startTime: string; // e.g. "11:15 AM"
  endTime?: string;   // e.g. "12:35 PM"
  durationMinutes?: number;
  leadId?: string;
  clientId?: string;
  companyName: string;
  contactPerson: string;
  visitType: FieldVisitType;
  purpose: string;
  meetingLocation: string;
  address: string;
  projectId?: string;
  service?: string;
  expectedOutcome: string;
  actualOutcome?: string;
  discussionSummary?: string;
  followUpRequired: boolean;
  nextFollowUpDate?: string;
  remarks?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  expensesTotal: number;
  reimbursementId?: string;
}

export type ReimbursementCategory =
  | 'Travel'
  | 'Fuel'
  | 'Food'
  | 'Hotel'
  | 'Transportation'
  | 'Parking'
  | 'Internet'
  | 'Mobile'
  | 'Office Supplies'
  | 'Client Meeting'
  | 'Software'
  | 'Other';

export interface Reimbursement {
  id: string;
  reimbursementCode: string; // e.g. "PAA-RMB-502"
  employeeId: string;
  date: string;
  category: ReimbursementCategory;
  amount: number;
  description: string;
  projectId?: string;
  clientId?: string;
  fieldVisitId?: string;
  paymentMethod: string;
  receiptName?: string;
  remarks?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  reviewedBy?: string;
  approvalRemarks?: string;
  paidDate?: string;
}

export interface Project {
  id: string;
  projectCode: string; // e.g. "PAA-PRJ-012"
  name: string;
  clientId?: string;
  projectManagerId: string;
  assignedEmployeeIds: string[];
  startDate: string;
  endDate: string;
  budget: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  description: string;
}

export interface Task {
  id: string;
  taskCode: string; // e.g. "PAA-TSK-78"
  projectId: string;
  clientId?: string;
  title: string;
  description: string;
  assignedEmployeeId: string;
  managerId: string;
  projectManagerId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "PAA-QT-2026-08"
  clientId: string;
  date: string;
  validUntil: string;
  title: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  terms: string;
  notes: string;
  createdBy: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'converted';
}

export interface Agreement {
  id: string;
  agreementNumber: string; // e.g. "PAA-AGR-2026-03"
  quotationId?: string;
  clientId: string;
  projectId?: string;
  title: string;
  startDate: string;
  endDate: string;
  terms: string;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  renewalDate?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "PAA-INV-2026-114"
  clientId: string;
  quotationId?: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface Payment {
  id: string;
  paymentCode: string; // e.g. "PAA-PAY-882"
  invoiceId: string;
  clientId: string;
  date: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Card';
  transactionRef: string;
  notes?: string;
  recordedBy: string;
}

export interface Expense {
  id: string;
  expenseCode: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  departmentId?: string;
  employeeId?: string;
  projectId?: string;
  fieldVisitId?: string;
  notes?: string;
}

export interface Payslip {
  id: string;
  payslipNumber: string; // e.g. "PAA-SLIP-2026-02-101"
  employeeId: string;
  payPeriod: string; // e.g. "February 2026"
  basicSalary: number;
  hra: number;
  allowances: number;
  incentives: number;
  bonus: number;
  grossSalary: number;
  deductions: number;
  approvedReimbursement: number;
  netPay: number;
  generatedDate: string;
  status: 'generated' | 'processed' | 'paid';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance' | 'task' | 'reimbursement' | 'field_visit' | 'payroll' | 'invoice' | 'system';
  read: boolean;
  timestamp: string;
  linkTab?: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  date: string;
  time: string;
  relatedRecord: string;
  details?: string;
}

export type DocumentType =
  | 'payslip'
  | 'reimbursement_statement'
  | 'offer_letter'
  | 'joining_letter'
  | 'experience_letter'
  | 'relieving_letter'
  | 'quotation'
  | 'agreement'
  | 'invoice'
  | 'payment_receipt'
  | 'employee_report'
  | 'client_report';
