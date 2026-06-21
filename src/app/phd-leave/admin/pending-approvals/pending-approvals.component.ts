import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { LeaveStatusService } from '../../../core/services/leave-status.service';
import { LeaveApplication } from '../../../core/models/leave-application.model';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, StatusPillComponent, DatePipe],
  templateUrl: './pending-approvals.component.html',
  styleUrl: './pending-approvals.component.scss',
})
export class PendingApprovalsComponent implements OnInit {
  pendingRequests: LeaveApplication[] = [];

  constructor(
    private statusService: LeaveStatusService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.statusService.getAllPendingRequests().subscribe(data => {
      this.pendingRequests = data;
    });
  }

  navigateToStudent(rollNo: string): void {
    this.router.navigate(['/admin/phd-leave/student', rollNo]);
  }

  formatDuration(app: LeaveApplication): string {
    if (app.isHalfDay) return '0.5 days';
    return `${app.duration} ${app.duration === 1 ? 'day' : 'days'}`;
  }
}
