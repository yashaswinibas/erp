--
-- PostgreSQL database dump
--

\restrict KsR8C8sb7KWCWBEpPyeMaymoTLiPzs9vWhs5yF2j01vXgEE3Pr9GVNCZZZ4y2pe

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_no_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_no_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agreements (
    id text NOT NULL,
    number text,
    client_id text,
    status text,
    end_date text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: app_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_records (
    store text NOT NULL,
    id text NOT NULL,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id text NOT NULL,
    employee_id text,
    date text,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: attendance_regularizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_regularizations (
    id text NOT NULL,
    employee_id text,
    date text,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    user_name text,
    action text,
    related_record text,
    date text,
    "time" text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    client_code text,
    company_name text,
    phone text,
    email text,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: daily_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_activities (
    id text NOT NULL,
    employee_id text,
    date text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: deleted_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deleted_records (
    id bigint NOT NULL,
    store text NOT NULL,
    record_id text NOT NULL,
    data jsonb,
    deleted_by text,
    deleted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deleted_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deleted_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deleted_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deleted_records_id_seq OWNED BY public.deleted_records.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id text NOT NULL,
    name text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designations (
    id text NOT NULL,
    title text,
    department_id text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id text NOT NULL,
    employee_code text,
    name text,
    email text,
    phone text,
    role text,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    code text,
    date text,
    category text,
    amount numeric,
    employee_id text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: field_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.field_visits (
    id text NOT NULL,
    employee_id text,
    client_id text,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    number text,
    client_id text,
    issue_date text,
    due_date text,
    total numeric,
    balance numeric,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id text NOT NULL,
    lead_code text,
    company text,
    phone text,
    email text,
    source text,
    status text,
    assigned_employee_id text,
    estimated_value numeric,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_balances (
    id text NOT NULL,
    employee_id text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id text NOT NULL,
    code text,
    employee_id text,
    leave_type text,
    start_date text,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: login_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_events (
    id bigint NOT NULL,
    employee_id text,
    login text,
    ok boolean NOT NULL,
    reason text,
    ip text,
    user_agent text,
    at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: login_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_events_id_seq OWNED BY public.login_events.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text,
    title text,
    read text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    code text,
    invoice_id text,
    date text,
    amount numeric,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: payslips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payslips (
    id text NOT NULL,
    number text,
    employee_id text,
    pay_period text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id text NOT NULL,
    project_code text,
    name text,
    client_id text,
    status text,
    project_manager_id text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotations (
    id text NOT NULL,
    number text,
    client_id text,
    total numeric,
    discount numeric,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: reimbursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reimbursements (
    id text NOT NULL,
    code text,
    employee_id text,
    date text,
    amount numeric,
    status text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    employee_id text NOT NULL,
    ip text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);


--
-- Name: sync_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_events (
    id bigint NOT NULL,
    store text NOT NULL,
    by_employee text,
    at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sync_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sync_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_events_id_seq OWNED BY public.sync_events.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    task_code text,
    title text,
    project_id text,
    assigned_employee_id text,
    status text,
    due_date text,
    data jsonb NOT NULL,
    pos double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: user_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credentials (
    employee_id text NOT NULL,
    password_hash text NOT NULL,
    must_change boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- Name: deleted_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deleted_records ALTER COLUMN id SET DEFAULT nextval('public.deleted_records_id_seq'::regclass);


--
-- Name: login_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_events ALTER COLUMN id SET DEFAULT nextval('public.login_events_id_seq'::regclass);


--
-- Name: sync_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_events ALTER COLUMN id SET DEFAULT nextval('public.sync_events_id_seq'::regclass);


--
-- Data for Name: agreements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agreements (id, number, client_id, status, end_date, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: app_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_records (store, id, data, pos, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (key, value, updated_at, updated_by) FROM stdin;
paa_x_os_org	{"emp-role-admin": {"unit": "leadership", "position": "Founder / Owner / Super Admin", "reportsTo": ""}, "emp-role-intern": {"unit": "creative", "position": "Graphic Designer", "reportsTo": ""}, "emp-role-vendor": {"unit": "external", "position": "Vendor", "reportsTo": ""}, "emp-role-auditor": {"unit": "external", "position": "Auditor", "reportsTo": ""}, "emp-role-finance": {"unit": "finance", "position": "Accounts & Finance Manager", "reportsTo": ""}, "emp-role-manager": {"unit": "leadership", "position": "General Manager", "reportsTo": ""}, "emp-role-employee": {"unit": "perf", "position": "Meta Ads Specialist", "reportsTo": "emp-role-team_leader"}, "emp-role-recruiter": {"unit": "hr", "position": "Recruiter", "reportsTo": ""}, "emp-role-accountant": {"unit": "finance", "position": "Accountant", "reportsTo": ""}, "emp-role-consultant": {"unit": "external", "position": "Consultant", "reportsTo": ""}, "emp-role-freelancer": {"unit": "external", "position": "Freelancer", "reportsTo": ""}, "emp-role-telecaller": {"unit": "sales", "position": "Telecaller", "reportsTo": ""}, "emp-role-team_leader": {"unit": "perf", "position": "Team Leader", "reportsTo": ""}, "emp-role-hr_executive": {"unit": "hr", "position": "HR Executive", "reportsTo": ""}, "emp-role-sales_manager": {"unit": "sales", "position": "Sales Manager", "reportsTo": ""}, "emp-role-project_manager": {"unit": "ops", "position": "Operations / Project Manager", "reportsTo": ""}, "emp-role-sales_executive": {"unit": "sales", "position": "Sales Executive", "reportsTo": ""}, "emp-role-billing_executive": {"unit": "finance", "position": "Billing Executive", "reportsTo": ""}, "emp-role-sales_team_leader": {"unit": "sales", "position": "Sales Team Leader", "reportsTo": ""}, "emp-role-operations_manager": {"unit": "ops", "position": "Operations / Project Manager", "reportsTo": ""}, "emp-role-project_coordinator": {"unit": "ops", "position": "Project Coordinator", "reportsTo": ""}, "emp-role-business_development": {"unit": "sales", "position": "Sales Executive", "reportsTo": ""}, "emp-role-automation_specialist": {"unit": "leadgen", "position": "WhatsApp Automation Executive", "reportsTo": ""}, "emp-role-client_support_executive": {"unit": "crm", "position": "Client Support Executive", "reportsTo": ""}, "emp-role-client_relationship_manager": {"unit": "crm", "position": "Client Relationship Manager", "reportsTo": ""}}	2026-11-11 13:12:36.100891+05:30	import
paa_x_login_history	[]	2026-11-11 17:04:16.165498+05:30	reset
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, employee_id, date, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: attendance_regularizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_regularizations (id, employee_id, date, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, user_name, action, related_record, date, "time", data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, client_code, company_name, phone, email, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: daily_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_activities (id, employee_id, date, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: deleted_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deleted_records (id, store, record_id, data, deleted_by, deleted_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, data, pos, created_at, updated_at, updated_by) FROM stdin;
dept-1	Executive & Strategy	{"id": "dept-1", "code": "EXEC", "name": "Executive & Strategy", "description": "Executive leadership & business direction", "employeeCount": 2}	0	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
dept-2	Human Resources	{"id": "dept-2", "code": "HR", "name": "Human Resources", "description": "Talent acquisition, payroll, and culture", "employeeCount": 1}	1	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
dept-3	Engineering & Development	{"id": "dept-3", "code": "ENG", "name": "Engineering & Development", "description": "Web, mobile, AI systems and technical delivery", "employeeCount": 2}	2	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
dept-4	Sales & Field Force	{"id": "dept-4", "code": "SALES", "name": "Sales & Field Force", "description": "Client acquisition, field visits, and CRM", "employeeCount": 1}	3	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
dept-5	Finance & Accounts	{"id": "dept-5", "code": "FIN", "name": "Finance & Accounts", "description": "Billing, payroll processing, and audit", "employeeCount": 1}	4	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
dept-6	Creative & Digital Media	{"id": "dept-6", "code": "MEDIA", "name": "Creative & Digital Media", "description": "Ad campaigns, branding, and content creation", "employeeCount": 1}	5	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
\.


--
-- Data for Name: designations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.designations (id, title, department_id, data, pos, created_at, updated_at, updated_by) FROM stdin;
desig-1	Managing Director & CEO	dept-1	{"id": "desig-1", "level": "L6", "title": "Managing Director & CEO", "departmentId": "dept-1"}	0	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
desig-2	Lead HR Manager	dept-2	{"id": "desig-2", "level": "L4", "title": "Lead HR Manager", "departmentId": "dept-2"}	1	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
desig-3	Technical Project Manager	dept-3	{"id": "desig-3", "level": "L4", "title": "Technical Project Manager", "departmentId": "dept-3"}	2	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
desig-4	Senior AI & Full Stack Developer	dept-3	{"id": "desig-4", "level": "L3", "title": "Senior AI & Full Stack Developer", "departmentId": "dept-3"}	3	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
desig-5	Senior Field Sales Executive	dept-4	{"id": "desig-5", "level": "L2", "title": "Senior Field Sales Executive", "departmentId": "dept-4"}	4	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
desig-6	Finance & Operations Lead	dept-5	{"id": "desig-6", "level": "L4", "title": "Finance & Operations Lead", "departmentId": "dept-5"}	5	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
desig-7	Co-Founder & Director	dept-1	{"id": "desig-7", "level": "L6", "title": "Co-Founder & Director", "departmentId": "dept-1"}	6	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_code, name, email, phone, role, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
emp-1	PAA-EMP-001	Rajesh Sharma	rajesh.sharma@priorityadsagency.com	+91 9845011223	super_admin	active	{"id": "emp-1", "name": "Rajesh Sharma", "role": "super_admin", "email": "rajesh.sharma@priorityadsagency.com", "phone": "+91 9845011223", "phone2": "+91 9845099882", "salary": {"hra": 34000, "basic": 85000, "bonus": 18000, "netSalary": 184000, "allowances": 28000, "deductions": 6000, "incentives": 25000}, "skills": ["Executive Leadership", "P&L Management", "Digital Strategy", "Brand Advisory"], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-001", "dateOfBirth": "1985-04-12", "joiningDate": "2020-01-10", "departmentId": "dept-1", "workLocation": "Bangalore HQ", "designationId": "desig-1", "employmentType": "Full-time", "experienceYears": 15, "assignedProjectIds": []}	0	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-2	PAA-EMP-002	Priya Sharma	priya.sharma@priorityadsagency.com	+91 9845012345	hr	active	{"id": "emp-2", "name": "Priya Sharma", "role": "hr", "email": "priya.sharma@priorityadsagency.com", "phone": "+91 9845012345", "phone2": "+91 9845098765", "salary": {"hra": 16000, "basic": 40000, "bonus": 4000, "netSalary": 73500, "allowances": 12000, "deductions": 3500, "incentives": 5000}, "skills": ["Talent Management", "Statutory Compliance", "Payroll", "Performance Appraisal"], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-002", "dateOfBirth": "1990-11-20", "joiningDate": "2022-03-01", "departmentId": "dept-2", "workLocation": "Bangalore HQ", "designationId": "desig-2", "employmentType": "Full-time", "experienceYears": 7, "assignedProjectIds": [], "reportingManagerId": "emp-1"}	1	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-3	PAA-EMP-003	Karthik Rao	karthik.rao@priorityadsagency.com	+91 9742299881	project_manager	active	{"id": "emp-3", "name": "Karthik Rao", "role": "project_manager", "email": "karthik.rao@priorityadsagency.com", "phone": "+91 9742299881", "phone2": "+91 9742211223", "salary": {"hra": 22000, "basic": 55000, "bonus": 6000, "netSalary": 101800, "allowances": 15000, "deductions": 4200, "incentives": 8000}, "skills": ["Agile / Scrum", "Project Delivery", "Architecture", "Client Management"], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-003", "dateOfBirth": "1988-04-12", "joiningDate": "2022-08-15", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-3", "employmentType": "Full-time", "experienceYears": 9, "assignedProjectIds": [], "reportingManagerId": "emp-1"}	2	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-4	PAA-EMP-004	Ananya Desai	ananya.desai@priorityadsagency.com	+91 9988776655	employee	active	{"id": "emp-4", "hrId": "emp-2", "name": "Ananya Desai", "role": "employee", "email": "ananya.desai@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 18000, "basic": 45000, "bonus": 5000, "netSalary": 82200, "allowances": 12000, "deductions": 3800, "incentives": 6000}, "skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "AI Engineering"], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-004", "dateOfBirth": "1995-09-08", "joiningDate": "2023-05-02", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 4, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	3	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-5	PAA-EMP-005	Rahul Verma	rahul.verma@priorityadsagency.com	+91 9123456789	employee	active	{"id": "emp-5", "hrId": "emp-2", "name": "Rahul Verma", "role": "employee", "email": "rahul.verma@priorityadsagency.com", "phone": "+91 9123456789", "phone2": "+91 9123459999", "salary": {"hra": 12800, "basic": 32000, "bonus": 4000, "netSalary": 71000, "allowances": 10000, "deductions": 2800, "incentives": 15000}, "skills": ["B2B Sales", "Client Engagement", "Negotiation", "Outdoor Ad Activation", "Field CRM"], "status": "active", "workMode": "field", "employeeId": "PAA-EMP-005", "dateOfBirth": "1994-01-25", "joiningDate": "2023-02-14", "departmentId": "dept-4", "workLocation": "Field / On-Site", "designationId": "desig-5", "employmentType": "Full-time", "experienceYears": 5, "assignedClientId": "cl-2", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-1"}	4	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-6	PAA-EMP-006	Suresh Kumar	suresh.kumar@priorityadsagency.com	+91 9448102938	admin	active	{"id": "emp-6", "name": "Suresh Kumar", "role": "admin", "email": "suresh.kumar@priorityadsagency.com", "phone": "+91 9448102938", "salary": {"hra": 19200, "basic": 48000, "bonus": 5000, "netSalary": 82200, "allowances": 14000, "deductions": 4000, "incentives": 4000}, "skills": ["Statutory Invoicing", "GST Filing", "Accounts Receivable", "Vendor Audits"], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-006", "dateOfBirth": "1986-07-30", "joiningDate": "2021-06-01", "departmentId": "dept-5", "workLocation": "Bangalore HQ", "designationId": "desig-6", "employmentType": "Full-time", "experienceYears": 11, "assignedProjectIds": [], "reportingManagerId": "emp-1"}	5	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-7	PAA-EMP-007	Ningappa B.	ningappa@priorityadsagency.com	+91 7760665912	super_admin	active	{"id": "emp-7", "name": "Ningappa B.", "role": "super_admin", "email": "ningappa@priorityadsagency.com", "phone": "+91 7760665912", "salary": {"hra": 34000, "basic": 85000, "bonus": 18000, "netSalary": 184000, "allowances": 28000, "deductions": 6000, "incentives": 25000}, "skills": ["Co-Founder & Director", "Authorized Signatory", "Business Operations"], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-007", "dateOfBirth": "1982-08-10", "joiningDate": "2020-01-10", "departmentId": "dept-1", "workLocation": "Bangalore HQ", "designationId": "desig-7", "employmentType": "Full-time", "experienceYears": 16, "assignedProjectIds": []}	6	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-manager	PAA-EMP-101	Arjun Mehta	gm@priorityadsagency.com	+91 9988776655	manager	active	{"id": "emp-role-manager", "hrId": "emp-2", "name": "Arjun Mehta", "role": "manager", "email": "gm@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-101", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	7	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-recruiter	PAA-EMP-102	Kavya Nair	recruiter@priorityadsagency.com	+91 9988776655	recruiter	active	{"id": "emp-role-recruiter", "hrId": "emp-2", "name": "Kavya Nair", "role": "recruiter", "email": "recruiter@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-102", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	8	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-hr_executive	PAA-EMP-103	Divya Rao	hrexec@priorityadsagency.com	+91 9988776655	hr_executive	active	{"id": "emp-role-hr_executive", "hrId": "emp-2", "name": "Divya Rao", "role": "hr_executive", "email": "hrexec@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-103", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	9	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-finance	PAA-EMP-104	Vikram Iyer	finance@priorityadsagency.com	+91 9988776655	finance	active	{"id": "emp-role-finance", "hrId": "emp-2", "name": "Vikram Iyer", "role": "finance", "email": "finance@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-104", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	10	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-accountant	PAA-EMP-105	Sneha Kulkarni	accountant@priorityadsagency.com	+91 9988776655	accountant	active	{"id": "emp-role-accountant", "hrId": "emp-2", "name": "Sneha Kulkarni", "role": "accountant", "email": "accountant@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-105", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	11	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-billing_executive	PAA-EMP-106	Rohit Jain	billing@priorityadsagency.com	+91 9988776655	billing_executive	active	{"id": "emp-role-billing_executive", "hrId": "emp-2", "name": "Rohit Jain", "role": "billing_executive", "email": "billing@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-106", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	12	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-sales_manager	PAA-EMP-107	Manoj Reddy	salesmanager@priorityadsagency.com	+91 9988776655	sales_manager	active	{"id": "emp-role-sales_manager", "hrId": "emp-2", "name": "Manoj Reddy", "role": "sales_manager", "email": "salesmanager@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-107", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	13	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-sales_team_leader	PAA-EMP-108	Pooja Shetty	salestl@priorityadsagency.com	+91 9988776655	sales_team_leader	active	{"id": "emp-role-sales_team_leader", "hrId": "emp-2", "name": "Pooja Shetty", "role": "sales_team_leader", "email": "salestl@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-108", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	14	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-sales_executive	PAA-EMP-109	Anil Kumar	sales@priorityadsagency.com	+91 9988776655	sales_executive	active	{"id": "emp-role-sales_executive", "hrId": "emp-2", "name": "Anil Kumar", "role": "sales_executive", "email": "sales@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-109", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	15	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-telecaller	PAA-EMP-110	Meena Joshi	telecaller@priorityadsagency.com	+91 9988776655	telecaller	active	{"id": "emp-role-telecaller", "hrId": "emp-2", "name": "Meena Joshi", "role": "telecaller", "email": "telecaller@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-110", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	16	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-business_development	PAA-EMP-111	Farhan Ali	bde@priorityadsagency.com	+91 9988776655	business_development	active	{"id": "emp-role-business_development", "hrId": "emp-2", "name": "Farhan Ali", "role": "business_development", "email": "bde@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-111", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	17	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-client_relationship_manager	PAA-EMP-112	Neha Gupta	crm@priorityadsagency.com	+91 9988776655	client_relationship_manager	active	{"id": "emp-role-client_relationship_manager", "hrId": "emp-2", "name": "Neha Gupta", "role": "client_relationship_manager", "email": "crm@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-112", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	18	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-client_support_executive	PAA-EMP-113	Ravi Teja	support@priorityadsagency.com	+91 9988776655	client_support_executive	active	{"id": "emp-role-client_support_executive", "hrId": "emp-2", "name": "Ravi Teja", "role": "client_support_executive", "email": "support@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-113", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	19	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-operations_manager	PAA-EMP-114	Suresh Babu	operations@priorityadsagency.com	+91 9988776655	operations_manager	active	{"id": "emp-role-operations_manager", "hrId": "emp-2", "name": "Suresh Babu", "role": "operations_manager", "email": "operations@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-114", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	20	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-project_manager	PAA-EMP-115	Kiran Rao	pm@priorityadsagency.com	+91 9988776655	project_manager	active	{"id": "emp-role-project_manager", "hrId": "emp-2", "name": "Kiran Rao", "role": "project_manager", "email": "pm@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-115", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	21	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-project_coordinator	PAA-EMP-116	Lakshmi Prasad	coordinator@priorityadsagency.com	+91 9988776655	project_coordinator	active	{"id": "emp-role-project_coordinator", "hrId": "emp-2", "name": "Lakshmi Prasad", "role": "project_coordinator", "email": "coordinator@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-116", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	22	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-team_leader	PAA-EMP-117	Deepak Verma	teamlead@priorityadsagency.com	+91 9988776655	team_leader	active	{"id": "emp-role-team_leader", "hrId": "emp-2", "name": "Deepak Verma", "role": "team_leader", "email": "teamlead@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-117", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	23	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-employee	PAA-EMP-118	Sanjay Patil	specialist@priorityadsagency.com	+91 9988776655	employee	active	{"id": "emp-role-employee", "hrId": "emp-2", "name": "Sanjay Patil", "role": "employee", "email": "specialist@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-118", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	24	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-intern	PAA-EMP-119	Aditi Singh	intern@priorityadsagency.com	+91 9988776655	intern	active	{"id": "emp-role-intern", "hrId": "emp-2", "name": "Aditi Singh", "role": "intern", "email": "intern@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-119", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	25	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-automation_specialist	PAA-EMP-120	Nikhil Bhat	automation@priorityadsagency.com	+91 9988776655	automation_specialist	active	{"id": "emp-role-automation_specialist", "hrId": "emp-2", "name": "Nikhil Bhat", "role": "automation_specialist", "email": "automation@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-120", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	26	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-freelancer	PAA-EMP-121	Kiran Das	freelancer@priorityadsagency.com	+91 9988776655	freelancer	active	{"id": "emp-role-freelancer", "hrId": "emp-2", "name": "Kiran Das", "role": "freelancer", "email": "freelancer@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-121", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	27	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-consultant	PAA-EMP-122	Prakash Menon	consultant@priorityadsagency.com	+91 9988776655	consultant	active	{"id": "emp-role-consultant", "hrId": "emp-2", "name": "Prakash Menon", "role": "consultant", "email": "consultant@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-122", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	28	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-auditor	PAA-EMP-123	Ramesh Hegde	auditor@priorityadsagency.com	+91 9988776655	auditor	active	{"id": "emp-role-auditor", "hrId": "emp-2", "name": "Ramesh Hegde", "role": "auditor", "email": "auditor@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-123", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	29	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-vendor	PAA-EMP-124	PrintCo Vendor	vendor@priorityadsagency.com	+91 9988776655	vendor	active	{"id": "emp-role-vendor", "hrId": "emp-2", "name": "PrintCo Vendor", "role": "vendor", "email": "vendor@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-124", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	30	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
emp-role-admin	PAA-EMP-125	Owner Admin	owner@priorityadsagency.com	+91 9988776655	admin	active	{"id": "emp-role-admin", "hrId": "emp-2", "name": "Owner Admin", "role": "admin", "email": "owner@priorityadsagency.com", "phone": "+91 9988776655", "phone2": "+91 9988776600", "salary": {"hra": 8000, "basic": 20000, "bonus": 0, "netSalary": 32000, "allowances": 4000, "deductions": 0, "incentives": 0}, "skills": [], "status": "active", "workMode": "office", "employeeId": "PAA-EMP-125", "dateOfBirth": "1995-09-08", "joiningDate": "2026-11-11", "departmentId": "dept-3", "workLocation": "Bangalore HQ", "designationId": "desig-4", "employmentType": "Full-time", "experienceYears": 1, "assignedClientId": "cl-1", "projectManagerId": "emp-3", "assignedProjectIds": [], "reportingManagerId": "emp-3"}	31	2026-11-11 13:12:36.100891+05:30	2026-11-11 13:12:36.100891+05:30	import
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, code, date, category, amount, employee_id, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: field_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.field_visits (id, employee_id, client_id, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, number, client_id, issue_date, due_date, total, balance, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, lead_code, company, phone, email, source, status, assigned_employee_id, estimated_value, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_balances (id, employee_id, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_requests (id, code, employee_id, leave_type, start_date, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: login_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.login_events (id, employee_id, login, ok, reason, ip, user_agent, at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, read, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, code, invoice_id, date, amount, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payslips (id, number, employee_id, pay_period, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, project_code, name, client_id, status, project_manager_id, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotations (id, number, client_id, total, discount, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: reimbursements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reimbursements (id, code, employee_id, date, amount, status, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, employee_id, ip, user_agent, created_at, last_seen, revoked_at) FROM stdin;
cd3eb19e-4d54-41b9-a97d-400d02aa26ce	emp-7	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0	2026-11-11 13:13:20.93682+05:30	2026-11-11 13:21:54.998067+05:30	\N
\.


--
-- Data for Name: sync_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sync_events (id, store, by_employee, at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, task_code, title, project_id, assigned_employee_id, status, due_date, data, pos, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: user_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_credentials (employee_id, password_hash, must_change, updated_at, updated_by) FROM stdin;
\.


--
-- Name: deleted_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deleted_records_id_seq', 1, false);


--
-- Name: login_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.login_events_id_seq', 1, true);


--
-- Name: sync_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sync_events_id_seq', 3, true);


--
-- Name: agreements agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_pkey PRIMARY KEY (id);


--
-- Name: app_records app_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_records
    ADD CONSTRAINT app_records_pkey PRIMARY KEY (store, id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance_regularizations attendance_regularizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_regularizations
    ADD CONSTRAINT attendance_regularizations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: daily_activities daily_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activities
    ADD CONSTRAINT daily_activities_pkey PRIMARY KEY (id);


--
-- Name: deleted_records deleted_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deleted_records
    ADD CONSTRAINT deleted_records_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: field_visits field_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_visits
    ADD CONSTRAINT field_visits_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: login_events login_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_events
    ADD CONSTRAINT login_events_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: reimbursements reimbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reimbursements
    ADD CONSTRAINT reimbursements_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sync_events sync_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_events
    ADD CONSTRAINT sync_events_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_credentials user_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_pkey PRIMARY KEY (employee_id);


--
-- Name: agreements_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agreements_client_id_idx ON public.agreements USING btree (client_id);


--
-- Name: agreements_end_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agreements_end_date_idx ON public.agreements USING btree (end_date);


--
-- Name: agreements_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agreements_number_idx ON public.agreements USING btree (number);


--
-- Name: agreements_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agreements_status_idx ON public.agreements USING btree (status);


--
-- Name: attendance_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_date_idx ON public.attendance USING btree (date);


--
-- Name: attendance_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_employee_id_idx ON public.attendance USING btree (employee_id);


--
-- Name: attendance_regularizations_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_regularizations_date_idx ON public.attendance_regularizations USING btree (date);


--
-- Name: attendance_regularizations_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_regularizations_employee_id_idx ON public.attendance_regularizations USING btree (employee_id);


--
-- Name: attendance_regularizations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_regularizations_status_idx ON public.attendance_regularizations USING btree (status);


--
-- Name: attendance_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_status_idx ON public.attendance USING btree (status);


--
-- Name: audit_logs_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_date_idx ON public.audit_logs USING btree (date);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: clients_client_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_client_code_idx ON public.clients USING btree (client_code);


--
-- Name: clients_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_email_idx ON public.clients USING btree (email);


--
-- Name: clients_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_status_idx ON public.clients USING btree (status);


--
-- Name: daily_activities_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_activities_date_idx ON public.daily_activities USING btree (date);


--
-- Name: daily_activities_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_activities_employee_id_idx ON public.daily_activities USING btree (employee_id);


--
-- Name: designations_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX designations_department_id_idx ON public.designations USING btree (department_id);


--
-- Name: employees_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_email_idx ON public.employees USING btree (email);


--
-- Name: employees_employee_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_employee_code_idx ON public.employees USING btree (employee_code);


--
-- Name: employees_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_status_idx ON public.employees USING btree (status);


--
-- Name: expenses_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_code_idx ON public.expenses USING btree (code);


--
-- Name: expenses_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_date_idx ON public.expenses USING btree (date);


--
-- Name: expenses_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_employee_id_idx ON public.expenses USING btree (employee_id);


--
-- Name: field_visits_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX field_visits_client_id_idx ON public.field_visits USING btree (client_id);


--
-- Name: field_visits_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX field_visits_employee_id_idx ON public.field_visits USING btree (employee_id);


--
-- Name: field_visits_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX field_visits_status_idx ON public.field_visits USING btree (status);


--
-- Name: invoices_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_client_id_idx ON public.invoices USING btree (client_id);


--
-- Name: invoices_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_due_date_idx ON public.invoices USING btree (due_date);


--
-- Name: invoices_issue_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_issue_date_idx ON public.invoices USING btree (issue_date);


--
-- Name: invoices_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_number_idx ON public.invoices USING btree (number);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: leads_assigned_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_assigned_employee_id_idx ON public.leads USING btree (assigned_employee_id);


--
-- Name: leads_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_email_idx ON public.leads USING btree (email);


--
-- Name: leads_lead_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_lead_code_idx ON public.leads USING btree (lead_code);


--
-- Name: leads_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_status_idx ON public.leads USING btree (status);


--
-- Name: leave_balances_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_balances_employee_id_idx ON public.leave_balances USING btree (employee_id);


--
-- Name: leave_requests_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_requests_code_idx ON public.leave_requests USING btree (code);


--
-- Name: leave_requests_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_requests_employee_id_idx ON public.leave_requests USING btree (employee_id);


--
-- Name: leave_requests_start_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_requests_start_date_idx ON public.leave_requests USING btree (start_date);


--
-- Name: leave_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_requests_status_idx ON public.leave_requests USING btree (status);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: payments_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_code_idx ON public.payments USING btree (code);


--
-- Name: payments_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_date_idx ON public.payments USING btree (date);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: payslips_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payslips_employee_id_idx ON public.payslips USING btree (employee_id);


--
-- Name: payslips_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payslips_number_idx ON public.payslips USING btree (number);


--
-- Name: projects_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_client_id_idx ON public.projects USING btree (client_id);


--
-- Name: projects_project_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_project_code_idx ON public.projects USING btree (project_code);


--
-- Name: projects_project_manager_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_project_manager_id_idx ON public.projects USING btree (project_manager_id);


--
-- Name: projects_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_status_idx ON public.projects USING btree (status);


--
-- Name: quotations_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quotations_client_id_idx ON public.quotations USING btree (client_id);


--
-- Name: quotations_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quotations_number_idx ON public.quotations USING btree (number);


--
-- Name: quotations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quotations_status_idx ON public.quotations USING btree (status);


--
-- Name: reimbursements_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reimbursements_code_idx ON public.reimbursements USING btree (code);


--
-- Name: reimbursements_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reimbursements_date_idx ON public.reimbursements USING btree (date);


--
-- Name: reimbursements_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reimbursements_employee_id_idx ON public.reimbursements USING btree (employee_id);


--
-- Name: reimbursements_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reimbursements_status_idx ON public.reimbursements USING btree (status);


--
-- Name: tasks_assigned_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_assigned_employee_id_idx ON public.tasks USING btree (assigned_employee_id);


--
-- Name: tasks_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_due_date_idx ON public.tasks USING btree (due_date);


--
-- Name: tasks_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_project_id_idx ON public.tasks USING btree (project_id);


--
-- Name: tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_status_idx ON public.tasks USING btree (status);


--
-- Name: tasks_task_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_task_code_idx ON public.tasks USING btree (task_code);


--
-- Name: audit_logs audit_logs_lock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_logs_lock BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.audit_no_change();


--
-- PostgreSQL database dump complete
--

\unrestrict KsR8C8sb7KWCWBEpPyeMaymoTLiPzs9vWhs5yF2j01vXgEE3Pr9GVNCZZZ4y2pe

