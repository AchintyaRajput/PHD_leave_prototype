import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveBalance } from '../../../core/models/leave-balance.model';

@Component({
  selector: 'app-leave-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-balance-card.component.html',
  styleUrl: './leave-balance-card.component.scss',
})
export class LeaveBalanceCardComponent {
  @Input({ required: true }) balance!: LeaveBalance;

  get percentage(): number {
    if (this.balance.isUnlimited || this.balance.credited === null || this.balance.balance === null) {
      return 0;
    }
    if (this.balance.credited === 0) return 0;
    return (this.balance.balance / this.balance.credited) * 100;
  }

  get ringColor(): string {
    if (this.percentage > 50) return '#1b5e20';
    if (this.percentage > 25) return '#f57f17';
    return '#c62828';
  }

  get strokeDashoffset(): number {
    const circumference = 2 * Math.PI * 28;
    return circumference * (1 - this.percentage / 100);
  }

  get circumference(): number {
    return 2 * Math.PI * 28;
  }

  get showRing(): boolean {
    return !this.balance.isUnlimited && this.balance.credited !== null && this.balance.balance !== null;
  }

  get isExhausted(): boolean {
    return this.balance.balance !== null && this.balance.balance === 0;
  }

  get isLow(): boolean {
    return this.balance.balance !== null && this.balance.balance > 0 && this.balance.balance <= 2 && !this.balance.isUnlimited;
  }

  get displayBalance(): string {
    if (this.balance.isUnlimited) return '∞';
    if (this.balance.balance === null) return '—';
    return String(this.balance.balance);
  }

  get displayCredited(): string {
    if (this.balance.isUnlimited) return 'Unlimited';
    if (this.balance.credited === null) return '—';
    return String(this.balance.credited);
  }

  get unitLabel(): string {
    return this.balance.unit === 'semesters' ? 'sem' : 'days';
  }
}
