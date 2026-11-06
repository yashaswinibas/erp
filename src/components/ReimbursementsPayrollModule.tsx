import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProofThumbs } from './ProofThumbs'; // AGENCYOS_V2_PART12
import { Reimbursement, Payslip, Employee } from '../types';
import {
  Receipt,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Plus,
  Download,
  Printer,
  FileSpreadsheet,
  Car,
  Utensils,
  Hotel,
  ShieldCheck,
  Send,
  XCircle,
  TrendingUp,
  MapPin,
  FileText
} from 'lucide-react';

export const ReimbursementsPayrollModule: React.FC<{
  onOpenAddReimbursementModal: () => void
}> = ({ onOpenAddReimbursementModal }) => {
  const {
    reimbursements,
    reviewReimbursement,
    employees,
    currentUser,
    currentRole,
    payslips,
    generatePayslipForEmployee,
    openDocument
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'reimbursements' | 'payroll'>('reimbursements');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Payout / Rejection Modal State
  const [actionClaimId, setActionClaimId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'pay' | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');

  const canApprove = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'hr' || currentRole === 'manager';

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);

  // Big Metrics
  const totalClaimsSum = reimbursements.reduce((sum, r) => sum + r.amount, 0);
  const pendingClaims = reimbursements.filter(r => r.status === 'submitted' || r.status === 'under_review');
  const pendingSum = pendingClaims.reduce((sum, r) => sum + r.amount, 0);
  const travelFuelClaims = reimbursements.filter(r => r.category === 'Travel' || r.category === 'Fuel' || r.category === 'Transportation');
  const travelFuelSum = travelFuelClaims.reduce((sum, r) => sum + r.amount, 0);
  const paidClaims = reimbursements.filter(r => r.status === 'paid');
  const paidSum = paidClaims.reduce((sum, r) => sum + r.amount, 0);

  const filteredReimbursements = reimbursements.filter(r => {
    // Non-managers only see their own claims unless HR/Admin
    if (currentRole === 'employee' && r.employeeId !== currentUser.id) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchCode = r.reimbursementCode.toLowerCase().includes(q);
      const emp = getEmployee(r.employeeId);
      const matchEmp = emp?.name.toLowerCase().includes(q) || false;
      if (!matchDesc && !matchCode && !matchEmp) return false;
    }

    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionClaimId || !actionType) return;

    if (actionType === 'reject') {
      reviewReimbursement(actionClaimId, 'rejected', actionRemarks || 'Expense non-compliant with agency policy.');
    } else if (actionType === 'pay') {
      reviewReimbursement(actionClaimId, 'paid', actionRemarks || 'Disbursed via Direct Bank / Corporate UPI.');
    }

    setActionClaimId(null);
    setActionType(null);
    setActionRemarks('');
  };

  const exportCSV = () => {
    const headers = ['Claim Code', 'Employee ID', 'Employee Name', 'Date', 'Category', 'Amount (INR)', 'Purpose', 'Status', 'Payment Method', 'Reviewed By'];
    const rows = filteredReimbursements.map(r => {
      const emp = getEmployee(r.employeeId);
      return [
        r.reimbursementCode,
        emp?.employeeId || r.employeeId,
        `"${emp?.name || ''}"`,
        r.date,
        r.category,
        r.amount,
        `"${r.description.replace(/"/g, '""')}"`,
        r.status,
        r.paymentMethod,
        `"${r.reviewedBy || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `priority_ads_reimbursements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Reimbursements & Corporate Expense Management</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              AUDIT COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time mileage calculations · Field force travel claims · GST non-taxable expense refund · Priority Ads Agency official stamped vouchers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveSubTab('reimbursements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'reimbursements'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Reimbursements ({reimbursements.length})
            </button>
            <button
              onClick={() => setActiveSubTab('payroll')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'payroll'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Payroll Register ({employees.length})
            </button>
          </div>

          {activeSubTab === 'reimbursements' && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onOpenAddReimbursementModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ File New Claim</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSubTab === 'reimbursements' ? (

        /* ======================================================== */
        /* BIG REIMBURSEMENT DASHBOARD WITH 4 STAT CARDS */
        /* ======================================================== */
        <div className="space-y-6">

          {/* 4 Big KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. Total Claims Filed */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Claims Filed</span>
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
                ₹{totalClaimsSum.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {reimbursements.length} overall submissions
              </p>
            </div>

            {/* 2. Pending Approval */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending HR Approval</span>
                <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                ₹{pendingSum.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {pendingClaims.length} claims awaiting review
              </p>
            </div>

            {/* 3. Field Force Travel & Fuel */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Field Force Mileage</span>
                <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Car className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 tabular-nums">
                ₹{travelFuelSum.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {travelFuelClaims.length} travel & fuel claims
              </p>
            </div>

            {/* 4. Disbursed / Settled */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Settled & Disbursed</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                ₹{paidSum.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {paidClaims.length} payouts confirmed via bank
              </p>
            </div>

          </div>

          {/* Search, Status Tabs, and Category Filters */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
              {[
                { id: 'all', label: `All Claims (${reimbursements.length})` },
                { id: 'submitted', label: `Pending Review (${pendingClaims.length})` },
                { id: 'approved', label: `Approved (${reimbursements.filter(r => r.status === 'approved').length})` },
                { id: 'paid', label: `Settled / Paid (${paidClaims.length})` },
                { id: 'rejected', label: `Rejected (${reimbursements.filter(r => r.status === 'rejected').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input & Category Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search claims by description, claim code, employee name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Expense Categories</option>
                  <option value="Travel">Travel & Lodging</option>
                  <option value="Fuel">Fuel & Mileage</option>
                  <option value="Transportation">Transportation & Cab</option>
                  <option value="Client Meeting">Client Food & Refreshments</option>
                  <option value="Office Supplies">Print Samples & Materials</option>
                  <option value="Software">Software & Cloud Hosting</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>
            </div>

          </div>

          {/* Big Detailed Claims Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Claim ID</th>
                    <th className="p-3.5">Employee Name & ID</th>
                    <th className="p-3.5">Date & Category</th>
                    <th className="p-3.5">Expense Purpose & Proof</th>
                    <th className="p-3.5 text-right">Claim Amount</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Verification & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReimbursements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No reimbursement claims found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReimbursements.map(rmb => {
                      const emp = getEmployee(rmb.employeeId);
                      return (
                        <tr key={rmb.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">

                          {/* Claim Reference */}
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {rmb.reimbursementCode}
                            </span>
                            {rmb.fieldVisitId && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>Linked to Field Visit</span>
                              </div>
                            )}
                          </td>

                          {/* Employee */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {emp?.name || 'Staff Member'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {emp?.employeeId} · {emp?.workMode.toUpperCase()}
                            </div>
                          </td>

                          {/* Date & Category */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                              {rmb.category === 'Fuel' || rmb.category === 'Travel' || rmb.category === 'Transportation' ? (
                                <Car className="w-3.5 h-3.5 text-purple-500" />
                              ) : rmb.category === 'Client Meeting' || rmb.category === 'Food' ? (
                                <Utensils className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Receipt className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              <span>{rmb.category}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {rmb.date}
                            </div>
                          </td>

                          {/* Purpose & Proof */}
                          <td className="p-3.5 max-w-sm">
                            <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                              {rmb.description}
                            </p>
                            {rmb.proofFiles && rmb.proofFiles.length > 0 ? (
                              <ProofThumbs files={rmb.proofFiles} size={48} />
                            ) : rmb.receiptName ? (
                              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-mono font-medium" title="Sample data - no file uploaded">
                                <FileText className="w-3 h-3" />
                                <span>{rmb.receiptName}</span>
                              </div>
                            ) : (
                              <div className="mt-1 text-[11px] font-bold text-rose-600">No proof attached</div>
                            )}
                            {rmb.approvalRemarks && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">
                                Note: {rmb.approvalRemarks}
                              </div>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white text-sm tabular-nums">
                            ₹{rmb.amount.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              rmb.status === 'approved'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                : rmb.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                : rmb.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            }`}>
                              {rmb.status}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">

                              {/* Print Official Voucher */}
                              <button
                                onClick={() => openDocument('reimbursement_statement', `Reimbursement Audit - ${rmb.reimbursementCode}`, rmb)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                              >
                                View Voucher
                              </button>

                              {/* Manager / HR Actions */}
                              {canApprove && (rmb.status === 'submitted' || rmb.status === 'under_review') && (
                                <>
                                  <button
                                    onClick={() => { if (!(rmb.proofFiles && rmb.proofFiles.length) && !confirm('This claim has no uploaded proof (bill photo). Approve anyway?')) return; reviewReimbursement(rmb.id, 'approved', `Approved by ${currentUser.name}`); }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs cursor-pointer transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActionClaimId(rmb.id);
                                      setActionType('reject');
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {canApprove && rmb.status === 'approved' && (
                                <button
                                  onClick={() => {
                                    setActionClaimId(rmb.id);
                                    setActionType('pay');
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs cursor-pointer transition-colors"
                                >
                                  Disburse / Pay
                                </button>
                              )}

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (

        /* ======================================================== */
        /* PAYROLL & SALARY REGISTER */
        /* ======================================================== */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Corporate Payroll Register — Priority Ads Agency
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly statutory pay components, incentives, and approved reimbursement payouts
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900">
                Cycle: October 2026 (Monthly)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5 text-right">Basic Pay</th>
                    <th className="p-3.5 text-right">HRA</th>
                    <th className="p-3.5 text-right">Allowances</th>
                    <th className="p-3.5 text-right">Incentives</th>
                    <th className="p-3.5 text-right">Deductions</th>
                    <th className="p-3.5 text-right">Approved Reimbursements</th>
                    <th className="p-3.5 text-right">Net Payable</th>
                    <th className="p-3.5 text-right">Official Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {employees.map(emp => {
                    const approvedRmbs = reimbursements
                      .filter(r => r.employeeId === emp.id && (r.status === 'approved' || r.status === 'paid'))
                      .reduce((s, r) => s + r.amount, 0);

                    const net = emp.salary.netSalary + approvedRmbs;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-sans">
                          <span className="font-bold text-slate-900 dark:text-white">{emp.name}</span>
                          <div className="text-[11px] text-slate-500 font-mono">{emp.employeeId} · {emp.role.replace('_', ' ')}</div>
                        </td>
                        <td className="p-3.5 text-right">₹{emp.salary.basic.toLocaleString()}</td>
                        <td className="p-3.5 text-right">₹{emp.salary.hra.toLocaleString()}</td>
                        <td className="p-3.5 text-right">₹{emp.salary.allowances.toLocaleString()}</td>
                        <td className="p-3.5 text-right">₹{emp.salary.incentives.toLocaleString()}</td>
                        <td className="p-3.5 text-right text-rose-600">₹{emp.salary.deductions.toLocaleString()}</td>
                        <td className="p-3.5 text-right text-purple-600 dark:text-purple-400 font-bold">
                          + ₹{approvedRmbs.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900 dark:text-white text-sm">
                          ₹{net.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-right font-sans">
                          <button
                            onClick={() => openDocument('payslip', `Official Payslip - ${emp.name}`, {
                              employeeId: emp.id,
                              payPeriod: 'October 2026',
                              payslipNumber: `PAA-SLIP-2026-10-${emp.employeeId.slice(-3)}`,
                              basicSalary: emp.salary.basic,
                              hra: emp.salary.hra,
                              allowances: emp.salary.allowances,
                              incentives: emp.salary.incentives,
                              bonus: emp.salary.bonus,
                              grossSalary: emp.salary.basic + emp.salary.hra + emp.salary.allowances + emp.salary.incentives + emp.salary.bonus,
                              deductions: emp.salary.deductions,
                              approvedReimbursement: approvedRmbs,
                              netPay: net,
                              generatedDate: '2026-10-31'
                            })}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer"
                          >
                            Generate Letterhead PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Payout Action Modal */}
      {actionClaimId && actionType && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {actionType === 'reject' ? 'Reject Reimbursement Claim' : 'Disburse & Settle Reimbursement'}
            </h3>
            <p className="text-slate-500">
              {actionType === 'reject'
                ? 'Please specify the audit reason for rejecting this claim.'
                : 'Enter the bank transfer UTR or UPI transaction reference for payment confirmation.'}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {actionType === 'reject' ? 'Rejection Reason *' : 'Bank Transfer UTR / UPI Reference *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={actionType === 'reject' ? 'e.g. Ineligible category, receipt missing GSTIN...' : 'e.g. UTR-HDFC-9918237190'}
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionClaimId(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold text-white shadow-xs cursor-pointer ${
                    actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {actionType === 'reject' ? 'Confirm Rejection' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
