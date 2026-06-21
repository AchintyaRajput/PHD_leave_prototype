# SYSTEM CONTEXT & KNOWLEDGE TRANSFER: AXIS Portal - PhD Leave Module

Hello Claude. I am transferring my current project context to you so you can act as my primary frontend co-pilot. I am contributing to my college's enterprise ERP system called the **AXIS Portal**. 

Please read this entire document carefully. Acknowledge that you understand the architecture, the business logic, and the exact 3 screens we are prototyping, and then wait for my first instruction.

## 1. The AXIS Portal: Overarching Architecture
AXIS is an all-in-one institutional portal handling graduation checks, medical forms, leave applications, and academic tracking. It replaces old, fragmented legacy `.aspx` systems.
* **Tech Stack:** Angular (Frontend), Node.js/Express (Backend), MongoDB (Database).
* **Modular Structure:** To prevent system-wide crashes, AXIS is split into independent repositories: `Student-Frontend`, `Admin-Frontend`, `Faculty-Frontend`, and `Backend`. 
* **Design Language:** "Corporate Modern." It uses a flat vector-style interface, tonal layering, ample whitespace, and a specific color palette (Primary: `#006565`, App Background: `#f4f7f9`, Card Surface: `#ffffff`). 

## 2. Current Mission: The PhD Leave Module
I am currently tasked with building a brand new **PhD Leave Module** from the ground up, starting with prototyping the Angular frontend for the Student view. This module will allow PhD students to track their leave balances and apply for various types of academic and medical leaves.

### Business Logic (PhD Leave Policy Rules)
The portal must strictly adhere to the following leave policies:
1. **Casual Leaves (CL):** 8 days per calendar year. Resets Jan 1st. Requires Advisor approval. No rollover.
2. **Vacation Leaves:** 15 days per semester (30 per year). Used during official institute breaks. Cannot exceed 30 continuous days at a time.
3. **Medical Leaves:** Up to 15 days for health issues (can be extended by 6 in severe cases). **Crucial:** Automatically requires a medical certificate file upload.
4. **Work / On-Duty Leaves:** Unlimited days for official academic work (conferences, etc.). **Crucial:** Requires a multi-tier approval chain (Advisor -> TA Instructor -> PGC Chair).
5. **Semester Leaves:** A student can take a maximum of 2 full semesters off during their entire PhD. Academic registration is paused, and stipend/financial assistance is halted. (Note: If a student is absent >20 days in a regular semester, they may be forced to convert to a Semester Leave).
6. **Maternity/Paternity:** Standard Government of India (GoI) rules.

## 3. Frontend Prototyping: The 3 Core Screens
We are currently in the frontend UI prototyping phase. I have used Google's Nano Banana Pro to redesign the old legacy UI into modern mockups, and we will be scaffolding the Angular code for these **3 specific Student-side screens**:

### Screen 1: Leave Balance Dashboard
* **Purpose:** A high-level ledger replacing old grid tables.
* **UI Elements:** A responsive CSS Grid of "Metric Summary Cards" at the top of the workspace. 
* **Data Visualization:** It specifically tracks Casual Leaves (8 days) and Vacation Leaves (15 days). Cards must show "Credited", "Availed", and feature visual circular progress rings representing the remaining "Balance".

### Screen 2: Dynamic Leave Application Form
* **Purpose:** The actual form students use to request time off.
* **UI Elements:** A clean, elevated white card container (`max-width` restricted for readability) with clean borders (`#e0e4ea`). Inputs must shift to primary (`#006565`) on focus. Includes a dropdown for Leave Type and Date Pickers.
* **Dynamic Behavior:** * If "Medical Leave" is selected, the form must dynamically render a drag-and-drop file upload zone for the doctor's certificate.
  * If "On-Duty Leave" is selected, the approver section must expand to show the Advisor, TA Instructor, and PGC Chair routing.

### Screen 3: Applied Leave Status Board
* **Purpose:** A history and tracking board for previously submitted leaves.
* **UI Elements:** A full-width data table (`min-width: 900px`) with sticky headers (`position: sticky`). Includes subtle row hover effects.
* **Semantic Status Pills:** Plain text statuses are replaced with visual pills:
  * Soft Amber background (`#fff8e1`) with Orange text (`#f57f17`) for "Pending Advisor".
  * Soft Green background (`#e8f5e9`) with Dark Green text (`#1b5e20`) for "Approved".
  * Soft Red background (`#ffebee`) with Dark Red text (`#c62828`) for "Rejected".
* **Actionable Links:** A quick link with a FontAwesome PDF icon to view uploaded medical documents.

## 4. Current State & Next Steps
For now, we are ONLY making the prototype frontend components in Angular. We will mock the data in the `.ts` files rather than connecting to the Node.js backend just yet. 

If you have read and understood the AXIS architecture, the PhD leave rules, and the requirements for the 3 frontend screens, please reply with **"AXIS Knowledge Transfer Complete. Which of the 3 prototype screens shall we scaffold first?"**