# PWADC Security Operations Suite - Changelog

## v3.5.0.4 - Historical Tardy Point Correction
- Corrected historical and migrated T<5 records to use the current 0-point tardy policy.
- Removed the v3.5.0.3 legacy 0.5-point override for generic tardies previously migrated to T<5.
- Existing saved T<5 attendance records recalculate automatically at 0 points without deleting or rewriting attendance history.
- T<5 continues to reset the 12-clean-working-day positive attendance streak because it remains an attendance issue despite carrying 0 negative points.
- T5-14 remains 0.5 points and T15+ remains 1 point.
- Retained rolling 90-day calculations, 14-day call-off classification, manual current-point adjustments, positive credit maximum of 3, corrective thresholds, visual status controls, atomic saves, and stale-write protection.


## v3.5.0.3 - Attendance Point Controls
- Reversed the 90-Day Grid date direction so the ending/current date is on the left and older dates continue to the right.
- Added reason-required editing of historical 90-Day Grid records with preserved correction history and Attendance audit entries.
- Updated tardy points to T<5 = 0, T5-14 = 0.5, and T15+ = 1.
- Preserved migrated legacy generic tardies at the previously approved 0.5-point value unless intentionally reclassified.
- Added controlled manual current-point adjustments with required reason, pre-save backup, effective date, audit record, and exclusion of pre-adjustment attendance incidents from future active-point calculations.
- Increased the maximum positive attendance credit bank from 2 to 3.
- Retained 90-day point aging, 12 clean working-day earning, 14-day call-off classification, 3/6/9 corrective thresholds, shift grouping, visual status colors, atomic saves, and stale-write protection.


## v3.5.0.2 - Attendance Grid Visual Status
- Broke the 90-Day Grid into shift sections while retaining All Employees, Single Employee, and shift-filter controls.
- Added 90-Day Grid status colors: Present green, approved blue, Off unhighlighted, Not Employed blacked out.
- Added yellow highlighting for 0.5-1.5 point attendance actions and red highlighting for 2+ point attendance actions.
- Added a green +1 marker on the workday that earns a positive attendance credit.
- Added employee-name risk highlighting across the Attendance workflow: green below 3 active points, yellow from 3 through 6.99, red at 7 or more.
- No changes to point calculations, migration, corrective thresholds, or shared-data write controls.

## v3.5.0.1 - Attendance Daily/Grid Usability
- Restored grouped Daily Entry sections with the requested order: 3rd Shift, 1st Shift, 2nd Shift, Gate, Reception.
- Added All Employees and Single Employee options to the 90-Day Grid.
- Added an All Employees shift filter while preserving full active-employee visibility when All is selected.
- Retained individual point-summary cards in Single Employee grid mode.
- Attendance point policy, positive-credit calculations, migration behavior, and data-reliability controls are unchanged.

## v3.5.0.0 - Attendance Point System
- Added rolling 90-day attendance points and 3/6/9 corrective-action thresholds.
- Added automatic rolling 14-day CO1/CO2 classification.
- Added positive attendance credits: +1 every 12 clean working days, maximum 2, consumed against negative points.
- Added Daily Entry, 90-Day Grid, Point Review, Corrective Action, and Audit attendance workflow.
- Added backup-first legacy Attendance migration and preserved NE as a zero-point Not Employed code.
- Legacy T migrates to T<5 (.5); legacy approved/early/absence codes migrate to their new equivalents.
- Legacy U records are preserved for manual review instead of being assigned an unsupported point value.



## v3.4.1.1 - Task Tracker Print Customization
- Added Print Tasks to the Task Tracker.
- Added Current filtered view and All task records print scopes.
- Added selectable print columns for Project, Status, Priority, Category, Assigned To, Due, Follow-up, Blocked By, Next Action, and Last Update.
- Current filtered printing preserves the existing Task Tracker filters and sort behavior.
- Added Basic, All Columns, and Clear print-column selectors.
- Excluded the on-screen Actions column from printed output.
- Printing remains read-only and does not alter Task Tracker data or revision-aware persistence.
- No Attendance, Roster, Schedule, Shift Operations, HPW, labor, or shared-data architecture changes.

## v3.4.1.0 - Stale Write + Conflict Detection
- Added SHA-256 revision fingerprints to operational module load envelopes.
- Added expected-revision checks to Attendance, Roster/Schedule, Tasks, Shift Reports, and Shift Intelligence saves.
- Blocks blind overwrites when the shared live file changed after this workstation loaded it.
- Preserves unsaved in-memory work and offers export, reload latest, or keep-open conflict actions.
- Added `Data Integrity\Conflict Audit` records with expected/current revision evidence.
- Restore and packaged-recovery responses now refresh the workstation revision baseline.
- Automatic merging remains intentionally excluded; save coordination/locking is planned next.



### v3.4.0.0 - Atomic Save + Integrity Foundation
- Added `MainForm.DataReliability.cs` as the centralized shared-JSON transaction layer.
- Routed live module saves, Suite Settings saves, Backup & Restore writes, and packaged-recovery writes through validated atomic persistence.
- Added durable temporary writes, forced flush, temporary/final JSON parsing, and SHA-256 verification.
- Added automatic pre-write safety backups for existing live data.
- Added malformed-live-file protection that blocks normal saves rather than silently overwriting damaged JSON.
- Added per-write user/workstation/module audit records under `Data Integrity\Write Audit`.
- Added Data Health integrity status for shared JSON files.
- Added permanent CI/static validation for the v3.4.0 persistence contract.
- No WebView bridge names, source data, schedule authority, attendance policy, or reporting calculations changed.

This file is the controlled release history for the PWADC Security Operations Suite. Detailed historical build notes that previously existed as separate root-level Markdown files are consolidated in `docs/archive/HISTORICAL-RELEASE-NOTES.md`.

## Prior Release History

### v3.3.1.0 - Suite-wide Responsive UI Stabilization
- Replaced full application re-rendering on normal window resize with CSS-driven responsive sizing.
- Normalized checkbox/radio, button, input, select, textarea, toolbar, modal, and action-group behavior.
- Added progressive responsive behavior across headers, forms, workspaces, dense tables, Schedule, Reports, Data Health, Restore, Settings, Attendance, and Shift Operations.
- Reduced the Windows minimum supported size from 1100×700 to 900×600.
- Preserved operational workflows, shared-data contracts, reporting logic, attendance rules, and schedule authority.

## v3.3.x

### v3.3.0.8 - Roster Print Employee Scope
- Added Current filtered roster, All employees, and Selected employees print scopes.
- Selected employees supports multi-select and name/EID search with rank/shift context.
- Existing roster column selection and print orientation rules are preserved.
- No roster or schedule records are changed by the print workflow.

### v3.3.0.7 - Attendance Print Employee Scope
- Added All Active Employees, By Shift, and Selected Employees print scopes.
- Selected Employees supports multi-select and name/EID search.
- Custom-group totals are calculated only from selected employees.
- Existing portrait, zero-suppression, and discipline-date rules are preserved.

### v3.3.0.6 - Attendance Print Date Detail Correction
- Only discipline codes T, U, UE, CO, and NCNS retain MM/DD occurrence dates.
- P and all other non-discipline attendance codes print totals only.
- Zero suppression and compact portrait layout remain unchanged.

### v3.3.0.5 - Attendance Print Density Optimization
- Approved attendance categories AL, V, E, and LE print totals only.
- Discipline attendance retains MM/DD occurrence dates.
- Attendance totals printing uses a denser portrait layout with reduced unused space.
- Zero-value attendance categories remain suppressed.

### v3.3.0.4 - Schedule Color Adjacency Fix
- Added schedule-wide adjacency-aware employee colors.
- Prevents different employees sharing horizontal or vertical borders from receiving the same color when an alternative is available.

### v3.3.0.3 - Attendance Print Zero Suppression
- Suppresses selected attendance categories and summary totals when an employee total is zero.

### v3.3.0.2 - Attendance Print Customization
- Converted Attendance Totals to portrait.
- Added user-selectable attendance categories and summary boxes.
- Added MM/DD occurrence dates for selected attendance codes.

### v3.3.0.1 - Schedule Assignment Picker
- Mock schedules allow any active roster employee in any slot.
- Added schedule-cell typeahead search by employee name or employee number.

### v3.3.0 - Code Organization / Modularization
- Split the front end into ordered functional modules with startup validation.
- Split the Windows host into partial-class responsibilities while preserving bridge contracts.
- Added permanent modular front-end validation to GitHub Actions.

## v3.2.x

### v3.2.6.3 - Attendance Totals Print Enhancement
- Added management-ready attendance totals printing from Attendance Review.

### v3.2.6.2 - Schedule Workspace Enhancements
- Added schedule cell copy/paste, controlled full schedule clearing, and persistent mock schedules.

### v3.2.6.1 - Attendance Review Discipline Code Fix
- Added CO and NCNS visibility to Attendance Review using canonical discipline-code definitions.

### v3.2.6 - Reports / Data / Admin Redesign
- Reorganized Report Center, Data Health, Backup/Restore, Change Log, and Settings into a governance workflow.

### v3.2.5.5 - Shift Operations Experience Redesign
- Reworked Shift Reports as intake and Shift Intelligence as the decision/watchlist workspace.

### v3.2.5.4 - Shift Operations Flow Redesign
- Established the Import → Extract → Decide → Follow Up → Close operating model.

### v3.2.5.3 - Shift Report Interface Cleanup / Fresh Start Control
- Simplified Shift Operations UI and added controlled Shift Report memory clearing.

### v3.2.5.2 - Shift Report Intelligence Rebuild
- Rebuilt operational signal classification around meaningful events instead of raw extracted text.

### v3.2.5.1 - Manifest XML Startup Fix
- Corrected the Windows application manifest XML declaration and version formatting controls.

### v3.2.5 - Operations Workflow Redesign
- Reorganized operational workflows and navigation.

### v3.2.4 - People Workflow Redesign
- Reorganized Attendance, Roster, Employee Profile, Training, and accountability workflows.

### v3.2.3.2 - GitHub Version Format Fix
- Corrected .NET/GitHub version-format handling.

### v3.2.3.1 - UI Render / Undefined Helper Fix
- Corrected missing UI helper functions and render failures.

### v3.2.3 - Home / Command Center Redesign
- Rebuilt the home screen around operational status and action needs.

### v3.2.2.2 - Navigation Dropdown Hover Fix
- Corrected navigation dropdown interaction behavior.

### v3.2.2.1 - High-Intelligence Design System Rerun
- Refined shared UI primitives, hierarchy, and print/export style isolation.

### v3.2.2 - Professional Design System Pass
- Established shared page headers, controls, cards, KPIs, tables, and design standards.

### v3.2.1 - UI/UX Audit and Reliability Foundation
- Established the professional UX roadmap, live-data clarity, backup/restore controls, and reporting expansion.

## Documentation Policy
- Root documentation is limited to current standing references.
- `CHANGELOG.md` carries release history.
- `BUILD-VALIDATION.md` carries the current release validation record.
- `ARCHITECTURE.md` carries the current architecture standard.
- `DESIGN-SYSTEM.md` carries the current UI/UX standard.
- Detailed historical notes are retained in one consolidated archive file rather than as individual root documents.
