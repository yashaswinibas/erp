import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Settings, 
  Clock, 
  FileCheck, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Save
} from 'lucide-react';

export const AuditSettingsModule: React.FC = () => {
  const { 
    auditLogs, 
    company, 
    updateCompany, 
    dailyActivities, 
    employees, 
    tasks, 
    projects,
    currentRole 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'audit' | 'settings' | 'activities'>('audit');
  
  // Settings form state
  const [formData, setFormData] = useState({
    name: company.name,
    tagline: company.tagline,
    phone: company.phone,
    email: company.email,
    website: company.website,
    address: company.address,
    gstNumber: company.gstNumber,
    panNumber: company.panNumber,
    officeStartTime: company.officeStartTime,
    officeEndTime: company.officeEndTime,
    graceMinutes: company.graceMinutes,
    minWorkingHoursFullDay: company.minWorkingHoursFullDay,
    minWorkingHoursHalfDay: company.minWorkingHoursHalfDay
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);
  const getTask = (tId?: string) => tasks.find(t => t.id === tId);
  const getProject = (pId?: string) => projects.find(p => p.id === pId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Audit Trail, Daily Work Activities & Company Rules</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Traceable activity logs (Prompt #52) · Daily work logs (Prompt #15) · Company attendance rules (Prompt #4 & #13)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'activities'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Daily Work Logs ({dailyActivities.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Company Rules & Settings
            </button>
          </div>
        </div>
      </div>

      {/* 1. AUDIT LOGS VIEW */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              Immutable System Audit Log
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              All timestamps verified by server clock
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Related Entity</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-500 text-[11px]">
                      {log.date} {log.time}
                    </td>
                    <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">
                      {log.relatedRecord}
                    </td>
                    <td className="p-3 font-sans text-slate-600 dark:text-slate-300 text-xs">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DAILY WORK LOGS VIEW */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Date / Timestamp</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Project & Task</th>
                    <th className="p-3">Completed Deliverables</th>
                    <th className="p-3">Work In Progress / Next</th>
                    <th className="p-3 text-right">Hours</th>
                    <th className="p-3">Blockers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dailyActivities.map(act => {
                    const emp = getEmployee(act.employeeId);
                    const prj = getProject(act.projectId);
                    const tsk = getTask(act.taskId);

                    return (
                      <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {act.date}
                          <div className="text-[10px] text-slate-400">{act.createdAt}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {emp?.name || 'Staff Member'}
                          </span>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {emp?.employeeId}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {prj?.name || 'General Operations'}
                          </span>
                          {tsk && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                              ↳ {tsk.title}
                            </div>
                          )}
                        </td>
                        <td className="p-3 max-w-xs text-slate-800 dark:text-slate-200">
                          {act.completedWork}
                        </td>
                        <td className="p-3 max-w-xs text-slate-600 dark:text-slate-400">
                          {act.workInProgress || act.pendingWork || '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {act.hoursSpent} hrs
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {act.blockers ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">{act.blockers}</span>
                          ) : (
                            'None'
                          )}
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

      {/* 3. COMPANY RULES & SETTINGS VIEW */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Company working hours and branding settings saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Branding & Contact Settings */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Company Identity & Letterhead Information</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
                    <input
                      type="text"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Office Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={e => setFormData({ ...formData, panNumber: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance & Working Hours Rules (Prompt #13) */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Attendance Calculation & Shift Rules</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Start Time</label>
                    <input
                      type="time"
                      value={formData.officeStartTime}
                      onChange={e => setFormData({ ...formData, officeStartTime: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Office End Time</label>
                    <input
                      type="time"
                      value={formData.officeEndTime}
                      onChange={e => setFormData({ ...formData, officeEndTime: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    value={formData.graceMinutes}
                    onChange={e => setFormData({ ...formData, graceMinutes: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Late marker triggered if login is past start time + grace.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Hours (Full Day)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.minWorkingHoursFullDay}
                      onChange={e => setFormData({ ...formData, minWorkingHoursFullDay: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Hours (Half Day)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.minWorkingHoursHalfDay}
                      onChange={e => setFormData({ ...formData, minWorkingHoursHalfDay: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Company Rules</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      )}

    </div>
  );
};
