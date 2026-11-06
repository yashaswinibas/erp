import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Shield, Plus, Trash2 } from 'lucide-react';
import { FieldVisitType, ReimbursementCategory, WorkMode, UserRole } from '../types';
import { saveFile } from '../lib/fileStore'; // AGENCYOS_V2_PART12
import { StoredFile } from '../lib/hrTypes';
import { ProofThumbs } from './ProofThumbs';

interface AddEntityModalsProps {
  modalType: string | null;
  onClose: () => void;
  contextData?: any;
}

export const AddEntityModals: React.FC<AddEntityModalsProps> = ({
  modalType,
  onClose,
  contextData
}) => {
  const {
    projects,
    tasks,
    clients,
    leads,
    employees,
    departments,
    designations,
    currentUser,
    company,
    invoices,
    addDailyActivity,
    startFieldVisit,
    addExpenseToFieldVisit,
    addReimbursement,
    requestAttendanceRegularization,
    addEmployee,
    addLead,
    addClient,
    addProject,
    addTask,
    addQuotation,
    addInvoice,
    addPayment,
    addExpense
  } = useApp();

  if (!modalType) return null;

  // 1. DAILY ACTIVITY MODAL
  if (modalType === 'daily_activity') {
    return <DailyActivityModal onClose={onClose} prefilledTaskId={contextData?.taskId} prefilledProjectId={contextData?.projectId} />;
  }

  // 2. FIELD VISIT MODAL
  if (modalType === 'field_visit') {
    return <StartFieldVisitModal onClose={onClose} />;
  }

  // 3. FIELD EXPENSE MODAL (Linked to visit)
  if (modalType === 'field_expense') {
    return <FieldExpenseModal onClose={onClose} visitId={contextData?.visitId} />;
  }

  // 4. GENERAL REIMBURSEMENT MODAL
  if (modalType === 'reimbursement') {
    return <ReimbursementModal onClose={onClose} />;
  }

  // 5. ATTENDANCE REGULARIZATION MODAL
  if (modalType === 'regularization') {
    return <RegularizationModal onClose={onClose} />;
  }

  // 6. EMPLOYEE MODAL
  if (modalType === 'employee') {
    return <EmployeeModal onClose={onClose} />;
  }

  // 7. LEAD MODAL
  if (modalType === 'lead') {
    return <LeadModal onClose={onClose} />;
  }

  // 8. CLIENT MODAL
  if (modalType === 'client') {
    return <ClientModal onClose={onClose} />;
  }

  // 9. PROJECT MODAL
  if (modalType === 'project') {
    return <ProjectModal onClose={onClose} />;
  }

  // 10. TASK MODAL
  if (modalType === 'task') {
    return <TaskModal onClose={onClose} />;
  }

  // 11. INVOICE MODAL
  if (modalType === 'invoice') {
    return <InvoiceModal onClose={onClose} />;
  }

  // 12. QUOTATION MODAL
  if (modalType === 'quotation') {
    return <QuotationModal onClose={onClose} />;
  }

  // 13. PAYMENT MODAL
  if (modalType === 'payment') {
    return <PaymentModal onClose={onClose} invoiceId={contextData?.invoiceId} />;
  }

  // 14. EXPENSE MODAL
  if (modalType === 'expense') {
    return <ExpenseModal onClose={onClose} />;
  }

  return null;
};

// --- SUB-MODALS ---

const DailyActivityModal: React.FC<{ onClose: () => void; prefilledTaskId?: string; prefilledProjectId?: string }> = ({
  onClose,
  prefilledTaskId,
  prefilledProjectId
}) => {
  const { projects, tasks, addDailyActivity, currentUser } = useApp();
  const [projectId, setProjectId] = useState(prefilledProjectId || (projects[0]?.id || ''));
  const [taskId, setTaskId] = useState(prefilledTaskId || '');
  const [completedWork, setCompletedWork] = useState('');
  const [workInProgress, setWorkInProgress] = useState('');
  const [pendingWork, setPendingWork] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(4);
  const [blockers, setBlockers] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedWork) return;

    addDailyActivity({
      employeeId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      completedWork,
      workInProgress,
      pendingWork,
      hoursSpent: Number(hoursSpent),
      blockers: blockers || undefined,
      remarks: remarks || undefined
    });
    onClose();
  };

  const projectTasks = tasks.filter(t => !projectId || t.projectId === projectId);

  return (
    <ModalWrapper title="+ Add Daily Activity & Work Progress" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Associated Project</label>
            <select
              value={projectId}
              onChange={e => {
                setProjectId(e.target.value);
                setTaskId('');
              }}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- General / Non-Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Task (Optional)</label>
            <select
              value={taskId}
              onChange={e => setTaskId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Select Task --</option>
              {projectTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Completed Deliverables Today *</label>
          <textarea
            required
            rows={2}
            placeholder="Detailed description of completed work items..."
            value={completedWork}
            onChange={e => setCompletedWork(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Work in Progress (WIP)</label>
            <input
              type="text"
              placeholder="Items currently in progress..."
              value={workInProgress}
              onChange={e => setWorkInProgress(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hours Spent *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="16"
              required
              value={hoursSpent}
              onChange={e => setHoursSpent(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Blockers / Roadblocks</label>
          <input
            type="text"
            placeholder="Any technical or approval blocker..."
            value={blockers}
            onChange={e => setBlockers(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Save Daily Activity" />
      </form>
    </ModalWrapper>
  );
};

const StartFieldVisitModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { clients, leads, projects, startFieldVisit } = useApp();
  const [selectedEntity, setSelectedEntity] = useState<'client' | 'lead' | 'custom'>('client');
  const [entityId, setEntityId] = useState(clients[0]?.id || '');
  const [companyName, setCompanyName] = useState(clients[0]?.companyName || '');
  const [contactPerson, setContactPerson] = useState(clients[0]?.contactPerson || '');
  const [address, setAddress] = useState(clients[0]?.address || 'Bangalore');
  const [visitType, setVisitType] = useState<FieldVisitType>('Client Meeting');
  const [purpose, setPurpose] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('Client Corporate Office');
  const [expectedOutcome, setExpectedOutcome] = useState('');

  const handleEntityChange = (id: string) => {
    setEntityId(id);
    if (selectedEntity === 'client') {
      const cl = clients.find(c => c.id === id);
      if (cl) {
        setCompanyName(cl.companyName);
        setContactPerson(cl.contactPerson);
        setAddress(cl.address);
      }
    } else {
      const ld = leads.find(l => l.id === id);
      if (ld) {
        setCompanyName(ld.company);
        setContactPerson(ld.contactPerson);
        setAddress('Bangalore');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !purpose) return;

    startFieldVisit({
      clientId: selectedEntity === 'client' ? entityId : undefined,
      leadId: selectedEntity === 'lead' ? entityId : undefined,
      companyName,
      contactPerson,
      visitType,
      purpose,
      meetingLocation,
      address,
      expectedOutcome: expectedOutcome || 'Sign contract / establish partnership',
      followUpRequired: true
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Initiate Field Force Client Meeting" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="entType"
              checked={selectedEntity === 'client'}
              onChange={() => {
                setSelectedEntity('client');
                if (clients[0]) handleEntityChange(clients[0].id);
              }}
            />
            <span>Existing Client</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="entType"
              checked={selectedEntity === 'lead'}
              onChange={() => {
                setSelectedEntity('lead');
                if (leads[0]) handleEntityChange(leads[0].id);
              }}
            />
            <span>Sales Pipeline Lead</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Account *</label>
            <select
              value={entityId}
              onChange={e => handleEntityChange(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {selectedEntity === 'client'
                ? clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)
                : leads.map(l => <option key={l.id} value={l.id}>{l.company}</option>)
              }
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Type *</label>
            <select
              value={visitType}
              onChange={e => setVisitType(e.target.value as FieldVisitType)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Client Meeting">Client Meeting</option>
              <option value="Lead Meeting">Lead Meeting</option>
              <option value="Sales Visit">Sales Visit</option>
              <option value="Project Meeting">Project Meeting</option>
              <option value="Site Visit">Site Visit</option>
              <option value="Business Development">Business Development</option>
              <option value="Payment Collection">Payment Collection</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Location</label>
            <input
              type="text"
              value={meetingLocation}
              onChange={e => setMeetingLocation(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Site / Office Address *</label>
          <input
            type="text"
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Purpose & Agenda *</label>
          <textarea
            required
            rows={2}
            placeholder="e.g. Q4 ad performance pitch, outdoor billboard site inspection..."
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Outcome</label>
          <input
            type="text"
            placeholder="e.g. Agreement signed, 20% budget hike approved..."
            value={expectedOutcome}
            onChange={e => setExpectedOutcome(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Check-In & Start Visit" />
      </form>
    </ModalWrapper>
  );
};

const FieldExpenseModal: React.FC<{ onClose: () => void; visitId?: string }> = ({ onClose, visitId }) => {
  const { fieldVisits, addExpenseToFieldVisit } = useApp();
  const targetVisitId = visitId || fieldVisits.find(v => v.status === 'in_progress')?.id || fieldVisits[0]?.id;
  const targetVisit = fieldVisits.find(v => v.id === targetVisitId);

  const [category, setCategory] = useState<ReimbursementCategory>('Fuel');
  const [amount, setAmount] = useState<number>(450);
  const [description, setDescription] = useState('Fuel & parking for client meeting');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVisitId || !amount) return;

    addExpenseToFieldVisit(targetVisitId, {
      category,
      amount: Number(amount),
      description,
      paymentMethod
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Add Travel / Food Expense Linked to Field Visit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Linked Visit: {targetVisit?.companyName || 'Active Meeting'} ({targetVisit?.visitCode})
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            This expense automatically links to the visit history and submits an authorized reimbursement claim (Prompt #30).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ReimbursementCategory)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Fuel">Fuel (Petrol/Diesel)</option>
              <option value="Food">Food / Working Lunch</option>
              <option value="Parking">Parking / Toll</option>
              <option value="Travel">Travel / Cab Fare</option>
              <option value="Hotel">Hotel Accommodation</option>
              <option value="Other">Other Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Particulars *</label>
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="UPI / GPay">UPI / GPay / PhonePe</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Corporate / Personal Card</option>
            <option value="Fastag / Toll Card">Fastag / Toll Card</option>
          </select>
        </div>

        <ModalFooter onClose={onClose} submitLabel="Submit Linked Claim" />
      </form>
    </ModalWrapper>
  );
};

const RegularizationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { requestAttendanceRegularization } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctCheckIn, setCorrectCheckIn] = useState('09:30 AM');
  const [correctCheckOut, setCorrectCheckOut] = useState('06:30 PM');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    requestAttendanceRegularization({
      date,
      correctCheckIn,
      correctCheckOut,
      reason
    });
    onClose();
  };

  return (
    <ModalWrapper title="Submit Attendance Regularization Request (Prompt #14)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <p className="text-slate-500">
          If you forgot to check in or out due to field duty or technical issues, request manager approval.
        </p>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Attendance *</label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correct Check-In *</label>
            <input
              type="text"
              required
              value={correctCheckIn}
              onChange={e => setCorrectCheckIn(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correct Check-Out *</label>
            <input
              type="text"
              required
              value={correctCheckOut}
              onChange={e => setCorrectCheckOut(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Regularization *</label>
          <textarea
            required
            rows={3}
            placeholder="Explain why you could not check-in/out on the system (e.g. directly visited client site, network outage)..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Submit for Manager Approval" />
      </form>
    </ModalWrapper>
  );
};

const ReimbursementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addReimbursement, currentUser, projects, clients } = useApp();
  const [category, setCategory] = useState<ReimbursementCategory>('Travel');
  const [amount, setAmount] = useState<number>(1000);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Direct Bank');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofs, setProofs] = useState<StoredFile[]>([]);
  const [proofErr, setProofErr] = useState('');
  const addProofs = async (list: FileList | null) => {
    if (!list?.length) return;
    setProofErr('');
    try { const s: StoredFile[] = []; for (const f of Array.from(list)) s.push(await saveFile(f)); setProofs((p) => [...p, ...s]); }
    catch (er) { setProofErr((er as Error).message); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    if (proofs.length === 0) { setProofErr('Please attach a photo or PDF of the bill / receipt as proof.'); return; }

    addReimbursement({
      employeeId: currentUser.id,
      date: expDate,
      category,
      amount: Number(amount),
      description,
      projectId: projectId || undefined,
      clientId: clientId || undefined,
      paymentMethod,
      receiptName: proofs[0]?.fileName,
      proofFiles: proofs
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Submit Corporate Reimbursement Claim" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ReimbursementCategory)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Travel">Travel & Lodging</option>
              <option value="Fuel">Fuel</option>
              <option value="Food">Food / Client Hospitality</option>
              <option value="Parking">Parking & Toll</option>
              <option value="Internet">Internet / Mobile</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Software">Software & Cloud Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Particulars / Description *</label>
          <textarea
            required
            rows={2}
            placeholder="Detailed commercial description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Linked Project (Optional)</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- None --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Linked Client (Optional)</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- None --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Date *</label>
            <input type="date" required value={expDate} max={new Date().toISOString().split('T')[0]} onChange={e => setExpDate(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
        </div>

        <div className={`rounded-xl border-2 border-dashed p-4 ${proofErr ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-300 dark:border-slate-700'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Proof of expense *</div>
              <div className="text-[11px] text-slate-500">Photo of the bill / receipt / ticket, or a PDF. Max 10 MB each.</div>
            </div>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">Take photo
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { addProofs(e.target.files); e.target.value = ''; }} /></label>
              <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-bold cursor-pointer text-slate-700 dark:text-slate-200">Upload file
                <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => { addProofs(e.target.files); e.target.value = ''; }} /></label>
            </div>
          </div>
          {proofs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {proofs.map(p => (
                <div key={p.fileId} className="relative">
                  <ProofThumbs files={[p]} size={64} showNames={false} />
                  <button type="button" title="Remove" onClick={() => setProofs(x => x.filter(y => y.fileId !== p.fileId))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold cursor-pointer">x</button>
                </div>
              ))}
            </div>
          )}
          {proofErr && <p className="mt-2 text-rose-600 font-semibold">{proofErr}</p>}
        </div>

        <ModalFooter onClose={onClose} submitLabel="Submit for HR / Finance Approval" />
      </form>
    </ModalWrapper>
  );
};

const EmployeeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addEmployee, departments, designations, employees } = useApp();
  const nextNum = employees.length + 1;
  const [employeeId, setEmployeeId] = useState(`PAA-EMP-${nextNum.toString().padStart(3, '0')}`);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [phone2, setPhone2] = useState('+91 ');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-3');
  const [designationId, setDesignationId] = useState(designations[0]?.id || 'desig-4');
  const [role, setRole] = useState<UserRole>('employee');
  const [workMode, setWorkMode] = useState<WorkMode>('office');
  const [basic, setBasic] = useState(40000);
  const [hra, setHra] = useState(16000);
  const [allowances, setAllowances] = useState(10000);
  const [deductions, setDeductions] = useState(3000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const net = basic + hra + allowances - deductions;

    addEmployee({
      employeeId,
      name,
      email,
      phone,
      phone2: phone2.trim() !== '+91' ? phone2 : undefined,
      dateOfBirth: '1995-05-15',
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId,
      designationId,
      employmentType: 'Full-time',
      assignedProjectIds: [],
      salary: {
        basic,
        hra,
        allowances,
        incentives: 5000,
        bonus: 4000,
        deductions,
        netSalary: net
      },
      workLocation: 'Bangalore HQ',
      workMode,
      skills: ['Agency Management', 'Operations'],
      experienceYears: 3,
      role,
      status: 'active'
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Onboard New Employee" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee ID *</label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile 1 (Primary) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile 2 (Alternate / WhatsApp)</label>
            <input
              type="text"
              value={phone2}
              onChange={e => setPhone2(e.target.value)}
              placeholder="+91 94XXXXXXXX"
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
            <select
              value={designationId}
              onChange={e => setDesignationId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {designations.map(ds => <option key={ds.id} value={ds.id}>{ds.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="employee">Employee</option>
              <option value="project_manager">Project Manager</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200">Salary Structure (Confidential HR Entry)</p>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Basic Pay</label>
              <input
                type="number"
                value={basic}
                onChange={e => setBasic(Number(e.target.value))}
                className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">HRA</label>
              <input
                type="number"
                value={hra}
                onChange={e => setHra(Number(e.target.value))}
                className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Allowances</label>
              <input
                type="number"
                value={allowances}
                onChange={e => setAllowances(Number(e.target.value))}
                className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Deductions</label>
              <input
                type="number"
                value={deductions}
                onChange={e => setDeductions(Number(e.target.value))}
                className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-rose-600"
              />
            </div>
          </div>
        </div>

        <ModalFooter onClose={onClose} submitLabel="Complete Employee Onboarding" />
      </form>
    </ModalWrapper>
  );
};

const LeadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addLead, employees } = useApp();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [phone2, setPhone2] = useState('+91 ');
  const [serviceRequired, setServiceRequired] = useState('Digital Marketing & Outdoor Billboards');
  const [estimatedValue, setEstimatedValue] = useState<number>(350000);
  const [source, setSource] = useState('Direct Referral');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(employees[4]?.id || employees[0]?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    addLead({
      name: name || company,
      company,
      contactPerson,
      email,
      phone,
      phone2: phone2.trim() !== '+91' ? phone2 : undefined,
      source,
      serviceRequired,
      estimatedValue: Number(estimatedValue),
      status: 'new',
      priority: 'high',
      assignedEmployeeId,
      followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      notes: 'Initial inbound lead inquiry.'
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Add New Sales Lead" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization *</label>
            <input
              type="text"
              required
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile 1 (Primary) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile 2 (Alternate / WhatsApp)</label>
            <input
              type="text"
              value={phone2}
              onChange={e => setPhone2(e.target.value)}
              placeholder="+91 94XXXXXXXX"
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Required</label>
            <input
              type="text"
              value={serviceRequired}
              onChange={e => setServiceRequired(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Est. Value (₹)</label>
            <input
              type="number"
              value={estimatedValue}
              onChange={e => setEstimatedValue(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <ModalFooter onClose={onClose} submitLabel="Save Lead to Pipeline" />
      </form>
    </ModalWrapper>
  );
};

const ClientModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addClient, employees } = useApp();
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [phone2, setPhone2] = useState('+91 ');
  const [address, setAddress] = useState('Bangalore, Karnataka');
  const [gstNumber, setGstNumber] = useState('29AAACP');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    addClient({
      companyName,
      contactPerson,
      email,
      phone,
      phone2: phone2.trim() !== '+91' ? phone2 : undefined,
      website: `www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      address,
      gstNumber,
      billingAddress: address,
      accountManagerId: employees[4]?.id || employees[0]?.id,
      services: ['Comprehensive Brand Retainer', 'Field Outdoor Ads'],
      status: 'active',
      notes: 'Direct client onboarding.'
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Add New Client Account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Client Company Name *</label>
          <input
            type="text"
            required
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile 1 (Primary) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98XXXXXXXX"
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile 2 (Alternate / WhatsApp)</label>
            <input
              type="text"
              value={phone2}
              onChange={e => setPhone2(e.target.value)}
              placeholder="+91 94XXXXXXXX"
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN</label>
            <input
              type="text"
              value={gstNumber}
              onChange={e => setGstNumber(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing City / State</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Save Client Account" />
      </form>
    </ModalWrapper>
  );
};

const ProjectModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addProject, clients, employees } = useApp();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [budget, setBudget] = useState(750000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addProject({
      name,
      clientId: clientId || undefined,
      projectManagerId: employees[2]?.id || employees[0]?.id,
      assignedEmployeeIds: [employees[2]?.id, employees[3]?.id],
      startDate,
      endDate,
      budget: Number(budget),
      status: 'active',
      priority: 'high',
      description
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Create Strategic Agency Project (Prompt #37)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Client (Optional for Internal)</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Internal Agency Project --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Budget (₹)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Delivery Deadline</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Scope & Objectives</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Initialize Project" />
      </form>
    </ModalWrapper>
  );
};

const TaskModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addTask, projects, employees } = useApp();
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(employees[3]?.id || employees[0]?.id);
  const [priority, setPriority] = useState<any>('high');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState(16);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) return;

    addTask({
      projectId,
      title,
      description,
      assignedEmployeeId,
      managerId: employees[2]?.id || employees[0]?.id,
      projectManagerId: employees[2]?.id || employees[0]?.id,
      priority,
      status: 'todo',
      startDate: new Date().toISOString().split('T')[0],
      dueDate,
      estimatedHours: Number(estimatedHours),
      actualHours: 0
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Create Deliverable Task (Prompt #38)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Project *</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Meta Ads API Webhook receiver & test verification"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign To</label>
            <select
              value={assignedEmployeeId}
              onChange={e => setAssignedEmployeeId(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Hours</label>
            <input
              type="number"
              value={estimatedHours}
              onChange={e => setEstimatedHours(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <ModalFooter onClose={onClose} submitLabel="Assign Task" />
      </form>
    </ModalWrapper>
  );
};

const InvoiceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addInvoice, clients } = useApp();
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [description, setDescription] = useState('Digital Advertising Campaign Retainer (November 2026)');
  const [subtotal, setSubtotal] = useState(150000);

  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    addInvoice({
      clientId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      items: [
        { id: '1', description, quantity: 1, unitPrice: subtotal, total: subtotal }
      ],
      subtotal,
      taxAmount: tax,
      totalAmount: total,
      paidAmount: 0,
      balanceAmount: total,
      status: 'issued'
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Generate Official Tax Invoice (Prompt #43)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Billed Client *</label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Deliverable Scope *</label>
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Taxable Subtotal (₹) *</label>
          <input
            type="number"
            required
            value={subtotal}
            onChange={e => setSubtotal(Number(e.target.value))}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
        </div>

        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span>GST (18%):</span>
            <span className="font-mono">₹{tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-1 border-t border-blue-200">
            <span>Total Payable:</span>
            <span className="font-mono">₹{total.toLocaleString()}</span>
          </div>
        </div>

        <ModalFooter onClose={onClose} submitLabel="Issue Tax Invoice" />
      </form>
    </ModalWrapper>
  );
};

const QuotationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addQuotation, clients, currentUser } = useApp();
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [title, setTitle] = useState('Brand Outdoor Activation & Targeted Lead Campaign');
  const [subtotal, setSubtotal] = useState(250000);

  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    addQuotation({
      clientId,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      title,
      items: [
        { id: '1', description: title, quantity: 1, unit: 'Package', unitPrice: subtotal, total: subtotal }
      ],
      subtotal,
      discount: 0,
      taxPercent: 18,
      taxAmount: tax,
      total,
      terms: 'Standard agency terms: 50% advance on sign-off.',
      notes: 'Prepared by Priority Ads Agency marketing cell.',
      createdBy: `${currentUser.name} (${currentUser.role})`,
      status: 'sent'
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Draft Business Quotation (Prompt #41)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Client *</label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quotation Scope Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Commercial Subtotal (₹) *</label>
          <input
            type="number"
            required
            value={subtotal}
            onChange={e => setSubtotal(Number(e.target.value))}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Generate Official Quotation" />
      </form>
    </ModalWrapper>
  );
};

const PaymentModal: React.FC<{ onClose: () => void; invoiceId?: string }> = ({ onClose, invoiceId }) => {
  const { invoices, addPayment, currentUser } = useApp();
  const targetInvId = invoiceId || invoices.find(i => i.balanceAmount > 0)?.id || invoices[0]?.id;
  const targetInv = invoices.find(i => i.id === targetInvId);

  const [amount, setAmount] = useState<number>(targetInv?.balanceAmount || 50000);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Card'>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState(`NEFT-HDFC-${Math.floor(100000 + Math.random() * 900000)}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvId || !amount) return;

    addPayment({
      invoiceId: targetInvId,
      clientId: targetInv?.clientId || 'cl-1',
      date: new Date().toISOString().split('T')[0],
      amount: Number(amount),
      paymentMethod,
      transactionRef,
      recordedBy: `${currentUser.name} (${currentUser.role})`
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Record Client Inward Payment (Prompt #44)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            Invoice: {targetInv?.invoiceNumber}
          </p>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
            Total: ₹{targetInv?.totalAmount.toLocaleString()} · Outstanding: ₹{targetInv?.balanceAmount.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Paid (₹) *</label>
            <input
              type="number"
              required
              min="1"
              max={targetInv?.balanceAmount || 1000000}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Cheque">Account Payee Cheque</option>
              <option value="Cash">Cash Receipt</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / Cheque No *</label>
          <input
            type="text"
            required
            value={transactionRef}
            onChange={e => setTransactionRef(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
        </div>

        <ModalFooter onClose={onClose} submitLabel="Record Payment & Update Balance" />
      </form>
    </ModalWrapper>
  );
};

const ExpenseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addExpense } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Office Supplies');
  const [amount, setAmount] = useState(2500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    addExpense({
      title,
      category,
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <ModalWrapper title="+ Record General Company Expense (Prompt #45)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Particulars *</label>
          <input
            type="text"
            required
            placeholder="e.g. Fiber Internet Lease, Office consumables..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <ModalFooter onClose={onClose} submitLabel="Save Expense" />
      </form>
    </ModalWrapper>
  );
};

// --- SHARED WRAPPERS ---

const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalFooter: React.FC<{ onClose: () => void; submitLabel: string }> = ({ onClose, submitLabel }) => {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
      >
        {submitLabel}
      </button>
    </div>
  );
};
