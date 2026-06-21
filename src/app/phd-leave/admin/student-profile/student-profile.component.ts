import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LeaveApplicationService, StudentProfile } from '../../../core/services/leave-application.service';
import { LeaveBalanceService } from '../../../core/services/leave-balance.service';
import { LeaveStatusService } from '../../../core/services/leave-status.service';
import { LeaveBalance } from '../../../core/models/leave-balance.model';
import { LeaveApplication } from '../../../core/models/leave-application.model';
import { LeaveType } from '../../../core/models/leave-type.enum';
import { LeaveStatus } from '../../../core/models/leave-status.enum';

import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusPillComponent, DatePipe],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.scss',
})
export class StudentProfileComponent implements OnInit {
  student: StudentProfile | null = null;
  balances: LeaveBalance[] = [];
  applications: LeaveApplication[] = [];
  pendingRequest: LeaveApplication | null = null;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: LeaveApplicationService,
    private balanceService: LeaveBalanceService,
    private statusService: LeaveStatusService,
  ) {}

  ngOnInit(): void {
    const rollNo = this.route.snapshot.paramMap.get('rollNo');
    if (!rollNo) {
      this.router.navigate(['/admin/phd-leave/search']);
      return;
    }

    // Load student profile
    this.student = this.appService.getStudentByRollNumber(rollNo) ?? null;
    if (!this.student) {
      this.router.navigate(['/admin/phd-leave/search']);
      return;
    }

    // Load balances
    this.balanceService.getBalancesByRollNo(rollNo).subscribe(data => {
      this.balances = data;
    });

    // Load applications (history)
    this.statusService.getApplicationsByRollNo(rollNo).subscribe(data => {
      this.applications = data;
    });

    // Load pending request
    this.statusService.getPendingRequest(rollNo).subscribe(data => {
      this.pendingRequest = data;
    });
  }

  isMedicalLeave(app: LeaveApplication): boolean {
    return app.leaveType === LeaveType.MEDICAL;
  }

  get totalCredited(): number {
    return this.balances.reduce((acc, b) => acc + (b.credited ?? 0), 0);
  }

  get totalAvailed(): number {
    return this.balances.reduce((acc, b) => acc + (b.availed ?? 0), 0);
  }

  get totalBalance(): number {
    return this.balances.reduce((acc, b) => acc + (b.balance ?? 0), 0);
  }

  formatDuration(app: LeaveApplication): string {
    if (app.isHalfDay) return '0.5 days';
    return `${app.duration} ${app.duration === 1 ? 'day' : 'days'}`;
  }

  formatDateRange(app: LeaveApplication): string {
    const from = app.fromDate;
    const to = app.toDate;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const fromStr = from.toLocaleDateString('en-IN', options);
    const toStr = to.toLocaleDateString('en-IN', options);
    if (fromStr === toStr) return fromStr;
    return `${fromStr} — ${toStr}`;
  }

  approveRequest(): void {
    if (!this.pendingRequest || !this.student) return;
    this.statusService.updateApplicationStatus(
      this.student.rollNumber,
      this.pendingRequest.id,
      LeaveStatus.APPROVED,
    );
    this.triggerToast('Leave request approved successfully!', 'success');
    this.pendingRequest = null;
    // Reload applications to reflect new status
    this.statusService.getApplicationsByRollNo(this.student.rollNumber).subscribe(data => {
      this.applications = data;
    });
  }

  rejectRequest(): void {
    if (!this.pendingRequest || !this.student) return;
    this.statusService.updateApplicationStatus(
      this.student.rollNumber,
      this.pendingRequest.id,
      LeaveStatus.REJECTED,
    );
    this.triggerToast('Leave request rejected.', 'error');
    this.pendingRequest = null;
    // Reload applications to reflect new status
    this.statusService.getApplicationsByRollNo(this.student.rollNumber).subscribe(data => {
      this.applications = data;
    });
  }

  openDocument(url: string): void {
    window.open(url, '_blank');
  }

  private triggerToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 3000);
  }
}
