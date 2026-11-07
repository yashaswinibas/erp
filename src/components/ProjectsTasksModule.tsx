import { scopeForStaff } from '../lib/scope'; // AGENCYOS_V2_PART19
import { isStaffRole } from '../os/osConfig'; // AGENCYOS_V3_OS
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TaskEditModal } from './QuickEditModals'; // AGENCYOS_V2_UI
import { Task, Project } from '../types';
import {
  Briefcase,
  CheckSquare,
  Clock,
  Calendar,
  Plus,
  Users,
  Search,
  Filter,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Play,
  CheckCircle,
  Send,
  UserCheck,
  ListTodo,
  TrendingUp,
  FileText
} from 'lucide-react';

interface ProjectsTasksProps {
  initialViewMode?: 'task_operations' | 'my_tasks' | 'projects';
  onOpenAddProjectModal: () => void;
  onOpenAddTaskModal: () => void;
  onOpenDailyActivityModal: (taskId?: string, projectId?: string) => void;
}

export const ProjectsTasksModule: React.FC<ProjectsTasksProps> = ({
  initialViewMode = 'task_operations',
  onOpenAddProjectModal,
  onOpenAddTaskModal,
  onOpenDailyActivityModal
}) => {
  const {
    projects,
    tasks,
    updateTaskStatus,
    employees,
    clients,
    currentUser,
    currentRole
  } = scopeForStaff(useApp());
  const [editTask, setEditTask] = useState<Task | null>(null);
  const canManageTasks = !isStaffRole(currentRole);

  const [activeTab, setActiveTab] = useState<'task_operations' | 'my_tasks' | 'projects'>(isStaffRole(currentRole) && initialViewMode === 'task_operations' ? 'my_tasks' : initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState('all');
  const [myTasksStatusFilter, setMyTasksStatusFilter] = useState<string>('all');

  useEffect(() => {
    setActiveTab(isStaffRole(currentRole) && initialViewMode === 'task_operations' ? 'my_tasks' : initialViewMode);
  }, [initialViewMode]);

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);
  const getClient = (clientId?: string) => clients.find(c => c.id === clientId);

  // All tasks for operations board
  const filteredOperationsTasks = tasks.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.taskCode.toLowerCase().includes(q)) return false;
    }
    if (selectedProjectFilter !== 'all' && t.projectId !== selectedProjectFilter) return false;
    if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) return false;
    if (selectedAssigneeFilter !== 'all' && t.assignedEmployeeId !== selectedAssigneeFilter) return false;
    return true;
  });

  // My Tasks specifically filtered to currentUser.id
  const myTasksList = tasks.filter(t => t.assignedEmployeeId === currentUser.id);
  const filteredMyTasks = myTasksList.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.taskCode.toLowerCase().includes(q)) return false;
    }
    if (myTasksStatusFilter !== 'all' && t.status !== myTasksStatusFilter) return false;
    return true;
  });

  const columns: { id: Task['status']; title: string; color: string; badge: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-slate-300 dark:border-slate-700', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-500', badge: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
    { id: 'review', title: 'QA / Review', color: 'border-amber-500', badge: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
    { id: 'blocked', title: 'Blocked', color: 'border-rose-500', badge: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {activeTab === 'my_tasks' && <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            {activeTab === 'task_operations' && <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            {activeTab === 'projects' && <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            <span>
              {activeTab === 'my_tasks' && `My Deliverables & Tasks (${currentUser.name})`}
              {activeTab === 'task_operations' && 'Team Tasks Operations Matrix'}
              {activeTab === 'projects' && 'Projects Matrix & Deliverable Tracking'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'my_tasks' && 'Your assigned deliverables, active work timer & daily activity logging'}
            {activeTab === 'task_operations' && 'Live agency deliverable workflow: To Do → In Progress → QA → Done'}
            {activeTab === 'projects' && 'High-level project budgets, client ownership & deliverable health'}
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('my_tasks')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'my_tasks'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Tasks ({myTasksList.length})
            </button>
            <button
              hidden={isStaffRole(currentRole)}
              onClick={() => setActiveTab('task_operations')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'task_operations'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Task Operations ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isStaffRole(currentRole) ? 'My Projects' : 'Projects'} ({projects.length})
            </button>
          </div>

          <button
            hidden={isStaffRole(currentRole)}
            onClick={onOpenAddTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Task</span>
          </button>
          <button
            hidden={isStaffRole(currentRole)}
            onClick={onOpenAddProjectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Project</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MY TASKS VIEW (SPECIFIC TO LOGGED IN USER) */}
      {/* ======================================================== */}
      {activeTab === 'my_tasks' && (
        <div className="space-y-4">

          {/* Personal Task Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned to Me</span>
              <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                {myTasksList.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total personal deliverables</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">In Progress</span>
              <div className="mt-2 text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {myTasksList.filter(t => t.status === 'in_progress').length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Currently being executed</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Review / QA</span>
              <div className="mt-2 text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {myTasksList.filter(t => t.status === 'review').length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Submitted for verification</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</span>
              <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {myTasksList.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Finished deliverables</p>
            </div>

          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {['all', 'in_progress', 'todo', 'review', 'completed'].map(st => (
                <button
                  key={st}
                  onClick={() => setMyTasksStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-colors ${
                    myTasksStatusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search my tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* My Tasks List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMyTasks.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">No tasks pending in this view</h4>
                <p className="text-xs text-slate-500 mt-1">All deliverables are either completed or none have been assigned yet.</p>
              </div>
            ) : (
              filteredMyTasks.map(task => {
                const prj = projects.find(p => p.id === task.projectId);

                return (
                  <div
                    key={task.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{task.taskCode}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{task.title}</h4>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {task.description}
                    </p>

                    {prj && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex items-center justify-between">
                        <span className="text-slate-500">Project:</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">{prj.name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        Deadline: <strong className="font-mono text-slate-800 dark:text-slate-200">{task.dueDate}</strong>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Est: {task.estimatedHours}h · Spent: {task.actualHours || 0}h
                      </span>
                    </div>

                    {/* Personal Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {task.status === 'todo' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Start Working</span>
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'review')}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Submit QA</span>
                          </button>
                        )}
                        {task.status === 'review' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Mark Done</span>
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        )}
                      </div>

                      {canManageTasks && (
                        <button onClick={() => setEditTask(task)} className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer">Edit</button>
                      )}
                      <button
                        onClick={() => onOpenDailyActivityModal(task.id, task.projectId)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                      >
                        + Log Daily Work
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TASK OPERATIONS KANBAN MATRIX (FULL AGENCY VIEW) */}
      {/* ======================================================== */}
      {activeTab === 'task_operations' && (
        <div className="space-y-4">

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={selectedProjectFilter}
              onChange={e => setSelectedProjectFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedAssigneeFilter}
              onChange={e => setSelectedAssigneeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Team Assignees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
              ))}
            </select>

            <select
              value={selectedPriorityFilter}
              onChange={e => setSelectedPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {columns.map(col => {
              const colTasks = filteredOperationsTasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="p-3 bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {col.title}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${col.badge}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[350px]">
                    {colTasks.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        No tasks in {col.title}
                      </div>
                    ) : (
                      colTasks.map(task => {
                        const prj = projects.find(p => p.id === task.projectId);
                        const assignee = getEmployee(task.assignedEmployeeId);

                        return (
                          <div
                            key={task.id}
                            className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 hover:border-blue-400 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">
                                {task.taskCode}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : task.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                              {task.title}
                            </h4>

                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {task.description}
                            </p>

                            {prj && (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                                📁 {prj.name}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <span>Due: <strong className="font-mono">{task.dueDate}</strong></span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {assignee?.name?.split(' ')[0] || 'Unassigned'}
                              </span>
                            </div>

                            {/* Status mover dropdown & log activity */}
                            <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-50 dark:border-slate-800">
                              <select
                                value={task.status}
                                onChange={e => updateTaskStatus(task.id, e.target.value as any)}
                                className="text-[10px] p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="blocked">Blocked</option>
                                <option value="completed">Completed</option>
                              </select>

                              {canManageTasks && (
                                <button onClick={() => setEditTask(task)} className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer">Edit</button>
                              )}
                              <button
                                onClick={() => onOpenDailyActivityModal(task.id, task.projectId)}
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>+ Log Activity</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PROJECTS LIST VIEW */}
      {/* ======================================================== */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(prj => {
            const cl = getClient(prj.clientId);
            const pm = getEmployee(prj.projectManagerId);
            const prjTasks = tasks.filter(t => t.projectId === prj.id);
            const doneTasks = prjTasks.filter(t => t.status === 'completed').length;
            const pct = prjTasks.length ? Math.round((doneTasks / prjTasks.length) * 100) : 50;

            return (
              <div
                key={prj.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-400">{prj.projectCode}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                      {prj.name}
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      {cl?.companyName || 'Internal Strategic Initiative'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    prj.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {prj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {prj.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    <span>Deliverables Progress</span>
                    <span className="font-mono">{pct}% ({doneTasks}/{prjTasks.length} tasks)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Budget: <strong className="font-mono text-slate-900 dark:text-white">₹{prj.budget.toLocaleString()}</strong></span>
                  <span>PM: <strong className="text-slate-800 dark:text-slate-200">{pm?.name || 'Karthik Rao'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editTask && <TaskEditModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
};
