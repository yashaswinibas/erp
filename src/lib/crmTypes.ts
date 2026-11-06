// AgencyOS v2 Part 3: quotation extras, agreements, installments, SOW, templates, GPS.
import { StoredFile } from './hrTypes';

export interface QuotationRevision { rev: number; at: string; by: string; total: number; note: string; snapshot: string }
export interface QuotationExtra {
  quotationId: string;
  clientAddress: string;
  siteAddress: string;
  files: StoredFile[];
  paymentTerms: string;
  advancePercent: number;
  installmentCount: number;
  frequency: 'one_time' | 'monthly' | 'quarterly';
  approval: 'not_required' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNote?: string;
  revisions: QuotationRevision[];
  agreementId?: string;
  projectId?: string;
}

export interface AgreementClause { id: string; title: string; text: string }
export interface AgreementVersion { version: number; at: string; by: string; note: string; title: string; startDate: string; endDate: string; terms: string; clauses: AgreementClause[]; value: number }
export interface AgreementExtra {
  agreementId: string;
  value: number;
  clauses: AgreementClause[];
  versions: AgreementVersion[];
  signedFile?: StoredFile;
  signedOn?: string;
  autoRenew: boolean;
  remindersSent: number[];
  renewedFromId?: string;
}

export interface Installment {
  id: string; agreementId: string; clientId: string; no: number; label: string;
  dueDate: string; amount: number; invoiceId?: string;
}
export interface InstallmentPayment {
  id: string; receiptNo: string; clientId: string; date: string; amount: number;
  method: 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Card'; reference: string; notes: string;
  allocations: { installmentId: string; amount: number }[]; recordedBy: string;
}

export interface Milestone { id: string; title: string; dueDate: string; amount: number; done: boolean }
export interface SowContent {
  objectives: string; deliverables: string[]; exclusions: string; timeline: string; assumptions: string;
  milestones: Milestone[]; assignedEmployeeIds: string[];
}
export interface ScopeOfWork {
  id: string; sowNumber: string; clientId: string; projectId?: string; agreementId?: string; title: string;
  version: number; status: 'draft' | 'sent' | 'approved' | 'rejected';
  content: SowContent; history: { version: number; at: string; by: string; note: string; content: SowContent }[];
  clientApprovedBy?: string; clientApprovedOn?: string;
}

export interface TemplateTask { title: string; days: number; hours: number }
export interface ProjectTemplate { id: string; name: string; description: string; tasks: TemplateTask[]; deliverables: string[] }

export interface ProjectChange { id: string; projectId: string; field: string; oldValue: string; newValue: string; at: string; by: string }

export interface GpsPoint { lat: number; lng: number; accuracy: number; at: string }
export interface VisitGps {
  visitId: string; employeeId: string; start?: GpsPoint; end?: GpsPoint;
  distanceFromClientM?: number; withinGeofence?: boolean; error?: string; files: StoredFile[];
}
export interface ClientGeo { clientId: string; lat: number; lng: number; radiusM: number }
export interface GpsConsent { employeeId: string; granted: boolean; at: string }

export interface DealSettings { approvalThreshold: number; reminderDays: number[] }
export const DEFAULT_DEAL_SETTINGS: DealSettings = { approvalThreshold: 100000, reminderDays: [30, 15, 7] };
