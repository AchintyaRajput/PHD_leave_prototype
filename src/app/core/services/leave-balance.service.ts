import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LeaveBalance } from '../models/leave-balance.model';
import { LeaveType } from '../models/leave-type.enum';

@Injectable({ providedIn: 'root' })
export class LeaveBalanceService {
  private readonly balanceMap: Map<string, LeaveBalance[]> = new Map([
    // ── Achintya Rajput (2024025) ─────────────────────────
    ['2024025', [
      { leaveType: LeaveType.CASUAL,    credited: 8,    availed: 3, balance: 5,    unit: 'days' },
      { leaveType: LeaveType.VACATION,  credited: 15,   availed: 7, balance: 8,    unit: 'days' },
      { leaveType: LeaveType.MEDICAL,   credited: 15,   availed: 0, balance: 15,   unit: 'days' },
      { leaveType: LeaveType.ON_DUTY,   credited: null, availed: 5, balance: null, isUnlimited: true, unit: 'days' },
      { leaveType: LeaveType.SEMESTER,  credited: 2,    availed: 0, balance: 2,    unit: 'semesters' },
      { leaveType: LeaveType.MATERNITY, credited: null, availed: 0, balance: null, note: 'Per GoI Rules' },
    ]],

    // ── Aditya Kumar (2024026) ────────────────────────────
    ['2024026', [
      { leaveType: LeaveType.CASUAL,    credited: 8,    availed: 5, balance: 3,    unit: 'days' },
      { leaveType: LeaveType.VACATION,  credited: 15,   availed: 2, balance: 13,   unit: 'days' },
      { leaveType: LeaveType.MEDICAL,   credited: 15,   availed: 3, balance: 12,   unit: 'days' },
      { leaveType: LeaveType.ON_DUTY,   credited: null, availed: 8, balance: null, isUnlimited: true, unit: 'days' },
      { leaveType: LeaveType.SEMESTER,  credited: 2,    availed: 1, balance: 1,    unit: 'semesters' },
      { leaveType: LeaveType.PATERNITY, credited: null, availed: 0, balance: null, note: 'Per GoI Rules' },
    ]],

    // ── Deepanshu Singh (2024027) ─────────────────────────
    ['2024027', [
      { leaveType: LeaveType.CASUAL,    credited: 8,    availed: 8, balance: 0,    unit: 'days' },
      { leaveType: LeaveType.VACATION,  credited: 15,   availed: 10, balance: 5,   unit: 'days' },
      { leaveType: LeaveType.MEDICAL,   credited: 15,   availed: 5, balance: 10,   unit: 'days' },
      { leaveType: LeaveType.ON_DUTY,   credited: null, availed: 2, balance: null, isUnlimited: true, unit: 'days' },
      { leaveType: LeaveType.SEMESTER,  credited: 2,    availed: 2, balance: 0,    unit: 'semesters' },
      { leaveType: LeaveType.MATERNITY, credited: null, availed: 0, balance: null, note: 'Per GoI Rules' },
    ]],
  ]);

  /** Returns balances for the logged-in student (student side). */
  getBalances(): Observable<LeaveBalance[]> {
    return of(this.balanceMap.get('2024025') ?? []);
  }

  /** Returns balances for a specific student by roll number (admin side). */
  getBalancesByRollNo(rollNo: string): Observable<LeaveBalance[]> {
    return of(this.balanceMap.get(rollNo) ?? []);
  }

  getBalanceByType(type: LeaveType): Observable<LeaveBalance | undefined> {
    const balances = this.balanceMap.get('2024025') ?? [];
    return of(balances.find(b => b.leaveType === type));
  }

  getSemesterUsed(): number {
    const balances = this.balanceMap.get('2024025') ?? [];
    const semester = balances.find(b => b.leaveType === LeaveType.SEMESTER);
    return semester ? semester.availed : 0;
  }
}
