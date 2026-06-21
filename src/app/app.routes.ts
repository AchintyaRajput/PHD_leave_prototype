import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'phd-leave/dashboard',
    pathMatch: 'full',
  },
  // ── Student Routes ──────────────────────────────────────────
  {
    path: 'phd-leave',
    loadComponent: () =>
      import('./phd-leave/student/student-layout/student-layout.component').then(m => m.StudentLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./phd-leave/student/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'apply',
        loadComponent: () =>
          import('./phd-leave/student/apply-leave/apply-leave.component').then(m => m.ApplyLeaveComponent),
      },
      {
        path: 'status',
        loadComponent: () =>
          import('./phd-leave/student/leave-status/leave-status.component').then(m => m.LeaveStatusComponent),
      },
    ],
  },
  // ── Admin Routes ────────────────────────────────────────────
  {
    path: 'admin/phd-leave',
    children: [
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full',
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./phd-leave/admin/student-search/student-search.component').then(m => m.StudentSearchComponent),
      },
      {
        path: 'student/:rollNo',
        loadComponent: () =>
          import('./phd-leave/admin/student-profile/student-profile.component').then(m => m.StudentProfileComponent),
      },
      {
        path: 'pending',
        loadComponent: () =>
          import('./phd-leave/admin/pending-approvals/pending-approvals.component').then(m => m.PendingApprovalsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'phd-leave/dashboard',
  },
];
