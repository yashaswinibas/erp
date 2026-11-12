// AGENCYOS_HUBS_DONE
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee, Department, Designation } from '../types';
import { 
  Users, 
  Building, 
  Briefcase, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck,
  Award
} from 'lucide-react';

export const EmployeesModule: React.FC<{ 
  onOpenAddEmployeeModal: () => void 
}> = ({ onOpenAddEmployeeModal }) => {
  const { 
    employees, 
    departments, 
    designations, 
    currentUser, 
    currentRole,
    openDocument 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'designations'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const canViewSalaries = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'hr';

  const getDept = (dId: string) => departments.find(d => d.id === dId || d.code === dId);
  const getDesig = (dId: string) => designations.find(d => d.id === dId);

  const filteredEmployees = employees.filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.employeeId.toLowerCase().includes(q)) return false;
    }
    if (deptFilter !== 'all' && e.departmentId !== deptFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="legacy-title text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Human Capital, Departments & Designations</span>
          </h2>
          <p className="legacy-title text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Role assignments · Hierarchy mapping: Employee → Department → Manager → Project Manager
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'employees'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Employees ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'departments'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Departments ({departments.length})
            </button>
            <button
              onClick={() => setActiveTab('designations')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'designations'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Designations ({designations.length})
            </button>
          </div>

          {(currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'hr') && (
            <button
              onClick={onOpenAddEmployeeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or employee ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => {
              const dept = getDept(emp.departmentId);
              const desig = getDesig(emp.designationId);

              return (
                <div 
                  key={emp.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-400">{emp.employeeId}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{emp.name}</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{desig?.title || emp.designationId}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {emp.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p>Department: <strong className="text-slate-800 dark:text-slate-200">{dept?.name || emp.departmentId}</strong></p>
                    <p>Email: {emp.email}</p>
                    
                    {/* Get One / Two Mobile for Employees */}
                    <div className="flex items-center gap-1.5 font-mono pt-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">M1:</span>
                      <a href={`tel:${emp.phone}`} className="hover:text-blue-600 font-semibold text-slate-800 dark:text-slate-200">
                        {emp.phone}
                      </a>
                      <a href={`tel:${emp.phone}`} title="Call Mobile 1" className="text-blue-600 hover:text-blue-700">
                        <Phone className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {emp.phone2 && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">M2:</span>
                        <a href={`tel:${emp.phone2}`} className="hover:text-emerald-600 font-semibold text-slate-800 dark:text-slate-200">
                          {emp.phone2}
                        </a>
                        <a 
                          href={`https://wa.me/${emp.phone2.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          title="WhatsApp Mobile 2"
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                        </a>
                      </div>
                    )}

                    <p className="pt-0.5">Mode: <strong className="uppercase text-slate-800 dark:text-slate-200">{emp.workMode}</strong> · Joined: {emp.joiningDate}</p>
                  </div>

                  {canViewSalaries && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Monthly CTC:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{emp.salary.netSalary.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{emp.experienceYears} yrs experience</span>
                    <button
                      onClick={() => openDocument('experience_letter', `Experience Certificate - ${emp.name}`, {
                        name: emp.name,
                        designation: desig?.title || emp.designationId,
                        joiningDate: emp.joiningDate
                      })}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Certificate →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <div key={d.id} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="font-mono text-xs text-slate-400">{d.code}</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">{d.name}</h4>
              <p className="text-xs text-slate-500">{d.description}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <span>{employees.filter(e => e.departmentId === d.id).length} Active Staff Members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'designations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designations.map(ds => {
            const d = getDept(ds.departmentId);
            return (
              <div key={ds.id} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <span className="font-mono text-xs text-amber-500 font-bold">{ds.level}</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{ds.title}</h4>
                <p className="text-xs text-slate-500">Department: {d?.name || ds.departmentId}</p>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
