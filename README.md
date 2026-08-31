# PWADC Security Operations Suite v3.4.1.1

## v3.4.1.1 Task Tracker Print Customization

This focused production enhancement adds controlled Task Tracker printing without changing task data, persistence, stale-write protection, or unrelated PWADC operational modules.

### Task Tracker Printing
- Adds **Print Tasks** directly to the Task Tracker action bar.
- Supports **Current filtered view** or **All task records**.
- Current filtered printing preserves the existing search, status, priority, category, and Task Tracker sort behavior.
- All task records includes open, completed, and archived task records.
- Print columns are independently selectable: Project, Status, Priority, Category, Assigned To, Due, Follow-up, Blocked By, Next Action, and Last Update.
- The on-screen Actions column is intentionally excluded from printable fields.
- Basic, All Columns, and Clear selectors support fast report setup.
- Reports use portrait orientation for six or fewer columns and landscape for wider selections.

### Release Boundary
- Printing is read-only and does not save or modify Task Tracker data.
- No Attendance, Roster, Schedule, Shift Reports, Shift Intelligence, HPW, labor, or shared-data architecture changes.
- Additional file-locking work remains deferred unless production collision evidence justifies it or it is specifically requested.


## v3.4.1.0 Stale Write + Conflict Detection

This release adds revision-aware concurrency protection to the v3.4.0 atomic-save foundation. Attendance, Roster/Schedule, Tasks, Shift Reports, and Shift Intelligence now remember the SHA-256 revision loaded from the shared PWADC Data folder and must present that same revision before a normal save can replace the live JSON.

### Revision-Aware Save Gate
- Every operational module load returns a revision token derived from the live JSON SHA-256.
- Normal module saves send the workstation's loaded revision back to the Windows host.
- The host rechecks the current shared-file revision after staging/validating the requested JSON but before creating a live-file safety backup or replacement.
- If the live revision changed, the transaction is blocked and the shared file is untouched.
- Successful saves return the new live revision so the workstation can continue saving against the correct baseline.

### Controlled Conflict Workflow
- A stale-write conflict keeps the user's current in-memory work open.
- The user can export the unsaved JSON copy to the module Exports folder for comparison/re-entry.
- **Reload Latest Shared Data** is the controlled path for discarding the stale in-memory copy and resuming from the newest shared revision.
- **Keep Unsaved Work Open** allows review without forcing an immediate discard, but saving remains blocked until the module is reloaded.
- Automatic record merging is intentionally not attempted.

### Conflict Audit
- Blocked conflicts are recorded under `Data Integrity\Conflict Audit`.
- Records include timestamp, suite version, Windows user, workstation, module, operation, target file, expected revision, current revision, live modified time, live size, and blocked result.
- The existing v3.4.0 Write Audit continues to capture the failed atomic transaction attempt.

### Release Boundary
- No automatic merge engine.
- Additional file locking remains deferred unless production collision evidence justifies it or it is specifically requested.
- No database migration.
- No Attendance policy, Roster, Schedule, HPW, labor, Shift Intelligence classification, or report-calculation changes.
- Existing `suite:*` message names remain compatible; revision data is carried inside the existing load/save payloads.

## v3.4.0.0 Atomic Save + Integrity Foundation

This release hardens PWADC Security Operations Suite shared JSON persistence without changing operational workflows or moving to a database. Critical live-data writes now pass through one Windows-host transaction service.

### Controlled JSON Transaction
- Validate the requested JSON before any live-file replacement.
- Preserve the current live file to the module backup folder when one exists.
- Stage the new JSON to a temporary file in the same directory as the live file.
- Write with `FileOptions.WriteThrough` and force a disk flush.
- Re-read and parse the temporary JSON before replacement.
- Verify the staged file SHA-256 against the requested payload.
- Replace the live JSON with `File.Replace` when available, with same-directory overwrite move fallback.
- Re-read, parse, and SHA-256 verify the final live file before reporting success.
- Remove abandoned transaction temp files in the transaction cleanup path.

### Integrity Safeguards
- Normal module/settings saves are blocked when the existing live JSON is malformed, preventing silent overwrite of damaged data.
- Restore and packaged-recovery operations remain controlled replacement paths and create pre-operation backups when a live file exists.
- Manual JSON backups now use durable writes and hash verification.
- Data Health reports live JSON as VALID, MISSING, or INVALID JSON and exposes integrity errors when present.

### Write Audit
- Each critical write records a per-event audit file under `Data Integrity\Write Audit`.
- Audit records include timestamp, suite version, Windows user, workstation, module, operation, target path, success state, verification state, replacement method, SHA-256, file size, backup path, and error detail when applicable.
- Audit-log failure does not block the operational save after the live-data transaction itself has been verified.

### Release Boundary
- No database migration.
- No stale-write/conflict detection yet; that is v3.4.1.
- No long-duration file locking.
- No Attendance, Roster, Schedule, Shift Intelligence, HPW, labor, or report calculation changes.
- Existing WebView `suite:*` bridge message names remain compatible.




## v3.3.1.0 Suite-wide Responsive UI Stabilization

This release is a suite-wide UI/UX stabilization pass on the v3.3 modular architecture. It improves window resizing and control consistency without changing operational records, workflow authority, attendance rules, schedule logic, reporting calculations, or shared-data contracts.

### Responsive Layout Foundation
- Normal window resizing is CSS-driven and no longer triggers a full application re-render.
- The Windows minimum size is reduced from 1100×700 to 900×600 now that major workspaces can collapse safely.
- Header/navigation, page actions, toolbars, forms, cards, modals, and multi-column workspaces now use shared responsive rules.
- Dense Schedule, Training, Settings, and table surfaces use local scrolling instead of stretching or clipping the entire application.
- Navigation dropdown positioning is normalized so wrapped navigation remains usable at narrower widths.

### Control Normalization
- Checkbox and radio inputs now use intentional control dimensions instead of inheriting full-width text-input styling.
- Buttons, selects, text fields, textareas, action groups, and modal footers use common sizing and wrapping behavior.
- Focus-visible treatment is standardized for keyboard operation.
- Narrow-window form grids and schedule-draft controls collapse progressively instead of forcing fixed desktop geometry.

### Release Boundary
- No Attendance records or thresholds changed.
- No Roster or Schedule assignments changed.
- No Shift Operations intelligence logic changed.
- No HPW, labor, report, role, backup, or shared JSON contracts changed.
- v3.4.0 Data Layer / Reliability Upgrade remains the next major roadmap phase.


## v3.3.0.8 Roster Print Employee Scope

This focused Roster reporting enhancement adds employee-level print selection without changing roster records, schedule authority, payroll assumptions, or existing roster filters.

### Print Scope
- Roster → Print Roster now supports **Current filtered roster**, **All employees**, or **Selected employees**.
- Selected employees supports one employee or a hand-picked multi-employee group.
- The employee picker includes name/EID search plus rank and shift context.
- Select Visible, Select All, and Clear controls support fast group selection.
- The existing roster column selector remains available and applies to the selected employee group.

### Preserved Behavior
- Current roster filters remain authoritative when Current filtered roster is selected.
- All employees retains the existing all-roster scope.
- Archived records remain identifiable in the selected-employee picker.
- Print orientation still switches to landscape only when more than eight roster columns are selected.
- No Roster, Schedule, Attendance, HPW, labor, or shared-data records are changed.


## v3.3.0.7 Attendance Print Employee Scope

This focused Attendance reporting enhancement adds employee-level print scope without changing attendance records, thresholds, or the compact portrait report format.

### Print Scope
- Attendance Review → Print Attendance Totals now supports **All Active Employees**, **By Shift**, or **Selected Employees**.
- Selected Employees supports one employee or a hand-picked multi-employee group.
- The employee picker includes a search field for name and, when the employee can be matched to the active Roster, employee number/EID.
- Custom employee reports calculate the report total from the selected employees only.

### Preserved Behavior
- Only discipline codes T, U, UE, CO, and NCNS show MM/DD occurrence dates.
- P, AL, V, E, LE, O, FL, and NE remain totals-only.
- Zero-total categories remain suppressed.
- Portrait orientation and compact density remain unchanged.
- No Attendance source records, code meanings, thresholds, notice rules, Schedule authority, or shared-data contracts are changed.


## v3.3.0.6 Attendance Print Date Detail Correction

This focused hotfix corrects Attendance Totals date-detail behavior without changing attendance records, thresholds, or code meanings.

### Date Detail Rule
- Only discipline codes **T, U, UE, CO, and NCNS** print MM/DD occurrence dates.
- All non-discipline codes, including **P, AL, V, E, LE, O, FL, and NE**, print totals only.
- Zero-total suppression remains active.
- The compact portrait layout from v3.3.0.5 is unchanged.

### Operational Effect
- A selected Present code now prints as `P 12`, not `P 12 | 08/01, 08/02, ...`.
- Discipline activity continues to retain dates for review and counseling context.
- This further reduces unnecessary print density and page consumption.


## v3.3.0.5 Attendance Print Density Optimization

This focused Attendance reporting hotfix makes the portrait Attendance Totals report more compact while preserving the user-selected categories, zero-total suppression, and attendance source data.

### Approved Categories: Totals Only
- Approved attendance categories **AL, V, E, and LE** now print the category total only.
- Approved-category occurrence dates are intentionally suppressed from the printout.
- Discipline categories **T, U, UE, CO, and NCNS** continue to show compact MM/DD occurrence dates when selected.
- Other non-approved codes continue to show MM/DD dates when selected.

### Compact Portrait Layout
- Employee name and shift are combined into one compact print column.
- Attendance activity uses flex-packed inline chips instead of a fixed two-column inner grid, eliminating unused box space.
- Large KPI blocks were removed from the print body because the report header already identifies scope and reporting period.
- Report margins, header spacing, table padding, typography, and footer spacing were tightened specifically for Attendance Totals printing.
- The ALL EMPLOYEES row remains available as a compact aggregate summary.

### Preserved Behavior
- Zero-total categories remain suppressed for each employee.
- Employees with no selected attendance activity remain on the report.
- User-selectable attendance and summary boxes remain available.
- Week, month, and rolling 90-day ranges remain available.
- No attendance records, code definitions, discipline thresholds, notice logic, schedule authority, or shared-data contracts are changed.



## v3.3.0.4 Schedule Color Adjacency Fix

This focused hotfix improves Schedule visual separation without changing schedule assignments, live/mock authority, HPW calculations, labor reporting, or the v3.3.0 modular architecture.

### Schedule-Wide Color Assignment
- Employee color allocation now evaluates the full active schedule rather than restarting the palette inside each schedule section.
- The same employee retains the same color throughout the schedule.
- Different employees that share a horizontal or vertical cell border are assigned different colors whenever an alternative is available.
- Cross-section boundaries are included, preventing a color collision where one shift/section ends and another begins.
- The employee color palette was expanded to reduce reuse on larger staffing layouts.

### Preserved Behavior
- Live schedule remains the authority for HPW and labor reporting.
- Mock schedules remain isolated until explicitly applied to live.
- Copy/paste and name/EID typeahead assignment remain unchanged.
- No roster, attendance, Shift Intelligence, seed data, or specialist-program records are modified.


## v3.3.0.3 Attendance Print Zero Suppression

This focused hotfix improves the portrait Attendance Totals printout without changing attendance records, code definitions, thresholds, or the modular architecture.

### Zero-Total Suppression
- A selected attendance category is printed for an employee only when that employee has a total greater than 0 in the selected reporting period.
- Example: if T, CO, NCNS, V, and AL are selected but the employee only has two CO entries, only `CO 2` and its MM/DD dates are shown.
- Selected Discipline Total, Approved Total, and Recorded Total boxes are also suppressed when their calculated value is 0.
- Employees remain on the report even when all selected attendance categories are zero; their Selected Attendance area is simply blank.
- The ALL EMPLOYEES summary follows the same rule and omits aggregate categories that total 0.

### Preserved Behavior
- Portrait orientation remains unchanged.
- User-selectable attendance boxes remain unchanged.
- Displayed attendance categories retain their MM/DD occurrence dates.
- No attendance records or discipline/pattern thresholds are modified.

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
- `ARCHITECTURE.md` defines module ownership, dependency order, and rules for future changes.
- Existing workflows are intentionally unchanged. The release is a structural refactor, not a UI or policy redesign.
- v3.4.0 Data Layer / Reliability Upgrade is now the next major roadmap phase.


## Repository Documentation
- `README.md` - current application overview and release context.
- `ROADMAP-v4.0.md` - controlled roadmap and completed phase history.
- `ARCHITECTURE.md` - current module ownership, dependency, and maintenance standard.
- `DESIGN-SYSTEM.md` - current UI/UX design standard.
- `CHANGELOG.md` - consolidated release history.
- `BUILD-VALIDATION.md` - current release validation record.
- `docs/archive/HISTORICAL-RELEASE-NOTES.md` - consolidated historical build and release notes retained for traceability.

Version-specific Markdown files should not be added to the repository root going forward. Release history belongs in `CHANGELOG.md`; current validation belongs in `BUILD-VALIDATION.md`.

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
- ~~v3.4.0 - Data Layer / Reliability Upgrade~~ Completed
- ~~v3.4.1.0 - Stale Write / Conflict Detection~~ Completed
- ~~v3.4.1.1 - Task Tracker Print Customization~~ Completed
- **Legacy production stabilization / operational enhancements** Current
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