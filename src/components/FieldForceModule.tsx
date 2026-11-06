import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FieldVisit, FieldVisitType } from '../types';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Plus,
  CheckCircle,
  Receipt,
  Search,
  Filter,
  ArrowRight,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface FieldForceProps {
  onOpenStartVisitModal: () => void;
  onOpenExpenseModal: (visitId: string) => void;
}

export const FieldForceModule: React.FC<FieldForceProps> = ({
  onOpenStartVisitModal,
  onOpenExpenseModal
}) => {
  const {
    fieldVisits,
    activeFieldVisit,
    endFieldVisit,
    employees,
    clients,
    leads,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Complete visit modal state
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [actualOutcome, setActualOutcome] = useState('');
  const [discussionSummary, setDiscussionSummary] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);

  const handleEndVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingVisitId || !actualOutcome) return;

    endFieldVisit(completingVisitId, {
      actualOutcome,
      discussionSummary,
      followUpRequired,
      nextFollowUpDate: followUpRequired ? nextFollowUpDate : undefined,
      remarks
    });

    setCompletingVisitId(null);
    setActualOutcome('');
    setDiscussionSummary('');
    setRemarks('');
  };

  const filteredVisits = fieldVisits.filter(v => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCompany = v.companyName.toLowerCase().includes(q);
      const matchContact = v.contactPerson.toLowerCase().includes(q);
      const matchCode = v.visitCode.toLowerCase().includes(q);
      if (!matchCompany && !matchContact && !matchCode) return false;
    }
    if (filterType !== 'all' && v.visitType !== filterType) return false;
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <span>Field Force & Client Meeting Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time client site visits · Attendance mode linkage · Direct travel & food reimbursement generation
          </p>
        </div>

        <button
          onClick={onOpenStartVisitModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Start New Field Visit</span>
        </button>
      </div>

      {/* Active Field Visit Card if currently in progress */}
      {activeFieldVisit && (
        <div className="p-5 bg-amber-500/10 dark:bg-amber-950/40 rounded-xl border-2 border-amber-500/40 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                  Live Field Visit In-Progress: {activeFieldVisit.visitCode}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeFieldVisit.companyName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Contact: <strong className="text-slate-900 dark:text-white">{activeFieldVisit.contactPerson}</strong> · Type: {activeFieldVisit.visitType} · Purpose: {activeFieldVisit.purpose}
              </p>
              <p className="text-[11px] text-slate-500">
                Location: {activeFieldVisit.address} · Checked in at <strong className="font-mono text-slate-900 dark:text-white">{activeFieldVisit.startTime}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenExpenseModal(activeFieldVisit.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>+ Log Travel / Food Expense</span>
              </button>
              <button
                onClick={() => setCompletingVisitId(activeFieldVisit.id)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                Complete & End Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Visit Modal Form */}
      {completingVisitId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Conclude Field Visit & Record Outcomes (Prompt #25 & #27)
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the discussion summary, agreed next steps, and follow-up schedule.
            </p>

            <form onSubmit={handleEndVisitSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Meeting Outcome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client agreed to proposal, quotation approved for 3 screens"
                  value={actualOutcome}
                  onChange={e => setActualOutcome(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discussion Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of topics covered, pain points, budget discussed..."
                  value={discussionSummary}
                  onChange={e => setDiscussionSummary(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={e => setFollowUpRequired(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Follow-up Required?</span>
                </label>

                {followUpRequired && (
                  <div className="flex-grow">
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={e => setNextFollowUpDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional internal remarks for manager"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingVisitId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                >
                  Save & Complete Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact, or visit ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="all">All Visit Types</option>
          <option value="Client Meeting">Client Meeting</option>
          <option value="Sales Visit">Sales Visit</option>
          <option value="Site Visit">Site Visit</option>
          <option value="Business Development">Business Development</option>
          <option value="Payment Collection">Payment Collection</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="planned">Planned</option>
        </select>
      </div>

      {/* Visits Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Visit Code / Client</th>
                <th className="p-3">Field Employee</th>
                <th className="p-3">Date & Timings</th>
                <th className="p-3">Type & Location</th>
                <th className="p-3">Discussion / Outcome</th>
                <th className="p-3 text-right">Incurred Expenses</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No field visits logged for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredVisits.map(visit => {
                  const emp = getEmployee(visit.employeeId);
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {visit.visitCode}
                        </span>
                        <div className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                          {visit.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Attn: {visit.contactPerson}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {emp?.name || 'Field Representative'}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {emp?.employeeId}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {visit.date}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {visit.startTime} {visit.endTime ? `- ${visit.endTime}` : ''}
                        </div>
                        {visit.durationMinutes && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Duration: {visit.durationMinutes} mins
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {visit.visitType}
                        </span>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {visit.address}
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="font-medium text-slate-900 dark:text-white line-clamp-1">
                          {visit.actualOutcome || visit.expectedOutcome}
                        </p>
                        {visit.discussionSummary && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                            "{visit.discussionSummary}"
                          </p>
                        )}
                        {visit.followUpRequired && visit.nextFollowUpDate && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            Follow-up: {visit.nextFollowUpDate}
                          </p>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ₹{visit.expensesTotal.toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {visit.reimbursementId ? 'Claim Submitted' : 'No Claim'}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          visit.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : visit.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {visit.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenExpenseModal(visit.id)}
                            title="Add travel/fuel/food expense directly to this visit"
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          {visit.status === 'in_progress' && (
                            <button
                              onClick={() => setCompletingVisitId(visit.id)}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded cursor-pointer"
                            >
                              End Visit
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
  );
};
