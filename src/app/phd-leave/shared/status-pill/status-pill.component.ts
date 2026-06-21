import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveStatus } from '../../../core/models/leave-status.enum';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="pill" [ngClass]="pillClass">{{ status }}</span>`,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.5;
      white-space: nowrap;
    }
    .pill--success  { background: var(--color-success-bg); color: var(--color-success-text); }
    .pill--danger   { background: var(--color-danger-bg);  color: var(--color-danger-text); }
    .pill--warning  { background: var(--color-warning-bg); color: var(--color-warning-text); }
    .pill--neutral  { background: var(--color-neutral-bg); color: var(--color-neutral-text); }
  `],
})
export class StatusPillComponent {
  @Input({ required: true }) status!: LeaveStatus;

  get pillClass(): string {
    const map: Record<LeaveStatus, string> = {
      [LeaveStatus.APPROVED]:         'pill--success',
      [LeaveStatus.REJECTED]:         'pill--danger',
      [LeaveStatus.PENDING_ADVISOR]:  'pill--warning',
      [LeaveStatus.PENDING_TA]:       'pill--warning',
      [LeaveStatus.PENDING_PGC]:      'pill--warning',
      [LeaveStatus.CANCELLED]:        'pill--neutral',
    };
    return map[this.status] ?? 'pill--neutral';
  }
}
