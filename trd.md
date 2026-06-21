# TRD — AXIS Portal: PhD Leave Module (Student View)
**Document ID:** AXIS-PHD-TRD-v1.0  
**Date:** June 2026  
**Status:** Active — Prototype Phase

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | Angular | 17+ (Standalone Components) |
| Language | TypeScript | 5.x |
| Styling | SCSS (component-scoped) | — |
| Icons | FontAwesome (Free) | 6.x |
| Routing | Angular Router | Built-in |
| State (Prototype) | Component-level + RxJS BehaviorSubject | — |
| Mock Data | Static `.ts` service files | — |
| Build Tool | Angular CLI | Latest |
| Package Manager | npm | Latest |
| Backend (future) | Node.js / Express | — |
| Database (future) | MongoDB | — |
| Deployment (future) | Ubuntu server (axisDev) + NGINX | — |

---

## 2. Project Structure

```
src/
└── app/
    ├── core/
    │   ├── models/
    │   │   ├── leave-type.enum.ts
    │   │   ├── leave-balance.model.ts
    │   │   ├── leave-application.model.ts
    │   │   └── leave-status.enum.ts
    │   └── services/
    │       ├── leave-balance.service.ts      ← mock data
    │       ├── leave-application.service.ts  ← mock data
    │       └── leave-status.service.ts       ← mock data
    │
    ├── phd-leave/                            ← Feature Module
    │   ├── phd-leave.module.ts              (or standalone routes)
    │   ├── phd-leave-routing.module.ts
    │   ├── dashboard/
    │   │   ├── dashboard.component.ts
    │   │   ├── dashboard.component.html
    │   │   └── dashboard.component.scss
    │   ├── apply-leave/
    │   │   ├── apply-leave.component.ts
    │   │   ├── apply-leave.component.html
    │   │   └── apply-leave.component.scss
    │   ├── leave-status/
    │   │   ├── leave-status.component.ts
    │   │   ├── leave-status.component.html
    │   │   └── leave-status.component.scss
    │   └── shared/
    │       ├── leave-balance-card/
    │       │   ├── leave-balance-card.component.ts
    │       │   ├── leave-balance-card.component.html
    │       │   └── leave-balance-card.component.scss
    │       ├── status-pill/
    │       │   ├── status-pill.component.ts
    │       │   └── status-pill.component.html
    │       └── file-upload-zone/
    │           ├── file-upload-zone.component.ts
    │           ├── file-upload-zone.component.html
    │           └── file-upload-zone.component.scss
    │
    ├── shared/
    │   └── sidebar/
    │       ├── sidebar.component.ts
    │       ├── sidebar.component.html
    │       └── sidebar.component.scss
    │
    └── styles/
        ├── _tokens.scss    ← design tokens / CSS custom properties
        ├── _base.scss      ← resets, body, typography
        └── styles.scss     ← global entry (imports tokens + base)
```

---

## 3. SCSS Design Tokens (`_tokens.scss`)

```scss
:root {
  // Brand Colours
  --color-primary:       #006565;
  --color-primary-dark:  #004d4d;
  --color-primary-light: #e0f2f2;

  // App Shell
  --color-bg:            #f4f7f9;
  --color-surface:       #ffffff;
  --color-border:        #e0e4ea;

  // Text
  --color-text-primary:  #1a202c;
  --color-text-secondary:#6b7280;
  --color-text-muted:    #9ca3af;

  // Semantic
  --color-success-bg:    #e8f5e9;
  --color-success-text:  #1b5e20;
  --color-warning-bg:    #fff8e1;
  --color-warning-text:  #f57f17;
  --color-danger-bg:     #ffebee;
  --color-danger-text:   #c62828;
  --color-neutral-bg:    #f3f4f6;
  --color-neutral-text:  #6b7280;

  // Spacing
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  // Radius
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 9999px;

  // Shadows
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
  --shadow-dropdown: 0 8px 24px rgba(0,0,0,0.12);

  // Typography
  --font-sans: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-size-xs:   11px;
  --font-size-sm:   13px;
  --font-size-base: 14px;
  --font-size-md:   16px;
  --font-size-lg:   20px;
  --font-size-xl:   24px;
  --font-size-2xl:  28px;
}
```

---

## 4. Angular Routes

```typescript
// phd-leave-routing.module.ts
const routes: Routes = [
  {
    path: 'phd-leave',
    children: [
      { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   component: DashboardComponent },
      { path: 'apply',       component: ApplyLeaveComponent },
      { path: 'status',      component: LeaveStatusComponent },
    ]
  }
];
```

---

## 5. Data Models

### 5.1 Enums

```typescript
// leave-type.enum.ts
export enum LeaveType {
  CASUAL          = 'Casual Leave',
  VACATION        = 'Vacation Leave',
  MEDICAL         = 'Medical Leave',
  ON_DUTY         = 'Work / On-Duty Leave',
  SEMESTER        = 'Semester Leave',
  MATERNITY       = 'Maternity Leave',
  PATERNITY       = 'Paternity Leave',
}

// leave-status.enum.ts
export enum LeaveStatus {
  PENDING_ADVISOR      = 'Pending Advisor',
  PENDING_TA           = 'Pending TA Instructor',
  PENDING_PGC          = 'Pending PGC Chair',
  APPROVED             = 'Approved',
  REJECTED             = 'Rejected',
  CANCELLED            = 'Cancelled',
}
```

### 5.2 Interfaces

```typescript
// leave-balance.model.ts
export interface LeaveBalance {
  leaveType:    LeaveType;
  credited:     number | null;   // null = unlimited (On-Duty)
  availed:      number;
  balance:      number | null;
  isUnlimited?: boolean;
  unit?:        'days' | 'semesters';
}

// leave-application.model.ts
export interface LeaveApplication {
  id:           string;
  leaveType:    LeaveType;
  fromDate:     Date;
  toDate:       Date;
  isHalfDay:    boolean;
  duration:     number;          // in days
  reason:       string;
  approvers:    Approver[];
  status:       LeaveStatus;
  appliedOn:    Date;
  documentUrl?: string;          // for Medical Leave
}

export interface Approver {
  role:   'Advisor' | 'TA Instructor' | 'PGC Chair' | 'Admin';
  name:   string;
  status: 'Pending' | 'Approved' | 'Rejected';
}
```

---

## 6. Mock Data Services

### 6.1 Leave Balance Service

```typescript
// leave-balance.service.ts
@Injectable({ providedIn: 'root' })
export class LeaveBalanceService {
  private balances: LeaveBalance[] = [
    { leaveType: LeaveType.CASUAL,    credited: 8,    availed: 3, balance: 5 },
    { leaveType: LeaveType.VACATION,  credited: 15,   availed: 7, balance: 8 },
    { leaveType: LeaveType.MEDICAL,   credited: 15,   availed: 0, balance: 15 },
    { leaveType: LeaveType.ON_DUTY,   credited: null, availed: 5, balance: null, isUnlimited: true },
    { leaveType: LeaveType.SEMESTER,  credited: 2,    availed: 0, balance: 2, unit: 'semesters' },
    { leaveType: LeaveType.MATERNITY, credited: null, availed: 0, balance: null },
  ];

  getBalances(): Observable<LeaveBalance[]> {
    return of(this.balances);
  }
}
```

### 6.2 Leave Status Service (Mock Data)

```typescript
// leave-status.service.ts
@Injectable({ providedIn: 'root' })
export class LeaveStatusService {
  private applications: LeaveApplication[] = [
    {
      id: 'LV-001',
      leaveType: LeaveType.CASUAL,
      fromDate: new Date('2026-05-10'),
      toDate: new Date('2026-05-12'),
      isHalfDay: false,
      duration: 3,
      reason: 'Personal work',
      approvers: [{ role: 'Advisor', name: 'Prof. Anand Kumar', status: 'Approved' }],
      status: LeaveStatus.APPROVED,
      appliedOn: new Date('2026-05-08'),
    },
    {
      id: 'LV-002',
      leaveType: LeaveType.MEDICAL,
      fromDate: new Date('2026-06-01'),
      toDate: new Date('2026-06-03'),
      isHalfDay: false,
      duration: 3,
      reason: 'Fever and throat infection',
      approvers: [{ role: 'Advisor', name: 'Prof. Anand Kumar', status: 'Pending' }],
      status: LeaveStatus.PENDING_ADVISOR,
      appliedOn: new Date('2026-05-31'),
      documentUrl: '/assets/mock/medical-cert-lv002.pdf',
    },
    {
      id: 'LV-003',
      leaveType: LeaveType.ON_DUTY,
      fromDate: new Date('2026-06-20'),
      toDate: new Date('2026-06-23'),
      isHalfDay: false,
      duration: 4,
      reason: 'Presenting paper at CVPR 2026, Vancouver',
      approvers: [
        { role: 'Advisor',       name: 'Prof. Anand Kumar',  status: 'Approved' },
        { role: 'TA Instructor', name: 'Prof. Ritu Singhal', status: 'Pending' },
        { role: 'PGC Chair',     name: 'Prof. M. Balakrishnan', status: 'Pending' },
      ],
      status: LeaveStatus.PENDING_TA,
      appliedOn: new Date('2026-06-10'),
    },
  ];

  getApplications(): Observable<LeaveApplication[]> {
    return of(this.applications);
  }
}
```

---

## 7. Component Specifications

### 7.1 LeaveBalanceCardComponent

**Inputs:**
```typescript
@Input() balance!: LeaveBalance;
```

**Template logic:**
- Computes `percentage = (balance.balance / balance.credited) * 100`
- Renders SVG `<circle>` ring using `stroke-dasharray` + `stroke-dashoffset`
- Ring colour: green (>50%), amber (≤25%), red (0%)

**SCSS:**
```scss
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}
.ring-label { font-size: var(--font-size-xl); font-weight: 700; }
.meta-row { display: flex; gap: var(--space-lg); }
```

---

### 7.2 StatusPillComponent

**Inputs:**
```typescript
@Input() status!: LeaveStatus;
```

**Template:**
```html
<span class="pill" [ngClass]="status | pillClass">
  {{ status }}
</span>
```

**Pipe (`pillClass`):**
```typescript
transform(status: LeaveStatus): string {
  const map: Record<LeaveStatus, string> = {
    [LeaveStatus.APPROVED]:         'pill--success',
    [LeaveStatus.REJECTED]:         'pill--danger',
    [LeaveStatus.PENDING_ADVISOR]:  'pill--warning',
    [LeaveStatus.PENDING_TA]:       'pill--warning',
    [LeaveStatus.PENDING_PGC]:      'pill--warning',
    [LeaveStatus.CANCELLED]:        'pill--neutral',
  };
  return map[status] ?? 'pill--neutral';
}
```

**SCSS:**
```scss
.pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.pill--success  { background: var(--color-success-bg); color: var(--color-success-text); }
.pill--danger   { background: var(--color-danger-bg);  color: var(--color-danger-text); }
.pill--warning  { background: var(--color-warning-bg); color: var(--color-warning-text); }
.pill--neutral  { background: var(--color-neutral-bg); color: var(--color-neutral-text); }
```

---

### 7.3 ApplyLeaveComponent — Dynamic Field Logic

```typescript
// apply-leave.component.ts
leaveForm = new FormGroup({
  leaveType:  new FormControl<LeaveType | null>(null, Validators.required),
  fromDate:   new FormControl<Date | null>(null, Validators.required),
  toDate:     new FormControl<Date | null>(null),
  isHalfDay:  new FormControl(false),
  reason:     new FormControl('', [Validators.required, Validators.maxLength(500)]),
  medicalDoc: new FormControl<File | null>(null),
});

get isMedicalLeave(): boolean {
  return this.leaveForm.get('leaveType')?.value === LeaveType.MEDICAL;
}

get isOnDutyLeave(): boolean {
  return this.leaveForm.get('leaveType')?.value === LeaveType.ON_DUTY;
}

get isSemesterLeave(): boolean {
  return this.leaveForm.get('leaveType')?.value === LeaveType.SEMESTER;
}

// Validate: medical doc required for Medical Leave
ngOnInit() {
  this.leaveForm.get('leaveType')?.valueChanges.subscribe(type => {
    const docControl = this.leaveForm.get('medicalDoc');
    if (type === LeaveType.MEDICAL) {
      docControl?.setValidators(Validators.required);
    } else {
      docControl?.clearValidators();
    }
    docControl?.updateValueAndValidity();
  });
}
```

---

### 7.4 FileUploadZoneComponent

**Inputs:** `@Input() accept = '.pdf,.jpg,.jpeg,.png'`  
**Inputs:** `@Input() maxSizeMB = 5`  
**Outputs:** `@Output() fileSelected = new EventEmitter<File>()`

**Features:**
- Drag-enter highlights the zone border with `var(--color-primary)`.
- Drag-leave removes highlight.
- Drop / file-input change validates size → emits file or shows error.
- Shows file name + formatted size + remove (×) button post-selection.

---

## 8. Sidebar Integration

The existing AXIS sidebar component should be extended with a PHD-LEAVE `NavGroup`:

```typescript
// sidebar nav config (extend existing)
{
  groupLabel: 'PHD-LEAVE',
  icon: 'fa-graduation-cap',
  isCollapsible: true,
  defaultExpanded: true,
  children: [
    { label: 'Dashboard',    route: '/phd-leave/dashboard', icon: 'fa-house' },
    { label: 'Apply Leave',  route: '/phd-leave/apply',     icon: 'fa-plus-circle' },
    { label: 'Leave Status', route: '/phd-leave/status',    icon: 'fa-list-check' },
  ]
}
```

Active route should be highlighted with `background: var(--color-primary-light)` and `color: var(--color-primary)`.

---

## 9. Prototype Constraints

- **No HTTP calls.** All data is returned from `of(mockData)` in services.
- **No authentication guard** in prototype — assume user is always a logged-in PhD student.
- **No file persistence** — the `FileUploadZoneComponent` emits the File object to the parent; no actual upload in prototype.
- **Form submission** — logs to console and shows a toast; no POST request.
- Angular **Reactive Forms** (not Template-Driven) for all form screens.
- Use `@NgModule` structure OR standalone components with `provideRouter` — be consistent throughout the module.
