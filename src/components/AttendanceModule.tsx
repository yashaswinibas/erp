// AGENCYOS_HUBS_DONE
import React, { useState, useEffect } from 'react';
import { useApp, parseTimeToMinutes, calculateTimeDiffHours } from '../context/AppContext';
import { localDate } from '../lib/dates'; // AGENCYOS_V2_UI
import { WorkMode, AttendanceStatus } from '../types';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  ShieldCheck,
  UserCheck,
  Building,
  MapPin,
  Laptop,
  Briefcase,
  Play,
  Square,
  Timer,
  ChevronRight,
  TrendingUp,
  UserX
} from 'lucide-react';

export const AttendanceModule: React.FC<{ onOpenRegularizeModal: () => void }> = ({ onOpenRegularizeModal }) => {
  const {
    attendance,
    employees,
    departments,
    currentUser,
    currentRole,
    regularizations,
    reviewRegularization,
    todayAttendance,
    checkInAttendance,
    checkOutAttendance,
    resetAttendanceShift,
    updateEmployeeAttendanceStatus,
    company
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPunchMode, setSelectedPunchMode] = useState<WorkMode>(currentUser.workMode || 'office');
  const [punchRemarks, setPunchRemarks] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Can review if Super Admin, Admin, HR, or Manager
  const canReview = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'hr' || currentRole === 'manager';

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);

  // Formatted live clock string
  const liveClockStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const liveDateStr = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Compute live duration if checked in today and not yet checked out
  const getLiveDuration = (checkInStr: string) => {
    if (!checkInStr) return '0h 0m';
    const nowTimeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const inMins = parseTimeToMinutes(checkInStr);
    const nowMins = parseTimeToMinutes(nowTimeStr);
    let diff = nowMins - inMins;
    if (diff < 0) diff += 24 * 60;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins}m`;
  };

  // Determine late arrival based on company office start time + grace (09:30 + 15m = 09:45 AM = 585 mins)
  const isLateCheckIn = (checkInStr: string) => {
    if (!checkInStr) return false;
    const inMins = parseTimeToMinutes(checkInStr);
    const shiftStartMins = 9 * 60 + 30; // 09:30 AM
    const graceMins = company?.graceMinutes || 15;
    return inMins > (shiftStartMins + graceMins);
  };

  // Filter attendance
  const filteredAttendance = attendance.filter(rec => {
    const emp = getEmployee(rec.employeeId);
    if (!emp) return false;

    // Non-admins only see their own records unless they are HR or managers
    if (currentRole === 'employee' && rec.employeeId !== currentUser.id) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchId = emp.employeeId.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    if (selectedDept !== 'all' && emp.departmentId !== selectedDept) return false;
    if (selectedStatus !== 'all' && rec.status !== selectedStatus) return false;
    if (dateFilter && rec.date !== dateFilter) return false;

    return true;
  });

  // Today's summary stats
  const todayStr = localDate();
  const todayRecords = attendance.filter(a => a.date === todayStr);
  const totalStaff = employees.length;
  const presentCount = todayRecords.filter(a => a.checkIn && a.status !== 'leave' && a.status !== 'absent').length;
  const lateCount = todayRecords.filter(a => a.checkIn && isLateCheckIn(a.checkIn)).length;
  const fieldVisitCount = todayRecords.filter(a => a.status === 'field_visit' || a.workMode === 'field').length;
  const onLeaveCount = employees.filter(e => e.status === 'on_leave').length;

  const exportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Date', 'Check-In', 'Check-Out', 'Hours', 'Status', 'Work Mode', 'Remarks'];
    const rows = filteredAttendance.map(rec => {
      const emp = getEmployee(rec.employeeId);
      const effectiveHours = rec.checkOut
        ? rec.workingHours
        : (rec.checkIn ? calculateTimeDiffHours(rec.checkIn, currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })) : 0);

      return [
        emp?.employeeId || rec.employeeId,
        `"${emp?.name || ''}"`,
        rec.date,
        rec.checkIn || '—',
        rec.checkOut || 'In Progress',
        effectiveHours,
        rec.status,
        rec.workMode,
        `"${rec.remarks || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `priority_ads_attendance_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCheckedIn = Boolean(todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut);
  const isShiftEnded = Boolean(todayAttendance && todayAttendance.checkOut);

  return (
    <div className="space-y-6">

      {/* Module Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="legacy-title text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Attendance & Working Hours Desk</span>
          </h2>
          <p className="legacy-title text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official Shift: 09:30 AM – 06:30 PM (Grace till 09:45 AM) · Biometric & Login Auto-Sync
          </p>
        </div>

        <div className="flex items-center gap-2">
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenRegularizeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Regularize Attendance</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE LIVE PUNCH DESK CARD */}
      {/* ======================================================== */}
      <div className="p-5 bg-gradient-to-r from-blue-900 via-slate-900 to-[#0A1633] rounded-2xl border border-blue-900/60 shadow-lg text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* User & Live Clock Information */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE WORKDESK CLOCK · ASIA/KOLKATA</span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
              {liveClockStr}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {liveDateStr}
            </div>

            <div className="pt-2 text-xs border-t border-slate-800/80">
              <div className="font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-slate-400 font-mono text-[11px]">{currentUser.employeeId} · {currentUser.role.replace('_', ' ').toUpperCase()}</div>
            </div>
          </div>

          {/* Current Punch Status & Shift Compliance */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Today's Punch Status:</span>
              {isCheckedIn && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Punched In
                </span>
              )}
              {isShiftEnded && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Shift Completed
                </span>
              )}
              {!isCheckedIn && !isShiftEnded && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Not Checked In
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">Check In</span>
                <span className="font-mono font-bold text-white text-sm">
                  {todayAttendance?.checkIn || '—'}
                </span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">Check Out</span>
                <span className="font-mono font-bold text-white text-sm">
                  {todayAttendance?.checkOut || (isCheckedIn ? 'Running...' : '—')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
              <span className="text-slate-300 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-blue-400" />
                <span>Working Duration:</span>
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {isCheckedIn
                  ? getLiveDuration(todayAttendance?.checkIn || '')
                  : (todayAttendance?.workingHours ? `${todayAttendance.workingHours} hrs` : '0h 0m')}
              </span>
            </div>
          </div>

          {/* Action Punch Area */}
          <div className="lg:col-span-4 space-y-3">
            {!isShiftEnded && (
              <>
                {!isCheckedIn ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {(['office', 'wfh', 'field'] as WorkMode[]).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSelectedPunchMode(mode)}
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                            selectedPunchMode === mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {mode === 'wfh' ? 'WFH' : mode}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => checkInAttendance(selectedPunchMode, punchRemarks || `Checked in from ${selectedPunchMode}`)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Punch In for Shift</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-300">
                      Currently working as: <strong className="text-emerald-400 uppercase">{todayAttendance?.workMode}</strong>
                    </div>

                    <button
                      onClick={checkOutAttendance}
                      className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Punch Out (End Shift)</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {isShiftEnded && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-center space-y-2">
                <div className="font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Shift Completed for Today</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Logged {todayAttendance?.workingHours} total hours. Have a restful evening!
                </p>
                <button
                  type="button"
                  onClick={() => resetAttendanceShift()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  ↻ Re-Open Shift / Punch In Again
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {presentCount} <span className="text-xs font-normal text-slate-500">/ {totalStaff}</span>
            </span>
            <span className="text-xs font-mono text-emerald-600 font-bold">
              {Math.round((presentCount / totalStaff) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged into AgencyOS workdesk</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Late Check-ins</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {lateCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">Past 09:45 AM</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">15m grace window exceeded</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Field Visits</span>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {fieldVisitCount}
            </span>
            <span className="text-xs text-blue-600 font-bold font-mono">Active GPS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Client site meetings ongoing</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">On Leave</span>
            <UserX className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {onLeaveCount}
            </span>
            <span className="text-xs text-purple-600 font-bold font-mono">Approved</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Casual / Sick / Privilege off</p>
        </div>

      </div>

      {/* Pending Attendance Regularization Section */}
      {canReview && regularizations.filter(r => r.status === 'pending').length > 0 && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-bold uppercase text-amber-900 dark:text-amber-200 tracking-wider">
                Pending Attendance Corrections Requiring Review
              </h4>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
              {regularizations.filter(r => r.status === 'pending').length} Request(s)
            </span>
          </div>

          <div className="space-y-2">
            {regularizations.filter(r => r.status === 'pending').map(req => {
              const emp = getEmployee(req.employeeId);
              return (
                <div key={req.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{emp?.name}</span>
                      <span className="text-slate-500">({emp?.employeeId})</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{req.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Requested Timings: <strong className="font-mono text-blue-600 dark:text-blue-400">{req.correctCheckIn} - {req.correctCheckOut}</strong>
                    </p>
                    <p className="text-slate-500 italic mt-0.5">Reason: "{req.reason}"</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => reviewRegularization(req.id, 'approved', 'Approved by manager')}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewRegularization(req.id, 'rejected', 'Time discrepancy')}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">

        <div className="flex flex-wrap items-center gap-2 text-xs">

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="field_visit">Field Visit</option>
            <option value="half_day">Half Day</option>
            <option value="leave">Leave</option>
            <option value="absent">Absent</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear Date
            </button>
          )}

        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* Attendance Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Working Hours</th>
                <th className="px-4 py-3">Work Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3 text-right">Quick HR Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(rec => {
                  const emp = getEmployee(rec.employeeId);
                  const isLate = isLateCheckIn(rec.checkIn);
                  const isCurrentActive = !rec.checkOut && rec.checkIn && rec.date === todayStr;
                  const displayHours = rec.checkOut
                    ? `${rec.workingHours} hrs`
                    : (isCurrentActive ? `${getLiveDuration(rec.checkIn)} (Active)` : '—');

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {emp?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {emp?.employeeId} · {emp?.role.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {rec.date}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {rec.checkIn ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">{rec.checkIn}</span>
                            {isLate && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                Late
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {rec.checkOut ? (
                          <span className="font-bold text-slate-900 dark:text-white">{rec.checkOut}</span>
                        ) : (
                          isCurrentActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              In Progress
                            </span>
                          ) : '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {displayHours}
                      </td>
                      <td className="px-4 py-3 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {rec.workMode}
                      </td>
                      <td className="px-4 py-3">
                        {rec.status === 'present' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            Present
                          </span>
                        )}
                        {rec.status === 'field_visit' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            Field Visit
                          </span>
                        )}
                        {rec.status === 'late' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            Late Arrival
                          </span>
                        )}
                        {rec.status === 'half_day' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
                            Half Day
                          </span>
                        )}
                        {rec.status === 'leave' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            On Leave
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {rec.remarks || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canReview ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => updateEmployeeAttendanceStatus(rec.employeeId, 'present', 'office')}
                              title="Set Present"
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 cursor-pointer"
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => updateEmployeeAttendanceStatus(rec.employeeId, 'field_visit', 'field')}
                              title="Set Field Visit"
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 cursor-pointer"
                            >
                              Field
                            </button>
                            <button
                              type="button"
                              onClick={() => resetAttendanceShift(rec.employeeId)}
                              title="Reset shift"
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Logged</span>
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

    </div>
  );
};
