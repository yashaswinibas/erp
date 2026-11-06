import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { localDate } from '../lib/dates'; // AGENCYOS_V2_UI
import { LeaveType, LeaveStatus, LeaveRequest } from '../types';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  Phone,
  FileText,
  User,
  Calendar,
  Info
} from 'lucide-react';

export const LeaveManagementModule: React.FC = () => {
  const {
    currentUser,
    currentRole,
    employees,
    leaveRequests,
    leaveBalances,
    applyLeave,
    reviewLeave,
    cancelLeave
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewModalData, setReviewModalData] = useState<{ id: string; action: 'approved' | 'rejected'; code: string; empName: string } | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Form state for applying leave
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState(localDate());
  const [endDate, setEndDate] = useState(localDate());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<'first_half' | 'second_half'>('first_half');
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(currentUser.phone2 || currentUser.phone || '+91 9448011223');

  // Can review if Super Admin, Admin, HR, or Manager
  const canReview = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'hr' || currentRole === 'manager';

  // Get user's balance
  const userBalance = leaveBalances.find(b => b.employeeId === currentUser.id) || {
    employeeId: currentUser.id,
    casualLeaveTotal: 12,
    casualLeaveUsed: 1,
    sickLeaveTotal: 8,
    sickLeaveUsed: 0,
    privilegeLeaveTotal: 15,
    privilegeLeaveUsed: 2,
    compOffTotal: 2,
    compOffUsed: 0
  };

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);

  // Calculate day difference
  const calculateDays = (start: string, end: string, half: boolean) => {
    if (half) return 0.5;
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const calculatedDays = calculateDays(startDate, endDate, isHalfDay);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    applyLeave({
      employeeId: currentUser.id,
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      daysCount: calculatedDays,
      isHalfDay,
      halfDayType: isHalfDay ? halfDayType : undefined,
      reason,
      emergencyContact
    });

    setIsApplyModalOpen(false);
    setReason('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalData) return;
    reviewLeave(reviewModalData.id, reviewModalData.action, reviewRemarks);
    setReviewModalData(null);
    setReviewRemarks('');
  };

  // Filter requests
  const filteredRequests = leaveRequests.filter(req => {
    const emp = getEmployee(req.employeeId);

    // Non-admins and non-managers see their own leave requests
    if (currentRole === 'employee' && req.employeeId !== currentUser.id) {
      return false;
    }

    if (activeTab === 'pending' && req.status !== 'pending') return false;
    if (activeTab === 'approved' && req.status !== 'approved') return false;
    if (activeTab === 'rejected' && req.status !== 'rejected' && req.status !== 'cancelled') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchEmp = emp?.name.toLowerCase().includes(q) || emp?.employeeId.toLowerCase().includes(q);
      const matchCode = req.leaveCode.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      if (!matchEmp && !matchCode && !matchReason) return false;
    }

    return true;
  });

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Leave Management & Time-Off Balance</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Annual entitlements, half-day leaves, medical approvals & emergency contact audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Balance Grid for current user */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Casual Leave */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Casual Leave (CL)</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {userBalance.casualLeaveTotal - userBalance.casualLeaveUsed} Avail
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {userBalance.casualLeaveTotal - userBalance.casualLeaveUsed} <span className="text-xs font-normal text-slate-500">/ {userBalance.casualLeaveTotal}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">Used: {userBalance.casualLeaveUsed}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (userBalance.casualLeaveUsed / userBalance.casualLeaveTotal) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Sick Leave */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sick Leave (SL)</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              {userBalance.sickLeaveTotal - userBalance.sickLeaveUsed} Avail
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {userBalance.sickLeaveTotal - userBalance.sickLeaveUsed} <span className="text-xs font-normal text-slate-500">/ {userBalance.sickLeaveTotal}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">Used: {userBalance.sickLeaveUsed}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (userBalance.sickLeaveUsed / userBalance.sickLeaveTotal) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Privilege Leave */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Privilege Leave (PL)</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              {userBalance.privilegeLeaveTotal - userBalance.privilegeLeaveUsed} Avail
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {userBalance.privilegeLeaveTotal - userBalance.privilegeLeaveUsed} <span className="text-xs font-normal text-slate-500">/ {userBalance.privilegeLeaveTotal}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">Used: {userBalance.privilegeLeaveUsed}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (userBalance.privilegeLeaveUsed / userBalance.privilegeLeaveTotal) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Comp Off */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Compensatory Off</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              {userBalance.compOffTotal - userBalance.compOffUsed} Avail
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {userBalance.compOffTotal - userBalance.compOffUsed} <span className="text-xs font-normal text-slate-500">/ {userBalance.compOffTotal}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">Used: {userBalance.compOffUsed}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-600 h-1.5 rounded-full"
              style={{ width: `${userBalance.compOffTotal > 0 ? Math.min(100, (userBalance.compOffUsed / userBalance.compOffTotal) * 100) : 0}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Policy Notice Box */}
      <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/70 dark:border-blue-900/40 text-xs flex items-start gap-3 text-blue-900 dark:text-blue-300">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Priority Ads Agency Leave Norms & Workflow</p>
          <p className="text-slate-600 dark:text-slate-400">
            • Standard shift is 09:30 AM to 06:30 PM (9 hours with 15m grace). Full-day minimum is 8.0 hrs; Half-day is 4.0 hrs.
            <br />
            • Casual Leave requires 24h advance notice. Sick Leave exceeding 2 consecutive days requires a registered medical certificate.
            <br />
            • Comp-offs are credited upon verified weekend deployment for outdoor billboard shoots or urgent live campaign rollouts.
          </p>
        </div>
      </div>

      {/* Requests Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Requests ({leaveRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Rejected / Cancelled
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, employee, reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Leave Code</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duration / Dates</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Emergency Mobile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No leave requests found matching the current view.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const emp = getEmployee(req.employeeId);
                  const isOwn = req.employeeId === currentUser.id;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {req.leaveCode}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {emp?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {emp?.employeeId} · {emp?.employmentType}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {req.leaveType}
                        </span>
                        {req.isHalfDay && (
                          <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            Half Day ({req.halfDayType === 'first_half' ? '1st Half' : '2nd Half'})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div>{req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}</div>
                        <div className="text-[11px] text-slate-500">{req.daysCount} Day(s)</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={req.reason}>
                        <span className="text-slate-700 dark:text-slate-300">{req.reason}</span>
                        {req.reviewRemarks && (
                          <div className="text-[11px] text-slate-500 mt-0.5 italic">
                            Review: {req.reviewRemarks}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {req.emergencyContact ? (
                          <a href={`tel:${req.emergencyContact}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{req.emergencyContact}</span>
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                        {req.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {canReview && (
                              <>
                                <button
                                  onClick={() => setReviewModalData({ id: req.id, action: 'approved', code: req.leaveCode, empName: emp?.name || '' })}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setReviewModalData({ id: req.id, action: 'rejected', code: req.leaveCode, empName: emp?.name || '' })}
                                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] cursor-pointer shadow-xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {isOwn && (
                              <button
                                onClick={() => cancelLeave(req.id)}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                        {req.status !== 'pending' && (
                          <span className="text-slate-400 text-[11px]">
                            {req.reviewedBy ? `By ${req.reviewedBy}` : 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Apply for Leave</span>
                </h3>
                <p className="text-xs text-slate-500">Applicant: {currentUser.name} ({currentUser.employeeId})</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-5 space-y-4 text-xs">

              {/* Leave Type */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Leave Category
                </label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Casual Leave">Casual Leave (CL) — Available: {userBalance.casualLeaveTotal - userBalance.casualLeaveUsed}</option>
                  <option value="Sick Leave">Sick Leave (SL) — Available: {userBalance.sickLeaveTotal - userBalance.sickLeaveUsed}</option>
                  <option value="Privilege Leave">Privilege Leave (PL) — Available: {userBalance.privilegeLeaveTotal - userBalance.privilegeLeaveUsed}</option>
                  <option value="Compensatory Off">Compensatory Off — Available: {userBalance.compOffTotal - userBalance.compOffUsed}</option>
                </select>
              </div>

              {/* Half Day Option */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={e => setIsHalfDay(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Apply as Half Day (0.5 day)</span>
                </label>

                {isHalfDay && (
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="halfDayType"
                        checked={halfDayType === 'first_half'}
                        onChange={() => setHalfDayType('first_half')}
                        className="text-blue-600"
                      />
                      <span>First Half (Morning)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="halfDayType"
                        checked={halfDayType === 'second_half'}
                        onChange={() => setHalfDayType('second_half')}
                        className="text-blue-600"
                      />
                      <span>Second Half (Afternoon)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHalfDay ? 'Leave Date' : 'From Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                {!isHalfDay && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      required
                      min={startDate}
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Calculated duration badge */}
              <div className="flex items-center justify-between text-xs py-1 px-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 font-mono">
                <span>Calculated Duration:</span>
                <span className="font-bold">{calculatedDays} Day(s)</span>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Leave *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="State the purpose (e.g. personal exigency, medical emergency, family event)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Mobile Number
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Submit Application
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Review Modal for HR/Admin */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {reviewModalData.action === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button onClick={() => setReviewModalData(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-4 space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                You are about to mark <strong>{reviewModalData.code}</strong> for <strong>{reviewModalData.empName}</strong> as{' '}
                <span className={reviewModalData.action === 'approved' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {reviewModalData.action.toUpperCase()}
                </span>.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager / HR Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Approved. Tasks handed over to teammate."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalData(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded-lg text-white font-semibold shadow-xs ${
                    reviewModalData.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {reviewModalData.action === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
