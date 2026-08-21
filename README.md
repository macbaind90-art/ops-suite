# PWADC Security Operations Suite v3.3.0.2


## v3.3.0.2 Attendance Print Customization

This focused Attendance reporting enhancement improves the management printout without changing attendance records, code definitions, discipline thresholds, notice logic, or the v3.3.0 modular architecture.

### Portrait Attendance Totals
- Attendance Review → Print Attendance Totals now produces a **portrait** report.
- The printed employee list uses fixed Employee and Shift fields with a portrait-friendly Selected Attendance area rather than expanding into a wide landscape table.
- The report continues to support all active employees or a selected shift and Current Week, Current Month, or Rolling 90 Days.

### Selectable Attendance Boxes
- The print setup now lets the user choose exactly which attendance codes appear.
- Quick selectors are provided for Discipline + Approved, Discipline Only, Approved Only, Select All, and Clear.
- Any individual attendance code can also be checked or unchecked independently.
- Discipline Total, Approved Total, and Recorded Total are optional summary boxes and can be independently included or excluded.

### Occurrence Dates
- Each selected attendance code box shows the employee's total for that code.
- The occurrence dates for that code are printed beside the total in compact **MM/DD** format.
- Example: `CO 2 | 08/04, 08/11`.
- The final ALL EMPLOYEES summary row retains aggregate totals without presenting employee-specific dates.

### Scope Control
- No Attendance source records are changed by printing.
- No attendance code meanings or discipline/pattern thresholds are changed.
- No Schedule, Shift Reports, Shift Intelligence, labor, roster, or shared-data authority rules are changed.
- v3.4.0 Data Layer / Reliability Upgrade remains the next major roadmap phase.



## v3.3.0.1 Schedule Assignment Picker

This controlled schedule enhancement improves staffing scenario flexibility without changing live schedule authority, HPW rules, or the shared roster JSON structure.

### Mock Schedule Assignment Flexibility
- Mock schedules can assign **any active roster employee to any schedule slot**, regardless of the employee's normal shift, gate assignment, or schedule section.
- The unrestricted pool applies to individual cell reassignment and the day-assignment selectors used when adding/editing mock rows.
- Archived/inactive roster employees remain excluded.
- Live schedule dropdown behavior retains the existing section/shift context.

### Name / Employee Number Typeahead
- Clicking a schedule cell now opens a searchable employee picker instead of requiring a long dropdown scan.
- Open, Pending, and Closed cells automatically focus the search field.
- Search accepts partial employee name or employee number (EID).
- Results show employee name, EID, rank, and shift before selection.
- Keyboard Up/Down, Enter, and Escape are supported.
- The selected employee is stored using the existing schedule label format so HPW, employee matching, printouts, colors, and reporting remain compatible.
- Copy/paste and Closed/Open/Pending status controls remain available in the same cell editor.

### Scope Control
- No roster records, schedule authority rules, attendance rules, labor assumptions, Shift Operations logic, or report definitions are changed.
- v3.4.0 Data Layer / Reliability Upgrade remains the next major roadmap phase.


## v3.3.0 Code Organization / Modularization

This architecture release reduces regression risk without intentionally changing PWADC operating workflows, shared JSON contracts, role rules, or schedule authority. The C# / WebView2 platform remains in place.

### Front-End Module Structure
- Reduces `app/index.html` from the monolithic application container to a small document shell that loads ordered assets.
- Moves the design system into `app/assets/styles.css`.
- Splits the former inline JavaScript into 10 bounded functional modules plus a module registry and startup gate.
- Preserves classic-script global compatibility so existing inline UI actions and cross-feature helper calls continue to work without a framework rewrite.
- Adds `PWADCModuleRegistry`, which verifies all expected front-end modules are present before `init()` is allowed to run.
- Keeps the existing 85-function render guard and exposes front-end module registration status in the QA guardrail panel.

### Windows Host Structure
- Converts `MainForm` to a partial class and separates responsibilities into:
  - `MainForm.cs` - window lifecycle and WebView shell
  - `MainForm.Bridge.cs` - WebView message routing / responses
  - `MainForm.Storage.cs` - settings, module load/save, health and storage operations
  - `MainForm.Backups.cs` - backup inventory, retention, cleanup and restore
  - `MainForm.Programs.cs` - approved path handling, standalone programs, locks, environment and module file status
  - `Models.cs` - settings, users, coverage and backup models
- Preserves the existing `suite:*` desktop bridge contracts and shared-drive folder model.

### Build / Maintenance Controls
- GitHub Actions artifact naming is aligned to v3.3.0.
- `ARCHITECTURE-v3.3.0.md` defines module ownership, dependency order, and rules for future changes.
- Existing workflows are intentionally unchanged. The release is a structural refactor, not a UI or policy redesign.
- v3.4.0 Data Layer / Reliability Upgrade is now the next major roadmap phase.


## v3.2.6.3 Attendance Totals Print Enhancement

This controlled enhancement adds a management-ready attendance totals print workflow directly to Attendance Review without changing attendance records, code meanings, discipline thresholds, or notice logic.

### Print Attendance Totals
- Adds **Print Attendance Totals** to Attendance Review.
- Produces one row per active employee with attendance code totals for the selected reporting window.
- Defaults to the same rolling 90-day ending date used by Attendance Review.
- Supports all active employees or a selected shift.
- Supports Current Week, Current Month, or Rolling 90 Days.
- Supports three detail levels: Discipline Only, Discipline + Approved, or All Attendance Codes.
- Discipline Total uses the canonical `DISCIPLINE_CODES` source: T, U, UE, CO, NCNS.
- Approved Total uses the canonical `TRACKING_CODES` source: AL, V, E, LE.
- Adds a final **ALL EMPLOYEES** totals row for management comparison.
- Uses a landscape print preview suitable for paper or Save to PDF.

### Scope Control
- No attendance entries are modified by printing.
- No discipline or pattern thresholds are changed.
- No Schedule, Shift Reports, Shift Intelligence, labor, or roster logic is changed.
- v3.3.0 Code Organization / Modularization is now complete; v3.4.0 Data Layer / Reliability Upgrade is the next major roadmap phase.


## v3.2.6.2 Schedule Workspace Enhancements

This controlled enhancement expands the Master Schedule into a safer working environment for day-to-day staffing changes and scenario planning without changing the rule that the **live published schedule is the authority for HPW, staffing reports, and labor analytics**.

### Cell Copy / Paste
- Adds a schedule clipboard for copying an employee assignment or status from one schedule cell to another.
- Copy is initiated from the cell editor; the copied assignment remains available while moving between cells.
- Paste records the source cell and destination in the roster audit history.
- Copy/paste works in both the live schedule and mock schedules.

### Clear Entire Schedule
- Adds a guarded **Clear Schedule** action that clears every daily assignment/status to Closed while preserving sections, posts, coverage windows, cost hours, and row notes.
- Clearing the live schedule requires a reason and exact `CLEAR SCHEDULE` confirmation.
- A roster backup is created before the live schedule is cleared.
- Mock schedules can be cleared independently with `CLEAR MOCK`; the live schedule is not affected.

### Mock Schedule Library
- Adds persistent `scheduleDrafts` storage inside the roster JSON for held staffing scenarios.
- A mock can start from a copy of the live schedule or from blank assignments using the current live section/post structure.
- Mock schedules can be opened, edited, renamed, duplicated, printed/shared, held indefinitely, and deleted without changing the live schedule.
- Mock schedule screens and exports are clearly marked **MOCK / NOT PUBLISHED**.
- Mock assignments do not drive live HPW, labor cost, attendance coverage, management reports, or other schedule-authority calculations.
- Applying a mock to live requires a reason, exact `APPLY SCHEDULE` confirmation, and a roster backup before replacement.
- Applying a mock does not delete the saved mock; the scenario remains available for reference or later reuse.

### Scope Control
- No Attendance logic or discipline codes were changed.
- No Shift Reports / Shift Intelligence logic was changed.
- No coverage-authority definitions, loaded-cost rates, or shared-data paths were changed.
- v3.3.0 Code Organization / Modularization is now complete; v3.4.0 Data Layer / Reliability Upgrade is the next major roadmap phase.

## v3.2.6.1 Attendance Review Discipline Code Fix

This controlled hotfix corrects Attendance Review so it uses the same canonical discipline-code set as Daily Entry, Patterns, Notices, and Attendance reporting.

### Attendance Review
- Adds **CO (Call-Out)** to Week, Month, and 90-Day Discipline counts.
- Adds **NCNS (No Call No Show)** to the same review columns because it was omitted by the same hard-coded display list.
- Adds CO and NCNS to the expandable Discipline Review date history under each employee.
- Replaces the duplicated Attendance Review discipline-code array with the suite's existing `DISCIPLINE_CODES` source of truth: T, U, UE, CO, NCNS.
- Uses the existing `TRACKING_CODES` source of truth for approved tracking: AL, V, E, LE.
- Does not change attendance data, thresholds, historical records, or the meaning of any attendance code.

The defect was presentation-layer only: CO and NCNS were already stored and used by the pattern/notice/reporting logic, but Attendance Review displayed only T, U, and UE.

## v3.2.6 Reports / Data / Admin Redesign

This release rebuilds the suite's governance lane so reporting, data verification, recovery, audit review, and administrative configuration operate as one controlled workflow instead of separate utility screens.

The governing sequence is:

**Report → Verify → Recover → Govern**

The redesign does not change the shared JSON architecture or introduce a database. It improves decision flow, risk visibility, recovery discipline, and administrative usability on the existing C# / WebView2 platform.

### Report Center
- Replaces the report-card wall with a report library, selected-report detail panel, and reporting-readiness rail.
- Groups outputs by operational purpose instead of presenting every report with equal visual weight.
- Identifies the decision each report supports, its data source, output formats, and access level.
- Keeps date-range and scope controls adjacent to the selected report.
- Provides direct handoffs to Data Health, Backup & Restore, and Change Log when confidence or governance review is required.
- Retains existing report generation, print, and CSV functions.

### Data Health
- Moves critical and warning findings ahead of technical inventories and maintenance controls.
- Separates operational findings from progressive-disclosure technical panels.
- Gives each finding a direct source-review action instead of presenting diagnostics without a next step.
- Retains live-file verification, data repairs, backup management, source inventory, QA guardrails, and regression controls.
- Automated repairs remain secondary to source verification and backup-first handling.

### Backup & Restore
- Reframes restoration as a controlled three-step recovery workflow:
  1. Select the data scope.
  2. Select the backup.
  3. Preview the replacement boundary before restoration.
- Keeps the mandatory reason and confirmation requirements.
- Preserves pre-restore backup protection and existing module boundaries.
- Separates routine backup management from high-risk restore actions.

### Change Log
- Adds governance metrics for total activity, high-impact activity, current-user activity, and displayed records.
- Adds module, search, and row-limit controls.
- Labels entries by operational impact so restore, deletion, settings, role, and clearance actions rise above routine saves.
- Retains the underlying module audit histories and reporting functions.

### Admin Settings
- Replaces the long stacked page with seven controlled sections:
  - General
  - Users & Roles
  - Labor Assumptions
  - Coverage Authority
  - Data & Recovery
  - Standalone Programs
  - Restricted Actions
- Preserves unsaved edits when moving between sections and validates all sections before one final save.
- Keeps Admin-only access restrictions and at least one active Admin requirement.
- Retains current loaded-cost defaults and schedule-based coverage authority.

### Scope control
- Shift Reports and Shift Intelligence functionality from v3.2.5.5 remains intact.
- Shift Intelligence operational calibration is intentionally deferred for a later stabilization pass.
- Emergency procedure and contact documents are not integrated into this release.
- Other Programs remains the specialist-tool launcher and is not converted into a data-governance module.

## Operating Rules Retained
- Shared data root: `\\pig-fs\Security\MacBain\Security Operations Suite`
- JSON/shared files remain the active data layer.
- Schedule remains the authority for hours per week.
- Named schedule cells count as scheduled HPW.
- Open/Pending cells count as unfilled HPW.
- Closed and blank cells are ignored.
- Reception is 0800–1700 coverage with eight cost hours because lunch relief is covered by another guard.
- Default loaded-cost assumptions remain:
  - PT: 20%
  - FT: 33%
  - TempToHire: 35%
- The preferred operational term remains **Base**, not SOC.

## Roadmap Progress
- ~~v3.2.1 - Full UI / UX Audit + Roadmap Anchor~~ Completed
- ~~v3.2.2 - Professional Design System Pass~~ Completed
- ~~v3.2.2.1 - High-Intelligence Professional Design System Rerun~~ Completed
- ~~v3.2.2.2 - Navigation Dropdown Hover Fix~~ Completed
- ~~v3.2.3 - Home / Command Center Redesign~~ Completed
- ~~v3.2.3.1 - UI Render Fix / Undefined Helper Sweep~~ Completed
- ~~v3.2.3.2 - GitHub Version Format Fix~~ Completed
- ~~v3.2.4 - People Workflow Redesign~~ Completed
- ~~v3.2.5 - Operations Workflow Redesign~~ Completed
- ~~v3.2.5.1 - Manifest XML Startup Fix~~ Completed
- ~~v3.2.5.2 - Shift Report Intelligence Rebuild~~ Completed
- ~~v3.2.5.3 - Shift Report Interface Cleanup / Fresh Start Control~~ Completed
- ~~v3.2.5.4 - Shift Operations Flow Redesign~~ Completed
- ~~v3.2.5.5 - Shift Operations Experience Redesign~~ Completed
- ~~v3.2.6 - Reports / Data / Admin Redesign~~ Completed
- ~~v3.2.6.1 - Attendance Review Discipline Code Fix~~ Completed
- ~~v3.2.6.2 - Schedule Workspace Enhancements~~ Completed
- ~~v3.2.6.3 - Attendance Totals Print Enhancement~~ Completed
- ~~v3.3.0 - Code Organization / Modularization~~ Completed
- **v3.4.0 - Data Layer / Reliability Upgrade** Next
- v3.5.0 - Reporting / Compliance Maturity
- v3.6.0 - Role / Security Maturity
- v3.7.0 - Workflow Intelligence / Smart Assist
- v3.8.0 - Performance / Scale Pass
- v3.9.0 - v4.0 Migration Planning
- v4.0 - Platform Architecture Release

## Current Project Map
1. **Command Center:** Home summarizes priority queues and live-data confidence.
2. **People Lane:** Attendance, Notice Workflow, Roster, Employee Profile, Training, and Uniform Accountability operate as a connected workflow.
3. **Operations Lane:** Shift Reports controls source intake and extraction. Shift Intelligence controls disposition, watchlist management, task handoff, and closure.
4. **Governance Lane:** Report Center, Data Health, Backup & Restore, Change Log, and Admin Settings follow Report → Verify → Recover → Govern.
5. **Specialist Tools:** Other Programs launches independent tools without mixing their scripts into the primary suite.
6. **Future Emergency Operations:** Uploaded emergency procedure documents remain candidates for a later controlled Emergency Operations Manual / procedure module.
7. **Road to v4.0:** v3.3.0 has reduced monolithic-code risk; the next priority is hardening shared-file persistence, conflict handling, validation, and recovery in v3.4.0.

## Architecture Direction
Continue with the current C# / WebView2 / HTML / CSS / JavaScript stack. v3.3.0 establishes the modular baseline. v3.4.0 should build on that structure by strengthening persistence, conflict handling, validation, recovery, and shared-file reliability before considering any database migration.
