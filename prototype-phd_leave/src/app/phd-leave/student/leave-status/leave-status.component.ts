import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaveStatusService } from '../../../core/services/leave-status.service';
import { LeaveApplication } from '../../../core/models/leave-application.model';
import { LeaveType } from '../../../core/models/leave-type.enum';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';

@Component({
  selector: 'app-leave-status',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusPillComponent, DatePipe],
  templateUrl: './leave-status.component.html',
  styleUrl: './leave-status.component.scss',
})
export class LeaveStatusComponent implements OnInit {
  applications: LeaveApplication[] = [];

  constructor(private leaveStatusService: LeaveStatusService) {}

  ngOnInit(): void {
    this.leaveStatusService.getApplications().subscribe(data => {
      this.applications = data;
    });
  }

  isMedicalLeave(app: LeaveApplication): boolean {
    return app.leaveType === LeaveType.MEDICAL;
  }

  openDocument(url: string): void {
    window.open(url, '_blank');
  }

  formatDuration(app: LeaveApplication): string {
    if (app.isHalfDay) return '0.5 days';
    return `${app.duration} ${app.duration === 1 ? 'day' : 'days'}`;
  }
}
