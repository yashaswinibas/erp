import {
  CompanyConfig,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
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
  AttendanceRegularizationRequest,
  LeaveRequest,
  LeaveBalance
} from '../types';

export const INITIAL_COMPANY: CompanyConfig = {
  name: "Priority Ads Agency",
  tagline: "Your success is our priority",
  code: "AGENCY-OS",
  address: "SV Arcade No.116, Gurunath Layout, Opp Bus Stop Huralichikkanahalli Hesragatta Main Road Bangalore -560090",
  phone: "+91 7760665912",
  email: "rajesh.sharma@priorityadsagency.com",
  website: "www.priorityadsagency.com",
  gstNumber: "29AAACP9812K1Z8",
  panNumber: "AAACP9812K",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  officeStartTime: "09:30",
  officeEndTime: "18:30",
  graceMinutes: 15,
  minWorkingHoursFullDay: 8.0,
  minWorkingHoursHalfDay: 4.0,
  logoUrl: "/logo.png",
  stampUrl: "/assets/aistudio/image_0f46d769.png"
};

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Executive & Strategy', code: 'EXEC', employeeCount: 2, description: 'Executive leadership & business direction' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', employeeCount: 1, description: 'Talent acquisition, payroll, and culture' },
  { id: 'dept-3', name: 'Engineering & Development', code: 'ENG', employeeCount: 2, description: 'Web, mobile, AI systems and technical delivery' },
  { id: 'dept-4', name: 'Sales & Field Force', code: 'SALES', employeeCount: 1, description: 'Client acquisition, field visits, and CRM' },
  { id: 'dept-5', name: 'Finance & Accounts', code: 'FIN', employeeCount: 1, description: 'Billing, payroll processing, and audit' },
  { id: 'dept-6', name: 'Creative & Digital Media', code: 'MEDIA', employeeCount: 1, description: 'Ad campaigns, branding, and content creation' },
];

export const INITIAL_DESIGNATIONS: Designation[] = [
  { id: 'desig-1', title: 'Managing Director & CEO', departmentId: 'dept-1', level: 'L6' },
  { id: 'desig-2', title: 'Lead HR Manager', departmentId: 'dept-2', level: 'L4' },
  { id: 'desig-3', title: 'Technical Project Manager', departmentId: 'dept-3', level: 'L4' },
  { id: 'desig-4', title: 'Senior AI & Full Stack Developer', departmentId: 'dept-3', level: 'L3' },
  { id: 'desig-5', title: 'Senior Field Sales Executive', departmentId: 'dept-4', level: 'L2' },
  { id: 'desig-6', title: 'Finance & Operations Lead', departmentId: 'dept-5', level: 'L4' },
  { id: 'desig-7', title: 'Co-Founder & Director', departmentId: 'dept-1', level: 'L6' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'PAA-EMP-001',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@priorityadsagency.com',
    phone: '+91 9845011223',
    phone2: '+91 9845099882',
    dateOfBirth: '1985-04-12',
    joiningDate: '2020-01-10',
    departmentId: 'dept-1',
    designationId: 'desig-1',
    employmentType: 'Full-time',
    assignedProjectIds: ['prj-1', 'prj-2', 'prj-3'],
    salary: { basic: 85000, hra: 34000, allowances: 28000, incentives: 25000, bonus: 18000, deductions: 6000, netSalary: 184000 },
    workLocation: 'Bangalore HQ',
    workMode: 'office',
    skills: ['Executive Leadership', 'P&L Management', 'Digital Strategy', 'Brand Advisory'],
    experienceYears: 15,
    role: 'super_admin',
    status: 'active'
  },
  {
    id: 'emp-2',
    employeeId: 'PAA-EMP-002',
    name: 'Priya Sharma',
    email: 'priya.sharma@priorityadsagency.com',
    phone: '+91 9845012345',
    phone2: '+91 9845098765',
    dateOfBirth: '1990-11-20',
    joiningDate: '2022-03-01',
    departmentId: 'dept-2',
    designationId: 'desig-2',
    employmentType: 'Full-time',
    reportingManagerId: 'emp-1',
    assignedProjectIds: [],
    salary: { basic: 40000, hra: 16000, allowances: 12000, incentives: 5000, bonus: 4000, deductions: 3500, netSalary: 73500 },
    workLocation: 'Bangalore HQ',
    workMode: 'office',
    skills: ['Talent Management', 'Statutory Compliance', 'Payroll', 'Performance Appraisal'],
    experienceYears: 7,
    role: 'hr',
    status: 'active'
  },
  {
    id: 'emp-3',
    employeeId: 'PAA-EMP-003',
    name: 'Karthik Rao',
    email: 'karthik.rao@priorityadsagency.com',
    phone: '+91 9742299881',
    phone2: '+91 9742211223',
    dateOfBirth: '1988-04-12',
    joiningDate: '2022-08-15',
    departmentId: 'dept-3',
    designationId: 'desig-3',
    employmentType: 'Full-time',
    reportingManagerId: 'emp-1',
    assignedProjectIds: ['prj-1', 'prj-2'],
    salary: { basic: 55000, hra: 22000, allowances: 15000, incentives: 8000, bonus: 6000, deductions: 4200, netSalary: 101800 },
    workLocation: 'Bangalore HQ',
    workMode: 'office',
    skills: ['Agile / Scrum', 'Project Delivery', 'Architecture', 'Client Management'],
    experienceYears: 9,
    role: 'project_manager',
    status: 'active'
  },
  {
    id: 'emp-4',
    employeeId: 'PAA-EMP-004',
    name: 'Ananya Desai',
    email: 'ananya.desai@priorityadsagency.com',
    phone: '+91 9988776655',
    phone2: '+91 9988776600',
    dateOfBirth: '1995-09-08',
    joiningDate: '2023-05-02',
    departmentId: 'dept-3',
    designationId: 'desig-4',
    employmentType: 'Full-time',
    reportingManagerId: 'emp-3',
    projectManagerId: 'emp-3',
    hrId: 'emp-2',
    assignedProjectIds: ['prj-1'],
    assignedClientId: 'cl-1',
    salary: { basic: 45000, hra: 18000, allowances: 12000, incentives: 6000, bonus: 5000, deductions: 3800, netSalary: 82200 },
    workLocation: 'Bangalore HQ',
    workMode: 'office',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'AI Engineering'],
    experienceYears: 4,
    role: 'employee',
    status: 'active'
  },
  {
    id: 'emp-5',
    employeeId: 'PAA-EMP-005',
    name: 'Rahul Verma',
    email: 'rahul.verma@priorityadsagency.com',
    phone: '+91 9123456789',
    phone2: '+91 9123459999',
    dateOfBirth: '1994-01-25',
    joiningDate: '2023-02-14',
    departmentId: 'dept-4',
    designationId: 'desig-5',
    employmentType: 'Full-time',
    reportingManagerId: 'emp-1',
    projectManagerId: 'emp-3',
    hrId: 'emp-2',
    assignedProjectIds: ['prj-2', 'prj-3'],
    assignedClientId: 'cl-2',
    salary: { basic: 32000, hra: 12800, allowances: 10000, incentives: 15000, bonus: 4000, deductions: 2800, netSalary: 71000 },
    workLocation: 'Field / On-Site',
    workMode: 'field',
    skills: ['B2B Sales', 'Client Engagement', 'Negotiation', 'Outdoor Ad Activation', 'Field CRM'],
    experienceYears: 5,
    role: 'employee',
    status: 'active'
  },
  {
    id: 'emp-6',
    employeeId: 'PAA-EMP-006',
    name: 'Suresh Kumar',
    email: 'suresh.kumar@priorityadsagency.com',
    phone: '+91 9448102938',
    dateOfBirth: '1986-07-30',
    joiningDate: '2021-06-01',
    departmentId: 'dept-5',
    designationId: 'desig-6',
    employmentType: 'Full-time',
    reportingManagerId: 'emp-1',
    assignedProjectIds: [],
    salary: { basic: 48000, hra: 19200, allowances: 14000, incentives: 4000, bonus: 5000, deductions: 4000, netSalary: 82200 },
    workLocation: 'Bangalore HQ',
    workMode: 'office',
    skills: ['Statutory Invoicing', 'GST Filing', 'Accounts Receivable', 'Vendor Audits'],
    experienceYears: 11,
    role: 'admin',
    status: 'active'
  },
  {
    id: 'emp-7',
    employeeId: 'PAA-EMP-007',
    name: 'Ningappa B.',
    email: 'ningappa@priorityadsagency.com',
    phone: '+91 7760665912',
    dateOfBirth: '1982-08-10',
    joiningDate: '2020-01-10',
    departmentId: 'dept-1',
    designationId: 'desig-7',
    employmentType: 'Full-time',
    assignedProjectIds: ['prj-1', 'prj-2', 'prj-3'],
    salary: { basic: 85000, hra: 34000, allowances: 28000, incentives: 25000, bonus: 18000, deductions: 6000, netSalary: 184000 },
    workLocation: 'Bangalore HQ',
    workMode: 'office',
    skills: ['Co-Founder & Director', 'Authorized Signatory', 'Business Operations'],
    experienceYears: 16,
    role: 'super_admin',
    status: 'active'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:18 AM',
    checkOut: '',
    workingHours: 0,
    status: 'present',
    workMode: 'office',
    remarks: 'Super Admin active session'
  },
  {
    id: 'att-2',
    employeeId: 'emp-2',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:25 AM',
    checkOut: '',
    workingHours: 0,
    status: 'present',
    workMode: 'office',
    remarks: 'On time'
  },
  {
    id: 'att-3',
    employeeId: 'emp-3',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:35 AM',
    checkOut: '',
    workingHours: 0,
    status: 'present',
    workMode: 'office',
    remarks: 'Sprint planning'
  },
  {
    id: 'att-4',
    employeeId: 'emp-4',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:40 AM',
    checkOut: '',
    workingHours: 0,
    status: 'present',
    workMode: 'office',
    remarks: 'Code review & API dev'
  },
  {
    id: 'att-5',
    employeeId: 'emp-5',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15 AM',
    checkOut: '',
    workingHours: 0,
    status: 'field_visit',
    workMode: 'field',
    remarks: 'Brigade Road client visit'
  },
  {
    id: 'att-6',
    employeeId: 'emp-6',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:20 AM',
    checkOut: '',
    workingHours: 0,
    status: 'present',
    workMode: 'office',
    remarks: 'Month-end billing reconciliation'
  }
];

export const INITIAL_REGULARIZATIONS: AttendanceRegularizationRequest[] = [
  {
    id: 'reg-1',
    employeeId: 'emp-5',
    date: '2026-10-30',
    correctCheckIn: '09:20 AM',
    correctCheckOut: '07:15 PM',
    reason: 'Was stuck in rain returning from Whitefield client site; phone battery died before manual check-out.',
    status: 'pending',
    requestedAt: '2026-10-31 09:15 AM'
  }
];

// Screenshot shows: Active Clients: 3 (Total 4 onboarded accounts, 1 in pipeline)
export const INITIAL_LEADS: Lead[] = [
  {
    id: 'ld-1',
    leadCode: 'PAA-LD-201',
    name: 'Prestige Tech Park Hub',
    company: 'Prestige Estates Projects Ltd',
    contactPerson: 'Mr. Arvind Swaminathan',
    email: 'arvind.s@prestigeconstructions.com',
    phone: '+91 9845123980',
    phone2: '+91 9448011223',
    source: 'Direct Referral',
    serviceRequired: 'Digital Billboards & Meta Ad Funnel',
    estimatedValue: 480000,
    status: 'proposal',
    priority: 'high',
    assignedEmployeeId: 'emp-5',
    followUpDate: '2026-11-05',
    notes: 'Requires 4 outdoor digital boards along Outer Ring Road plus targeted B2B lead generation.',
    createdAt: '2026-10-18'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cl-1',
    clientCode: 'PAA-CL-041',
    companyName: 'Brigade Tech Ventures',
    contactPerson: 'Rajesh Narayan',
    email: 'rajesh.narayan@brigadegroup.com',
    phone: '+91 9880192837',
    phone2: '+91 9448112233',
    website: 'www.brigadetechventures.com',
    address: 'World Trade Center, Brigade Gateway Campus, Rajajinagar, Bangalore - 560055',
    gstNumber: '29AABCB1234D1Z2',
    billingAddress: 'World Trade Center, 26th Floor, Rajajinagar, Bangalore - 560055',
    accountManagerId: 'emp-5',
    services: ['Digital Marketing', 'Meta Ads', 'Google Ads', 'Portal Development'],
    status: 'active',
    notes: 'Key enterprise account. Monthly ad retainer.',
    createdAt: '2025-06-12'
  },
  {
    id: 'cl-2',
    clientCode: 'PAA-CL-042',
    companyName: 'Phoenix Mall Outlets Consortium',
    contactPerson: 'Tanvi Mehra',
    email: 'tanvi.m@phoenixmarketcity.in',
    phone: '+91 9900881122',
    phone2: '+91 9845998877',
    website: 'www.phoenixmarketcity.com/bangalore',
    address: 'Whitefield Main Road, Mahadevapura, Bangalore - 560048',
    gstNumber: '29AAACP5566G1Z4',
    billingAddress: 'Whitefield Main Road, Bangalore - 560048',
    accountManagerId: 'emp-5',
    services: ['Outdoor LED Billboards', 'Footfall Campaign', 'Influencer Marketing'],
    status: 'active',
    notes: 'Diwali & festive billboard campaigns running with high ROI.',
    createdAt: '2025-09-01'
  },
  {
    id: 'cl-3',
    clientCode: 'PAA-CL-043',
    companyName: 'Greenline Mobility Solutions',
    contactPerson: 'Sanjay Reddy',
    email: 'sanjay@greenlinemobility.com',
    phone: '+91 9741005544',
    phone2: '+91 9980223344',
    website: 'www.greenlinemobility.com',
    address: 'Indiranagar 100ft Road, Stage 2, Bangalore - 560038',
    gstNumber: '29AABCG7788M1Z9',
    billingAddress: 'Indiranagar 100ft Road, Bangalore - 560038',
    accountManagerId: 'emp-5',
    services: ['Brand Launch', 'Corporate Video', 'Performance Marketing'],
    status: 'active',
    notes: 'EV Mobility fleet promotion.',
    createdAt: '2026-01-15'
  },
  {
    id: 'cl-4',
    clientCode: 'PAA-CL-044',
    companyName: 'Urban Habitat Living Spaces',
    contactPerson: 'Deepak Mohan',
    email: 'deepak@urbanhabitat.co.in',
    phone: '+91 9886001122',
    phone2: '+91 9731445566',
    website: 'www.urbanhabitat.co.in',
    address: 'Koramangala 80ft Road, Bangalore - 560034',
    gstNumber: '29AABCU9900K1Z5',
    billingAddress: 'Koramangala 80ft Road, Bangalore - 560034',
    accountManagerId: 'emp-5',
    services: ['SEO & Digital Advertising'],
    status: 'onboarding',
    notes: 'Onboarded account.',
    createdAt: '2026-02-10'
  }
];

export const INITIAL_FIELD_VISITS: FieldVisit[] = [
  {
    id: 'vst-1',
    visitCode: 'PAA-VST-310',
    employeeId: 'emp-5',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:45 AM',
    endTime: '12:15 PM',
    durationMinutes: 90,
    clientId: 'cl-1',
    companyName: 'Brigade Tech Ventures',
    contactPerson: 'Rajesh Narayan',
    visitType: 'Client Meeting',
    purpose: 'Quarterly review of Q4 Meta ad performance and proposal for AI lead scoring revamp.',
    meetingLocation: 'Client Office',
    address: 'World Trade Center, 26th Floor, Malleshwaram-Rajajinagar, Bangalore',
    projectId: 'prj-1',
    service: 'Digital Marketing & Portal',
    expectedOutcome: 'Client approves 20% budget hike for Q1 2027 campaigns.',
    actualOutcome: 'Reviewed 4.2x ROAS data. Rajesh agreed to the budget expansion and requested updated contract by Friday.',
    discussionSummary: 'Covered conversion metrics, cost per acquisition drop, and previewed new dashboard modules.',
    followUpRequired: true,
    nextFollowUpDate: '2026-11-06',
    remarks: 'Very positive meeting. Handed over physical sample print reports.',
    status: 'completed',
    expensesTotal: 650,
    reimbursementId: 'rmb-1'
  }
];

export const INITIAL_REIMBURSEMENTS: Reimbursement[] = [
  {
    id: 'rmb-1',
    reimbursementCode: 'PAA-RMB-501',
    employeeId: 'emp-5',
    date: new Date().toISOString().split('T')[0],
    category: 'Travel',
    amount: 650,
    description: 'Fuel (₹450) and toll/parking (₹200) for client visit to Brigade Tech Ventures (WTC Malleshwaram).',
    projectId: 'prj-1',
    clientId: 'cl-1',
    fieldVisitId: 'vst-1',
    paymentMethod: 'UPI / Direct Bank',
    receiptName: 'fuel_wtc_parking_receipt.jpg',
    remarks: 'Auto-linked from Field Visit PAA-VST-310.',
    status: 'approved',
    reviewedBy: 'Priya Sharma (HR)',
    approvalRemarks: 'Valid travel expense for scheduled client meeting.'
  },
  {
    id: 'rmb-2',
    reimbursementCode: 'PAA-RMB-502',
    employeeId: 'emp-5',
    date: new Date().toISOString().split('T')[0],
    category: 'Client Meeting',
    amount: 1840,
    description: 'Lunch meeting with VP Marketing & Retail Head of Phoenix Marketcity at Indiranagar.',
    projectId: 'prj-2',
    clientId: 'cl-2',
    paymentMethod: 'Corporate Card / UPI',
    receiptName: 'indiranagar_client_lunch.pdf',
    remarks: 'Discussed Diwali campaign screen footprint.',
    status: 'submitted',
    approvalRemarks: 'Pending review by HR'
  },
  {
    id: 'rmb-3',
    reimbursementCode: 'PAA-RMB-503',
    employeeId: 'emp-5',
    date: '2026-10-31',
    category: 'Fuel',
    amount: 720,
    description: 'Bike Mileage (90 KM @ ₹8/KM) for Prestige Tech Park & Manyata Embassy field lead pitches.',
    paymentMethod: 'UPI / Cash',
    receiptName: 'odometer_mileage_log_oct31.jpg',
    remarks: 'Covered ORR & Hebbal route.',
    status: 'approved',
    reviewedBy: 'Rajesh Sharma (MD)',
    approvalRemarks: 'Standard bike mileage verified against GPS timestamps.'
  },
  {
    id: 'rmb-4',
    reimbursementCode: 'PAA-RMB-504',
    employeeId: 'emp-4',
    date: '2026-10-29',
    category: 'Software',
    amount: 2450,
    description: 'Cloudflare enterprise DNS routing and staging SSL certificates for client portal deployment.',
    projectId: 'prj-1',
    clientId: 'cl-1',
    paymentMethod: 'Credit Card',
    receiptName: 'cloudflare_invoice_inv_8821.pdf',
    remarks: 'Approved for client live deployment.',
    status: 'paid',
    reviewedBy: 'Suresh Kumar (Finance)',
    approvalRemarks: 'Verified against technical invoice. Disbursed via Bank Transfer.',
    paidDate: '2026-10-30'
  },
  {
    id: 'rmb-5',
    reimbursementCode: 'PAA-RMB-505',
    employeeId: 'emp-3',
    date: '2026-10-27',
    category: 'Office Supplies',
    amount: 3750,
    description: 'High-resolution vinyl flex test prints & backlit outdoor banner proof samples for Greenline EV review.',
    projectId: 'prj-3',
    clientId: 'cl-3',
    paymentMethod: 'Company UPI',
    receiptName: 'color_craft_prints_bill.pdf',
    remarks: 'Client signed physical proofs.',
    status: 'paid',
    reviewedBy: 'Priya Sharma (HR)',
    approvalRemarks: 'Official production samples approved.',
    paidDate: '2026-10-28'
  },
  {
    id: 'rmb-6',
    reimbursementCode: 'PAA-RMB-506',
    employeeId: 'emp-2',
    date: '2026-10-25',
    category: 'Food',
    amount: 1250,
    description: 'Refreshments & team snacks during monthly employee townhall & onboarding session.',
    paymentMethod: 'Google Pay',
    receiptName: 'chai_point_townhall.pdf',
    remarks: 'HR team engagement expenses.',
    status: 'paid',
    reviewedBy: 'Rajesh Sharma (MD)',
    approvalRemarks: 'Monthly team allowance.',
    paidDate: '2026-10-26'
  },
  {
    id: 'rmb-7',
    reimbursementCode: 'PAA-RMB-507',
    employeeId: 'emp-5',
    date: '2026-10-24',
    category: 'Transportation',
    amount: 1950,
    description: 'Cab fare & highway toll for client site emergency meeting at Mysore Road Industrial Hub.',
    paymentMethod: 'Uber / Fastag',
    receiptName: 'uber_mysore_highway.pdf',
    remarks: 'Emergency on-site visit for banner alignment.',
    status: 'submitted',
    approvalRemarks: 'Under review by Finance'
  }
];

// Screenshot shows: 3 Active Projects
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-1',
    projectCode: 'PAA-PRJ-011',
    name: 'Brigade Omnichannel Performance & Portal',
    clientId: 'cl-1',
    projectManagerId: 'emp-3',
    assignedEmployeeIds: ['emp-3', 'emp-4', 'emp-5'],
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    budget: 1250000,
    status: 'active',
    priority: 'high',
    description: 'High-converting lead portal, integrated analytics dashboard, and automated WhatsApp CRM funnel.'
  },
  {
    id: 'prj-2',
    projectCode: 'PAA-PRJ-012',
    name: 'Phoenix Festive Billboard & Footfall Campaign',
    clientId: 'cl-2',
    projectManagerId: 'emp-3',
    assignedEmployeeIds: ['emp-3', 'emp-5'],
    startDate: '2026-09-15',
    endDate: '2026-11-30',
    budget: 850000,
    status: 'active',
    priority: 'high',
    description: 'Outdoor DOOH advertising screens across Whitefield and East Bangalore with real-time QR footfall tracking.'
  },
  {
    id: 'prj-3',
    projectCode: 'PAA-PRJ-013',
    name: 'Greenline EV Mobility Launch Sprint',
    clientId: 'cl-3',
    projectManagerId: 'emp-3',
    assignedEmployeeIds: ['emp-3', 'emp-4', 'emp-5'],
    startDate: '2026-11-01',
    endDate: '2027-01-31',
    budget: 550000,
    status: 'active',
    priority: 'medium',
    description: 'Brand identity assets, corporate intro video, and targeted B2B logistics ad campaign.'
  }
];

// Screenshot shows: 4 Pending Delivery Tasks
export const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-1',
    taskCode: 'PAA-TSK-81',
    projectId: 'prj-1',
    clientId: 'cl-1',
    title: 'Lead Capture Webhook & Analytics Sync',
    description: 'Build backend webhook receiver for Meta Lead Gen and route leads in real-time to executive CRM.',
    assignedEmployeeId: 'emp-4',
    managerId: 'emp-3',
    projectManagerId: 'emp-3',
    priority: 'high',
    status: 'in_progress',
    startDate: '2026-10-28',
    dueDate: '2026-11-04',
    estimatedHours: 24,
    actualHours: 18
  },
  {
    id: 'tsk-2',
    taskCode: 'PAA-TSK-82',
    projectId: 'prj-1',
    clientId: 'cl-1',
    title: 'Executive Analytics Performance Report',
    description: 'Compile monthly CAC, ROAS, and conversion funnel figures into the official Priority Ads Agency format.',
    assignedEmployeeId: 'emp-4',
    managerId: 'emp-3',
    projectManagerId: 'emp-3',
    priority: 'medium',
    status: 'review',
    startDate: '2026-10-25',
    dueDate: '2026-11-02',
    estimatedHours: 12,
    actualHours: 11
  },
  {
    id: 'tsk-3',
    taskCode: 'PAA-TSK-83',
    projectId: 'prj-2',
    clientId: 'cl-2',
    title: 'Billboard Footfall QR Code Dynamic Generator',
    description: 'Generate UTM-tagged dynamic QR codes for each physical screen location in Whitefield.',
    assignedEmployeeId: 'emp-5',
    managerId: 'emp-3',
    projectManagerId: 'emp-3',
    priority: 'urgent',
    status: 'in_progress',
    startDate: '2026-10-20',
    dueDate: '2026-11-08',
    estimatedHours: 16,
    actualHours: 15
  },
  {
    id: 'tsk-4',
    taskCode: 'PAA-TSK-84',
    projectId: 'prj-3',
    clientId: 'cl-3',
    title: 'Kickoff Scope Document & Agreement Drafting',
    description: 'Draft master service agreement for Greenline EV Mobility based on accepted quotation.',
    assignedEmployeeId: 'emp-3',
    managerId: 'emp-1',
    projectManagerId: 'emp-3',
    priority: 'high',
    status: 'todo',
    startDate: '2026-11-02',
    dueDate: '2026-11-06',
    estimatedHours: 10,
    actualHours: 2
  }
];

export const INITIAL_DAILY_ACTIVITIES: DailyActivity[] = [
  {
    id: 'act-1',
    employeeId: 'emp-4',
    date: new Date().toISOString().split('T')[0],
    projectId: 'prj-1',
    clientId: 'cl-1',
    taskId: 'tsk-1',
    completedWork: 'Built resilient webhook listener with signature verification and payload normalization.',
    workInProgress: 'Wiring event dispatch to send real-time SMS/Email notification upon new lead arrival.',
    pendingWork: 'Load testing with simulated concurrent 500 requests/sec.',
    hoursSpent: 5.5,
    blockers: 'None. Meta test token refreshed.',
    remarks: 'Ready for staging rollout tomorrow afternoon.',
    links: ['https://github.com/priorityads/lead-webhook'],
    createdAt: '2026-11-02 03:00 PM'
  }
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'qt-1',
    quotationNumber: 'PAA-QT-2026-088',
    clientId: 'cl-1',
    date: '2026-10-15',
    validUntil: '2026-11-15',
    title: 'Enterprise Digital Marketing & Ad Retainer (Q4 2026)',
    items: [
      { id: 'item-1', description: 'Meta & Google Ads Campaign Management & Media Optimization', quantity: 3, unit: 'Months', unitPrice: 75000, total: 225000 },
      { id: 'item-2', description: 'Creative Ad Sets Production (Static Graphics & Video Reels)', quantity: 24, unit: 'Creatives', unitPrice: 3500, total: 84000 },
      { id: 'item-3', description: 'AI Lead Automation Funnel & CRM Webhook Integration', quantity: 1, unit: 'Package', unitPrice: 65000, total: 65000 }
    ],
    subtotal: 374000,
    discount: 14000,
    taxPercent: 18,
    taxAmount: 64800,
    total: 424800,
    terms: '1. 50% advance on signing. 2. Media spend billed at actuals. 3. Scope modifications charged separately.',
    notes: 'Official quote prepared for Brigade Tech Ventures.',
    createdBy: 'Rajesh Sharma (Managing Director)',
    status: 'accepted'
  }
];

export const INITIAL_AGREEMENTS: Agreement[] = [
  {
    id: 'agr-1',
    agreementNumber: 'PAA-AGR-2026-031',
    quotationId: 'qt-1',
    clientId: 'cl-1',
    projectId: 'prj-1',
    title: 'Master Retainer & Advertising Services Agreement',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    terms: 'Comprehensive retainer covering ad strategy, creative production, and full-funnel lead attribution.',
    status: 'active',
    renewalDate: '2026-12-15'
  }
];

// Screenshot figures:
// Total billed: ₹6,19,500
// Received collections: ₹3,06,500
// Outstanding invoices: ₹3,13,000 (3 pending)
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'PAA-INV-2026-101',
    clientId: 'cl-1',
    projectId: 'prj-1',
    issueDate: '2026-10-01',
    dueDate: '2026-10-20',
    items: [
      { id: 'it-1', description: 'Monthly Ad Campaign Retainer - October 2026', quantity: 1, unitPrice: 198240, total: 198240 }
    ],
    subtotal: 168000,
    taxAmount: 30240,
    totalAmount: 198240,
    paidAmount: 198240,
    balanceAmount: 0,
    status: 'paid',
    notes: 'Paid in full via NEFT.'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'PAA-INV-2026-102',
    clientId: 'cl-2',
    projectId: 'prj-2',
    issueDate: '2026-10-15',
    dueDate: '2026-11-05',
    items: [
      { id: 'it-2', description: 'Phoenix Mall Billboard Display & Footfall Campaign', quantity: 1, unitPrice: 217860, total: 217860 }
    ],
    subtotal: 184627,
    taxAmount: 33233,
    totalAmount: 217860,
    paidAmount: 108260,
    balanceAmount: 109600,
    status: 'partially_paid',
    notes: 'Advance received; balance ₹1,09,600 due.'
  },
  {
    id: 'inv-3',
    invoiceNumber: 'PAA-INV-2026-103',
    clientId: 'cl-3',
    projectId: 'prj-3',
    issueDate: '2026-10-25',
    dueDate: '2026-11-15',
    items: [
      { id: 'it-3', description: 'Greenline EV Mobility Launch Milestone 1', quantity: 1, unitPrice: 123400, total: 123400 }
    ],
    subtotal: 104576,
    taxAmount: 18824,
    totalAmount: 123400,
    paidAmount: 0,
    balanceAmount: 123400,
    status: 'issued',
    notes: 'First milestone invoice.'
  },
  {
    id: 'inv-4',
    invoiceNumber: 'PAA-INV-2026-104',
    clientId: 'cl-4',
    issueDate: '2026-10-28',
    dueDate: '2026-11-20',
    items: [
      { id: 'it-4', description: 'Urban Habitat Digital PR & Social Retargeting', quantity: 1, unitPrice: 80000, total: 80000 }
    ],
    subtotal: 67797,
    taxAmount: 12203,
    totalAmount: 80000,
    paidAmount: 0,
    balanceAmount: 80000,
    status: 'issued',
    notes: 'Onboarding campaign.'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    paymentCode: 'PAA-PAY-881',
    invoiceId: 'inv-1',
    clientId: 'cl-1',
    date: '2026-10-18',
    amount: 198240,
    paymentMethod: 'Bank Transfer',
    transactionRef: 'NEFT-HDFC-9918237190',
    notes: 'Full payment for invoice PAA-INV-2026-101 received.',
    recordedBy: 'Suresh Kumar (Finance)'
  },
  {
    id: 'pay-2',
    paymentCode: 'PAA-PAY-882',
    invoiceId: 'inv-2',
    clientId: 'cl-2',
    date: '2026-10-20',
    amount: 108260,
    paymentMethod: 'Bank Transfer',
    transactionRef: 'RTGS-ICICI-001928374',
    notes: 'Part payment received.',
    recordedBy: 'Suresh Kumar (Finance)'
  }
];

// Screenshot shows: Exp: ₹1,67,499
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    expenseCode: 'PAA-EXP-701',
    title: 'Office Rental SV Arcade Gurunath Layout',
    category: 'Office Rent',
    amount: 65000,
    date: '2026-10-01',
    departmentId: 'dept-1',
    notes: 'HQ Office Space'
  },
  {
    id: 'exp-2',
    expenseCode: 'PAA-EXP-702',
    title: 'High-Speed Leased Line Fiber HQ',
    category: 'Internet & Infrastructure',
    amount: 12499,
    date: '2026-10-05',
    departmentId: 'dept-3',
    notes: 'ACT Enterprise Dedicated'
  },
  {
    id: 'exp-3',
    expenseCode: 'PAA-EXP-703',
    title: 'Ad Production Lighting & Consumables',
    category: 'Equipment',
    amount: 35000,
    date: '2026-10-12',
    departmentId: 'dept-6',
    notes: 'Studio kit'
  },
  {
    id: 'exp-4',
    expenseCode: 'PAA-EXP-704',
    title: 'Outdoor DOOH Screen Server Bandwidth',
    category: 'Cloud Services',
    amount: 55000,
    date: '2026-10-15',
    departmentId: 'dept-3',
    notes: 'DOOH Display server'
  }
];

export const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: 'slip-1',
    payslipNumber: 'PAA-SLIP-2026-10-101',
    employeeId: 'emp-1',
    payPeriod: 'October 2026',
    basicSalary: 85000,
    hra: 34000,
    allowances: 28000,
    incentives: 25000,
    bonus: 18000,
    grossSalary: 190000,
    deductions: 6000,
    approvedReimbursement: 0,
    netPay: 184000,
    generatedDate: '2026-10-31',
    status: 'paid'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'emp-1',
    title: 'Attendance Auto Checked In',
    message: 'Welcome Rajesh Sharma! System attendance checked in automatically at 09:18 AM.',
    type: 'attendance',
    read: false,
    timestamp: 'Today, 09:18 AM',
    linkTab: 'attendance'
  },
  {
    id: 'notif-2',
    userId: 'emp-1',
    title: 'Field Visit Completed',
    message: 'Rahul Verma completed field meeting at Brigade Tech Ventures (90 mins).',
    type: 'field_visit',
    read: false,
    timestamp: 'Today, 12:15 PM',
    linkTab: 'field_force'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    userId: 'emp-1',
    userName: 'Rajesh Sharma',
    action: 'USER_LOGIN',
    date: new Date().toISOString().split('T')[0],
    time: '09:18:22 AM',
    relatedRecord: 'Attendance',
    details: 'System login from Bangalore HQ IP; automatic attendance check-in logged.'
  }
];

export const INITIAL_LEAVE_BALANCES: LeaveBalance[] = [
  {
    employeeId: 'emp-1',
    casualLeaveTotal: 12,
    casualLeaveUsed: 1,
    sickLeaveTotal: 8,
    sickLeaveUsed: 0,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 2,
    compOffTotal: 2,
    compOffUsed: 0,
  },
  {
    employeeId: 'emp-2',
    casualLeaveTotal: 12,
    casualLeaveUsed: 2,
    sickLeaveTotal: 8,
    sickLeaveUsed: 1,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 0,
    compOffTotal: 1,
    compOffUsed: 0,
  },
  {
    employeeId: 'emp-3',
    casualLeaveTotal: 12,
    casualLeaveUsed: 3,
    sickLeaveTotal: 8,
    sickLeaveUsed: 2,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 4,
    compOffTotal: 3,
    compOffUsed: 1,
  },
  {
    employeeId: 'emp-4',
    casualLeaveTotal: 12,
    casualLeaveUsed: 1,
    sickLeaveTotal: 8,
    sickLeaveUsed: 0,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 1,
    compOffTotal: 2,
    compOffUsed: 0,
  },
  {
    employeeId: 'emp-5',
    casualLeaveTotal: 12,
    casualLeaveUsed: 2,
    sickLeaveTotal: 8,
    sickLeaveUsed: 1,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 3,
    compOffTotal: 1,
    compOffUsed: 0,
  },
  {
    employeeId: 'emp-6',
    casualLeaveTotal: 12,
    casualLeaveUsed: 1,
    sickLeaveTotal: 8,
    sickLeaveUsed: 0,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 0,
    compOffTotal: 0,
    compOffUsed: 0,
  },
  {
    employeeId: 'emp-7',
    casualLeaveTotal: 12,
    casualLeaveUsed: 0,
    sickLeaveTotal: 8,
    sickLeaveUsed: 0,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 0,
    compOffTotal: 0,
    compOffUsed: 0,
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lev-1',
    leaveCode: 'PAA-LEV-041',
    employeeId: 'emp-5',
    leaveType: 'Casual Leave',
    startDate: '2026-11-10',
    endDate: '2026-11-11',
    daysCount: 2,
    isHalfDay: false,
    reason: 'Family function at native town in Mysore.',
    emergencyContact: '+91 9448011223',
    status: 'pending',
    appliedAt: '2026-11-01 10:30 AM'
  },
  {
    id: 'lev-2',
    leaveCode: 'PAA-LEV-040',
    employeeId: 'emp-4',
    leaveType: 'Sick Leave',
    startDate: '2026-10-24',
    endDate: '2026-10-24',
    daysCount: 1,
    isHalfDay: false,
    reason: 'Viral fever and doctor consultation.',
    emergencyContact: '+91 9845012345',
    status: 'approved',
    appliedAt: '2026-10-23 08:30 PM',
    reviewedBy: 'Priya Sharma (HR)',
    reviewRemarks: 'Approved with medical slip submitted.',
    reviewedAt: '2026-10-24 09:00 AM'
  },
  {
    id: 'lev-3',
    leaveCode: 'PAA-LEV-039',
    employeeId: 'emp-3',
    leaveType: 'Privilege Leave',
    startDate: '2026-10-14',
    endDate: '2026-10-17',
    daysCount: 4,
    isHalfDay: false,
    reason: 'Annual family vacation.',
    emergencyContact: '+91 9880192837',
    status: 'approved',
    appliedAt: '2026-10-01 11:00 AM',
    reviewedBy: 'Rajesh Sharma (MD)',
    reviewRemarks: 'Pre-approved sprint tasks handed over to Ananya.',
    reviewedAt: '2026-10-02 02:15 PM'
  }
];

