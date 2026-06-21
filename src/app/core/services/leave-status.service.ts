import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LeaveApplication, Approver } from '../models/leave-application.model';
import { LeaveType } from '../models/leave-type.enum';
import { LeaveStatus } from '../models/leave-status.enum';

@Injectable({ providedIn: 'root' })
export class LeaveStatusService {
  private readonly applicationMap: Map<string, LeaveApplication[]> = new Map([
    // ── Achintya Rajput (2024025) — has a PENDING Medical Leave ────────
    ['2024025', [
      {
        id: 'LV-001',
        leaveType: LeaveType.CASUAL,
        fromDate: new Date('2026-05-10'),
        toDate: new Date('2026-05-12'),
        isHalfDay: false,
        duration: 3,
        reason: 'Personal work — visiting family',
        approvers: [
          { role: 'Advisor', name: 'Prof. Anand Kumar', status: 'Approved' },
        ],
        status: LeaveStatus.APPROVED,
        appliedOn: new Date('2026-05-08'),
      },
      {
        id: 'LV-002',
        leaveType: LeaveType.MEDICAL,
        fromDate: new Date('2026-06-01'),
        toDate: new Date('2026-06-03'),
        isHalfDay: false,
        duration: 3,
        reason: 'Fever and throat infection',
        approvers: [
          { role: 'Advisor', name: 'Prof. Anand Kumar', status: 'Pending' },
        ],
        status: LeaveStatus.PENDING_ADVISOR,
        appliedOn: new Date('2026-05-31'),
        documentUrl: '/assets/mock/medical-cert-lv002.pdf',
      },
      {
        id: 'LV-005',
        leaveType: LeaveType.VACATION,
        fromDate: new Date('2026-03-01'),
        toDate: new Date('2026-03-07'),
        isHalfDay: false,
        duration: 7,
        reason: 'Family vacation — Goa trip',
        approvers: [
          { role: 'Advisor', name: 'Prof. Anand Kumar', status: 'Approved' },
        ],
        status: LeaveStatus.APPROVED,
        appliedOn: new Date('2026-02-25'),
      },
    ]],

    // ── Aditya Kumar (2024026) — has a PENDING On-Duty request ────────
    ['2024026', [
      {
        id: 'LV-003',
        leaveType: LeaveType.ON_DUTY,
        fromDate: new Date('2026-06-20'),
        toDate: new Date('2026-06-23'),
        isHalfDay: false,
        duration: 4,
        reason: 'Presenting paper at CVPR 2026, Vancouver',
        approvers: [
          { role: 'Advisor', name: 'Prof. Ritu Singhal', status: 'Approved' },
          { role: 'TA Instructor', name: 'Prof. Anand Kumar', status: 'Pending' },
          { role: 'PGC Chair', name: 'Prof. M. Balakrishnan', status: 'Pending' },
        ],
        status: LeaveStatus.PENDING_TA,
        appliedOn: new Date('2026-06-10'),
      },
      {
        id: 'LV-006',
        leaveType: LeaveType.CASUAL,
        fromDate: new Date('2026-04-20'),
        toDate: new Date('2026-04-21'),
        isHalfDay: false,
        duration: 2,
        reason: 'Personal errands in hometown',
        approvers: [
          { role: 'Advisor', name: 'Prof. Ritu Singhal', status: 'Approved' },
        ],
        status: LeaveStatus.APPROVED,
        appliedOn: new Date('2026-04-18'),
      },
      {
        id: 'LV-007',
        leaveType: LeaveType.MEDICAL,
        fromDate: new Date('2026-02-15'),
        toDate: new Date('2026-02-17'),
        isHalfDay: false,
        duration: 3,
        reason: 'Dental surgery recovery',
        approvers: [
          { role: 'Advisor', name: 'Prof. Ritu Singhal', status: 'Approved' },
        ],
        status: LeaveStatus.APPROVED,
        appliedOn: new Date('2026-02-14'),
        documentUrl: '/assets/mock/dental-cert-lv007.pdf',
      },
    ]],

    // ── Deepanshu Singh (2024027) — NO pending requests ───────────────
    ['2024027', [
      {
        id: 'LV-004',
        leaveType: LeaveType.CASUAL,
        fromDate: new Date('2026-04-15'),
        toDate: new Date('2026-04-15'),
        isHalfDay: true,
        duration: 0.5,
        reason: 'Doctor appointment',
        approvers: [
          { role: 'Advisor', name: 'Prof. M. Balakrishnan', status: 'Rejected' },
        ],
        status: LeaveStatus.REJECTED,
        appliedOn: new Date('2026-04-13'),
      },
      {
        id: 'LV-008',
        leaveType: LeaveType.VACATION,
        fromDate: new Date('2026-01-10'),
        toDate: new Date('2026-01-20'),
        isHalfDay: false,
        duration: 11,
        reason: 'Winter break — family visit to Shimla',
        approvers: [
          { role: 'Advisor', name: 'Prof. M. Balakrishnan', status: 'Approved' },
        ],
        status: LeaveStatus.APPROVED,
        appliedOn: new Date('2026-01-05'),
      },
      {
        id: 'LV-009',
        leaveType: LeaveType.ON_DUTY,
        fromDate: new Date('2026-03-15'),
        toDate: new Date('2026-03-17'),
        isHalfDay: false,
        duration: 3,
        reason: 'Workshop at IIT Delhi',
        approvers: [
          { role: 'Advisor', name: 'Prof. M. Balakrishnan', status: 'Approved' },
          { role: 'TA Instructor', name: 'Prof. Anand Kumar', status: 'Approved' },
          { role: 'PGC Chair', name: 'Prof. Ritu Singhal', status: 'Approved' },
        ],
        status: LeaveStatus.APPROVED,
        appliedOn: new Date('2026-03-10'),
      },
    ]],
  ]);

  // Student-name lookup for enriching admin views
  private readonly studentNames: Map<string, string> = new Map([
    ['2024025', 'Achintya Rajput'],
    ['2024026', 'Aditya Kumar'],
    ['2024027', 'Deepanshu Singh'],
  ]);

  /** Returns applications for the logged-in student (student side). */
  getApplications(): Observable<LeaveApplication[]> {
    return of(this.applicationMap.get('2024025') ?? []);
  }

  /** Returns applications for a specific student by roll number (admin side). */
  getApplicationsByRollNo(rollNo: string): Observable<LeaveApplication[]> {
    return of(this.applicationMap.get(rollNo) ?? []);
  }

  /** Returns the first pending request for a given student, or null. */
  getPendingRequest(rollNo: string): Observable<LeaveApplication | null> {
    const apps = this.applicationMap.get(rollNo) ?? [];
    const pending = apps.find(a =>
      a.status === LeaveStatus.PENDING_ADVISOR ||
      a.status === LeaveStatus.PENDING_TA ||
      a.status === LeaveStatus.PENDING_PGC
    );
    return of(pending ?? null);
  }

  /** Returns ALL pending requests across all students (admin Pending Approvals page). */
  getAllPendingRequests(): Observable<LeaveApplication[]> {
    const result: LeaveApplication[] = [];
    this.applicationMap.forEach((apps, rollNo) => {
      const studentName = this.studentNames.get(rollNo) ?? 'Unknown';
      apps.forEach(app => {
        if (
          app.status === LeaveStatus.PENDING_ADVISOR ||
          app.status === LeaveStatus.PENDING_TA ||
          app.status === LeaveStatus.PENDING_PGC
        ) {
          result.push({
            ...app,
            studentName,
            studentRollNo: rollNo,
          });
        }
      });
    });
    return of(result);
  }

  /** Adds a new application for the logged-in student. */
  addApplication(app: LeaveApplication): void {
    const apps = this.applicationMap.get('2024025') ?? [];
    apps.unshift(app);
    this.applicationMap.set('2024025', apps);
  }

  /** Updates the status of an application (for admin approve/reject actions). */
  updateApplicationStatus(rollNo: string, appId: string, newStatus: LeaveStatus): boolean {
    const apps = this.applicationMap.get(rollNo);
    if (!apps) return false;
    const app = apps.find(a => a.id === appId);
    if (!app) return false;
    app.status = newStatus;
    // Update approver statuses based on the new status
    if (newStatus === LeaveStatus.APPROVED) {
      app.approvers.forEach(a => a.status = 'Approved');
    } else if (newStatus === LeaveStatus.REJECTED) {
      const pendingApprover = app.approvers.find(a => a.status === 'Pending');
      if (pendingApprover) pendingApprover.status = 'Rejected';
    }
    return true;
  }
}
