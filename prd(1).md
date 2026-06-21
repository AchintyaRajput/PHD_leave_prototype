# PRD — AXIS Portal: PhD Leave Module (Student View)
**Document ID:** AXIS-PHD-PRD-v1.0  
**Date:** June 2026  
**Status:** Active — Prototype Phase  
**Scope:** Student-side UI only (Admin and Faculty views are out of scope for this phase)

---

## 1. Overview

### 1.1 Purpose
The PhD Leave Module is a new sub-system within the AXIS Portal that allows PhD students at IIIT-Delhi to manage their entire leave lifecycle — from checking balances, to applying for leave, to tracking approval status — from a single, modern interface. It replaces the fragmented legacy `.aspx` system at `leave.iiitd.edu.in`.

### 1.2 Problem Statement
The current leave system is a collection of disparate `.aspx` pages with no visual hierarchy, no contextual validation, no dynamic behavior, and no visual status indicators. PhD students cannot easily track their leave types (which differ significantly from staff policies), cannot see real-time approval chain progress, and must navigate multiple pages with no consistent design.

### 1.3 Goals
- Provide PhD students a single, cohesive leave management workspace under the AXIS sidebar.
- Enforce all PhD-specific leave policy rules through the UI (dynamic field rendering, balance warnings).
- Replace plain-text statuses with semantic, color-coded visual pills.
- Surface the correct approval chain automatically based on leave type selection.

### 1.4 Non-Goals (Out of Scope for this Phase)
- Admin-side leave approval interface.
- Faculty-side leave management.
- Backend API integration (all data is mocked in `.ts` files for prototype phase).
- Email/push notification triggers.
- Attendance Regularization screen.

---

## 2. Users

**Primary User:** PhD Student (enrolled at IIIT-Delhi)  
**Context:** Student logs into AXIS Portal, navigates the sidebar, and interacts with the PHD-LEAVE section.

---

## 3. Leave Policy Business Rules

These rules are non-negotiable and must be enforced or surfaced in the UI:

| Leave Type | Allocation | Key Rule | Approval Chain |
|---|---|---|---|
| Casual Leave (CL) | 8 days/calendar year | No rollover. Resets Jan 1. | Advisor only |
| Vacation Leave | 15 days/semester (30/year) | Cannot exceed 30 continuous days | Advisor only |
| Medical Leave | Up to 15 days (extendable by 6) | **Mandatory medical certificate upload** | Advisor only |
| Work / On-Duty Leave | Unlimited days | For conferences, academic work | **Multi-tier: Advisor → TA Instructor → PGC Chair** |
| Semester Leave | Max 2 semesters total in PhD | Pauses registration + halts stipend | Institute-level |
| Maternity/Paternity | As per GoI rules | Standard government policy | Advisor + Admin |

**UI enforcement rules:**
- If **Medical Leave** is selected → a drag-and-drop file upload zone for doctor's certificate MUST appear dynamically.
- If **Work / On-Duty Leave** is selected → the Approver section MUST expand to show all 3 approvers (Advisor, TA Instructor, PGC Chair) instead of just one.
- If a student's Casual Leave balance is 0 → the "Apply" CTA should warn the student before submission.
- Semester Leave selection should trigger a prominent warning banner: *"Taking a semester leave will pause your academic registration and halt your stipend/financial assistance."*

---

## 4. Navigation Structure

The PHD-LEAVE section lives in the AXIS left sidebar as a collapsible group:

```
AXIS Sidebar
└── PHD-LEAVE  (section header, collapsible)
    ├── Dashboard          (icon: home / grid)
    ├── Apply Leave        (icon: plus-circle / file-plus)
    └── Leave Status       (icon: list / clipboard-list)
```

Clicking "PHD-LEAVE" in the sidebar toggles the sub-navigation open/closed.  
Each sub-item is a direct router link — no modals, no pop-ups for navigation.

---

## 5. Screen Requirements

### 5.1 Screen 1 — Leave Balance Dashboard

**Route:** `/phd-leave/dashboard`  
**Sidebar Label:** Dashboard  
**Purpose:** High-level ledger of all leave entitlements for the current academic year.

#### Layout
- Page title: **"Leave Balance"** with a subtitle showing the current academic year (e.g., *"AY 2025–26 · Semester II"*).
- A responsive CSS Grid of **Metric Summary Cards**, one per leave type.
- Each card displays:
  - **Leave Type name** (e.g., "Casual Leave")
  - **Credited** (total allocation, e.g., 8)
  - **Availed** (days used)
  - **Balance** (remaining days)
  - A **circular progress ring** (SVG or CSS `conic-gradient`) visually representing Balance as a percentage of Credited.
  - If Balance = 0 → ring fills red and a small "Exhausted" chip appears.
  - If Balance ≤ 2 → ring fills amber and a "Low" chip appears.

#### Cards to Display
1. Casual Leave — 8 days credited
2. Vacation Leave — 15 days credited (current semester)
3. Medical Leave — 15 days credited
4. Work / On-Duty Leave — Unlimited (show as "–" for the ring; display a text note instead)
5. Semester Leave — Show "2 semesters total allowance" with "Used: X of 2"
6. Maternity / Paternity — Show eligibility status

#### Additional Elements
- A **"Quick Apply"** CTA button in the top-right of the page header → navigates to `/phd-leave/apply`.
- A **"View Full History"** link below the card grid → navigates to `/phd-leave/status`.

---

### 5.2 Screen 2 — Apply Leave Form

**Route:** `/phd-leave/apply`  
**Sidebar Label:** Apply Leave  
**Purpose:** A clean, accessible form for submitting a new leave request.

#### Layout
- Centered white card container (`max-width: 720px`, `border-radius: 12px`, `border: 1px solid #e0e4ea`).
- Page title: **"Apply for Leave"** inside the card header.
- All form inputs shift to primary `#006565` on focus (border + label colour).

#### Form Fields (in order)

1. **Leave Type** — `<select>` dropdown. Options:
   - Casual Leave
   - Vacation Leave
   - Medical Leave ← triggers file upload zone
   - Work / On-Duty Leave ← triggers multi-approver section
   - Semester Leave ← triggers warning banner
   - Maternity Leave
   - Paternity Leave

2. **Approver** — Text display (read-only, auto-populated based on leave type):
   - Default: Shows student's registered Advisor name.
   - If "Work / On-Duty Leave" → renders 3 separate read-only fields: Advisor, TA Instructor, PGC Chair (each showing the assigned person's name from mock data).

3. **From Date** — Date picker (calendar popover). Cannot be in the past.

4. **To Date** — Date picker (calendar popover). Cannot be before From Date. Auto-calculates total days.

5. **Total Days** — Read-only computed field (shown inline below date pickers as: *"Duration: X working day(s)"*).

6. **Half Day** — Checkbox. If checked, "To Date" field is hidden and duration shows "0.5 days".

7. **Reason** — `<textarea>` (min 3 rows, max 500 chars). Character counter shown at bottom-right.

8. **[DYNAMIC] Medical Certificate Upload** — Appears ONLY when "Medical Leave" is selected:
   - Drag-and-drop zone with a dashed border (`#006565`).
   - Supports PDF, JPG, PNG. Max size: 5 MB.
   - Shows file name + size after upload, with a remove (×) icon.
   - Upload is **mandatory** for Medical Leave — submit button remains disabled until file is attached.

9. **[DYNAMIC] Semester Leave Warning Banner** — Appears ONLY when "Semester Leave" is selected:
   - Amber background banner directly below the Leave Type dropdown.
   - Text: *"Warning: A Semester Leave will pause your academic registration and halt your monthly stipend and financial assistance. You have used X of 2 allowed semester leaves."*

#### Actions
- **Submit** button (primary, full-width at bottom): Validates all required fields. On success → shows a success toast notification and redirects to `/phd-leave/status`.
- **Reset** button (ghost/outline): Clears the entire form after confirmation prompt.

---

### 5.3 Screen 3 — Applied Leave Status Board

**Route:** `/phd-leave/status`  
**Sidebar Label:** Leave Status  
**Purpose:** A history and real-time tracking board for all submitted leave requests.

#### Layout
- Page title: **"Leave Status"** with a subtitle: *"Track your submitted requests."*
- Full-width data table (`min-width: 900px`, horizontally scrollable on smaller screens).
- **Sticky table header** (`position: sticky; top: 0; z-index: 10`).
- Subtle row hover effect (`background: #f4f7f9`).

#### Table Columns

| Column | Content |
|---|---|
| **Leave Type** | Text (e.g., "Casual Leave") |
| **Applied On** | Date + time (e.g., "3 Jun 2026, 10:26 AM") |
| **From Date** | Date (e.g., "4 Jun 2026") |
| **To Date** | Date (e.g., "5 Jun 2026") |
| **Duration** | "2 days" or "0.5 days" |
| **Current Status** | Semantic status pill (see below) |
| **Document** | PDF link icon (FontAwesome `fa-file-pdf`) — shown only for Medical Leave rows |

#### Semantic Status Pills

| Status | Background | Text Colour | Use Case |
|---|---|---|---|
| Pending Advisor | `#fff8e1` (Soft Amber) | `#f57f17` (Orange) | Awaiting advisor action |
| Pending TA Instructor | `#fff8e1` | `#f57f17` | On-Duty leave, step 2 |
| Pending PGC Chair | `#fff8e1` | `#f57f17` | On-Duty leave, step 3 |
| Approved | `#e8f5e9` (Soft Green) | `#1b5e20` (Dark Green) | Fully approved |
| Rejected | `#ffebee` (Soft Red) | `#c62828` (Dark Red) | Rejected at any stage |
| Cancelled | `#f3f4f6` (Light Grey) | `#6b7280` (Grey) | Cancelled by student |

#### Additional Behaviour
- Empty state: If no leaves have been applied, show a centred illustration with text *"No leave requests found. Apply for your first leave."* and a CTA linking to `/phd-leave/apply`.
- A **"Apply New Leave"** button in the top-right of the page header.

---

## 6. Design System Tokens

| Token | Value |
|---|---|
| Primary | `#006565` |
| Primary Dark | `#004d4d` |
| App Background | `#f4f7f9` |
| Card Surface | `#ffffff` |
| Border Colour | `#e0e4ea` |
| Text Primary | `#1a202c` |
| Text Secondary | `#6b7280` |
| Danger | `#c62828` |
| Warning | `#f57f17` |
| Success | `#1b5e20` |

---

## 7. Acceptance Criteria

- [ ] All 3 screens are navigable via the AXIS sidebar under PHD-LEAVE.
- [ ] Leave Balance Dashboard shows a card per leave type with a circular progress ring.
- [ ] Apply Leave form dynamically renders the file upload zone on Medical Leave selection.
- [ ] Apply Leave form dynamically expands to 3 approvers on Work / On-Duty Leave selection.
- [ ] Semester Leave warning banner appears on leave type selection.
- [ ] Leave Status table uses correct semantic pill colours for all 5 status types.
- [ ] Medical Leave rows in the status table show a clickable PDF icon.
- [ ] All form fields validate before submission.
- [ ] Sidebar PHD-LEAVE section is collapsible.
- [ ] All data is mocked in `.ts` files — no backend calls in prototype.
