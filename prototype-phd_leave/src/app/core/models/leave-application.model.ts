import { LeaveType } from './leave-type.enum';
import { LeaveStatus } from './leave-status.enum';

export interface Approver {
  role:   'Advisor' | 'TA Instructor' | 'PGC Chair' | 'Admin';
  name:   string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface LeaveApplication {
  id:           string;
  leaveType:    LeaveType;
  fromDate:     Date;
  toDate:       Date;
  isHalfDay:    boolean;
  duration:     number;
  reason:       string;
  approvers:    Approver[];
  status:       LeaveStatus;
  appliedOn:    Date;
  documentUrl?: string;
  studentName?: string;
  studentRollNo?: string;
}
