# APP FLOW — AXIS Portal: PhD Leave Module (Student View)
**Document ID:** AXIS-PHD-FLOW-v1.0  
**Date:** June 2026  
**Status:** Active — Prototype Phase

---

## 1. Global Shell Layout

```
┌─────────────────────────────────────────────────────┐
│  AXIS Portal Header (Logo + Student Name + Logout)  │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   SIDEBAR    │         MAIN CONTENT AREA            │
│   (fixed,    │         (scrollable, bg: #f4f7f9)    │
│   240px)     │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

The sidebar is fixed on the left. The content area renders the active route component.

---

## 2. Sidebar Navigation Flow

```
SIDEBAR
│
├── [Other AXIS Modules] (collapsed or visible)
│
└── ▼ PHD-LEAVE  ← Click to toggle expand/collapse
    ├── Dashboard     → navigates to /phd-leave/dashboard
    ├── Apply Leave   → navigates to /phd-leave/apply
    └── Leave Status  → navigates to /phd-leave/status
```

**Behaviour:**
- PHD-LEAVE group header has a chevron icon (▼/▶) indicating expanded/collapsed state.
- Clicking the group header toggles the sub-menu (CSS height animation).
- Clicking any sub-item navigates via Angular Router (no page reload).
- Active route sub-item is highlighted: teal left border + teal text + light teal background.
- Default: PHD-LEAVE group is expanded when any `/phd-leave/*` route is active.

---

## 3. Screen 1: Leave Balance Dashboard (`/phd-leave/dashboard`)

### Entry Points
- Click **"Dashboard"** in sidebar
- App loads at `/phd-leave` → auto-redirects to `/phd-leave/dashboard`
- Click **"View Full History"** link on this page → goes to `/phd-leave/status`

### Page Load Flow
```
User lands on /phd-leave/dashboard
    │
    ▼
DashboardComponent.ngOnInit()
    │
    ▼
LeaveBalanceService.getBalances()  ← returns mock Observable
    │
    ▼
Render 6 LeaveBalanceCards in CSS Grid
    │
    ├── Each card shows: Leave Type, Credited, Availed, Balance, Progress Ring
    ├── Ring colour logic:
    │     > 50% remaining  → green  (#1b5e20 stroke)
    │     ≤ 25% remaining  → amber  (#f57f17 stroke)
    │       0 remaining    → red    (#c62828 stroke) + "Exhausted" chip
    └── "Unlimited" types (On-Duty) → ring hidden, shows "Unlimited" badge
```

### Click Map
| Element | Action |
|---|---|
| **"Quick Apply"** button (top-right) | Navigate to `/phd-leave/apply` |
| **"View Full History"** link (below cards) | Navigate to `/phd-leave/status` |
| **"Apply"** CTA inside a leave card (if present) | Navigate to `/phd-leave/apply` with leaveType pre-selected via query param `?type=CASUAL` |
| Sidebar → **Apply Leave** | Navigate to `/phd-leave/apply` |
| Sidebar → **Leave Status** | Navigate to `/phd-leave/status` |

---

## 4. Screen 2: Apply Leave Form (`/phd-leave/apply`)

### Entry Points
- Click **"Apply Leave"** in sidebar
- Click **"Quick Apply"** button on Dashboard
- Click **"Apply New Leave"** button on Leave Status page
- Card-level CTA with pre-selected leave type (query param)

### Page Load Flow
```
User lands on /phd-leave/apply
    │
    ▼
ApplyLeaveComponent.ngOnInit()
    │
    ├── Check queryParam ?type=  → if present, pre-select LeaveType dropdown
    ├── Load mock student data (advisor name, TA name, PGC Chair name)
    └── Render blank form
```

### Form Interaction Flow

```
STEP 1 — Select Leave Type (dropdown)
    │
    ├── [CASUAL / VACATION / MATERNITY / PATERNITY selected]
    │       └── Approver section: show 1 read-only field "Advisor: Prof. Anand Kumar"
    │
    ├── [MEDICAL selected]
    │       ├── Approver section: show 1 read-only field "Advisor: Prof. Anand Kumar"
    │       └── ★ DYNAMIC: Render FileUploadZone below Reason field
    │
    ├── [ON-DUTY selected]
    │       └── ★ DYNAMIC: Expand Approver section to 3 read-only fields:
    │                 • Advisor:        Prof. Anand Kumar
    │                 • TA Instructor:  Prof. Ritu Singhal
    │                 • PGC Chair:      Prof. M. Balakrishnan
    │
    └── [SEMESTER selected]
            └── ★ DYNAMIC: Render amber Warning Banner below dropdown:
                  "Warning: A Semester Leave will pause your registration
                   and halt your stipend. You have used 0 of 2 allowed
                   semester leaves."

STEP 2 — Select From Date (calendar picker)
    │
    └── Cannot select past dates (dates before today are disabled)

STEP 3 — Select To Date (calendar picker)
    │
    ├── Visible unless [Half Day] checkbox is checked
    ├── Cannot be before From Date
    └── Auto-compute: "Duration: X working day(s)" shown inline

STEP 4 — Half Day checkbox
    │
    ├── [Unchecked] → To Date field is visible
    └── [Checked]   → To Date field hides, Duration = "0.5 days"

STEP 5 — Type Reason (textarea)
    │
    └── Max 500 chars, character counter shown bottom-right of textarea

STEP 6 — [MEDICAL ONLY] Upload File (FileUploadZone)
    │
    ├── Drag a file OR click "Browse" to select
    ├── Validates: PDF/JPG/PNG only, max 5 MB
    ├── [Valid file dropped/selected]
    │       └── Show filename + size + × remove button inside the zone
    └── [Invalid] → show inline error: "Only PDF, JPG, PNG under 5 MB allowed"

STEP 7 — Submit
    │
    ├── [Form is invalid / required fields missing]
    │       └── All invalid fields highlight red, error messages appear inline
    │
    ├── [Medical Leave + no document attached]
    │       └── Submit button remains disabled with tooltip: "Medical certificate required"
    │
    └── [All valid]
            ├── Submit button triggers LeaveApplicationService.submit(form.value)
            ├── Show success toast: "Leave application submitted successfully!"
            └── Navigate to /phd-leave/status after 1.5s delay
```

### Reset Button Flow
```
User clicks "Reset"
    │
    └── Confirmation dialog: "Are you sure you want to clear the form?"
            ├── [Cancel] → Dialog dismisses, form unchanged
            └── [Confirm] → Form resets to default empty state,
                            dynamic sections (file upload, multi-approver, warning) collapse
```

---

## 5. Screen 3: Leave Status Board (`/phd-leave/status`)

### Entry Points
- Click **"Leave Status"** in sidebar
- After successful form submission (auto-redirect)
- Click **"View Full History"** link on Dashboard

### Page Load Flow
```
User lands on /phd-leave/status
    │
    ▼
LeaveStatusComponent.ngOnInit()
    │
    ▼
LeaveStatusService.getApplications()  ← returns mock Observable
    │
    ├── [Applications found]
    │       └── Render full-width table with sticky header + all rows
    │
    └── [No applications]
            └── Render empty state:
                  Icon + "No leave requests found."
                  + CTA button → navigate to /phd-leave/apply
```

### Table Interaction Flow
```
Table Row Interactions:
    │
    ├── Hover on any row → row background shifts to #f4f7f9 (subtle)
    │
    ├── Status column → renders StatusPillComponent
    │       ├── "Approved"          → green pill
    │       ├── "Rejected"          → red pill
    │       ├── "Pending Advisor"   → amber pill
    │       ├── "Pending TA Instructor" → amber pill
    │       ├── "Pending PGC Chair" → amber pill
    │       └── "Cancelled"         → grey pill
    │
    └── Document column (Medical Leave rows only)
            └── FontAwesome PDF icon (fa-file-pdf, teal #006565)
                    └── Click → opens mock PDF in new tab
                                (uses documentUrl from mock data)
```

### Click Map
| Element | Action |
|---|---|
| **"Apply New Leave"** button (top-right) | Navigate to `/phd-leave/apply` |
| PDF icon in Document column | Open `documentUrl` in new browser tab |
| Sidebar → **Dashboard** | Navigate to `/phd-leave/dashboard` |
| Sidebar → **Apply Leave** | Navigate to `/phd-leave/apply` |

---

## 6. Full Navigation State Diagram

```
                          ┌─────────────────────────────────────┐
                          │           AXIS Portal Login          │
                          └─────────────────┬───────────────────┘
                                            │ (auto-redirect to dashboard)
                                            ▼
                          ┌─────────────────────────────────────┐
                          │  /phd-leave/dashboard  (Dashboard)   │
                          │  ┌─────────────┐                     │
                          │  │ Leave Cards │                     │
                          │  └─────────────┘                     │
                          └────┬──────────────────┬─────────────┘
                               │                  │
                    "Quick Apply"           "View Full History"
                               │                  │
                               ▼                  ▼
          ┌────────────────────────┐    ┌──────────────────────────┐
          │  /phd-leave/apply       │    │  /phd-leave/status        │
          │  (Leave Application)    │    │  (Status Board)           │
          │                        │    │                           │
          │  [Form] ──Submit──►    │    │  Table with status pills  │
          │  Success Toast          │    │  PDF links for Medical    │
          │       │                 │    │                           │
          │       └─ Redirect (1.5s)───►│                           │
          └────────────────────────┘    └──────────────────────────┘
                     ▲                              │
                     └──── "Apply New Leave" ◄──────┘
```

---

## 7. Dynamic Form Sections — Render Conditions

| Section | Renders When | Hides When |
|---|---|---|
| Single Approver field | Any leave type EXCEPT On-Duty | On-Duty selected |
| Multi-Approver section (3 fields) | On-Duty Leave selected | Any other type |
| Medical Certificate Upload Zone | Medical Leave selected | Any other type |
| Semester Leave Warning Banner | Semester Leave selected | Any other type |
| "To Date" date picker | Half Day checkbox = unchecked | Half Day checkbox = checked |
| Duration display ("X working days") | From Date is selected | — |
| "0.5 days" duration text | Half Day checkbox = checked | — |

---

## 8. Toast Notifications

| Trigger | Toast Type | Message |
|---|---|---|
| Successful leave submission | Success (green) | "Leave application submitted successfully!" |
| File upload type error | Error (red) | "Only PDF, JPG, or PNG files are allowed." |
| File upload size error | Error (red) | "File size must be under 5 MB." |
| Form reset confirmed | Info (blue) | "Form cleared." |

Toasts auto-dismiss after **3 seconds**. Appear bottom-right of viewport.

---

## 9. Responsive Behaviour Notes

| Breakpoint | Behaviour |
|---|---|
| Desktop (≥1024px) | Sidebar visible, card grid 3 columns, table full-width |
| Tablet (768–1023px) | Sidebar collapses to icon-only, card grid 2 columns |
| Mobile (< 768px) | Hamburger menu for sidebar, card grid 1 column, table horizontally scrollable |

> **Prototype target:** Desktop layout. Tablet/mobile is a stretch goal.
