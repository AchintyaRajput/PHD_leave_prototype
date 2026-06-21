import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeaveType } from '../../../core/models/leave-type.enum';
import { LeaveApplicationService } from '../../../core/services/leave-application.service';
import { LeaveBalanceService } from '../../../core/services/leave-balance.service';
import { LeaveStatusService } from '../../../core/services/leave-status.service';
import { LeaveStatus } from '../../../core/models/leave-status.enum';
import { FileUploadZoneComponent } from '../../shared/file-upload-zone/file-upload-zone.component';

@Component({
  selector: 'app-apply-leave',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadZoneComponent],
  templateUrl: './apply-leave.component.html',
  styleUrl: './apply-leave.component.scss',
})
export class ApplyLeaveComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  leaveTypes = Object.values(LeaveType);
  today: string;

  leaveForm = new FormGroup({
    leaveType:  new FormControl<LeaveType | null>(null, Validators.required),
    fromDate:   new FormControl<string>('', Validators.required),
    toDate:     new FormControl<string>(''),
    isHalfDay:  new FormControl<boolean>(false),
    reason:     new FormControl<string>('', [Validators.required, Validators.maxLength(500)]),
  });

  uploadedFile: File | null = null;
  advisorName = '';
  taInstructorName = '';
  pgcChairName = '';
  semesterUsed = 0;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: LeaveApplicationService,
    private balanceService: LeaveBalanceService,
    private statusService: LeaveStatusService,
  ) {
    const now = new Date();
    this.today = now.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Load student profile
    const profile = this.appService.getStudentProfile();
    this.advisorName = profile.advisor;
    this.taInstructorName = profile.taInstructor;
    this.pgcChairName = profile.pgcChair;
    this.semesterUsed = this.balanceService.getSemesterUsed();

    // Check for pre-selected leave type from query param
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const typeParam = params['type'];
      if (typeParam) {
        const matched = this.leaveTypes.find(lt =>
          lt.toLowerCase().includes(typeParam.toLowerCase())
        );
        if (matched) {
          this.leaveForm.patchValue({ leaveType: matched });
        }
      }
    });

    // Watch leave type changes for dynamic validation
    this.leaveForm.get('leaveType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.uploadedFile = null;
      });

    // Watch half-day checkbox
    this.leaveForm.get('isHalfDay')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isHalf => {
        if (isHalf) {
          this.leaveForm.get('toDate')?.clearValidators();
          this.leaveForm.get('toDate')?.setValue('');
        } else {
          // toDate not strictly required but needed for duration calc
        }
        this.leaveForm.get('toDate')?.updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isMedicalLeave(): boolean {
    return this.leaveForm.get('leaveType')?.value === LeaveType.MEDICAL;
  }

  get isOnDutyLeave(): boolean {
    return this.leaveForm.get('leaveType')?.value === LeaveType.ON_DUTY;
  }

  get isSemesterLeave(): boolean {
    return this.leaveForm.get('leaveType')?.value === LeaveType.SEMESTER;
  }

  get isHalfDay(): boolean {
    return this.leaveForm.get('isHalfDay')?.value === true;
  }

  get duration(): number {
    if (this.isHalfDay) return 0.5;
    const from = this.leaveForm.get('fromDate')?.value;
    const to = this.leaveForm.get('toDate')?.value;
    if (!from || !to) return 0;
    const diffTime = new Date(to).getTime() - new Date(from).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }

  get reasonLength(): number {
    return this.leaveForm.get('reason')?.value?.length ?? 0;
  }

  get canSubmit(): boolean {
    const baseValid = this.leaveForm.valid && this.duration > 0;
    if (this.isMedicalLeave && !this.uploadedFile) return false;
    return baseValid;
  }

  onFileSelected(file: File): void {
    this.uploadedFile = file;
  }

  onFileRemoved(): void {
    this.uploadedFile = null;
  }

  onSubmit(): void {
    if (!this.canSubmit) {
      this.triggerToast('Please fix the highlighted errors before submitting.', 'error');
      return;
    }

    const formVal = this.leaveForm.value;

    // Create the application
    const application = {
      id: 'LV-' + String(Date.now()).slice(-4),
      leaveType: formVal.leaveType!,
      fromDate: new Date(formVal.fromDate!),
      toDate: this.isHalfDay ? new Date(formVal.fromDate!) : new Date(formVal.toDate!),
      isHalfDay: formVal.isHalfDay ?? false,
      duration: this.duration,
      reason: formVal.reason ?? '',
      approvers: this.isOnDutyLeave
        ? [
            { role: 'Advisor' as const, name: this.advisorName, status: 'Pending' as const },
            { role: 'TA Instructor' as const, name: this.taInstructorName, status: 'Pending' as const },
            { role: 'PGC Chair' as const, name: this.pgcChairName, status: 'Pending' as const },
          ]
        : [{ role: 'Advisor' as const, name: this.advisorName, status: 'Pending' as const }],
      status: LeaveStatus.PENDING_ADVISOR,
      appliedOn: new Date(),
      documentUrl: this.uploadedFile ? URL.createObjectURL(this.uploadedFile) : undefined,
    };

    this.statusService.addApplication(application);
    console.log('Leave application submitted:', application);

    this.triggerToast('Leave application submitted successfully!', 'success');
    setTimeout(() => {
      this.router.navigate(['/phd-leave/status']);
    }, 1500);
  }

  onReset(): void {
    if (confirm('Are you sure you want to clear the form?')) {
      this.leaveForm.reset();
      this.uploadedFile = null;
      this.triggerToast('Form cleared.', 'info');
    }
  }

  private triggerToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 3000);
  }
}
