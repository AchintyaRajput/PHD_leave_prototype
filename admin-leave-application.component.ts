import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';

export interface LeaveRequest {
    _id: string;
    rowId: number;
    name: string;
    rollNo: string;
    program: string;
    courses: {
        course: string;
        instructor: string | null;
    }[];
    leaveFrom: string;
    leaveTo: string;
    document: string;
    email: string;
    adminStatus: 'Pending' | 'Approved' | 'Rejected';
    infirmaryStatus: 'Pending' | 'Approved' | 'Rejected' | 'Partial' | null;
    ugcStatus: 'Pending' | 'Approved' | 'Rejected' | 'Partial' | null;

    infirmaryDetails?: {
        approvedFrom?: string;
        approvedTo?: string;
        reason?: string;
    };
    ugcDetails?: {
        approvedFrom?: string;
        approvedTo?: string;
        reason?: string;
    };
    eligibility?: {
        status: "Eligible" | "Not Eligible";
        reasons: string[];
        snapshot?: {
        totalLeaves: number;
        totalDays: number;
        examLeaves: number;
    };
    };
    source: string;
    createdAt: Date;
}

@Component({
    selector: 'app-leave-application',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './leave-application.component.html',
    styleUrls: ['./leave-application.component.css']
})
export class LeaveApplicationComponent implements OnInit {

    semesterConfig = {
        semester: {
            start: '2026-01-01',
            end: '2026-05-15'
        },
        midsem: {
            start: '2026-02-20',
            end: '2026-02-28'
        },
        endsem: {
            start: '2026-04-25',
            end: '2026-05-05'
        }
        };


    isEditingDates = false;


    leaveRequests: LeaveRequest[] = [];
    isLoading = false;
    filterStatus: 'All' | 'Pending' | 'Approved' | 'Rejected' = 'All';
    rollNoFilter: string = '';
    showEligibilityModal = false;
    selectedEligibilityData: any = null;
    semesterStats: any = null;


    // Mock data for hardcoded rules
    mockStudentHistory: { [email: string]: { examLeavesTaken: number } } = {};

    constructor(private router: Router, private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadSemesterConfig();
        // this.apiService.delete(
        //         true,
        //         'Clear All Leave Data',
        //         'leave/clear-all'
        //     ).subscribe({
        //         next: () => {
        //             console.log('✅ Database cleared successfully');
                    
        //             // Optional: immediately resync after clearing
        //             this.syncLeaves();
        //         },
        //         error: (err) => {
        //             console.error('❌ Failed to clear database', err);
        //         }
        // });
        this.fetchLeaves();
    }

    setFilter(status: 'All' | 'Pending' | 'Approved' | 'Rejected'): void {
        this.filterStatus = status;
    }

    // get filteredLeaveRequests(): LeaveRequest[] {
    //     if (this.filterStatus === 'All') {
    //         return this.leaveRequests;
    //     }
    //     return this.leaveRequests.filter(req => req.status === this.filterStatus);
    // }

    get filteredLeaveRequests(): LeaveRequest[] {

        let filtered = this.leaveRequests;

        // Status filter
        if (this.filterStatus !== 'All') {
            filtered = filtered.filter(
                req => req.adminStatus === this.filterStatus
            );
        }

        // Roll number filter
        if (this.rollNoFilter && this.rollNoFilter.trim() !== '') {
            const roll = this.rollNoFilter.toLowerCase();
            filtered = filtered.filter(req =>
                req.rollNo?.toLowerCase().includes(roll)
            );
        }

        return filtered;
    }


    private normalizeDate(date: Date): Date {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
        }


    goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    syncLeaves(): void {
        this.isLoading = true;
        this.apiService.post(true, 'Sync Leave Applications', 'leave/sync-with-google-form', {}).subscribe({
            next: (res: any) => {
                console.log('Sync response:', res);
                alert(`Synced successfully! Added ${res.insertedCount} new requests.`);
                this.fetchLeaves(); // Refresh the list
            },
            error: (err: any) => {
                console.error('Error syncing leaves:', err);
                alert('Failed to sync leaves. Check console for details.');
                this.isLoading = false;
            }
        });
    }

    loadSummary(email: string) {
        this.apiService.get<any>(
            false,
            'Fetch Summary',
            `leave/summary/${email}`
        ).subscribe(res => {
            this.semesterStats = res;
        });
    }


    fetchLeaves(): void {
        this.isLoading = true;
        // Use ApiService.get(shouldLog, frontendAction, url)
        this.apiService.get<LeaveRequest[]>(false, 'Fetch Leave Applications', 'leave/all').subscribe({
            next: (data: LeaveRequest[]) => {
                console.log('Leaves data received:', data);
                this.leaveRequests = data.map((req: any) => ({
                    ...req,
                    adminStatus: req.approval?.admin ?? 'Pending',
                    infirmaryStatus: req.approval?.infirmary ?? null,
                    ugcStatus: req.approval?.ugc ?? null,
                    infirmaryDetails: {
                        approvedFrom: req.approval?.infirmaryDetails?.approvedFrom
                            ? new Date(req.approval.infirmaryDetails.approvedFrom)
                            : null,

                        approvedTo: req.approval?.infirmaryDetails?.approvedTo
                            ? new Date(req.approval.infirmaryDetails.approvedTo)
                            : null,

                        reason: req.approval?.infirmaryDetails?.reason ?? null
                    },
                    ugcDetails: {
                        approvedFrom: req.approval?.ugcDetails?.approvedFrom
                            ? new Date(req.approval.ugcDetails.approvedFrom)
                            : null,

                        approvedTo: req.approval?.ugcDetails?.approvedTo
                            ? new Date(req.approval.ugcDetails.approvedTo)
                            : null,

                        reason: req.approval?.ugcDetails?.reason ?? null
                    },
                }));

                console.log("🧩 AFTER FRONTEND MAPPING:");
                console.log(this.leaveRequests);
                this.isLoading = false;

                // Fetch instructors for each course
                // this.populateInstructors();

                // Initialize mock history
                this.initializeMockHistory();
            },
            error: (err: any) => {
                console.error('Error fetching leaves:', err);
                this.isLoading = false;
            }
        });
    }

    // populateInstructors(): void {
    //     const allCourses = new Set<string>();
    //     this.leaveRequests.forEach(req => {
    //         if (req.course) {
    //             req.course.split(',').forEach(c => allCourses.add(c.trim()));
    //         }
    //     });

    //     const courseInstructorMap = new Map<string, string>();
    //     let completedRequests = 0;

    //     if (allCourses.size === 0) return;

    //     allCourses.forEach(courseName => {
    //         const encodedCourse = encodeURIComponent(courseName);
    //         this.apiService.get<{ instructor: string }>(false, `Fetch Instructor for ${courseName}`, `leave/course-professor/${encodedCourse}`).subscribe({
    //             next: (response) => {
    //                 courseInstructorMap.set(courseName, response.instructor);
    //             },
    //             error: (err) => {
    //                 console.error(`Failed to fetch instructor for ${courseName}`, err);
    //                 courseInstructorMap.set(courseName, '-');
    //             },
    //             complete: () => {
    //                 completedRequests++;
    //                 this.updateRequestInstructors(courseInstructorMap);
    //             }
    //         });
    //     });
    // }

    // updateRequestInstructors(map: Map<string, string>): void {
    //     this.leaveRequests.forEach(req => {
    //         if (req.course) {
    //             const instructors = req.course.split(',').map(c => {
    //                 const trimmedName = c.trim();
    //                 return map.get(trimmedName) || 'Loading...';
    //             });

    //             const allLoaded = instructors.every(i => i !== 'Loading...');
    //             if (allLoaded) {
    //                 req.instructor = instructors.join(', ');
    //             }
    //         }
    //     });
    // }

    // Student Profile Popup
    showStudentProfile = false;
    selectedStudentProfile: any = null;

    openStudentProfile(request: LeaveRequest): void {
        const studentLeaves = this.leaveRequests.filter(r => r.email === request.email);
        const examLeaves = this.mockStudentHistory[request.email]?.examLeavesTaken || 0;

        // For current semester, we'll assume all loaded leaves are current sem for this mock/demo
        // In real app, would filter by date range of current sem
        const currentSemLeaves = studentLeaves.length;

        this.selectedStudentProfile = {
            name: request.name,
            rollNo: request.rollNo,
            email: request.email,
            program: request.program,
            totalLeaves: studentLeaves.length,
            examLeaves: examLeaves,
            currentSemLeaves: currentSemLeaves,
            eligibility: this.getComplianceStatus(request) === 'Green' ? 'Eligible' : 'Not Eligible',
            complianceWarnings: this.validateRequest(request).warnings
        };
        this.showStudentProfile = true;
    }

    closeStudentProfile(): void {
        this.showStudentProfile = false;
        this.selectedStudentProfile = null;
    }

    initializeMockHistory(): void {
        this.leaveRequests.forEach(req => {
            if (!this.mockStudentHistory[req.email]) {
                // Bias towards 0 so more people are eligible
                // 70% chance of 0, 20% chance of 1, 10% chance of 2
                const rand = Math.random();
                let leaves = 0;
                if (rand > 0.9) leaves = 2;
                else if (rand > 0.7) leaves = 1;

                this.mockStudentHistory[req.email] = {
                    examLeavesTaken: leaves
                };
            }
        });
    }

    getCourseList(request: LeaveRequest): string {
        if (!request.courses || request.courses.length === 0) return '-';

        return request.courses
            .map(c => this.formatCourse(c.course))
            .join(', ');
    }

    getInstructorList(request: LeaveRequest): string {
        if (!request.courses || request.courses.length === 0) return '-';

        return request.courses
            .map(c => c.instructor || '-')
            .join(', ');
    }

    formatCourse(course: string): string {
        if (!course) return '-';

        const parts = course.split('_');

        if (parts.length >= 2) {
            return parts[0] + '_' + parts.slice(1).join('_');
        }

        return course;
    }

    // Helper: Calculate duration in days
    calculateDuration(from: string, to: string): number {
        const start = new Date(from);
        const end = new Date(to);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    }

    isDateInRange(date: Date, start: string, end: string): boolean {
        const d = this.normalizeDate(date);
        const s = this.normalizeDate(new Date(start));
        const e = this.normalizeDate(new Date(end));

        return d >= s && d <= e;
        }



        isExamDay(date: Date): boolean {
        return (
            this.isDateInRange(date, this.semesterConfig.midsem.start, this.semesterConfig.midsem.end) ||
            this.isDateInRange(date, this.semesterConfig.endsem.start, this.semesterConfig.endsem.end)
        );
        }

        calculateEffectiveLeaveDays(from: string, to: string): {
            days: number;
            isExamLeave: boolean;
            } {
            let days = 0;
            let isExamLeave = false;

            const start = this.normalizeDate(new Date(from));
            const end = this.normalizeDate(new Date(to));

            for (
                let d = new Date(start);
                d <= end;
                d.setDate(d.getDate() + 1)
            ) {
                if (this.isExamDay(d)) {
                isExamLeave = true;
                continue;
                }
                days++;
            }

            return { days, isExamLeave };
            }



    // Validation Logic
    validateRequest(request: LeaveRequest): { passed: boolean; warnings: string[] } {
        const warnings: string[] = [];
        let passed = true;

        // Rule 1: Duration <= 20 days
        // const duration = this.calculateDuration(request.leaveFrom, request.leaveTo);
        const { days, isExamLeave } =
  this.calculateEffectiveLeaveDays(request.leaveFrom, request.leaveTo);

if (days > 20) {
  warnings.push(`Effective leave duration (${days} days) exceeds 20 days limit.`);
  passed = false;
}

if (isExamLeave) {
  warnings.push('Leave overlaps with exam days (exam days excluded from count).');
}

        // if (duration > 20) {
        //     warnings.push(`Duration (${duration} days) exceeds 20 days limit.`);
        //     passed = false;
        // }

        // Rule 2: Max 4 medical leaves in a semester
        // We act as if all visible requests are in the current semester for now (simplification)
        const studentLeaves = this.leaveRequests.filter(r => r.email === request.email);
        if (studentLeaves.length > 4) {
            warnings.push(`Student has applied for ${studentLeaves.length} leaves (Max 4/sem recommended).`);
            // passed = false; // Soft warning for demo
        }

        // Rule 3: Apply within 4-5 days
        const created = new Date(request.createdAt);
        const leaveStart = new Date(request.leaveFrom);
        // If applied after leave start + 5 days
        const deadline = new Date(leaveStart);
        deadline.setDate(deadline.getDate() + 5);

        if (created > deadline) {
            const diff = Math.ceil((created.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
            // warnings.push(`Applied late by approx ${diff} days (Should be within 5 days).`);
            // Soft warning for demo
        }

        // Rule 4: Max 2 medical leaves during midsem/endsem (Mocked)
        const history = this.mockStudentHistory[request.email];
        if (history && history.examLeavesTaken >= 2) {
            warnings.push(`Exam leaves limit reached (${history.examLeavesTaken}/2). Check if this is an exam leave.`);
            passed = false;
        }

        return { passed, warnings };
    }

    getComplianceStatus(request: LeaveRequest): 'Green' | 'Red' {
        const result = this.validateRequest(request);
        return result.passed ? 'Green' : 'Red';
    }

    getStudentLeaveCount(email: string): number {
        return this.leaveRequests.filter(req => req.email === email).length;
    }

    // updateStatus(request: LeaveRequest, status: 'Approved' | 'Rejected'): void {
    //     if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    //     // Use ApiService.patch(shouldLog, frontendAction, url, payload)
    //     this.apiService.patch(true, 'Update Leave Status', 'leave/update-status', { rowId: request.rowId, status }).subscribe({
    //         next: () => {
    //             // Update local state directly
    //             request.status = status;
    //         },
    //         error: (err: any) => {
    //             console.error('Error updating status:', err);
    //             alert('Failed to update status');
    //         }
    //     });
    // }

    // updateLocalStatus(
    //     request: LeaveRequest,
    //     authority: 'admin' | 'infirmary' | 'ugc',
    //     status: 'Approved' | 'Rejected'
    //     ): void {
    //     if (!confirm(`Mark as ${status}?`)) return;

    //     if (authority === 'admin') request.adminStatus = status;
    //     if (authority === 'infirmary') request.infirmaryStatus = status;
    //     if (authority === 'ugc') request.ugcStatus = status;
    // }

    updateLocalStatus(
        request: LeaveRequest,
        authority: 'admin' | 'infirmary' | 'ugc',
        status: 'Approved' | 'Rejected'
        ): void {

        if (!confirm(`Mark as ${status}?`)) return;

        if (authority === 'admin') {
            this.apiService.patch(
                true,
                'Admin Approval',
                'leave/update-status',
                { rowId: request.rowId, status }
            ).subscribe(() => {

                request.adminStatus = status;

                // if (status === 'Approved') {
                // request.infirmaryStatus = 'Pending';
                // } else {
                // request.infirmaryStatus = null;
                // request.infirmaryDetails = undefined;
                // request.ugcStatus = null;
                // }
            });
        }

        if (authority === 'infirmary') {

            this.apiService.patch(
                true,
                'Infirmary Approval',
                'leave/infirmary/update-status',
                {
                leaveRequestId: request._id,
                status
                }
            ).subscribe(() => {
                request.infirmaryStatus = status;
            });
        }
        // UGC can be wired later
    }


    canSendEmail(request: LeaveRequest): boolean {
        return (
            request.adminStatus === 'Approved'
        );
        }

        sendEmailPlaceholder(): void {
        alert('Email functionality will be added later');
    }

    openInfirmaryModal(request: LeaveRequest) {
        const approvedFrom = prompt("Approved From Date (YYYY-MM-DD):");
        const approvedTo = prompt("Approved To Date (YYYY-MM-DD):");

        if (!approvedFrom || !approvedTo) return;

        const isFull =
            approvedFrom === request.leaveFrom &&
            approvedTo === request.leaveTo;

        this.apiService.patch(
            true,
            'Infirmary Approval',
            'leave/infirmary/update-status',
            {
            leaveRequestId: request._id,
            status: isFull ? 'Approved' : 'Partial',
            approvedFrom,
            approvedTo
            }
        ).subscribe(() => {
            this.fetchLeaves();
        });
    }

    rejectInfirmary(request: LeaveRequest) {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        this.apiService.patch(
            true,
            'Infirmary Rejection',
            'leave/infirmary/update-status',
            {
            leaveRequestId: request._id,
            status: 'Rejected',
            reason
            }
        ).subscribe(() => {
            this.fetchLeaves();
        });
    }

    openEligibilityModal(request: LeaveRequest): void {

        this.selectedEligibilityData = {
            name: request.name,
            eligible: request.eligibility?.status === "Eligible",
            reasons: request.eligibility?.reasons || [],
            snapshot: request.eligibility?.snapshot || {
                totalLeaves: 0,
                totalDays: 0,
                examLeaves: 0
            }
        };

        this.showEligibilityModal = true;
    }



    closeEligibilityModal(): void {
        this.showEligibilityModal = false;
        this.selectedEligibilityData = null;
    }

    loadSemesterConfig(): void {

        this.apiService.get<any>(
            false,
            'Fetch Semester Config',
            'leave/semester-config'
        ).subscribe(res => {

            this.semesterConfig = res;

            console.log("📅 Loaded semester config:", this.semesterConfig);

        });
    }

    saveSemesterConfig(): void {
        this.apiService.patch(
            true,
            'Update Semester Config',
            'leave/semester-config',
            this.semesterConfig
        ).subscribe(() => {

            alert("Semester dates saved successfully");

            this.isEditingDates = false;

        });
    }

}
