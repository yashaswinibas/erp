// AGENCYOS_FRESH_START
// AGENCYOS_V4_P25_DONE
import { homeTab } from '../lib/rbac'; // AGENCYOS_V2_PART4
import { osGuard } from '../os/osP25';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserRole,
  WorkMode,
  CompanyConfig,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceRegularizationRequest,
  DailyActivity,
  Lead,
  Client,
  FieldVisit,
  Reimbursement,
  Project,
  Task,
  Quotation,
  Agreement,
  Invoice,
  Payment,
  Expense,
  Payslip,
  NotificationItem,
  AuditLogItem,
  DocumentType,
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus
} from '../types';

import {
  INITIAL_COMPANY,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_REGULARIZATIONS,
  INITIAL_LEADS,
  INITIAL_CLIENTS,
  INITIAL_FIELD_VISITS,
  INITIAL_REIMBURSEMENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_DAILY_ACTIVITIES,
  INITIAL_QUOTATIONS,
  INITIAL_AGREEMENTS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_PAYSLIPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS
} from '../data/initialData';
import { localDate, timeToMinutes } from '../lib/dates';
// AGENCYOS_V2_PATCHED

// Bulletproof 12h & 24h time parser to avoid Invalid Date / NaN
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3]?.toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 0;
};

export const calculateTimeDiffHours = (inStr: string, outStr: string): number => {
  if (!inStr || !outStr) return 0;
  const inMins = parseTimeToMinutes(inStr);
  const outMins = parseTimeToMinutes(outStr);
  let diffMins = outMins - inMins;
  if (diffMins < 0) {
    diffMins += 24 * 60; // crossed midnight
  }
  return Number((diffMins / 60).toFixed(2));
};

interface DocumentPreviewState {
  isOpen: boolean;
  docType: DocumentType;
  title: string;
  data: any;
}

interface AppContextType {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Company
  company: CompanyConfig;
  updateCompany: (updates: Partial<CompanyConfig>) => void;

  // Auth & Roles
  currentUser: Employee;
  currentRole: UserRole;
  switchUser: (employeeId: string) => void;
  switchRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;

  // Navigation / Active View
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Data Collections
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  attendance: AttendanceRecord[];
  regularizations: AttendanceRegularizationRequest[];
  dailyActivities: DailyActivity[];
  leads: Lead[];
  clients: Client[];
  fieldVisits: FieldVisit[];
  reimbursements: Reimbursement[];
  projects: Project[];
  tasks: Task[];
  quotations: Quotation[];
  agreements: Agreement[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  payslips: Payslip[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];

  // Leave Management Actions
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  applyLeave: (req: Omit<LeaveRequest, 'id' | 'leaveCode' | 'status' | 'appliedAt'>) => void;
  reviewLeave: (leaveId: string, status: LeaveStatus, remarks?: string) => void;
  cancelLeave: (leaveId: string) => void;

  // Attendance Actions
  todayAttendance: AttendanceRecord | undefined;
  checkInAttendance: (workMode?: WorkMode, remarks?: string) => void;
  checkOutAttendance: () => void;
  resetAttendanceShift: (employeeId?: string) => void;
  updateEmployeeAttendanceStatus: (employeeId: string, status: AttendanceStatus, workMode?: WorkMode) => void;
  requestAttendanceRegularization: (data: Omit<AttendanceRegularizationRequest, 'id' | 'employeeId' | 'status' | 'requestedAt'>) => void;
  reviewRegularization: (requestId: string, status: 'approved' | 'rejected', remarks?: string) => void;

  // Field Force Actions
  activeFieldVisit: FieldVisit | undefined;
  startFieldVisit: (data: Omit<FieldVisit, 'id' | 'visitCode' | 'employeeId' | 'date' | 'startTime' | 'status' | 'expensesTotal'>) => void;
  endFieldVisit: (visitId: string, outcomeData: { actualOutcome: string; discussionSummary?: string; followUpRequired: boolean; nextFollowUpDate?: string; remarks?: string }) => void;
  addExpenseToFieldVisit: (visitId: string, expense: { category: Reimbursement['category']; amount: number; description: string; paymentMethod: string }) => void;

  // General Entity Operations
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  addDesignation: (desig: Omit<Designation, 'id'>) => void;
  addDailyActivity: (activity: Omit<DailyActivity, 'id' | 'createdAt'>) => void;
  addLead: (lead: Omit<Lead, 'id' | 'leadCode' | 'createdAt'>) => void;
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  convertLeadToClient: (leadId: string) => void;
  addClient: (client: Omit<Client, 'id' | 'clientCode' | 'createdAt'>) => void;
  addProject: (project: Omit<Project, 'id' | 'projectCode'>) => Project;
  addTask: (task: Omit<Task, 'id' | 'taskCode'>) => Task;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addReimbursement: (reimbursement: Omit<Reimbursement, 'id' | 'reimbursementCode' | 'status'>) => void;
  reviewReimbursement: (id: string, status: Reimbursement['status'], remarks?: string) => void;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber'>) => void;
  acceptQuotation: (id: string) => void;
  addAgreement: (agreement: Omit<Agreement, 'id' | 'agreementNumber'>) => Agreement;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  updateAgreement: (id: string, updates: Partial<Agreement>) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'paymentCode'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'expenseCode'>) => void;
  generatePayslipForEmployee: (employeeId: string, payPeriod: string) => void;
  markNotificationAsRead: (id: string) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  notify: (title: string, message: string, type: NotificationItem['type'], linkTab?: string) => void;
  logAudit: (action: string, relatedRecord: string, details?: string) => void;
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;

  // Document Modal Preview
  docPreview: DocumentPreviewState;
  openDocument: (docType: DocumentType, title: string, data: any) => void;
  closeDocument: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('paa_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // modern dark default for productivity dashboard
  });

  useEffect(() => {
    localStorage.setItem('paa_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active view state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem('paa_x_session'));

  // Entities state
  const [company, setCompany] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('paa_company');
    const c = saved ? JSON.parse(saved) : INITIAL_COMPANY;
    if (!c.logoUrl || String(c.logoUrl).includes('/assets/aistudio/')) c.logoUrl = '/logo.png';
    return c;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('paa_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('paa_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [designations, setDesignations] = useState<Designation[]>(() => {
    const saved = localStorage.getItem('paa_designations');
    return saved ? JSON.parse(saved) : INITIAL_DESIGNATIONS;
  });

  // Current logged in user & role
  const [currentUserId, setCurrentUserId] = useState<string>(() => { try { return JSON.parse(sessionStorage.getItem('paa_x_session') || 'null')?.userId || 'emp-1'; } catch { return 'emp-1'; } }); // Ningappa B. (Super Admin) by default
  const currentUser = employees.find(e => e.id === currentUserId) || employees[0];
  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser.role);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('paa_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [regularizations, setRegularizations] = useState<AttendanceRegularizationRequest[]>(() => {
    const saved = localStorage.getItem('paa_regularizations');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>(() => {
    const saved = localStorage.getItem('paa_daily_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('paa_leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('paa_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>(() => {
    const saved = localStorage.getItem('paa_field_visits');
    return saved ? JSON.parse(saved) : [];
  });

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>(() => {
    const saved = localStorage.getItem('paa_reimbursements');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('paa_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('paa_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('paa_quotations');
    return saved ? JSON.parse(saved) : [];
  });

  const [agreements, setAgreements] = useState<Agreement[]>(() => {
    const saved = localStorage.getItem('paa_agreements');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('paa_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('paa_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('paa_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    const saved = localStorage.getItem('paa_payslips');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('paa_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('paa_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('paa_leave_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() => {
    const saved = localStorage.getItem('paa_leave_balances');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_BALANCES;
  });

  // Document modal preview
  const [docPreview, setDocPreview] = useState<DocumentPreviewState>({
    isOpen: false,
    docType: 'payslip',
    title: 'Document Preview',
    data: null
  });

  const openDocument = (docType: DocumentType, title: string, data: any) => {
    setDocPreview({
      isOpen: true,
      docType,
      title,
      data
    });
  };

  const closeDocument = () => {
    setDocPreview(prev => ({ ...prev, isOpen: false }));
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('paa_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('paa_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('paa_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('paa_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('paa_field_visits', JSON.stringify(fieldVisits));
  }, [fieldVisits]);

  useEffect(() => {
    localStorage.setItem('paa_reimbursements', JSON.stringify(reimbursements));
  }, [reimbursements]);

  useEffect(() => {
    localStorage.setItem('paa_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('paa_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('paa_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('paa_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('paa_payslips', JSON.stringify(payslips));
  }, [payslips]);

  useEffect(() => {
    localStorage.setItem('paa_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('paa_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('paa_leave_balances', JSON.stringify(leaveBalances));
  }, [leaveBalances]);

  useEffect(() => { localStorage.setItem('paa_regularizations', JSON.stringify(regularizations)); }, [regularizations]);
  useEffect(() => { localStorage.setItem('paa_daily_activities', JSON.stringify(dailyActivities)); }, [dailyActivities]);
  useEffect(() => { localStorage.setItem('paa_agreements', JSON.stringify(agreements)); }, [agreements]);
  useEffect(() => { localStorage.setItem('paa_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('paa_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('paa_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('paa_designations', JSON.stringify(designations)); }, [designations]);
  useEffect(() => { localStorage.setItem('paa_notifications', JSON.stringify(notifications.slice(0, 200))); }, [notifications]);

  // Audit logger helper
  const addAuditLog = (action: string, relatedRecord: string, details?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      date: dateStr,
      time: timeStr,
      relatedRecord,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Notification helper
  const pushNotification = (title: string, message: string, type: NotificationItem['type'], linkTab?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title,
      message,
      type,
      read: false,
      timestamp: 'Just now',
      linkTab
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Helper to format 12h time
  const formatTime = (date: Date = new Date()) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Today's attendance for current user
  const todayDateStr = localDate();
  // Late if check-in is after office start + grace minutes
  const isLateTime = (time: string) => timeToMinutes(time) > timeToMinutes(company.officeStartTime || '09:30') + (company.graceMinutes ?? 15);
  const todayAttendance = attendance.find(
    a => a.employeeId === currentUser.id && a.date === todayDateStr
  );

  // Active field visit for current user
  const activeFieldVisit = fieldVisits.find(
    v => v.employeeId === currentUser.id && v.status === 'in_progress'
  );

  // 3. LOGIN / LOGOUT ATTENDANCE INTEGRATION
  const checkInAttendance = (mode?: WorkMode, remarks?: string) => {
    const timeNow = formatTime();
    const effectiveMode = mode || currentUser.workMode || 'office';
    setAttendance(prev => {
      const existing = prev.find(a => a.employeeId === currentUser.id && a.date === todayDateStr);
      if (existing) {
        if (!existing.checkIn) {
          return prev.map(a => a.id === existing.id ? {
            ...a,
            checkIn: timeNow,
            status: effectiveMode === 'field' ? 'field_visit' : effectiveMode === 'wfh' ? 'wfh' : isLateTime(timeNow) ? 'late' : 'present',
            workMode: effectiveMode,
            remarks: remarks || a.remarks || 'Manual punch in'
          } : a);
        }
        return prev;
      }
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: currentUser.id,
        date: todayDateStr,
        checkIn: timeNow,
        checkOut: '',
        workingHours: 0,
        status: effectiveMode === 'field' ? 'field_visit' : effectiveMode === 'wfh' ? 'wfh' : isLateTime(timeNow) ? 'late' : 'present',
        workMode: effectiveMode,
        remarks: remarks || 'Desk punch in'
      };
      return [newRecord, ...prev];
    });

    addAuditLog('ATTENDANCE_CHECKIN', 'Attendance', `Check-in recorded at ${timeNow} (${effectiveMode})`);
    pushNotification('Attendance Checked In', `Recorded check-in at ${timeNow}`, 'attendance', 'attendance');
  };

  const calculateHours = (inStr: string, outStr: string): number => {
    return calculateTimeDiffHours(inStr, outStr);
  };

  const checkOutAttendance = () => {
    const timeNow = formatTime();
    setAttendance(prev => {
      const existing = prev.find(a => a.employeeId === currentUser.id && a.date === todayDateStr);
      if (existing) {
        const hrs = existing.checkIn ? calculateHours(existing.checkIn, timeNow) : 0;
        const keep = ['field_visit', 'wfh', 'on_duty', 'leave', 'holiday', 'week_off'].includes(existing.status);
        const status: AttendanceStatus = keep ? existing.status
          : hrs >= (company.minWorkingHoursFullDay ?? 8) ? existing.status
          : hrs >= (company.minWorkingHoursHalfDay ?? 4) ? 'half_day' : 'absent';
        return prev.map(a => a.id === existing.id ? {
          ...a,
          checkOut: timeNow,
          workingHours: hrs,
          status,
          remarks: status !== existing.status ? `${a.remarks || ''} (worked ${hrs} h → ${status.replace('_', ' ')})`.trim() : a.remarks
        } : a);
      }
      return prev;
    });

    addAuditLog('ATTENDANCE_CHECKOUT', 'Attendance', `Check-out recorded at ${timeNow}`);
    pushNotification('Attendance Checked Out', `Recorded check-out at ${timeNow}`, 'attendance', 'attendance');
  };

  // Reset shift for testing / re-punch
  const resetAttendanceShift = (employeeId?: string) => {
    const targetId = employeeId || currentUser.id;
    setAttendance(prev => prev.filter(a => !(a.employeeId === targetId && a.date === todayDateStr)));
    addAuditLog('ATTENDANCE_RESET', 'Attendance', `Shift reset for employee ${targetId} for today.`);
    pushNotification('Shift Reset for Testing', 'Attendance shift cleared. You can now punch in fresh.', 'attendance', 'attendance');
  };

  // Direct status update for any staff (HR/Super Admin action)
  const updateEmployeeAttendanceStatus = (employeeId: string, status: AttendanceStatus, workMode?: WorkMode) => {
    const timeNow = formatTime();
    setAttendance(prev => {
      const existing = prev.find(a => a.employeeId === employeeId && a.date === todayDateStr);
      if (existing) {
        return prev.map(a => a.id === existing.id ? {
          ...a,
          status,
          workMode: workMode || a.workMode,
          checkIn: a.checkIn || (status === 'absent' || status === 'leave' ? '' : timeNow),
          remarks: `Updated to ${status} by ${currentUser.name}`
        } : a);
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          employeeId,
          date: todayDateStr,
          checkIn: (status === 'absent' || status === 'leave') ? '' : timeNow,
          checkOut: '',
          workingHours: 0,
          status,
          workMode: workMode || 'office',
          remarks: `Marked as ${status} by ${currentUser.name}`
        };
        return [newRecord, ...prev];
      }
    });
    addAuditLog('ATTENDANCE_STATUS_UPDATE', employeeId, `Marked employee ${employeeId} as ${status}`);
    pushNotification('Attendance Register Updated', `Employee marked as ${status}.`, 'attendance', 'attendance');
  };

  // Leave Management Operations
  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'leaveCode' | 'status' | 'appliedAt'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `lev-${Date.now()}`,
      leaveCode: `PAA-LEV-${String(leaveRequests.length + 42).padStart(3, '0')}`,
      status: 'pending',
      appliedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    addAuditLog('LEAVE_APPLIED', newReq.leaveCode, `${currentUser.name} applied for ${req.daysCount} day(s) of ${req.leaveType}`);
    pushNotification('Leave Request Submitted', `${req.leaveType} (${req.daysCount} days) from ${req.startDate} to ${req.endDate} submitted.`, 'system', 'leave');
  };

  const BALANCE_KEYS: Record<LeaveType, [keyof LeaveBalance, keyof LeaveBalance]> = {
    'Casual Leave': ['casualLeaveTotal', 'casualLeaveUsed'],
    'Sick Leave': ['sickLeaveTotal', 'sickLeaveUsed'],
    'Privilege Leave': ['privilegeLeaveTotal', 'privilegeLeaveUsed'],
    'Compensatory Off': ['compOffTotal', 'compOffUsed'],
  };
  const defaultBalance = (employeeId: string): LeaveBalance => ({
    employeeId, casualLeaveTotal: 12, casualLeaveUsed: 0, sickLeaveTotal: 12, sickLeaveUsed: 0,
    privilegeLeaveTotal: 15, privilegeLeaveUsed: 0, compOffTotal: 0, compOffUsed: 0,
  });
  // Working dates in a leave (Sundays skipped; holidays come from payroll settings if set)
  const leaveDates = (req: LeaveRequest): string[] => {
    let offs = [0];
    let holidays: string[] = [];
    try {
      const rules = JSON.parse(localStorage.getItem('paa_x_payroll_rules') || 'null');
      if (rules) { offs = rules.weeklyOffs ?? [0]; holidays = (rules.holidays ?? []).map((h: any) => h.date); }
    } catch { /* defaults */ }
    const out: string[] = [];
    const [y, m, d] = req.startDate.split('-').map(Number);
    for (let dt = new Date(y, m - 1, d); localDate(dt) <= req.endDate; dt.setDate(dt.getDate() + 1)) {
      const iso = localDate(dt);
      if (!offs.includes(dt.getDay()) && !holidays.includes(iso)) out.push(iso);
    }
    return req.isHalfDay ? out.slice(0, 1) : out;
  };

  const reviewLeave = (leaveId: string, status: LeaveStatus, remarks?: string) => {
    const targetReq = leaveRequests.find(l => l.id === leaveId);
    if (!targetReq) return;
    if (targetReq.status !== 'pending') { alert('This leave request has already been reviewed.'); return; }
    if (targetReq.employeeId === currentUser.id && currentRole !== 'super_admin') { alert('You cannot approve your own leave.'); return; }

    let paidDays = 0;
    let unpaidDays = 0;
    if (status === 'approved') {
      const bal = leaveBalances.find(b => b.employeeId === targetReq.employeeId) || defaultBalance(targetReq.employeeId);
      const [totalKey, usedKey] = BALANCE_KEYS[targetReq.leaveType];
      const available = Math.max(0, (bal[totalKey] as number) - (bal[usedKey] as number));
      paidDays = Math.min(targetReq.daysCount, available);
      unpaidDays = Math.round((targetReq.daysCount - paidDays) * 10) / 10;
      setLeaveBalances(prev => {
        const exists = prev.some(b => b.employeeId === targetReq.employeeId);
        const list = exists ? prev : [...prev, bal];
        return list.map(b => b.employeeId === targetReq.employeeId ? { ...b, [usedKey]: (b[usedKey] as number) + paidDays } : b);
      });
      // Mark attendance: paid days as Leave, extra days as Absent (loss of pay)
      const dates = leaveDates(targetReq);
      let paidLeft = paidDays;
      setAttendance(prev => {
        let next = [...prev];
        for (const date of dates) {
          const portion = targetReq.isHalfDay ? 0.5 : 1;
          const isPaid = paidLeft >= portion;
          paidLeft -= isPaid ? portion : 0;
          const rec: AttendanceRecord = {
            id: `att-lv-${targetReq.id}-${date}`,
            employeeId: targetReq.employeeId,
            date,
            checkIn: '',
            checkOut: '',
            workingHours: 0,
            status: targetReq.isHalfDay ? 'half_day' : isPaid ? 'leave' : 'absent',
            workMode: 'office',
            remarks: `${targetReq.leaveCode} ${targetReq.leaveType}${isPaid ? '' : ' — loss of pay (no balance)'}`
          };
          const i = next.findIndex(a => a.employeeId === targetReq.employeeId && a.date === date);
          if (i >= 0) next[i] = { ...next[i], ...rec, id: next[i].id }; else next = [rec, ...next];
        }
        return next;
      });
    }

    setLeaveRequests(prev => prev.map(l => l.id !== leaveId ? l : {
      ...l,
      status,
      reviewedBy: `${currentUser.name} (${currentRole})`,
      reviewRemarks: [remarks, unpaidDays ? `${unpaidDays} day(s) unpaid — not enough balance` : ''].filter(Boolean).join(' · ') || undefined,
      reviewedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    }));

    addAuditLog('LEAVE_REVIEW', leaveId, `Leave ${targetReq.leaveCode} ${status} by ${currentUser.name}${status === 'approved' ? ` (paid ${paidDays}, unpaid ${unpaidDays})` : ''}`);
    pushNotification('Leave Status Updated', `Leave request ${targetReq.leaveCode} was ${status}.${unpaidDays ? ` ${unpaidDays} day(s) marked unpaid.` : ''}`, 'system', 'leave');
  };

  const cancelLeave = (leaveId: string) => {
    const req = leaveRequests.find(l => l.id === leaveId);
    if (!req || !['pending', 'approved'].includes(req.status)) return;
    if (req.status === 'approved') {
      const dates = leaveDates(req);
      // How many days were marked as paid leave for this request
      const paidMarked = attendance.filter(a => a.employeeId === req.employeeId && dates.includes(a.date) && (a.remarks || '').startsWith(req.leaveCode) && !(a.remarks || '').includes('loss of pay'))
        .reduce((n, a) => n + (a.status === 'half_day' ? 0.5 : 1), 0);
      const [, usedKey] = BALANCE_KEYS[req.leaveType];
      setLeaveBalances(prev => prev.map(b => b.employeeId === req.employeeId ? { ...b, [usedKey]: Math.max(0, (b[usedKey] as number) - paidMarked) } : b));
      setAttendance(prev => prev.filter(a => !(a.employeeId === req.employeeId && dates.includes(a.date) && (a.remarks || '').startsWith(req.leaveCode))));
    }
    setLeaveRequests(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'cancelled' } : l));
    addAuditLog('LEAVE_CANCEL', leaveId, `Leave request ${req.leaveCode} cancelled; balance and attendance restored.`);
    pushNotification('Leave Cancelled', `Leave request ${req.leaveCode} cancelled.`, 'system', 'leave');
  };

  // Full Login: automatically creates attendance check-in & routes to appropriate role desk!
  const login = (email: string, role?: UserRole) => {
    const targetUser = employees.find(e => e.email.toLowerCase() === email.toLowerCase()) || employees[0];
    const effectiveRole = role || targetUser.role;
    setCurrentUserId(targetUser.id);
    setCurrentRole(effectiveRole);
    setIsAuthenticated(true);
    sessionStorage.setItem('paa_x_session', JSON.stringify({ userId: targetUser.id }));

    const timeNow = formatTime();
    // Auto check-in attendance
    setAttendance(prev => {
      const existing = prev.find(a => a.employeeId === targetUser.id && a.date === todayDateStr);
      if (!existing) {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: targetUser.id,
          date: todayDateStr,
          checkIn: timeNow,
          checkOut: '',
          workingHours: 0,
          status: targetUser.workMode === 'field' ? 'field_visit' : 'present',
          workMode: targetUser.workMode,
          remarks: 'Automatic login check-in'
        };
        return [newRecord, ...prev];
      } else if (!existing.checkIn) {
        return prev.map(a => a.id === existing.id ? { ...a, checkIn: timeNow } : a);
      }
      return prev;
    });

    // Auto-route to dedicated role workspace desk
    const targetDesk = homeTab(effectiveRole, effectiveRole === 'employee' && targetUser.workMode === 'field');
    setActiveTab(targetDesk);

    addAuditLog('USER_LOGIN', 'Authentication', `Logged in as ${targetUser.name} (${effectiveRole}). Auto check-in logged at ${timeNow}. Routed to ${targetDesk}.`);
    pushNotification('Welcome back!', `Logged into Priority Ads Agency portal. Attendance check-in confirmed at ${timeNow}.`, 'attendance', targetDesk);
  };

  // Full Logout: automatically creates attendance check-out!
  const logout = () => {
    const timeNow = formatTime();
    // Auto check-out attendance
    setAttendance(prev => {
      const existing = prev.find(a => a.employeeId === currentUser.id && a.date === todayDateStr);
      if (existing && !existing.checkOut) {
        const hrs = existing.checkIn ? calculateHours(existing.checkIn, timeNow) : 0;
        return prev.map(a => a.id === existing.id ? {
          ...a,
          checkOut: timeNow,
          workingHours: hrs
        } : a);
      }
      return prev;
    });

    addAuditLog('USER_LOGOUT', 'Authentication', `User logged out. Auto check-out logged at ${timeNow}.`);
    setIsAuthenticated(false);
    sessionStorage.removeItem('paa_x_session');
    sessionStorage.removeItem('paa_x_must_change');
  };

  // Switch active user & sync role & desk
  const switchUser = (employeeId: string) => {
    const target = employees.find(e => e.id === employeeId);
    if (target) {
      setCurrentUserId(target.id);
      setCurrentRole(target.role);

      const targetDesk =
        target.role === 'hr' ? 'hr_desk' :
        target.role === 'project_manager' ? 'pm_desk' :
        (target.id === 'emp-5' || target.workMode === 'field') ? 'field_force_desk' :
        target.role === 'employee' ? 'employee_desk' :
        target.role === 'admin' ? 'billing' : 'owner_desk';
      setActiveTab(targetDesk);

      addAuditLog('SWITCH_USER_CONTEXT', 'User Management', `Switched active preview user to ${target.name} (${target.role}) and desk to ${targetDesk}`);
    }
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    const targetDesk =
      role === 'hr' ? 'hr_desk' :
      role === 'project_manager' ? 'pm_desk' :
      role === 'employee' ? 'employee_desk' :
      role === 'admin' ? 'billing' : 'owner_desk';
    setActiveTab(targetDesk);
    addAuditLog('SWITCH_ROLE', 'RBAC', `Switched active dashboard view to role: ${role}`);
  };

  // Attendance Regularization
  const requestAttendanceRegularization = (data: Omit<AttendanceRegularizationRequest, 'id' | 'employeeId' | 'status' | 'requestedAt'>) => {
    const newReq: AttendanceRegularizationRequest = {
      ...data,
      id: `reg-${Date.now()}`,
      employeeId: currentUser.id,
      status: 'pending',
      requestedAt: `${todayDateStr} ${formatTime()}`
    };
    setRegularizations(prev => [newReq, ...prev]);
    addAuditLog('REGULARIZATION_REQUESTED', newReq.id, `Requested correction for ${data.date} (${data.correctCheckIn} - ${data.correctCheckOut})`);
    pushNotification('Regularization Submitted', `Your attendance correction request for ${data.date} is pending approval.`, 'attendance', 'attendance');
  };

  const reviewRegularization = (requestId: string, status: 'approved' | 'rejected', remarks?: string) => {
    setRegularizations(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          reviewRemarks: remarks,
          reviewedBy: `${currentUser.name} (${currentRole})`
        };
      }
      return r;
    }));

    const req = regularizations.find(r => r.id === requestId);
    if (req && status === 'approved') {
      // update or insert attendance
      const hrs = calculateHours(req.correctCheckIn, req.correctCheckOut);
      setAttendance(prev => {
        const existing = prev.find(a => a.employeeId === req.employeeId && a.date === req.date);
        if (existing) {
          return prev.map(a => a.id === existing.id ? {
            ...a,
            checkIn: req.correctCheckIn,
            checkOut: req.correctCheckOut,
            workingHours: hrs,
            status: 'present',
            isRegularized: true,
            regularizedBy: currentUser.name
          } : a);
        } else {
          return [{
            id: `att-reg-${Date.now()}`,
            employeeId: req.employeeId,
            date: req.date,
            checkIn: req.correctCheckIn,
            checkOut: req.correctCheckOut,
            workingHours: hrs,
            status: 'present',
            workMode: 'office',
            isRegularized: true,
            regularizedBy: currentUser.name
          }, ...prev];
        }
      });
    }

    addAuditLog(`REGULARIZATION_${status.toUpperCase()}`, requestId, `Regularization ${status} by ${currentUser.name}`);
    pushNotification(`Regularization ${status.toUpperCase()}`, `Request ${requestId} was ${status}.`, 'attendance', 'attendance');
  };

  // Field Force Actions
  const startFieldVisit = (data: Omit<FieldVisit, 'id' | 'visitCode' | 'employeeId' | 'date' | 'startTime' | 'status' | 'expensesTotal'>) => {
    const timeNow = formatTime();
    const newVisit: FieldVisit = {
      ...data,
      id: `vst-${Date.now()}`,
      visitCode: `PAA-VST-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: currentUser.id,
      date: todayDateStr,
      startTime: timeNow,
      status: 'in_progress',
      expensesTotal: 0
    };

    setFieldVisits(prev => [newVisit, ...prev]);

    // Update employee's active work mode
    setEmployees(prev => prev.map(e => e.id === currentUser.id ? { ...e, workMode: 'field' } : e));

    // Update today's attendance status to field_visit
    setAttendance(prev => prev.map(a => (a.employeeId === currentUser.id && a.date === todayDateStr) ? {
      ...a,
      status: 'field_visit',
      workMode: 'field',
      remarks: `Field visit ${newVisit.visitCode} at ${data.companyName}`
    } : a));

    addAuditLog('FIELD_VISIT_START', newVisit.visitCode, `Started field visit to ${data.companyName} at ${timeNow}`);
    pushNotification('Field Visit Started', `Started visit with ${data.contactPerson} (${data.companyName})`, 'field_visit', 'field_force');
  };

  const endFieldVisit = (visitId: string, outcomeData: { actualOutcome: string; discussionSummary?: string; followUpRequired: boolean; nextFollowUpDate?: string; remarks?: string }) => {
    const timeNow = formatTime();
    setFieldVisits(prev => prev.map(v => {
      if (v.id === visitId) {
        // duration calculation
        let dur = timeToMinutes(timeNow) - timeToMinutes(v.startTime);
        if (dur < 0) dur += 24 * 60;
        return {
          ...v,
          ...outcomeData,
          endTime: timeNow,
          durationMinutes: dur,
          status: 'completed'
        };
      }
      return v;
    }));

    // Revert work mode to office if no other active field visits
    setEmployees(prev => prev.map(e => e.id === currentUser.id ? { ...e, workMode: 'office' } : e));

    addAuditLog('FIELD_VISIT_END', visitId, `Completed visit at ${timeNow}. Outcome: ${outcomeData.actualOutcome}`);
    pushNotification('Field Visit Completed', `Recorded meeting outcome and discussion summary.`, 'field_visit', 'field_force');
  };

  // Field visit -> direct reimbursement integration (PROMPT #30 & #31)
  const addExpenseToFieldVisit = (visitId: string, expense: { category: Reimbursement['category']; amount: number; description: string; paymentMethod: string }) => {
    const visit = fieldVisits.find(v => v.id === visitId);
    if (!visit) return;

    const rmbCode = `PAA-RMB-${Math.floor(500 + Math.random() * 500)}`;
    const newRmb: Reimbursement = {
      id: `rmb-${Date.now()}`,
      reimbursementCode: rmbCode,
      employeeId: currentUser.id,
      date: todayDateStr,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      projectId: visit.projectId,
      clientId: visit.clientId,
      fieldVisitId: visit.id,
      paymentMethod: expense.paymentMethod,
      status: 'submitted',
      remarks: `Incurred during Field Visit ${visit.visitCode} (${visit.companyName})`
    };

    setReimbursements(prev => [newRmb, ...prev]);

    // Update field visit total expenses
    setFieldVisits(prev => prev.map(v => v.id === visitId ? {
      ...v,
      expensesTotal: (v.expensesTotal || 0) + expense.amount,
      reimbursementId: newRmb.id
    } : v));

    addAuditLog('FIELD_EXPENSE_SUBMITTED', newRmb.reimbursementCode, `Submitted ₹${expense.amount} for ${expense.category} linked to ${visit.visitCode}`);
    pushNotification('Expense Linked to Field Visit', `₹${expense.amount} reimbursement submitted for review.`, 'reimbursement', 'reimbursements');
  };

  // Daily Activity
  const addDailyActivity = (activity: Omit<DailyActivity, 'id' | 'createdAt'>) => {
    const newAct: DailyActivity = {
      ...activity,
      id: `act-${Date.now()}`,
      createdAt: `${todayDateStr} ${formatTime()}`
    };
    setDailyActivities(prev => [newAct, ...prev]);
    addAuditLog('DAILY_ACTIVITY_SUBMITTED', newAct.id, `Logged ${activity.hoursSpent} hrs work for task ${activity.taskId || 'General'}`);
    pushNotification('Daily Activity Recorded', `Your work log for today has been saved.`, 'task', 'daily_activity');
  };

  // CRM
  const addLead = (lead: Omit<Lead, 'id' | 'leadCode' | 'createdAt'>) => {
    const code = `PAA-LD-${Math.floor(200 + Math.random() * 800)}`;
    const newLead: Lead = {
      ...lead,
      id: `ld-${Date.now()}`,
      leadCode: code,
      createdAt: todayDateStr
    };
    setLeads(prev => [newLead, ...prev]);
    addAuditLog('LEAD_CREATED', code, `New lead added: ${lead.name} (${lead.company})`);
    pushNotification('New Lead Created', `${lead.company} added to sales pipeline.`, 'system', 'leads');
  };

  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    addAuditLog('LEAD_STATUS_UPDATE', leadId, `Status updated to ${status}`);
  };

  // Convert Lead to Client (Prompt #20)
  const convertLeadToClient = (leadId: string) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const clientCode = `PAA-CL-${Math.floor(50 + Math.random() * 950)}`;
    const newClient: Client = {
      id: `cl-${Date.now()}`,
      clientCode,
      companyName: targetLead.company,
      contactPerson: targetLead.contactPerson,
      email: targetLead.email,
      phone: targetLead.phone,
      phone2: targetLead.phone2,
      website: `www.${targetLead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      address: 'Bangalore, Karnataka',
      gstNumber: '29AAACP0000A1Z1',
      billingAddress: 'Bangalore, Karnataka',
      accountManagerId: targetLead.assignedEmployeeId || currentUser.id,
      services: [targetLead.serviceRequired],
      status: 'active',
      notes: `Converted from Lead ${targetLead.leadCode}. Original notes: ${targetLead.notes}`,
      createdAt: todayDateStr,
      convertedFromLeadId: targetLead.id
    };

    setClients(prev => [newClient, ...prev]);

    // Update lead status to won with client reference
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      status: 'won',
      convertedToClientId: newClient.id
    } : l));

    // Auto-create initial project for converted client
    const prjCode = `PAA-PRJ-${String(projects.length + 15).padStart(3, '0')}`;
    const newProject: Project = {
      id: `prj-${Date.now()}`,
      projectCode: prjCode,
      name: `${targetLead.company} — ${targetLead.serviceRequired}`,
      clientId: newClient.id,
      projectManagerId: 'emp-3', // Karthik Rao (Technical PM)
      assignedEmployeeIds: ['emp-4', 'emp-5'],
      startDate: todayDateStr,
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      budget: targetLead.estimatedValue || 350000,
      status: 'active',
      priority: targetLead.priority || 'high',
      description: `Client deliverable project for ${targetLead.company}. Converted from Lead ${targetLead.leadCode}.`
    };
    setProjects(prev => [newProject, ...prev]);

    // Auto-generate initial GST Invoice for converted client
    const invCode = `PAA-INV-2026-${String(invoices.length + 104).padStart(3, '0')}`;
    const baseAmount = targetLead.estimatedValue || 350000;
    const taxAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + taxAmount;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invCode,
      clientId: newClient.id,
      issueDate: todayDateStr,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `item-${Date.now()}-1`,
          description: `${targetLead.serviceRequired} - Phase 1 Retainer & Setup`,
          quantity: 1,
          unitPrice: baseAmount,
          total: baseAmount
        }
      ],
      subtotal: baseAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      status: 'issued',
      notes: `Official tax invoice generated upon lead conversion from ${targetLead.leadCode}. 18% GST compliant.`
    };
    setInvoices(prev => [newInvoice, ...prev]);

    addAuditLog('LEAD_CONVERTED_TO_CLIENT', clientCode, `Lead ${targetLead.leadCode} converted to Client ${clientCode}. Project ${prjCode} and Invoice ${invCode} created.`);
    pushNotification('Lead Converted to Client & Invoice Generated!', `${targetLead.company} onboarded with Project ${prjCode} and Invoice ${invCode} (₹${totalAmount.toLocaleString()}).`, 'system', 'clients');

    // Automatically navigate to Clients Directory
    setActiveTab('clients');
  };

  const addClient = (client: Omit<Client, 'id' | 'clientCode' | 'createdAt'>) => {
    const clientCode = `PAA-CL-${Math.floor(100 + Math.random() * 900)}`;
    const newClient: Client = {
      ...client,
      id: `cl-${Date.now()}`,
      clientCode,
      createdAt: todayDateStr
    };
    setClients(prev => [newClient, ...prev]);
    addAuditLog('CLIENT_CREATED', clientCode, `Client created: ${client.companyName}`);
    pushNotification('Client Added', `${client.companyName} onboarded.`, 'system', 'clients');
  };

  // Project & Task
  const addProject = (project: Omit<Project, 'id' | 'projectCode'>) => {
    const code = `PAA-PRJ-${Math.floor(10 + Math.random() * 90)}`;
    const newPrj: Project = {
      ...project,
      id: `prj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectCode: code
    };
    setProjects(prev => [newPrj, ...prev]);
    addAuditLog('PROJECT_CREATED', code, `New Project: ${project.name}`);
    pushNotification('Project Created', `Project ${project.name} initialized.`, 'system', 'projects');
    return newPrj;
  };

  const addTask = (task: Omit<Task, 'id' | 'taskCode'>) => {
    const code = `PAA-TSK-${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 10)}`;
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      taskCode: code
    };
    setTasks(prev => [newTask, ...prev]);
    addAuditLog('TASK_CREATED', code, `Task created: ${task.title}`);
    pushNotification('New Task Assigned', `${task.title} added to project queue.`, 'task', 'tasks');
    return newTask;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const before = clients.find(c => c.id === id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates, id: c.id, clientCode: c.clientCode } : c));
    addAuditLog('CLIENT_UPDATED', before?.clientCode || id, `Client updated: ${Object.keys(updates).join(', ')}`);
    pushNotification('Client Updated', `${updates.companyName || before?.companyName} saved.`, 'system', 'clients');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const before = tasks.find(t => t.id === id);
    if (!before) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, id: t.id, taskCode: t.taskCode } : t));
    if (updates.assignedEmployeeId && updates.assignedEmployeeId !== before.assignedEmployeeId) {
      const emp = employees.find(e => e.id === updates.assignedEmployeeId);
      pushNotification('Task Reassigned', `${before.title} assigned to ${emp?.name || 'employee'}.`, 'task', 'my_tasks');
    }
    addAuditLog('TASK_UPDATED', before.taskCode, `Task updated: ${Object.keys(updates).join(', ')}`);
  };

  const deleteTask = (id: string) => {
    const t = tasks.find(x => x.id === id);
    setTasks(prev => prev.filter(x => x.id !== id));
    addAuditLog('TASK_DELETED', t?.taskCode || id, `Task deleted: ${t?.title}`);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const before = projects.find(p => p.id === id);
    if (!before) return;
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, id: p.id, projectCode: p.projectCode } : p));
    // Change history for SOW / project tracking
    try {
      const key = 'paa_x_project_changes';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const at = new Date().toLocaleString();
      for (const k of Object.keys(updates) as (keyof Project)[]) {
        const o = JSON.stringify(before[k]); const n = JSON.stringify(updates[k]);
        if (o !== n) list.unshift({ id: `chg-${Date.now()}-${k}`, projectId: id, field: k, oldValue: o, newValue: n, at, by: currentUser.name });
      }
      localStorage.setItem(key, JSON.stringify(list.slice(0, 1000)));
      window.dispatchEvent(new Event('paa-project-changes'));
    } catch { /* ignore */ }
    addAuditLog('PROJECT_UPDATED', before.projectCode, `Project updated: ${Object.keys(updates).join(', ')}`);
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    const t = tasks.find(x => x.id === taskId);
    if (t && currentRole === 'employee' && t.assignedEmployeeId !== currentUser.id) { alert('You can only update tasks assigned to you.'); return; }
    setTasks(prev => prev.map(x => x.id === taskId ? { ...x, status } : x));
    addAuditLog('TASK_STATUS_CHANGED', t?.taskCode || taskId, `Task status set to ${status}`);
  };

  // Reimbursements
  const addReimbursement = (reimbursement: Omit<Reimbursement, 'id' | 'reimbursementCode' | 'status'>) => {
    const code = `PAA-RMB-${Math.floor(500 + Math.random() * 500)}`;
    const newRmb: Reimbursement = {
      ...reimbursement,
      id: `rmb-${Date.now()}`,
      reimbursementCode: code,
      status: 'submitted'
    };
    setReimbursements(prev => [newRmb, ...prev]);
    addAuditLog('REIMBURSEMENT_SUBMITTED', code, `Submitted ₹${reimbursement.amount} for ${reimbursement.category}`);
    pushNotification('Reimbursement Submitted', `₹${reimbursement.amount} submitted for approval.`, 'reimbursement', 'reimbursements');
  };

  const reviewReimbursement = (id: string, status: Reimbursement['status'], remarks?: string) => {
    setReimbursements(prev => prev.map(r => r.id === id ? {
      ...r,
      status,
      reviewedBy: `${currentUser.name} (${currentRole})`,
      approvalRemarks: remarks,
      paidDate: status === 'paid' ? todayDateStr : r.paidDate
    } : r));
    addAuditLog(`REIMBURSEMENT_${status.toUpperCase()}`, id, `Reimbursement ${id} changed to ${status}`);
    pushNotification(`Reimbursement ${status}`, `Reimbursement marked as ${status}.`, 'reimbursement', 'reimbursements');
  };

  // Sales & Billing
  const addQuotation = (quotation: Omit<Quotation, 'id' | 'quotationNumber'>) => {
    const num = `PAA-QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newQt: Quotation = {
      ...quotation,
      id: `qt-${Date.now()}`,
      quotationNumber: num
    };
    setQuotations(prev => [newQt, ...prev]);
    addAuditLog('QUOTATION_CREATED', num, `Created quotation of ₹${quotation.total}`);
    pushNotification('Quotation Created', `Quotation ${num} ready for client review.`, 'invoice', 'quotations');
  };

  const acceptQuotation = (id: string) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'accepted' } : q));
    const qt = quotations.find(q => q.id === id);
    if (qt) {
      // Create agreement automatically
      const agrNum = `PAA-AGR-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;
      const newAgr: Agreement = {
        id: `agr-${Date.now()}`,
        agreementNumber: agrNum,
        quotationId: qt.id,
        clientId: qt.clientId,
        title: qt.title,
        startDate: todayDateStr,
        endDate: '2027-03-31',
        terms: qt.terms,
        status: 'active'
      };
      setAgreements(prev => [newAgr, ...prev]);
      addAuditLog('QUOTATION_ACCEPTED', qt.quotationNumber, `Accepted & generated agreement ${agrNum}`);
    }
  };

  const addAgreement = (agreement: Omit<Agreement, 'id' | 'agreementNumber'>) => {
    const num = `PAA-AGR-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;
    const newAgr: Agreement = {
      ...agreement,
      id: `agr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agreementNumber: num
    };
    setAgreements(prev => [newAgr, ...prev]);
    addAuditLog('AGREEMENT_CREATED', num, `Agreement ${num} created.`);
    return newAgr;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates, id: q.id, quotationNumber: q.quotationNumber } : q));
    addAuditLog('QUOTATION_UPDATED', id, `Quotation updated: ${Object.keys(updates).join(', ')}`);
  };

  const updateAgreement = (id: string, updates: Partial<Agreement>) => {
    setAgreements(prev => prev.map(a => a.id === id ? { ...a, ...updates, id: a.id, agreementNumber: a.agreementNumber } : a));
    addAuditLog('AGREEMENT_UPDATED', id, `Agreement updated: ${Object.keys(updates).join(', ')}`);
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const num = `PAA-INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newInv: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      invoiceNumber: num
    };
    setInvoices(prev => [newInv, ...prev]);
    addAuditLog('INVOICE_CREATED', num, `Invoice ${num} generated for ₹${invoice.totalAmount}`);
    pushNotification('Invoice Issued', `Invoice ${num} issued for ₹${invoice.totalAmount}.`, 'invoice', 'invoices');
    return newInv;
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'paymentCode'>) => {
    const code = `PAA-PAY-${Math.floor(800 + Math.random() * 200)}`;
    const newPay: Payment = {
      ...payment,
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      paymentCode: code
    };
    setPayments(prev => [newPay, ...prev]);

    // Update invoice paid balance
    setInvoices(prev => prev.map(inv => {
      if (inv.id === payment.invoiceId) {
        const newPaid = inv.paidAmount + payment.amount;
        const newBalance = Math.max(0, inv.totalAmount - newPaid);
        const newStatus = newBalance === 0 ? 'paid' : (newPaid > 0 ? 'partially_paid' : inv.status);
        return {
          ...inv,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus
        };
      }
      return inv;
    }));

    addAuditLog('PAYMENT_RECEIVED', code, `Received ₹${payment.amount} via ${payment.paymentMethod}`);
    pushNotification('Payment Recorded', `Payment of ₹${payment.amount} received.`, 'invoice', 'payments');
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'expenseCode'>) => {
    const code = `PAA-EXP-${Math.floor(700 + Math.random() * 300)}`;
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      expenseCode: code
    };
    setExpenses(prev => [newExp, ...prev]);
    addAuditLog('EXPENSE_RECORDED', code, `Expense of ₹${expense.amount} for ${expense.title}`);
  };

  // HR & Employee
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [newEmp, ...prev]);
    addAuditLog('EMPLOYEE_ONBOARDED', newEmp.employeeId, `Onboarded ${newEmp.name} to ${newEmp.departmentId}`);
    pushNotification('Employee Added', `${newEmp.name} (${newEmp.employeeId}) onboarded.`, 'system', 'employees');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addAuditLog('EMPLOYEE_UPDATED', id, `Updated employee profile records.`);
  };

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`
    };
    setDepartments(prev => [...prev, newDept]);
    addAuditLog('DEPARTMENT_CREATED', newDept.code, `Department ${newDept.name} created.`);
  };

  const addDesignation = (desig: Omit<Designation, 'id'>) => {
    const newDesig: Designation = {
      ...desig,
      id: `desig-${Date.now()}`
    };
    setDesignations(prev => [...prev, newDesig]);
    addAuditLog('DESIGNATION_CREATED', newDesig.title, `Designation created: ${newDesig.title}`);
  };

  // Generate Payslip for an employee (Prompt #35 & #36)
  const generatePayslipForEmployee = (employeeId: string, payPeriod: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    // Get approved reimbursements for this employee
    const approvedRmbs = reimbursements
      .filter(r => r.employeeId === employeeId && (r.status === 'approved' || r.status === 'paid'))
      .reduce((sum, r) => sum + r.amount, 0);

    const gross = emp.salary.basic + emp.salary.hra + emp.salary.allowances + emp.salary.incentives + emp.salary.bonus;
    const net = gross - emp.salary.deductions + approvedRmbs;

    const num = `PAA-SLIP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newSlip: Payslip = {
      id: `slip-${Date.now()}`,
      payslipNumber: num,
      employeeId,
      payPeriod,
      basicSalary: emp.salary.basic,
      hra: emp.salary.hra,
      allowances: emp.salary.allowances,
      incentives: emp.salary.incentives,
      bonus: emp.salary.bonus,
      grossSalary: gross,
      deductions: emp.salary.deductions,
      approvedReimbursement: approvedRmbs,
      netPay: net,
      generatedDate: todayDateStr,
      status: 'generated'
    };

    setPayslips(prev => [newSlip, ...prev]);
    addAuditLog('PAYSLIP_GENERATED', num, `Generated payslip for ${emp.name} (${payPeriod})`);
    pushNotification('Payslip Generated', `Payslip for ${payPeriod} is ready for download.`, 'payroll', 'payslips');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateCompany = (updates: Partial<CompanyConfig>) => {
    setCompany(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('paa_company', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('COMPANY_CONFIG_UPDATE', 'Company', 'Updated company working rules & branding.');
  };

  return (
    <AppContext.Provider
      value={osGuard({
        theme,
        toggleTheme,
        company,
        updateCompany,
        currentUser,
        currentRole,
        switchUser,
        switchRole,
        isAuthenticated,
        login,
        logout,
        activeTab,
        setActiveTab,
        employees,
        departments,
        designations,
        attendance,
        regularizations,
        dailyActivities,
        leads,
        clients,
        fieldVisits,
        reimbursements,
        projects,
        tasks,
        quotations,
        agreements,
        invoices,
        payments,
        expenses,
        payslips,
        notifications,
        auditLogs,
        leaveRequests,
        leaveBalances,
        applyLeave,
        reviewLeave,
        cancelLeave,
        todayAttendance,
        checkInAttendance,
        checkOutAttendance,
        resetAttendanceShift,
        updateEmployeeAttendanceStatus,
        requestAttendanceRegularization,
        reviewRegularization,
        activeFieldVisit,
        startFieldVisit,
        endFieldVisit,
        addExpenseToFieldVisit,
        addEmployee,
        updateEmployee,
        addDepartment,
        addDesignation,
        addDailyActivity,
        addLead,
        updateLeadStatus,
        convertLeadToClient,
        addClient,
        addProject,
        addTask,
        updateTaskStatus,
        addReimbursement,
        reviewReimbursement,
        addQuotation,
        acceptQuotation,
        addAgreement,
        addInvoice,
        addPayment,
        addExpense,
        generatePayslipForEmployee,
        markNotificationAsRead,
        updateClient,
        updateTask,
        deleteTask,
        updateProject,
        updateQuotation,
        updateAgreement,
        notify: pushNotification,
        logAudit: addAuditLog,
        setAttendanceRecords: setAttendance,
        docPreview,
        openDocument,
        closeDocument
      })}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
