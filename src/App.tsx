import React, { useState, useEffect } from 'react';
import { RoleLogin } from './components/RoleLogin'; // AGENCYOS_V2_PART4
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
  if (!isAuthenticated) return <RoleLogin />;
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased">

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/logo-wide.png" alt={company.name} data-x="AGENCYOS_V2_PART18" className="h-10 w-auto bg-white rounded-lg px-1" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SIDEBAR NAVIGATION — EXACT REPRODUCTION FROM SCREENSHOT */}
      {/* ======================================================== */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800
        transform md:translate-x-0 transition-transform duration-200 flex flex-col justify-between
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Brand Lockup: Blue icon with letter A + AgencyOS ERP */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-center">
            <img src="/logo-wide.png" alt={company.name} data-x="AGENCYOS_V2_PART18" className="w-full max-w-[220px] h-auto bg-white rounded-xl px-2 py-1.5 shadow-sm" />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3.5 space-y-4 overflow-y-auto flex-grow text-xs">

          {/* SECTION: ROLE WORKDESKS (Dedicated Desks for Owner, HR, PM, Field Force, Staff) */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
              <span>ROLE WORKDESKS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </div>

            <div className="space-y-0.5">
              <button
                hidden={!canAccess(currentRole, 'owner_desk')}
                onClick={() => { setActiveTab('owner_desk'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer text-left ${
                  activeTab === 'owner_desk' || activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>👑</span>
                <span>Owner Executive Desk</span>
              </button>

              <button
                hidden={!canAccess(currentRole, 'hr_desk')}
                onClick={() => { setActiveTab('hr_desk'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
                  activeTab === 'hr_desk'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>👔</span>
                <span>HR Manager Command</span>
              </button>

              <button
                hidden={!canAccess(currentRole, 'pm_desk')}
                onClick={() => { setActiveTab('pm_desk'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
                  activeTab === 'pm_desk'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>💼</span>
                <span>Project Delivery Matrix</span>
              </button>

              <button
                hidden={!canAccess(currentRole, 'field_force_desk')}
                onClick={() => { setActiveTab('field_force_desk'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
                  activeTab === 'field_force_desk'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🚗</span>
                <span>Field Force Operations</span>
              </button>

              <button
                hidden={!canAccess(currentRole, 'employee_desk')}
                onClick={() => { setActiveTab('employee_desk'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
                  activeTab === 'employee_desk'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>💻</span>
                <span>My Employee Workdesk</span>
              </button>

            </div>
          </div>

          {/* SECTION: HR & PEOPLE */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('hr')}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span>HR & PEOPLE</span>
              {collapsedSections.hr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!collapsedSections.hr && (
              <div className="space-y-0.5 pl-1">
                <button
                  hidden={!canAccess(currentRole, 'employees')}
                  onClick={() => { setActiveTab('employees'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'employees'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Employees Directory</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'attendance')}
                  onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'attendance'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Attendance Desk</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'leave')}
                  onClick={() => { setActiveTab('leave'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'leave'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Leave Management</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'hr_onboarding')}
                  onClick={() => { setActiveTab('hr_onboarding'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'hr_onboarding'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Onboarding & Contracts</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'hr_payroll')}
                  onClick={() => { setActiveTab('hr_payroll'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'hr_payroll'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Payroll & Payslips</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: CRM */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('crm')}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span>CRM</span>
              {collapsedSections.crm ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!collapsedSections.crm && (
              <div className="space-y-0.5 pl-1">
                <button
                  hidden={!canAccess(currentRole, 'leads')}
                  onClick={() => { setActiveTab('leads'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'leads'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Leads</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'clients')}
                  onClick={() => { setActiveTab('clients'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'clients'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Clients</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'deals_quotations')}
                  onClick={() => { setActiveTab('deals_quotations'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Quotations</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'deals_agreements')}
                  onClick={() => { setActiveTab('deals_agreements'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                >
                  <FileCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Agreements</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'document_center')}
                  onClick={() => { setActiveTab('document_center'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'document_center'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Document Center</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: WORK */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('work')}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span>WORK</span>
              {collapsedSections.work ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!collapsedSections.work && (
              <div className="space-y-0.5 pl-1">
                <button
                  hidden={!canAccess(currentRole, 'projects')}
                  onClick={() => { setActiveTab('projects'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'projects'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Projects</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'task_operations')}
                  onClick={() => { setActiveTab('task_operations'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'task_operations'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Tasks Operations</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'my_tasks')}
                  onClick={() => { setActiveTab('my_tasks'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'my_tasks'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <ListTodo className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>My Tasks</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'deals_sow')}
                  onClick={() => { setActiveTab('deals_sow'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'deals_sow'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Scope of Work</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'deals_templates')}
                  onClick={() => { setActiveTab('deals_templates'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'deals_templates'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Project Templates</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: FINANCE - all money screens in one place (AGENCYOS_V2_PART15) */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('finance')}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span>FINANCE</span>
              {collapsedSections.finance ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!collapsedSections.finance && (
              <div className="space-y-0.5 pl-1">
                <button
                  hidden={!canAccess(currentRole, 'finance_desk')}
                  onClick={() => { setActiveTab('finance_desk'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'finance_desk'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Finance Dashboard</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'business_finance')}
                  onClick={() => { setActiveTab('business_finance'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'business_finance'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Finance & Cash Book</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'billing')}
                  onClick={() => { setActiveTab('billing'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'billing'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Invoices & Collections</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'deals_installments')}
                  onClick={() => { setActiveTab('deals_installments'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'deals_installments'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Instalments & Receipts</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'reimbursements')}
                  onClick={() => { setActiveTab('reimbursements'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'reimbursements'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Employee Reimbursement</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'client_reimbursements')}
                  onClick={() => { setActiveTab('client_reimbursements'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'client_reimbursements'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Client Reimbursement</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'hr_payroll')}
                  onClick={() => { setActiveTab('hr_payroll'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'hr_payroll'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Payroll & Payslips</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: FIELD FORCE */}
          <div className="space-y-1">
            <button
              onClick={() => toggleSection('fieldforce')}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span>FIELD FORCE</span>
              {collapsedSections.fieldforce ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!collapsedSections.fieldforce && (
              <div className="space-y-0.5 pl-1">
                <button
                  hidden={!canAccess(currentRole, 'field_force')}
                  onClick={() => { setActiveTab('field_force'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'field_force'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Client Field Visits</span>
                </button>

                <button
                  hidden={!canAccess(currentRole, 'field_gps')}
                  onClick={() => { setActiveTab('field_gps'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                    activeTab === 'field_gps'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Field Visit GPS</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION: SYSTEM & AUDIT */}
          <div className="space-y-0.5 pt-1">
            <button
              hidden={!canAccess(currentRole, 'audit_settings')}
              onClick={() => { setActiveTab('audit_settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                activeTab === 'audit_settings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Audit Logs & Rules</span>
            </button>

              <button
                hidden={!canAccess(currentRole, 'access_admin')}
                onClick={() => { setActiveTab('access_admin'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                  activeTab === 'access_admin'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Users & Login</span>
              </button>
          </div>

        </div>

        {/* Sidebar Bottom Profile: Matching Rajesh Sharma in screenshot */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate block">
                {currentRole.replace('_', ' ')} · Online
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out (Auto Check-Out Attendance)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* ======================================================== */}
      {/* MAIN VIEWPORT CANVAS */}
      {/* ======================================================== */}
      <main className="md:ml-64 flex-1 flex flex-col min-w-0">

        {/* Top Header Bar — EXACT REPRODUCTION FROM SCREENSHOT */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30">

          {/* Left: Breadcrumbs + Large Page Title */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 tracking-wide">
              {company.name} / {activeTab === 'dashboard' ? 'Executive Overview' : activeTab.replace('_', ' ')}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {activeTab === 'dashboard' ? 'Executive Overview' : activeTab.replace('_', ' ').toUpperCase()}
            </h2>
          </div>

          {/* Right Controls: ACTIVE PERSONA dropdown, GST badge, notification bell, exit */}
          <div className="flex items-center gap-3 shrink-0">

            <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
              {currentUser.name} - {ROLE_LABEL[currentRole] || currentRole}
            </div>

            {/* INR (₹) GST-Compliant badge matching screenshot */}
            <div className="px-3 py-1.5 rounded-lg bg-[#FEF9C3] dark:bg-amber-950/60 border border-[#FDE047] dark:border-amber-800 text-[11px] font-bold text-[#854D0E] dark:text-amber-300">
              INR (₹) GST-Compliant
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500"></span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
                    <span className="text-[10px] text-slate-500 font-mono">{unreadNotifs.length} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.linkTab) setActiveTab(n.linkTab);
                          setNotifDropdownOpen(false);
                        }}
                        className={`p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${n.read ? 'opacity-70' : 'font-semibold'}`}
                      >
                        <p className="text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-[11px] text-slate-500 font-normal">{n.message}</p>
                        <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button with clear label to return to login page */}
            <button
              onClick={logout}
              title="Sign Out to Login Page (Auto Check-Out Attendance)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900 text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

          </div>
        </header>

        {/* Viewport Content Area */}
        <div className="p-4 md:p-8 flex-grow">
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

        {/* Minimal Bottom Bar */}
        <footer className="px-8 py-3.5 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AgencyOS · Priority Ads Agency Operations Portal</span>
          <span className="font-mono text-[11px]">Bangalore HQ · GSTIN: {company.gstNumber}</span>
        </footer>

      </main>

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
