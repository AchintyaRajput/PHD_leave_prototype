import { LeaveType } from './leave-type.enum';

export interface LeaveBalance {
  leaveType:    LeaveType;
  credited:     number | null;   // null = unlimited (On-Duty) or policy-based
  availed:      number;
  balance:      number | null;
  isUnlimited?: boolean;
  unit?:        'days' | 'semesters';
  note?:        string;          // e.g., "Per GoI Rules" for Maternity
}
