import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LeaveApplicationService, StudentProfile } from '../../../core/services/leave-application.service';

@Component({
  selector: 'app-student-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-search.component.html',
  styleUrl: './student-search.component.scss',
})
export class StudentSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  searchControl = new FormControl<string>('');
  results: StudentProfile[] = [];
  hasSearched = false;

  constructor(
    private appService: LeaveApplicationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(query => {
        if (!query || query.trim().length === 0) {
          this.results = [];
          this.hasSearched = false;
          return;
        }
        this.hasSearched = true;
        this.results = this.appService.searchStudents(query);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToProfile(student: StudentProfile): void {
    this.router.navigate(['/admin/phd-leave/student', student.rollNumber]);
  }
}
