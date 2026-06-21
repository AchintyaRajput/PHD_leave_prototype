import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaveBalanceService } from '../../../core/services/leave-balance.service';
import { LeaveApplicationService } from '../../../core/services/leave-application.service';
import { LeaveBalance } from '../../../core/models/leave-balance.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  balances: LeaveBalance[] = [];
  studentName: string = '';

  constructor(
    private leaveBalanceService: LeaveBalanceService,
    private appService: LeaveApplicationService
  ) {}

  ngOnInit(): void {
    this.studentName = this.appService.getStudentProfile().name;
    this.leaveBalanceService.getBalances().subscribe(data => {
      // Filter out 'unlimited' for this specific table view if needed, or handle it in template
      this.balances = data;
    });
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
}
