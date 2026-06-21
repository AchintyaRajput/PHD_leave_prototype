import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { LeaveApplicationService } from '../../core/services/leave-application.service';
import { AppModeService, AppMode } from '../../core/services/app-mode.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isExpanded = true;
  currentMode: AppMode = 'student';
  studentName: string;
  studentInitials: string;
  studentRole: string;

  studentNavItems: NavItem[] = [];

  adminNavItems: NavItem[] = [
    { label: 'Student Directory',  route: '/admin/phd-leave/search',  icon: 'search' },
    { label: 'Pending Approvals',  route: '/admin/phd-leave/pending', icon: 'pending' },
  ];

  constructor(
    private appService: LeaveApplicationService,
    private modeService: AppModeService,
    private router: Router,
  ) {
    const profile = this.appService.getStudentProfile();
    this.studentName = profile.name;
    this.studentInitials = profile.initials;
    this.studentRole = `${profile.program} Student`;
  }

  ngOnInit(): void {
    // Sync mode from service
    this.modeService.currentMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.currentMode = mode;
      });

    // Auto-detect mode from current route on navigation
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
        if (url.startsWith('/admin')) {
          this.modeService.setMode('admin');
        } else {
          this.modeService.setMode('student');
        }
      });

    // Also check initial URL
    const currentUrl = this.router.url;
    if (currentUrl.startsWith('/admin')) {
      this.modeService.setMode('admin');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get navItems(): NavItem[] {
    return this.currentMode === 'admin' ? this.adminNavItems : this.studentNavItems;
  }

  get groupLabel(): string {
    return this.currentMode === 'admin' ? 'PHD-LEAVE (Admin)' : 'PHD-LEAVE';
  }

  get switchLabel(): string {
    return this.currentMode === 'admin' ? 'Switch to Student View' : 'Switch to Admin View';
  }

  toggleGroup(): void {
    this.isExpanded = !this.isExpanded;
  }

  switchMode(): void {
    const targetRoute = this.modeService.toggleMode();
    this.router.navigate([targetRoute]);
  }
}
