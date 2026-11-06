import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, Download, X, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react'; // AGENCYOS_V2_PART7

export const DocumentViewerModal: React.FC = () => {
  const { docPreview, closeDocument, company, employees } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDocument(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [closeDocument]);

  if (!docPreview.isOpen || !docPreview.data) return null;

  const { docType, data } = docPreview;

  const handlePrint = () => {
    window.print();
  };

  const getEmployee = (empId: string) => {
    return employees.find(e => e.id === empId || e.employeeId === empId);
  };

  const renderDocumentBody = () => {
    switch (docType) {
      case 'payslip': {
        const slip = data;
        const emp = getEmployee(slip.employeeId);
        return (
          <div className="space-y-6 text-slate-800">
            <div className="text-center pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Salary Payslip — {slip.payPeriod}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Payslip Reference: {slip.payslipNumber}</p>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p><span className="font-semibold text-slate-700">Employee Name:</span> {emp?.name || 'Staff Member'}</p>
                <p><span className="font-semibold text-slate-700">Employee ID:</span> {emp?.employeeId || slip.employeeId}</p>
                <p><span className="font-semibold text-slate-700">Department:</span> {emp?.departmentId || 'Engineering'}</p>
                <p><span className="font-semibold text-slate-700">Designation:</span> {emp?.designationId || 'Consultant'}</p>
              </div>
              <div>
                <p><span className="font-semibold text-slate-700">Pay Period:</span> {slip.payPeriod}</p>
                <p><span className="font-semibold text-slate-700">Payment Status:</span> <span className="font-bold text-emerald-600">CONFIRMED / PAID</span></p>
                <p><span className="font-semibold text-slate-700">Generated Date:</span> {slip.generatedDate}</p>
                <p><span className="font-semibold text-slate-700">Bank Mode:</span> Direct NEFT / RTGS Transfer</p>
              </div>
            </div>

            {/* Earnings & Deductions Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-3 border-r border-slate-200">Earnings Description</th>
                    <th className="p-3 border-r border-slate-200 text-right">Amount (₹)</th>
                    <th className="p-3 border-r border-slate-200">Deductions</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200">Basic Salary</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">₹{slip.basicSalary.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-slate-200">Provident Fund / PT</td>
                    <td className="p-2.5 text-right text-rose-600">₹{slip.deductions.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200">House Rent Allowance (HRA)</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">₹{slip.hra.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-slate-200">Statutory Deductions</td>
                    <td className="p-2.5 text-right text-rose-600">₹0</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200">Special Allowances</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">₹{slip.allowances.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-slate-200">—</td>
                    <td className="p-2.5 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200">Sales / Performance Incentives</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">₹{slip.incentives.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-slate-200">—</td>
                    <td className="p-2.5 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200">Performance Bonus</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">₹{slip.bonus.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-slate-200">—</td>
                    <td className="p-2.5 text-right">—</td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                    <td className="p-2.5 border-r border-slate-200">Gross Earnings</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">₹{slip.grossSalary.toLocaleString()}</td>
                    <td className="p-2.5 border-r border-slate-200">Total Deductions</td>
                    <td className="p-2.5 text-right text-rose-600">₹{slip.deductions.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approved Reimbursement (Displayed Separately as per Requirement #33) */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-900">Approved Field & Travel Reimbursements (Non-Taxable Input):</p>
                <p className="text-amber-800 text-[11px]">Reimbursements are settled alongside monthly pay as authorized expense refunds.</p>
              </div>
              <p className="font-mono font-bold text-amber-900 text-sm">
                + ₹{(slip.approvedReimbursement || 0).toLocaleString()}
              </p>
            </div>

            {/* Net Pay Highlight */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-blue-900 tracking-wider">Net Amount Transferred to Bank Account</p>
                <p className="text-xs text-blue-700">Account verified through Priority Ads Agency corporate payroll</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-blue-900">
                  ₹{slip.netPay.toLocaleString()}
                </span>
                <p className="text-[10px] text-blue-800 uppercase font-semibold">Indian Rupees Only</p>
              </div>
            </div>

            {/* System Verification Notice */}
            <p className="text-[10px] text-slate-500 italic text-center">
              This is an official computer-generated document issued by Priority Ads Agency under authorized digital signature. No physical alteration is permitted.
            </p>
          </div>
        );
      }

      case 'reimbursement_statement': {
        const rmb = data;
        const emp = getEmployee(rmb.employeeId);
        return (
          <div className="space-y-6 text-slate-800">
            <div className="text-center pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Official Reimbursement Statement
              </h2>
              <p className="text-xs text-slate-500 mt-1">Claim Reference: {rmb.reimbursementCode}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p><span className="font-semibold text-slate-700">Claimant:</span> {emp?.name || 'Staff'}</p>
                <p><span className="font-semibold text-slate-700">Employee ID:</span> {emp?.employeeId || rmb.employeeId}</p>
                <p><span className="font-semibold text-slate-700">Expense Category:</span> {rmb.category}</p>
                <p><span className="font-semibold text-slate-700">Claim Date:</span> {rmb.date}</p>
              </div>
              <div>
                <p><span className="font-semibold text-slate-700">Status:</span> <span className="font-bold text-blue-600 uppercase">{rmb.status}</span></p>
                <p><span className="font-semibold text-slate-700">Approved By:</span> {rmb.reviewedBy || 'HR & Finance Cell'}</p>
                <p><span className="font-semibold text-slate-700">Payment Channel:</span> {rmb.paymentMethod}</p>
                <p><span className="font-semibold text-slate-700">Linked Visit:</span> {rmb.fieldVisitId || 'Field Mobility Task'}</p>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide">Expense Audit Particulars</h4>
              <p><span className="font-semibold text-slate-700">Business Purpose:</span> {rmb.description}</p>
              {rmb.remarks && <p><span className="font-semibold text-slate-700">Internal Remarks:</span> {rmb.remarks}</p>}
              {rmb.approvalRemarks && <p><span className="font-semibold text-slate-700">Review Notes:</span> {rmb.approvalRemarks}</p>}
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-emerald-900 tracking-wider">Total Approved Claim Amount</p>
                <p className="text-xs text-emerald-700">Verified against submitted bill receipts and travel logs</p>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-900">₹{rmb.amount.toLocaleString()}</span>
            </div>
          </div>
        );
      }

      case 'quotation': {
        const qt = data;
        return (
          <div className="space-y-6 text-slate-800">
            <div className="text-center pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Official Business Quotation
              </h2>
              <p className="text-xs text-slate-500 mt-1">Quotation ID: {qt.quotationNumber} · Date: {qt.date}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Billed To:</p>
                <p className="font-semibold text-slate-800 mt-0.5">{qt.clientName || 'Client Organization'}</p>
                <p className="text-slate-600">Subject: {qt.title}</p>
              </div>
              <div>
                <p><span className="font-semibold text-slate-700">Quote Date:</span> {qt.date}</p>
                <p><span className="font-semibold text-slate-700">Valid Until:</span> {qt.validUntil}</p>
                <p><span className="font-semibold text-slate-700">Prepared By:</span> {qt.createdBy || 'Executive Team'}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Service Scope / Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate (₹)</th>
                    <th className="p-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {qt.items?.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td className="p-3 text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-sans font-medium text-slate-800">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity} {item.unit || ''}</td>
                      <td className="p-3 text-right">₹{item.unitPrice?.toLocaleString()}</td>
                      <td className="p-3 text-right font-semibold">₹{item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={4} className="p-2.5 text-right text-slate-600">Subtotal:</td>
                    <td className="p-2.5 text-right font-mono">₹{qt.subtotal?.toLocaleString()}</td>
                  </tr>
                  {qt.discount > 0 && (
                    <tr className="bg-slate-50 text-emerald-700">
                      <td colSpan={4} className="p-2.5 text-right font-medium">Agency Special Discount:</td>
                      <td className="p-2.5 text-right font-mono">- ₹{qt.discount?.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 text-slate-600">
                    <td colSpan={4} className="p-2.5 text-right">GST ({qt.taxPercent || 18}%):</td>
                    <td className="p-2.5 text-right font-mono">₹{qt.taxAmount?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-blue-50/70 font-bold text-blue-900 border-t-2 border-blue-200 text-sm">
                    <td colSpan={4} className="p-3 text-right">Grand Total:</td>
                    <td className="p-3 text-right font-mono">₹{qt.total?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <p className="font-bold text-slate-800">Commercial Terms & Conditions:</p>
              <p className="text-slate-600">{qt.terms || '50% advance upon confirmation. Balance within 15 days of milestone delivery.'}</p>
            </div>
          </div>
        );
      }

      case 'invoice': {
        const inv = data;
        return (
          <div className="space-y-6 text-slate-800">
            <div className="text-center pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Official Tax Invoice
              </h2>
              <p className="text-xs text-slate-500 mt-1">Invoice Number: {inv.invoiceNumber} · GSTIN: {company.gstNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Billed Customer:</p>
                <p className="font-semibold text-slate-800 mt-0.5">{inv.clientName || 'Client Account'}</p>
                <p className="text-slate-600">Place of Supply: Bangalore, Karnataka</p>
              </div>
              <div>
                <p><span className="font-semibold text-slate-700">Invoice Date:</span> {inv.issueDate}</p>
                <p><span className="font-semibold text-slate-700">Due Date:</span> {inv.dueDate}</p>
                <p><span className="font-semibold text-slate-700">Payment Status:</span> <span className="font-bold uppercase text-blue-600">{inv.status}</span></p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item / Service Deliverable</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Rate (₹)</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {inv.items?.map((it: any, idx: number) => (
                    <tr key={it.id || idx}>
                      <td className="p-3 text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-sans font-medium text-slate-800">{it.description}</td>
                      <td className="p-3 text-center">{it.quantity}</td>
                      <td className="p-3 text-right">₹{it.unitPrice?.toLocaleString()}</td>
                      <td className="p-3 text-right font-semibold">₹{it.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={4} className="p-2.5 text-right text-slate-600">Subtotal:</td>
                    <td className="p-2.5 text-right font-mono">₹{inv.subtotal?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600">
                    <td colSpan={4} className="p-2.5 text-right">GST (18%):</td>
                    <td className="p-2.5 text-right font-mono">₹{inv.taxAmount?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-blue-50/70 font-bold text-blue-900 border-t border-blue-200 text-sm">
                    <td colSpan={4} className="p-3 text-right">Invoice Total:</td>
                    <td className="p-3 text-right font-mono">₹{inv.totalAmount?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-800 font-semibold">
                    <td colSpan={4} className="p-2.5 text-right">Amount Paid:</td>
                    <td className="p-2.5 text-right font-mono">₹{inv.paidAmount?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-rose-50 text-rose-800 font-bold">
                    <td colSpan={4} className="p-2.5 text-right">Balance Due:</td>
                    <td className="p-2.5 text-right font-mono">₹{inv.balanceAmount?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="font-semibold text-slate-800">Priority Ads Agency Corporate Bank Account Details:</p>
              <p className="text-slate-600 mt-0.5">Bank: HDFC Bank Ltd | A/C: 50200088192837 | IFSC: HDFC0001244 | Branch: Hesragatta Road, Bangalore</p>
            </div>
          </div>
        );
      }

      case 'offer_letter':
      case 'joining_letter':
      case 'experience_letter':
      case 'relieving_letter': {
        const doc = data;
        const letterTitles: Record<string, string> = {
          offer_letter: 'Formal Offer of Employment',
          joining_letter: 'Appointment & Joining Confirmation Letter',
          experience_letter: 'Certificate of Work Experience',
          relieving_letter: 'Official Relieving & Service Clearance Letter'
        };

        return (
          <div className="space-y-6 text-slate-800 text-xs leading-relaxed">
            <div className="text-center pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {letterTitles[docType]}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Ref: PAA-HR-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)} · Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-900">To,</p>
              <p className="font-bold text-slate-900">{doc.name || 'Candidate Name'}</p>
              <p className="text-slate-600">{doc.address || 'Bangalore, Karnataka'}</p>
              <p className="text-slate-600">Email: {doc.email || 'candidate@priorityadsagency.com'}</p>
            </div>

            <div className="space-y-3 text-slate-700">
              <p className="font-semibold text-slate-900">Dear {doc.name || 'Sir/Madam'},</p>
              {docType === 'offer_letter' && (
                <>
                  <p>
                    With reference to your interview and discussions with our leadership panel, we are pleased to offer you the position of <strong className="text-slate-900">{doc.designation || 'Software Engineer'}</strong> at <strong>Priority Ads Agency</strong>.
                  </p>
                  <p>
                    Your gross annual remuneration will be <strong className="text-slate-900 font-mono">₹{((doc.salary?.netSalary || 60000) * 12).toLocaleString()} per annum</strong>, inclusive of all statutory components and performance incentives.
                  </p>
                  <p>
                    Your expected joining date is <strong className="text-slate-900">{doc.joiningDate || 'Immediate'}</strong> at our Bangalore Headquarters. Please sign and return a duplicate copy of this letter as acceptance of this offer.
                  </p>
                </>
              )}

              {docType === 'experience_letter' && (
                <>
                  <p>
                    This is to certify that <strong className="text-slate-900">{doc.name}</strong> was employed with <strong>Priority Ads Agency</strong> from <strong>{doc.joiningDate || 'January 2023'}</strong> to <strong>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong> as <strong className="text-slate-900">{doc.designation || 'Specialist'}</strong>.
                  </p>
                  <p>
                    During their tenure, they demonstrated exceptional professional competence, leadership, and integrity in delivering high-value agency campaigns and technical initiatives.
                  </p>
                  <p>
                    We wish them all success in their future career endeavors.
                  </p>
                </>
              )}

              {docType === 'joining_letter' && (
                <>
                  <p>
                    We take immense pleasure in welcoming you aboard <strong>Priority Ads Agency</strong>. Your appointment as <strong className="text-slate-900">{doc.designation || 'Associate'}</strong> in the <strong className="text-slate-900">{doc.department || 'Operations'}</strong> Department is formally confirmed effective <strong>{doc.joiningDate || 'Today'}</strong>.
                  </p>
                  <p>
                    You will report directly to your assigned Manager and are expected to uphold the agency's highest standards of excellence and client dedication.
                  </p>
                </>
              )}

              {docType === 'relieving_letter' && (
                <>
                  <p>
                    This has reference to your formal resignation letter. We hereby confirm that you are relieved from your duties and responsibilities at <strong>Priority Ads Agency</strong> as of close of business hours today.
                  </p>
                  <p>
                    All company assets, documentation, and handover processes have been satisfactorily settled with the HR & Accounts departments.
                  </p>
                </>
              )}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="p-4 text-xs text-slate-700">
            <p>Official document data preview for {docPreview.title}.</p>
            <pre className="mt-2 p-2 bg-slate-100 rounded overflow-x-auto text-[11px] font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDocument(); }}>
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl my-6 border border-slate-300">

        {/* Top Control Bar */}
        <div className="no-print sticky top-0 z-20 rounded-t-xl flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
          <div className="flex items-center gap-2">
            <button onClick={closeDocument} className="flex items-center gap-1.5 px-3 py-1.5 mr-1 text-xs font-bold rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"><ArrowLeft className="w-4 h-4" /><span>Back</span></button>
            <ShieldCheck className="w-5 h-5 text-amber-400 hidden sm:block" />
            <span className="font-semibold text-sm tracking-tight">{docPreview.title}</span>
            <span className="text-xs text-slate-400 hidden md:inline">· Official Priority Ads Agency Document Format</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={closeDocument}
              title="Close (Esc)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /><span>Close</span>
            </button>
          </div>
        </div>

        {/* Printable Official Document Layout */}
        <div ref={printRef} className="print-page bg-white p-8 md:p-12 relative min-h-[900px] flex flex-col justify-between select-text">

          {/* Subtle Watermark in background matching the provided letterhead */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-8 select-none z-0"
            aria-hidden="true"
          >
            <img
              src={company.logoUrl}
              alt=""
              className="w-[450px] max-w-[80%] object-contain"
            />
          </div>

          {/* Official Letterhead Header (Strictly preserving Prompt #1, #36, #61) */}
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 pb-4">
              <div className="flex items-center gap-4">
                {/* Logo Mark matching uploaded image_1c6ded1a.png */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <img
                      src={company.logoUrl}
                      alt="Priority Ads Agency Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#E5A31E] leading-none">
                      PRIORITY
                    </h1>
                    <div className="flex items-center gap-1.5 my-1">
                      <div className="h-[2px] w-4 bg-[#0050C8]"></div>
                      <span className="text-base font-extrabold tracking-widest text-[#0050C8] uppercase">
                        ADS AGENCY
                      </span>
                      <div className="h-[2px] w-4 bg-[#0050C8]"></div>
                    </div>
                    <p className="text-xs italic text-[#E5A31E] font-medium tracking-wide">
                      {company.tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Regulatory & Tax Markers */}
              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-semibold text-slate-700">GSTIN:</span> {company.gstNumber}</p>
                <p><span className="font-semibold text-slate-700">PAN:</span> {company.panNumber}</p>
                <p><span className="font-semibold text-slate-700">Branch:</span> Bangalore HQ</p>
              </div>
            </div>

            {/* Official Blue Divider Bar with Star Node */}
            <div className="relative w-full h-[2px] bg-[#0050C8] my-3">
              <div className="absolute -top-[5px] left-8 w-3 h-3 bg-[#0050C8] rotate-45"></div>
              <div className="absolute -top-[5px] right-8 w-2 h-2 bg-[#0050C8] rotate-45"></div>
            </div>
          </div>

          {/* Middle Document Body */}
          <div className="relative z-10 py-6 flex-grow">
            {renderDocumentBody()}
          </div>

          {/* Signature & Official Seal Stamp Area */}
          <div className="relative z-10 pt-4 pb-2">
            <div className="flex items-end justify-between">
              <div className="text-[11px] text-slate-500 max-w-sm">
                <p className="font-semibold text-slate-700">Official Authenticity Guarantee:</p>
                <p>This document bears the registered seal and signature of Priority Ads Agency, Bangalore.</p>
              </div>

              {/* Official Seal Stamp and Signature */}
              <div className="relative flex flex-col items-center">
                {/* Stamp overlaying signature line */}
                <div className="relative w-28 h-28 mb-1">
                  <img
                    src={company.stampUrl}
                    alt="Priority Ads Agency Official Stamp & Signature"
                    className="w-full h-full object-contain mix-blend-multiply rotate-[-4deg]"
                  />
                </div>
                <div className="w-44 border-t border-slate-400 mt-1 pt-1 text-center">
                  <p className="text-xs font-bold text-slate-900 uppercase">Ningappa B.</p>
                  <p className="text-[10px] text-slate-600 font-medium">Managing Director & Authorized Signatory</p>
                  <p className="text-[9px] text-slate-400">PRIORITY ADS AGENCY, BENGALURU</p>
                </div>
              </div>
            </div>

            {/* Official Footer Divider with Star Node */}
            <div className="relative w-full h-[2px] bg-[#0050C8] mt-6 mb-3">
              <div className="absolute -top-[5px] right-6 w-3 h-3 bg-[#0050C8] rotate-45"></div>
            </div>

            {/* Exact Contact Details as per uploaded Letterhead Footer */}
            <div className="text-center space-y-1 text-slate-800">
              <div className="flex items-center justify-center gap-6 text-xs font-bold tracking-tight text-slate-900">
                <span>{company.phone}</span>
                <span>{company.email}</span>
                <span>{company.website}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700">
                {company.address}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
