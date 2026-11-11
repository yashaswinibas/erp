// AGENCYOS_DB_DONE
// AGENCYOS_V5_P26_DONE
// AGENCYOS_V4_P25_DONE
import React, { useState, useEffect } from 'react';
import { RoleLogin } from './components/RoleLogin'; // AGENCYOS_V2_PART4
import './os/os.css'; // AGENCYOS_V3_OS
import { OsLogin } from './os/OsLogin';
import { OsSidebar, OsTopbar, OsHeader } from './os/OsShell';
import { ToastHost } from './os/OsUi';
import { renderOsPage } from './os/OsRouter';
import { AccessAdmin, ForcePasswordChange } from './components/AccessAdmin';
import { FinanceDashboard } from './components/FinanceDashboard';
import { DocumentCenter } from './components/DocumentCenter'; // AGENCYOS_V2_PART13
import { FinanceBook } from './components/FinanceBook';
import { ClientReimbursementModule } from './components/ClientReimbursementModule'; // AGENCYOS_V2_PART11
import { canAccess, homeTab, ROLE_LABEL, setFieldAccess } from './lib/rbac';
import { useShared } from './lib/sharedStore';
import { AppProvider, useApp } from './context/AppContext';
import { RoleDashboardView } from './components/RoleDashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { AttendanceModule } from './components/AttendanceModule';
import { FieldForceModule } from './components/FieldForceModule';
import { CrmModule } from './components/CrmModule';
import { ProjectsTasksModule } from './components/ProjectsTasksModule';
import { ReimbursementsPayrollModule } from './components/ReimbursementsPayrollModule';
import { SalesBillingModule } from './components/SalesBillingModule';
import { EmployeesModule } from './components/EmployeesModule';
import { LeaveManagementModule } from './components/LeaveManagementModule';
import { HrPayrollModule } from './components/HrPayrollModule'; // AGENCYOS_V2_PART2
import { DealsModule, DealsTab } from './components/DealsModule'; // AGENCYOS_V2_PART3
import { FieldGpsModule } from './components/FieldGpsModule';
import { AgencyWatchers } from './components/AgencyWatchers';
import { AuditSettingsModule } from './components/AuditSettingsModule';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AddEntityModals } from './components/AddEntityModals';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  UserCheck,
  Building2,
  FileText,
  FileCheck,
  Briefcase,
  CheckSquare,
  ListTodo,
  Receipt,
  CreditCard,
  DollarSign,
  MapPin,
  ShieldAlert,
  Settings,
  Sun,
  Moon,
  Bell,
  LogOut,
  LogIn,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Shield,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserRole } from './types';
import { installExportGuard, setExportCtx } from './os/osP25';
import './os/osP26';
import './os/osSeedRoles';

function MainApp() {
  const {
    theme,
    toggleTheme,
    company,
    currentUser,
    currentRole,
    switchRole,
    switchUser,
    employees,
    activeTab,
    setActiveTab,
    isAuthenticated,
    login,
    logout,
    notifications,
    markNotificationAsRead
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { if (theme === 'dark') toggleTheme(); }, [theme]); // light theme only
  setExportCtx(currentRole, activeTab); installExportGuard();
  useEffect(() => { const em = sessionStorage.getItem('paa_x_db_autologin'); if (em) { sessionStorage.removeItem('paa_x_db_autologin'); login(em); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Collapsible sidebar sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    hr: false,
    crm: false,
    work: false,
    finance: false,
    field: false
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Modal Controller
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalContextData, setModalContextData] = useState<any>(null);

  const openAddModal = (type: string, data?: any) => {
    setModalType(type);
    setModalContextData(data);
  };

  const closeAddModal = () => {
    setModalType(null);
    setModalContextData(null);
  };

  // Login page form state
  const [loginEmail, setLoginEmail] = useState('rajesh.sharma@priorityadsagency.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginRole, setLoginRole] = useState<UserRole>('super_admin');
  const [rememberMe, setRememberMe] = useState(true);

  const unreadNotifs = notifications.filter(n => !n.read);
  useShared<Record<string, string[]>>('paa_x_perm_overrides', {}); // AGENCYOS_V2_PART14 re-render menu when permissions change
  setFieldAccess(currentRole !== 'employee' || currentUser.workMode === 'field'); // AGENCYOS_V2_PART20
  const allowed = canAccess(currentRole, activeTab);
  useEffect(() => {
    if (isAuthenticated && !canAccess(currentRole, activeTab)) setActiveTab(homeTab(currentRole, currentRole === 'employee' && currentUser.workMode === 'field'));
  }, [isAuthenticated, currentRole, activeTab]);

  // Available personas matching screenshot
  const personas: { id: string; name: string; role: UserRole; icon: string; label: string }[] = [
    { id: 'emp-1', name: 'Rajesh Sharma', role: 'super_admin', icon: '👑', label: 'Super Admin (Rajesh Sharma)' },
    { id: 'emp-2', name: 'Priya Sharma', role: 'hr', icon: '👔', label: 'HR Lead (Priya Sharma)' },
    { id: 'emp-3', name: 'Karthik Rao', role: 'project_manager', icon: '💼', label: 'Project Manager (Karthik Rao)' },
    { id: 'emp-5', name: 'Rahul Verma', role: 'employee', icon: '🚗', label: 'Field Sales Exec (Rahul Verma)' },
    { id: 'emp-4', name: 'Ananya Desai', role: 'employee', icon: '💻', label: 'Sr Developer (Ananya Desai)' },
    { id: 'emp-6', name: 'Suresh Kumar', role: 'admin', icon: '📊', label: 'Accounts Lead (Suresh Kumar)' },
    { id: 'emp-7', name: 'Ningappa B.', role: 'super_admin', icon: '🖋️', label: 'Director & Signatory (Ningappa B.)' },
  ];

  // ==========================================
  // DEDICATED HIGH-END LOGIN PAGE
  // ==========================================
  if (!isAuthenticated) return <OsLogin />; // AGENCYOS_V3_OS
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-blue-600 selection:text-white">

        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">

          {/* Left Hero Panel (Agency Showcase) */}
          <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-br from-[#0B1536] via-[#09112B] to-[#040817] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between">

            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-md">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-white">AgencyOS</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">ERP</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Digital Agency Operations</p>
                </div>
              </div>

              {/* Tagline & Headline */}
              <div className="space-y-2 pt-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>GST-Compliant Enterprise Suite</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Single source of truth for your agency operations.
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time billing, automated login/logout attendance tracking, field force GPS visits, task deliverables, and client 360.
                </p>
              </div>

              {/* Automatic Attendance Notice */}
              <div className="p-3.5 bg-blue-950/50 border border-blue-800/60 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Automatic Attendance Check-In</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Logging in automatically registers your system check-in for today's shift. When you sign out, your check-out and working hours are calculated automatically.
                </p>
              </div>
            </div>

            {/* Official Agency Footer Branding */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center gap-3">
              <img src="/assets/aistudio/image_1c6ded1a.png" alt="Priority Ads Agency" className="w-8 h-8 object-contain" />
              <div className="text-[11px] text-slate-400">
                <p className="font-semibold text-slate-200">PRIORITY ADS AGENCY, BENGALURU</p>
                <p className="text-[10px] text-slate-500">Your success is our priority · Official Portal</p>
              </div>
            </div>

          </div>

          {/* Right Login Form Panel */}
          <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center space-y-6">

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Select Role Workspace or Sign In</h3>
              <p className="text-xs text-slate-400">Click any role card below to instantly access its dedicated executive workdesk</p>
            </div>

            {/* Prominent Role Portals (Separate Page Entrances) */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'emp-1',
                    name: 'Rajesh Sharma',
                    role: 'super_admin' as UserRole,
                    deskTitle: 'Owner / Executive Desk',
                    badge: 'Director & MD',
                    icon: '👑',
                    color: 'border-blue-500/50 hover:border-blue-400 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300',
                    desc: 'Financials, Margin ₹1.39L, Cash Flow, Invoices & GST'
                  },
                  {
                    id: 'emp-2',
                    name: 'Priya Sharma',
                    role: 'hr' as UserRole,
                    deskTitle: 'HR Manager Command',
                    badge: 'Head of People',
                    icon: '👔',
                    color: 'border-purple-500/50 hover:border-purple-400 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300',
                    desc: 'Staff Headcount, Live Attendance, Leaves & Payroll'
                  },
                  {
                    id: 'emp-3',
                    name: 'Karthik Rao',
                    role: 'project_manager' as UserRole,
                    deskTitle: 'Project Delivery Matrix',
                    badge: 'Tech Delivery PM',
                    icon: '💼',
                    color: 'border-amber-500/50 hover:border-amber-400 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300',
                    desc: 'Active Projects, Sprint Kanban & Developer Allocations'
                  },
                  {
                    id: 'emp-5',
                    name: 'Rahul Verma',
                    role: 'employee' as UserRole,
                    deskTitle: 'Field Force & Sales Desk',
                    badge: 'Field Exec',
                    icon: '🚗',
                    color: 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300',
                    desc: 'GPS Client Visits, Mileage KM & Instant Reimbursements'
                  },
                  {
                    id: 'emp-4',
                    name: 'Ananya Desai',
                    role: 'employee' as UserRole,
                    deskTitle: 'Personal Developer Desk',
                    badge: 'Sr Developer',
                    icon: '💻',
                    color: 'border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300',
                    desc: 'Shift Stopwatch, My Tasks, Leave Balance & Work Log'
                  },
                  {
                    id: 'emp-6',
                    name: 'Suresh Kumar',
                    role: 'admin' as UserRole,
                    deskTitle: 'Finance & GST Accounts',
                    badge: 'Accounts Lead',
                    icon: '📊',
                    color: 'border-slate-600 hover:border-slate-400 bg-slate-800/40 hover:bg-slate-800 text-slate-300',
                    desc: '18% GST Invoicing, Collections & Statutory Filing'
                  }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const emp = employees.find(e => e.id === p.id);
                      if (emp) {
                        setLoginEmail(emp.email);
                        setLoginRole(p.role);
                        login(emp.email, p.role);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${p.color}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.icon}</span>
                          <span className="font-bold text-white text-xs group-hover:text-blue-300">
                            {p.name}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white">
                          {p.badge}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-white mt-1">
                        {p.deskTitle}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {p.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400 group-hover:text-white mt-2">
                      <span className="font-mono text-emerald-400">● Auto Check-In</span>
                      <span className="font-bold flex items-center gap-1 text-white">
                        Enter Desk →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 uppercase">Or Enter Email & Password</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login(loginEmail, loginRole);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Workspace</label>
                <input
                  type="text"
                  disabled
                  value="Priority Ads Agency · AgencyOS (GST-Compliant)"
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-hidden focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                  <span>Remember this workdesk</span>
                </label>
                <button type="button" className="text-blue-400 hover:underline">
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign in to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>
      </div>
    );
  }

  // Active persona label matching screenshot
  const currentPersona = personas.find(p => p.id === currentUser.id) || personas[0];

  return (
    <div className="app">
      <OsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <OsTopbar onMenu={() => setSidebarOpen(true)} />
        <main className="page">
          <OsHeader />
          {!allowed && <div className="notice"><b>This screen is not available for your role.</b>&nbsp;Ask the Founder to switch it ON in the Permission Matrix.</div>}
        <div className="os-embed">
          {allowed && renderOsPage(activeTab, openAddModal)}
          {allowed && (activeTab === 'dashboard' || activeTab === 'owner_desk') && (
            <RoleDashboardView onOpenAddModal={openAddModal} forcedDesk="executive" />
          )}
          {allowed && activeTab === 'hr_desk' && (
            <RoleDashboardView onOpenAddModal={openAddModal} forcedDesk="hr" />
          )}
          {allowed && activeTab === 'pm_desk' && (
            <RoleDashboardView onOpenAddModal={openAddModal} forcedDesk="pm" />
          )}
          {allowed && activeTab === 'field_force_desk' && (
            <RoleDashboardView onOpenAddModal={openAddModal} forcedDesk="field" />
          )}
          {allowed && activeTab === 'employee_desk' && (
            <RoleDashboardView onOpenAddModal={openAddModal} forcedDesk="employee" />
          )}
          {allowed && activeTab === 'analytics' && <AnalyticsView />}
          {allowed && activeTab === 'attendance' && <AttendanceModule onOpenRegularizeModal={() => openAddModal('regularization')} />}
          {allowed && activeTab === 'leave' && <LeaveManagementModule />}
          {allowed && activeTab === 'hr_onboarding' && <HrPayrollModule key="hr_onboarding" initialTab="onboarding" />}
          {allowed && activeTab === 'hr_payroll' && <HrPayrollModule key="hr_payroll" initialTab="payroll" />}
          <AgencyWatchers />
          <ForcePasswordChange />
          {allowed && activeTab === 'finance_desk' && <FinanceDashboard onOpen={setActiveTab} />}
          {allowed && activeTab === 'access_admin' && <AccessAdmin />}
          {allowed && activeTab === 'document_center' && <DocumentCenter />}
          {allowed && activeTab === 'business_finance' && <FinanceBook />}
          {allowed && activeTab === 'client_reimbursements' && <ClientReimbursementModule />}
          {allowed && activeTab.startsWith('deals_') && <DealsModule initialTab={activeTab.slice(6) as DealsTab} />}
          {allowed && activeTab === 'field_gps' && <FieldGpsModule />}
          {allowed && activeTab === 'field_force' && (
            <FieldForceModule
              onOpenStartVisitModal={() => openAddModal('field_visit')}
              onOpenExpenseModal={(vId) => openAddModal('field_expense', { visitId: vId })}
            />
          )}
          {allowed && (activeTab === 'crm' || activeTab === 'leads') && (
            <CrmModule
              initialSubTab="leads"
              onOpenAddLeadModal={() => openAddModal('lead')}
              onOpenAddClientModal={() => openAddModal('client')}
            />
          )}
          {allowed && activeTab === 'clients' && (
            <CrmModule
              initialSubTab="clients"
              onOpenAddLeadModal={() => openAddModal('lead')}
              onOpenAddClientModal={() => openAddModal('client')}
            />
          )}
          {allowed && activeTab === 'projects' && (
            <ProjectsTasksModule
              initialViewMode="projects"
              onOpenAddProjectModal={() => openAddModal('project')}
              onOpenAddTaskModal={() => openAddModal('task')}
              onOpenDailyActivityModal={(taskId, projectId) => openAddModal('daily_activity', { taskId, projectId })}
            />
          )}
          {allowed && activeTab === 'task_operations' && (
            <ProjectsTasksModule
              initialViewMode="task_operations"
              onOpenAddProjectModal={() => openAddModal('project')}
              onOpenAddTaskModal={() => openAddModal('task')}
              onOpenDailyActivityModal={(taskId, projectId) => openAddModal('daily_activity', { taskId, projectId })}
            />
          )}
          {allowed && activeTab === 'my_tasks' && (
            <ProjectsTasksModule
              initialViewMode="my_tasks"
              onOpenAddProjectModal={() => openAddModal('project')}
              onOpenAddTaskModal={() => openAddModal('task')}
              onOpenDailyActivityModal={(taskId, projectId) => openAddModal('daily_activity', { taskId, projectId })}
            />
          )}
          {allowed && activeTab === 'reimbursements' && (
            <ReimbursementsPayrollModule
              onOpenAddReimbursementModal={() => openAddModal('reimbursement')}
            />
          )}
          {allowed && activeTab === 'billing' && (
            <SalesBillingModule
              onOpenCreateQuotationModal={() => openAddModal('quotation')}
              onOpenCreateInvoiceModal={() => openAddModal('invoice')}
              onOpenRecordPaymentModal={(invId) => openAddModal('payment', { invoiceId: invId })}
              onOpenAddExpenseModal={() => openAddModal('expense')}
            />
          )}
          {allowed && activeTab === 'employees' && (
            <EmployeesModule
              onOpenAddEmployeeModal={() => openAddModal('employee')}
            />
          )}
          {allowed && activeTab === 'audit_settings' && <AuditSettingsModule />}
        </div>

        </main>
      </div>
      <ToastHost />

      {/* Global Modals & Document Viewer */}
      <DocumentViewerModal />
      <AddEntityModals
        modalType={modalType}
        onClose={closeAddModal}
        contextData={modalContextData}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
