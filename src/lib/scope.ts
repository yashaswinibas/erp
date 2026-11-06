// AGENCYOS_V2_PART19 + AGENCYOS_V2_PART23: who sees whose data.
// Employee: only own tasks, projects, visits, leads and claims.
// Claims: everyone's claims only if "view all claims" is ON for the role in the Permission matrix.
import { canAccess } from './rbac';
export function scopeForStaff<T>(app: T): T {
  const a = app as any;
  if (!a) return app;
  const me = a.currentUser?.id;
  const myClaims = (a.reimbursements || []).filter((r: any) => r.employeeId === me);
  const allClaims = canAccess(a.currentRole, 'view_all_claims');
  if (a.currentRole === 'employee') {
    const myTasks = (a.tasks || []).filter((t: any) => t.assignedEmployeeId === me);
    const myProjectIds = new Set(myTasks.map((t: any) => t.projectId));
    return {
      ...a,
      tasks: myTasks,
      projects: (a.projects || []).filter((p: any) => p.projectManagerId === me || (p.assignedEmployeeIds || []).includes(me) || myProjectIds.has(p.id)),
      fieldVisits: (a.fieldVisits || []).filter((v: any) => v.employeeId === me),
      leads: (a.leads || []).filter((l: any) => l.assignedEmployeeId === me),
      reimbursements: allClaims ? a.reimbursements : myClaims,
    } as T;
  }
  return allClaims ? app : ({ ...a, reimbursements: myClaims } as T);
}
