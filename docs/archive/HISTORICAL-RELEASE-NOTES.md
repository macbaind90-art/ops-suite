# PWADC Security Operations Suite - Historical Release Notes

> Consolidated from the version-specific Markdown files that previously lived in the repository root. The source filename is retained above each archived section for traceability.


---

## Archived Source: `ARCHITECTURE-v3.3.0.md`

# PWADC Security Operations Suite Architecture - v3.3.0

## Purpose
v3.3.0 establishes a maintainable module boundary without changing PWADC operational workflows, shared JSON contracts, or the C# / WebView2 platform.

The design objective is controlled separation, not a framework rewrite.

## Front-End Load Order
`app/index.html` is now a lightweight shell. It loads the design system and JavaScript in this controlled order:

1. `app/js/00-module-registry.js`
2. `app/js/10-bootstrap.js` - constants, global state, role controls, SuiteBridge, initialization and shared UI utilities
3. `app/js/20-data-core.js` - shared module normalization, save/load helpers, attendance/roster synchronization and employee profile data helpers
4. `app/js/30-shell-audits.js` - navigation shell, module dispatcher, specialist audit wrappers, Data Health backup/file controls
5. `app/js/40-reports-governance.js` - reporting, office supplies, Data Health findings, restore, change log and governance helpers
6. `app/js/50-workflows-home.js` - People/Operations workflow navigation, Start Here and Command Center
7. `app/js/60-roster-schedule.js` - roster maintenance, schedule workspace, mock schedules and schedule print/share
8. `app/js/70-training-uniforms.js` - training, uniform accountability, labor/coverage analytics and roster import/export helpers
9. `app/js/80-attendance.js` - all Attendance views, patterns, notices, totals printing and attendance import/export
10. `app/js/90-shift-operations.js` - Shift Reports and Shift Intelligence
11. `app/js/95-tasks-settings.js` - Task Tracker, Settings and viewport behavior
12. `app/js/99-startup.js` - validates module registration and then calls `init()`

## Front-End Module Contract
Every functional module registers exactly once with `PWADCModuleRegistry` after its source has loaded.

The startup gate expects these 10 functional registrations:

- `bootstrap`
- `data-core`
- `shell-audits`
- `reports-governance`
- `workflows-home`
- `roster-schedule`
- `training-uniforms`
- `attendance`
- `shift-operations`
- `tasks-settings`

If a required module is missing, startup is stopped and the existing startup error mechanism is used. This prevents a partially loaded suite from being mistaken for a healthy application.

## Shared JavaScript Rules
- Maintain the current classic-script load model until a future architecture phase explicitly approves a module-system migration.
- Shared constants/state belong in `10-bootstrap.js`.
- Shared persistence, normalization and cross-record matching belong in `20-data-core.js`.
- Feature-specific logic belongs in the owning functional file.
- Do not create a second copy of a canonical definition such as `DISCIPLINE_CODES`, `TRACKING_CODES`, loaded-cost assumptions, or schedule authority rules.
- Cross-feature calls are allowed when they reflect an intentional workflow handoff, but new shared helpers should move to the shared layer instead of being duplicated.
- `index.html` should remain a document shell. New application logic should not be added inline.
- Global render/action functions referenced by inline HTML handlers must remain reachable under the existing classic-script model unless the UI event architecture is intentionally redesigned later.

## Design System
The primary design system is now externalized to:

`app/assets/styles.css`

Feature-specific print styles embedded inside JavaScript-generated report windows remain feature-owned because they are runtime document payloads, not application-shell CSS.

## Windows Host Structure
`MainForm` remains one partial class with responsibilities separated by source file:

- `MainForm.cs` - WinForms/WebView lifecycle and primary fields
- `MainForm.Bridge.cs` - `suite:*` message routing and WebView response handling
- `MainForm.Storage.cs` - settings, folder creation, module load/save, storage health and seed recovery
- `MainForm.Backups.cs` - backup creation, retention, cleanup, inventory and restore
- `MainForm.Programs.cs` - approved path handling, packaged programs, suite lock files, environment information and module file status
- `Models.cs` - backup models, Suite Settings, coverage requirements and suite users

## Desktop Bridge Contract
v3.3.0 does not rename or remove existing WebView message contracts. Current contracts remain the compatibility boundary between the JavaScript application and the Windows host.

Any future bridge change must:
1. Preserve backward compatibility where practical.
2. Be documented in the release notes.
3. Be included in bridge contract validation.
4. Avoid silent changes to JSON payload meaning.

## Data Authority Rules Retained
- Shared data root remains `\\pig-fs\Security\MacBain\Security Operations Suite`.
- Shared JSON files remain the active persistence layer.
- The live schedule remains the authority for HPW and labor reporting.
- Mock schedules remain excluded from live reporting until explicitly applied.
- Attendance code meanings and discipline definitions are unchanged.
- Existing backup-first high-impact actions remain in force.

## Validation Requirements for Future Builds
At minimum, future changes should continue to run:
- JavaScript syntax checks for every `app/js/*.js` file.
- Front-end module registration/load-order validation.
- Existing required render-function guard validation.
- Inline action-handler target validation.
- Duplicate named-function validation.
- Major module render smoke tests.
- XML project/manifest parsing.
- Exact manifest XML declaration validation.
- Five-part .NET version sweep.
- GitHub workflow presence/publish validation.
- Clean repository and ZIP integrity checks.

## Next Architecture Risk
After code concentration, the primary platform risk is shared-file concurrency and data reliability. v3.4.0 should address stale writes, conflict detection, atomic persistence, schema/version awareness, validation, and recovery before a database migration is considered.


---

## Archived Source: `ATTENDANCE-PRINT-CUSTOMIZATION-v3.3.0.2.md`

# v3.3.0.2 - Attendance Print Customization

## Purpose
Improve the Attendance Review management printout while preserving attendance records, attendance-code definitions, discipline thresholds, notice logic, and the v3.3.0 modular application architecture.

## Changes
- Attendance Totals now previews and prints in portrait orientation.
- Print setup allows the user to choose exactly which attendance-code boxes appear.
- Quick selections are available for Discipline + Approved, Discipline Only, Approved Only, Select All, and Clear.
- Individual codes can be independently checked or unchecked.
- Discipline Total, Approved Total, and Recorded Total are independently selectable summary boxes.
- Employee and Shift remain fixed report fields.
- Selected attendance items render inside a portrait-friendly Selected Attendance area instead of creating a wide landscape column for every code.
- Each selected attendance code shows its count and the related occurrence dates in MM/DD format beside the count.
- Example: `CO 2 | 08/04, 08/11`.
- The existing All Active Employees / shift scope and Week / Month / Rolling 90-Day controls are preserved.
- The ALL EMPLOYEES row continues to provide aggregate counts.

## Data / Policy Boundaries
- Printing does not write to Attendance data.
- Attendance code meanings are unchanged.
- Discipline and pattern thresholds are unchanged.
- Attendance Notice Workflow behavior is unchanged.
- Roster, Schedule, Shift Operations, labor, and governance logic are unchanged.
- Shared JSON schemas are unchanged.

## Validation Focus
- Portrait orientation is passed to the report renderer.
- Selected code boxes render independently.
- CO/T seeded test confirms count accuracy.
- Occurrence date conversion is verified as MM/DD.
- Permanent front-end validation now asserts portrait attendance print output and occurrence-date rendering.


---

## Archived Source: `ATTENDANCE-PRINT-DENSITY-v3.3.0.5.md`

# v3.3.0.5 - Attendance Print Density Optimization

## Objective
Reduce Attendance Review print page count and unused white space while keeping the management value of attendance totals and discipline occurrence dates.

## Approved Attendance Display
- Approved attendance codes are defined by the existing `TRACKING_CODES` set: AL, V, E, and LE.
- When one of these approved codes is selected for the Attendance Totals printout, the employee's total is displayed without occurrence dates.
- The underlying attendance records and dates are not changed or removed; only the print presentation is condensed.
- Discipline codes T, U, UE, CO, and NCNS continue to display MM/DD occurrence dates when selected.
- Other non-approved codes retain MM/DD occurrence dates when selected.

## Compact Portrait Format
- The printed table is reduced from Employee / Shift / Selected Attendance to two columns: Employee / Shift and Attendance.
- Employee name and shift share one compact cell.
- Attendance categories use flex-wrapped inline chips sized to their actual content instead of a fixed two-column internal grid.
- Approved total-only chips consume less width than dated discipline chips.
- Attendance-specific print margins, typography, table padding, header spacing, and footer spacing are reduced.
- Large report KPI blocks are removed from this printout because the report subtitle already provides reporting scope and period.
- The ALL EMPLOYEES aggregate row remains, using totals only to avoid non-actionable date clutter.

## Preserved Controls
- Portrait orientation remains the standard.
- User-selected attendance boxes and quick-select controls remain available.
- Discipline Total, Approved Total, and Recorded Total remain optional.
- Zero-total categories remain suppressed.
- Employees remain listed even when all selected totals are zero.
- Week, month, and rolling 90-day reporting periods remain available.

## Scope Control
No Attendance source data, discipline thresholds, notice workflow, schedule logic, HPW rules, Shift Operations logic, shared JSON contracts, or specialist programs are changed by this release.


---

## Archived Source: `ATTENDANCE-PRINT-ZERO-SUPPRESSION-v3.3.0.3.md`

# v3.3.0.3 - Attendance Print Zero Suppression

## Purpose
Reduce clutter in the portrait Attendance Totals management report while preserving the user-selected reporting scope and attendance categories.

## Behavior
- A selected attendance-code box renders for an employee only when the code total is greater than zero for the selected period.
- MM/DD occurrence dates remain beside every displayed attendance code.
- Selected Discipline Total, Approved Total, and Recorded Total summary boxes render only when their value is greater than zero.
- Employees are not removed from the report solely because their selected totals are zero; the Selected Attendance cell remains blank.
- The ALL EMPLOYEES aggregate row applies the same zero-suppression rule.

## Scope Control
No Attendance source records, attendance code definitions, discipline thresholds, notice logic, pattern logic, Schedule authority, Shift Operations, or shared JSON contracts are changed.


---

## Archived Source: `ATTENDANCE-REVIEW-CO-FIX-v3.2.6.1.md`

# v3.2.6.1 - Attendance Review Discipline Code Fix

## Purpose
Correct a display-layer inconsistency in Attendance Review. The suite already defined CO (Call-Out) and NCNS (No Call No Show) as discipline-review codes and used them in Daily Entry, Patterns, notices, and attendance reporting, but the Attendance Review table and employee detail panel were hard-coded to show only T, U, and UE.

## Changes
- Attendance Review discipline columns now use the existing `DISCIPLINE_CODES` set.
- Week, Month, and 90-Day review now display T, U, UE, CO, and NCNS.
- Employee expandable discipline history now displays dates for all five discipline codes.
- Approved tracking continues to use AL, V, E, and LE.
- Table group column spans are calculated from the active discipline/tracking arrays so future code-list changes cannot silently break the header layout.

## Scope Control
- No attendance records are migrated or rewritten.
- No thresholds are changed.
- No attendance code meanings are changed.
- No Shift Operations, Reports/Data/Admin, roster, schedule, training, uniform, task, or backup logic is changed.
- v3.3.0 remains the next roadmap phase.


---

## Archived Source: `ATTENDANCE-TOTALS-PRINT-v3.2.6.3.md`

# v3.2.6.3 - Attendance Totals Print Enhancement

## Objective
Add a concise management printout showing each active employee's attendance totals without changing the underlying attendance record or discipline logic.

## Workflow
Attendance → Attendance Review → Print Attendance Totals.

The print setup allows:
- All active employees or a selected shift.
- Current Week, Current Month, or Rolling 90 Days.
- An ending date tied to the Attendance Review window.
- Discipline Only, Discipline + Approved, or All Attendance Codes.

## Canonical Totals
- Discipline Total: T + U + UE + CO + NCNS.
- Approved Total: AL + V + E + LE.
- All-code mode additionally displays P, O, FL, and NE and a Recorded Total.

## Output
- Landscape print preview.
- One row per active employee.
- Final ALL EMPLOYEES aggregate row.
- Code definitions printed beneath the table.
- Print / Save PDF through the existing report preview workflow.

## Data Governance
This feature is read-only. It does not save, rewrite, clear, or reclassify Attendance data and does not change thresholds, notices, patterns, Schedule, Shift Operations, or labor reporting.


---

## Archived Source: `BACKUP-RESTORE-AUDIT-v3.1.38.md`

# Backup / Restore Audit - v3.2.1

## Reviewed flows
- Backup Now: Attendance, Roster, Task Tracker, Shift Reports, Shift Intelligence.
- Backup Everything: all JSON modules plus Standalone Programs folder backup.
- Restore Center: list backups, preview backup, restore backup with reason and confirmation.
- Packaged recovery data: Attendance, Roster, Task Tracker, and seed-based module reset.
- Data Health: module file status and newest backup visibility.
- Export and open-path guards.

## Fixes made
- Backup preview and restore now require the backup path to live inside the selected module's backup folder, not just somewhere under the general Backups folder.
- Program folder backups are no longer displayed as JSON restore candidates.
- Restore writes through a temporary restore file before replacing the live module JSON.
- Seed recovery restore now validates the selected JSON module, validates the seed JSON, backs up existing live data to the correct module backup folder, checks folder boundaries, and writes only under Data.
- Backup listings now only return .json files for JSON modules.
- Packaged recovery wording was standardized so it does not look like live/current data.

## Remaining limitation
Local .NET publish/build could not be run in the sandbox because dotnet is unavailable. GitHub Actions remains included for Windows EXE build verification.


---

## Archived Source: `BACKUP-RETENTION-v3.1.38.md`

# PWADC Security Operations Suite v3.2.1

## Backup Retention / Backup Manager

This release adds a tiered backup strategy so the suite does not keep creating unlimited backup files without a controlled cleanup process.

## Policy

- Keep all backups from the last 7 days.
- Keep one daily backup for the last 30 days.
- Keep one weekly backup for the last 12 weeks.
- Keep one monthly backup for the last 12 months.
- Protect manual backups.
- Protect archive backups.
- Protect legacy backups.
- Protect pre-restore backups for at least 90 days.
- Never delete silently. Cleanup requires preview plus confirmation.

## Added

- Backup Manager panel in Data Health.
- Backup inventory by module.
- Backup type classification: Manual, Auto, Pre-Restore, Archive, Legacy.
- Cleanup preview with file list, reason, size, and module.
- Confirmed cleanup that writes a cleanup log.
- Safer backup naming for new backups.

## Also fixed

- Removed duplicate open-path launch call so a folder is not opened twice.


---

## Archived Source: `BUILD-FIX-v3.2.3.2.md`

# v3.2.3.2 GitHub Version Format Fix

## Issue
GitHub Actions failed because generated assembly metadata contained the previous five-part version string, which has five numeric version parts. .NET assembly/file/manifest versions require `major[.minor[.build[.revision]]]`, so the maximum valid numeric version shape is four parts.

## Fix
- Updated display/product version to `v3.2.3.2`.
- Updated `<Version>`, `<FileVersion>`, and `<AssemblyVersion>` to `3.2.3.2`.
- Updated `app.manifest` assemblyIdentity version to `3.2.3.2`.
- Updated GitHub Actions artifact name to `PWADC-Security-Operations-Suite-v3-2-3-2-Windows`.
- Swept for invalid five-part version strings before packaging.

## Next planned roadmap step
`v3.2.4 - People Workflow Redesign` remains the next feature/design milestone.


---

## Archived Source: `BUILD-FIX-v3.2.5.1.md`

# v3.2.5.1 - Manifest XML Startup Fix

## Issue
Windows displayed a side-by-side configuration error before the application opened.

## Root cause
The application manifest XML declaration had been versioned as the application version. XML declarations must remain `version="1.0"`. The application version belongs in the manifest `assemblyIdentity` and project version fields.

## Fix
- Restored manifest XML declaration to `<?xml version="1.0" encoding="utf-8"?>`.
- Set manifest `assemblyIdentity` version to `3.2.5.1`.
- Set project `Version`, `FileVersion`, and `AssemblyVersion` to `3.2.5.1`.
- Updated GitHub artifact naming to `v3-2-5-1`.
- Added a manifest declaration check so future builds catch this before packaging.

## Result
The EXE should no longer fail at Windows startup with a side-by-side configuration error caused by the application manifest.


---

## Archived Source: `BUILD-VALIDATION-v3.2.5.5.md`

# Build Validation - v3.2.5.5

## Validation Result
All required repository, JavaScript, render, XML, manifest, and version checks passed.

## Checks Performed
- JavaScript syntax check: Passed with Node.js `--check`.
- Required render-function check: Passed. 794 declared functions scanned; no required function missing.
- Inline UI handler helper sweep: Passed. 192 invoked helper names checked; no undefined handler helper found.
- Shift Reports render smoke test: Passed.
- Shift Intelligence render smoke test: Passed.
- Major module render smoke test: Passed for Home, Start Here, Attendance, Roster, Employee Profile, Training, Office Supplies, Shift Reports, Shift Intelligence, Reports, Task Tracker, Data Health, Restore Center, Change Log, Other Programs, and Settings.
- Sample parser calibration: Passed.
  - One grouped repeated Jockey Pump Run Alarm pattern.
  - Pump House Smoke Alarm classified as reference context.
  - Pump House Tamper Alarm classified as suggested-link/reference context.
  - Back log trucks classified as logistics reference.
  - No false incident generated from No Incidents.
- Project XML parse: Passed.
- Manifest XML parse: Passed.
- Manifest XML declaration check: Passed.
  - `<?xml version="1.0" encoding="utf-8"?>`
- Five-part version sweep: Passed.
  - Project Version: 3.2.5.5
  - File Version: 3.2.5.5
  - Assembly Version: 3.2.5.5
  - Manifest assemblyIdentity: 3.2.5.5
  - Runtime environment version: 3.2.5.5
- Four-part maximum .NET version validation: Passed.
- GitHub Actions workflow presence and artifact version: Passed.
- Clean repository check: Passed. No `.git` folder included.

## Build Environment Limitation
A local .NET publish was not run because the sandbox does not have the .NET SDK installed. The included GitHub Actions workflow remains the Windows EXE build authority.


---

## Archived Source: `BUILD-VALIDATION-v3.2.6.1.md`

# Build Validation - v3.2.6.1

Validation date: August 11, 2026

## Release
- Display/release version: v3.2.6.1
- Internal .NET version: 3.2.6.1
- Release focus: Attendance Review Discipline Code Fix

## Attendance Review Targeted Validation
- Canonical discipline set used by Attendance Review: Passed (`T`, `U`, `UE`, `CO`, `NCNS`).
- Canonical approved tracking set used by Attendance Review: Passed (`AL`, `V`, `E`, `LE`).
- Injected CO renders in Week, Month, and 90-Day discipline columns: Passed.
- Injected NCNS renders in Week, Month, and 90-Day discipline columns: Passed.
- CO appears in employee expandable Discipline Review history: Passed.
- NCNS appears in employee expandable Discipline Review history: Passed.
- Attendance Review table group column spans match the live code arrays: Passed.
- No attendance data migration or threshold change introduced: Passed.

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed.
- Inline action-handler function sweep: Passed.
- Duplicate named function declaration sweep: Passed.
- Major module render smoke test: Passed for all 16 modules:
  - Home
  - Start Here
  - Attendance
  - Roster
  - Employee Profile
  - Training
  - Office Supplies
  - Shift Reports
  - Shift Intelligence
  - Reports
  - Settings
  - Task Tracker
  - Data Health
  - Backup & Restore
  - Change Log
  - Other Programs
- Attendance subview render smoke test: Passed for:
  - Daily Entry
  - 90-Day Grid
  - Attendance Review
  - Attendance Patterns
  - Notice Workflow
  - Audit Log
- Headless browser page-error check during render validation: Passed with zero page errors.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.1` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- README updated for v3.2.6.1: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6.1 complete: Passed.
- `ROADMAP-v4.0.md` retains v3.3.0 as next phase: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.


---

## Archived Source: `BUILD-VALIDATION-v3.2.6.2.md`

# Build Validation - v3.2.6.2

Validation date: August 18, 2026

## Release
- Display/release version: v3.2.6.2
- Internal .NET version: 3.2.6.2
- Release focus: Schedule Workspace Enhancements

## Schedule Workspace Targeted Validation
- Cell-level copy of a named employee assignment: Passed.
- Paste copied assignment into a different live schedule cell: Passed.
- Schedule clipboard persists while moving between cells: Passed.
- Copy/paste audit record includes source and destination context: Passed.
- Create mock schedule from the current live schedule: Passed.
- Create/hold persistent mock data in `roster.scheduleDrafts`: Passed.
- Editing a mock does not modify `roster.schedule`: Passed.
- Default `scheduleMetrics()` continues to use only the live schedule while a mock is open: Passed.
- Mock schedule export identifies the output as `MOCK / NOT PUBLISHED`: Passed.
- Return to live schedule leaves the mock saved in the library: Passed.
- Clear mock sets all daily cells to Closed while preserving rows/posts/hours: Passed.
- Clearing a mock does not change the live schedule: Passed.
- Apply Mock to Live replaces only `roster.schedule` and retains the source mock: Passed.
- Apply Mock to Live calls roster backup before live save: Passed.
- Clear Live Schedule calls roster backup before live save: Passed.
- Clear Live Schedule preserves rows, posts, coverage windows/cost hours, notes, and schedule structure: Passed.
- Clear Live Schedule sets all seven daily cells in every row to Closed (`None`): Passed.
- Apply/Clear audit entries recorded: Passed.

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed; 85 required functions present.
- Inline action-handler function sweep: Passed.
- Duplicate named function declaration sweep: Passed; 839 named functions / 839 unique.
- Major module render smoke test: Passed for all 16 modules:
  - Home
  - Start Here
  - Attendance
  - Roster
  - Employee Profile
  - Training
  - Office Supplies
  - Shift Reports
  - Shift Intelligence
  - Reports
  - Settings
  - Task Tracker
  - Data Health
  - Backup & Restore
  - Change Log
  - Other Programs
- Schedule live-workspace render: Passed.
- Schedule mock-workspace render: Passed.
- Mock Schedule Library render: Passed.
- Headless Chromium page-error check during behavioral/render validation: Passed with zero page errors.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.2` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- README updated for v3.2.6.2: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6.2 complete: Passed.
- `ROADMAP-v4.0.md` retains v3.3.0 as next major phase: Passed.
- `.git` folder excluded: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Scope / Regression Control
The repository delta from v3.2.6.1 is limited to:
- `app/index.html`
- `MainForm.cs`
- `SecurityOperationsSuite.csproj`
- `app.manifest`
- `README.md`
- `ROADMAP-v4.0.md`
- New v3.2.6.2 release and validation documentation

No Shift Reports / Shift Intelligence logic, Attendance discipline logic, shared data path, coverage authority definitions, or loaded-cost assumptions were intentionally changed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.


---

## Archived Source: `BUILD-VALIDATION-v3.2.6.3.md`

# Build Validation - v3.2.6.3

Validation date: August 19, 2026

## Release
- Display/release version: v3.2.6.3
- Internal .NET version: 3.2.6.3
- Release focus: Attendance Totals Print Enhancement

## Attendance Totals Targeted Validation
- Attendance Review includes **Print Attendance Totals**: Passed.
- Print setup includes employee scope, reporting period, ending date, and detail level: Passed.
- All active employees scope: Passed.
- Selected-shift scope: Passed.
- Current Week range calculation using the selected ending date: Passed.
- Current Month range calculation using the selected ending date: Passed.
- Rolling 90-Day range calculation: Passed.
- Discipline Only output: Passed.
- Discipline + Approved output: Passed.
- All Attendance Codes output: Passed.
- CO (Call-Out) printed as a discipline column: Passed.
- NCNS (No Call No Show) printed as a discipline column: Passed.
- Discipline Total uses canonical `DISCIPLINE_CODES` (`T`, `U`, `UE`, `CO`, `NCNS`): Passed.
- Approved Total uses canonical `TRACKING_CODES` (`AL`, `V`, `E`, `LE`): Passed.
- All-code mode includes P/O/FL/NE and Recorded Total: Passed.
- Final ALL EMPLOYEES aggregate row: Passed.
- Landscape report output: Passed.
- Discipline-only explanatory text does not describe hidden approved columns: Passed.
- Printing remains read-only and does not save/modify attendance data: Passed by code-path review.

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed; 85 required functions present.
- Inline action-handler function sweep: Passed; 201 named inline handler targets resolved.
- Duplicate named function declaration sweep: Passed; 843 named functions / 843 unique.
- Seeded Node VM major-module render smoke test: Passed for all 16 modules:
  - Home
  - Start Here
  - Attendance
  - Roster
  - Employee Profile
  - Training
  - Office Supplies
  - Shift Reports
  - Shift Intelligence
  - Reports
  - Settings
  - Task Tracker
  - Data Health
  - Backup & Restore
  - Change Log
  - Other Programs
- Attendance Review render with the new print control: Passed.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.3` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- README updated for v3.2.6.3: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6.3 complete: Passed.
- `ROADMAP-v4.0.md` retains v3.3.0 as the next major phase: Passed.
- `.git` folder excluded: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Scope / Regression Control
The functional change is limited to Attendance Review printing and release/version documentation. No Attendance code meanings, thresholds, stored records, Schedule authority logic, Shift Reports / Shift Intelligence logic, labor assumptions, shared-data paths, or persistence contracts were intentionally changed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.


---

## Archived Source: `BUILD-VALIDATION-v3.2.6.md`

# Build Validation - v3.2.6

Validation date: August 4, 2026

## Release
- Display/release version: v3.2.6
- Internal .NET version: 3.2.6.0
- Release focus: Reports / Data / Admin Redesign

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed.
- Inline action-handler function sweep: Passed.
- Duplicate top-level function declaration sweep: Passed.
- Full visible-module render: Passed.
- Major module render smoke test: Passed for:
  - Home
  - Start Here
  - Attendance
  - Roster
  - Employee Profile
  - Training
  - Office Supplies
  - Shift Reports
  - Shift Intelligence
  - Reports
  - Settings
  - Task Tracker
  - Data Health
  - Backup & Restore
  - Change Log
  - Other Programs
- Report Center selection smoke test: Passed for all 14 production report identifiers.
- Report routing coverage: Passed. Every report catalog identifier has a matching preview/print route and CSV route.
- Settings section smoke test: Passed for all seven sections:
  - General
  - Users & Roles
  - Labor Assumptions
  - Coverage Requirements
  - Data & Recovery
  - Standalone Programs
  - Restricted Actions
- Data Health severity-state render test: Passed for All, Critical, Warning, and Informational findings.
- Restore Center populated-backup and preview-state render test: Passed.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.0` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- `.git` directory absent: Passed.
- README updated for v3.2.6: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6 complete: Passed.
- `ROADMAP-v4.0.md` marks v3.3.0 as next: Passed.
- Emergency procedure documents excluded from the application repository: Passed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.


---

## Archived Source: `BUILD-VALIDATION-v3.3.0.1.md`

# Build Validation - v3.3.0.1

## Release
- Display/release version: v3.3.0.1
- Internal .NET version: 3.3.0.1
- Release name: Schedule Assignment Picker
- Baseline: v3.3.0 Code Organization / Modularization

## Requested Behavior Validation
- Mock schedule employee pool uses the full active roster: Passed.
- Mock schedule assignment choices no longer filter by normal shift, gate shift, section, or post: Passed.
- Archived/inactive roster employees remain excluded: Passed.
- Cell assignment search matches partial employee name: Passed.
- Cell assignment search matches employee number (EID): Passed.
- Search results display employee name, EID, rank, and shift: Passed.
- Open/Pending/Closed schedule cells autofocus the search field: Implemented and static contract verified.
- Selection preserves the existing rank/name schedule-label format rather than storing EID: Passed by code-path review.
- Existing Closed/Open/Pending controls remain available: Passed.
- Existing schedule copy/paste controls remain available: Passed.
- Live schedule employee suggestions retain the existing section/shift contextual filter: Passed by code-path review.
- Mock schedule changes remain isolated from live schedule authority and reporting: Existing v3.2.6.2 contract preserved.

## Front-End Validation
- JavaScript syntax check across all app modules and validator: Passed.
- Required render/action function guard: Passed.
- Front-end module registry: 10 / 10 expected modules loaded.
- Major module render smoke: 16 / 16 passed.
- Attendance subview render smoke: 6 / 6 passed.
- Roster/Schedule/Training/Uniforms/Analytics view smoke: 5 / 5 passed.
- Named JavaScript functions: 851.
- Duplicate named function declarations: 0.
- Inline action targets: 209.
- Missing inline action targets: 0.
- Startup gate complete-module test: Passed.
- Startup gate missing-module rejection test: Passed.
- Permanent CI validation now includes mock full-roster and name/EID schedule-search assertions: Passed.

## XML / .NET Version Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Manifest XML declaration exactly `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Project `<Version>`: 3.3.0.1.
- Project `<FileVersion>`: 3.3.0.1.
- Project `<AssemblyVersion>`: 3.3.0.1.
- Manifest `assemblyIdentity`: 3.3.0.1.
- Runtime environment / lock-file version: 3.3.0.1.
- Four-part maximum .NET version format: Passed.

## Build / Repository Controls
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub workflow runs modular front-end validation before .NET build: Passed.
- GitHub Windows artifact name aligned to v3.3.0.1: Passed.
- `.git` folder absent: Passed.
- Seed JSON files unchanged from v3.3.0 baseline: Passed.
- Packaged standalone/specialist program files unchanged from v3.3.0 baseline: Passed.
- README updated: Passed.
- `ROADMAP-v4.0.md` updated and v3.4.0 remains next major phase: Passed.
- `SCHEDULE-ASSIGNMENT-PICKER-v3.3.0.1.md` present: Passed.

## Local Publish
A local .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the Windows EXE build authority.


---

## Archived Source: `BUILD-VALIDATION-v3.3.0.2.md`

# Build Validation - v3.3.0.2

## Release
- Display/release version: v3.3.0.2
- Internal .NET version: 3.3.0.2
- Release name: Attendance Print Customization
- Baseline: v3.3.0.1 Schedule Assignment Picker

## Requested Behavior Validation
- Attendance Totals report orientation changed from landscape to portrait: Passed.
- User can select individual attendance-code boxes: Passed.
- Quick selectors for Discipline + Approved, Discipline Only, Approved Only, All, and Clear: Passed.
- Discipline Total can be independently included/excluded: Passed.
- Approved Total can be independently included/excluded: Passed.
- Recorded Total can be independently included/excluded: Passed.
- Each selected attendance code prints its count: Passed.
- Each selected attendance code prints occurrence dates beside the count in MM/DD format: Passed.
- CO integration test renders two occurrences as `08/01` and `08/11`: Passed.
- Existing employee/shift scope controls retained: Passed.
- Existing Week / Month / Rolling 90-Day controls retained: Passed.
- Print operation remains read-only: Passed by code-path review.

## Front-End Validation
- JavaScript syntax check across all app modules and validator: Passed.
- Required render/action function guard: Passed.
- Front-end module registry: 10 / 10 expected modules loaded.
- Major module render smoke: 16 / 16 passed.
- Attendance subview render smoke: 6 / 6 passed.
- Roster/Schedule/Training/Uniforms/Analytics view smoke: 5 / 5 passed.
- Named JavaScript functions: 856.
- Duplicate named function declarations: 0.
- Inline action targets: 210.
- Missing inline action targets: 0.
- Startup gate complete-module test: Passed.
- Startup gate missing-module rejection test: Passed.
- Permanent CI attendance-print helper test: Passed.
- Permanent CI attendance-print portrait integration test: Passed.

## XML / .NET Version Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Manifest XML declaration exactly `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Project `<Version>`: 3.3.0.2.
- Project `<FileVersion>`: 3.3.0.2.
- Project `<AssemblyVersion>`: 3.3.0.2.
- Manifest `assemblyIdentity`: 3.3.0.2.
- Runtime environment / lock-file version: 3.3.0.2.
- Four-part maximum .NET version format: Passed.

## Build / Repository Controls
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub workflow runs modular front-end validation before .NET build: Passed.
- GitHub Windows artifact name aligned to v3.3.0.2: Passed.
- `.git` folder absent: Passed.
- Seed JSON files unchanged from v3.3.0.1 baseline: Passed.
- Packaged standalone/specialist program files unchanged from v3.3.0.1 baseline: Passed.
- README updated: Passed.
- `ROADMAP-v4.0.md` updated and v3.4.0 remains next major phase: Passed.
- `ATTENDANCE-PRINT-CUSTOMIZATION-v3.3.0.2.md` present: Passed.

## Local Publish
A local .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the Windows EXE build authority.


---

## Archived Source: `BUILD-VALIDATION-v3.3.0.3.md`

# Build Validation - v3.3.0.3

## Release
- Version: 3.3.0.3
- Release name: Attendance Print Zero Suppression
- Baseline: v3.3.0.2

## Functional Scope
- Selected attendance-code boxes render only when that employee's code total is greater than 0 for the selected reporting period: Passed.
- Nonzero selected code boxes retain MM/DD occurrence dates: Passed.
- Selected Discipline Total, Approved Total, and Recorded Total boxes are suppressed when their calculated value is 0: Passed.
- Employees with no selected nonzero activity remain on the report with a blank Selected Attendance cell: Passed by implementation review.
- ALL EMPLOYEES aggregate row uses the same zero-suppression rule: Passed by implementation review.
- Portrait orientation and user-selectable attendance categories remain unchanged: Passed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Named JavaScript functions: 856, no duplicate named declarations.
- Inline action targets: 210, all resolved.
- Module registry: 10/10 expected functional modules registered.
- Startup missing-module gate: Passed.
- Targeted integration test selecting CO + T with only CO activity confirms CO 2 and MM/DD dates render while `T 0` does not render: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Version / FileVersion / AssemblyVersion valid four-part values: Passed.
- Version / FileVersion / AssemblyVersion aligned at 3.3.0.3: Passed.
- app.manifest assemblyIdentity version aligned at 3.3.0.3: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.3: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Data / Scope Integrity
- app/seed files byte-for-byte unchanged from v3.3.0.2: Passed.
- app/programs specialist tools byte-for-byte unchanged from v3.3.0.2: Passed.
- No `.git` directory included: Passed.
- No Attendance source records, code definitions, discipline thresholds, notice logic, pattern logic, Schedule authority, Shift Operations logic, or shared JSON contracts intentionally changed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.


---

## Archived Source: `BUILD-VALIDATION-v3.3.0.4.md`

# Build Validation - v3.3.0.4

## Release
- Version: 3.3.0.4
- Release name: Schedule Color Adjacency Fix
- Baseline: v3.3.0.3

## Functional Scope
- Schedule color allocation operates across the full active schedule instead of restarting within each section: Passed.
- Horizontal adjacency conflict avoidance for different employees: Passed.
- Vertical adjacency conflict avoidance for different employees: Passed.
- Cross-section vertical adjacency conflict avoidance: Passed.
- Same employee retains a consistent color across repeated assignments: Passed.
- Existing section color mappings remain preferences but cannot force an avoidable adjacent collision: Passed.
- Expanded 36-color employee palette available before reuse pressure: Passed.
- Actual seeded PWADC schedule reports zero different-employee horizontal/vertical color conflicts under the new algorithm: Passed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Required render/action function guard: 85/85 Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Named JavaScript functions: 859, no duplicate named declarations.
- Inline action targets: 210, all resolved.
- Module registry: 10/10 expected functional modules registered.
- Startup missing-module gate: Passed.
- C# method inventory compared with v3.3.0.3: 52/52 preserved.
- Desktop `suite:*` bridge contract inventory compared with v3.3.0.3: 18/18 preserved.
- Synthetic section-boundary test using two employees with the same historical preferred color confirms the final colors are different: Passed.
- Seed schedule adjacency diagnostic returns zero conflicts between different employees: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Five-Part .NET Version Sweep: Passed.
  1. Project Version = 3.3.0.4.
  2. File Version = 3.3.0.4.
  3. Assembly Version = 3.3.0.4.
  4. Manifest `assemblyIdentity` = 3.3.0.4.
  5. Runtime environment version = 3.3.0.4.
- All controlled version values contain no more than four numeric components: Passed.
- Lock-file runtime version also aligned at 3.3.0.4: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.4: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Data / Scope Integrity
- app/seed files byte-for-byte unchanged from v3.3.0.3: Passed.
- app/programs specialist tools byte-for-byte unchanged from v3.3.0.3: Passed.
- No `.git` directory included: Passed.
- No Schedule assignments, HPW rules, labor reporting logic, Attendance logic, Shift Operations logic, or shared JSON contracts intentionally changed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.


---

## Archived Source: `BUILD-VALIDATION-v3.3.0.5.md`

# Build Validation - v3.3.0.5

## Release
- Version: 3.3.0.5
- Release name: Attendance Print Density Optimization
- Baseline: v3.3.0.4

## Functional Scope
- Approved attendance codes AL, V, E, and LE print totals only: Passed.
- Approved attendance occurrence dates are suppressed from the Attendance Totals printout: Passed.
- Discipline codes retain MM/DD occurrence dates when selected: Passed.
- Other non-approved selected codes retain MM/DD occurrence dates: Passed.
- Zero-total category suppression remains active: Passed.
- User-selectable attendance boxes and summary boxes remain available: Passed.
- Employee rows remain present even when selected attendance totals are zero: Passed.
- ALL EMPLOYEES aggregate summary remains available: Passed.
- Attendance Totals report remains portrait: Passed.
- Print table reduced to Employee / Shift + Attendance columns: Passed.
- Flex-packed attendance chips replace the fixed two-column inner grid: Passed.
- Large Attendance Totals KPI block removed to reduce vertical space: Passed.
- Attendance-specific margins, header spacing, table padding, typography, and footer spacing tightened: Passed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Required render/action function guard: 85/85 Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Named JavaScript functions: 859, no duplicate named declarations.
- Inline action targets: 210, all resolved.
- Module registry: 10/10 expected functional modules registered.
- Seeded Attendance print test confirms CO retains 08/01 and 08/11 dates: Passed.
- Seeded Attendance print test confirms AL total prints while 08/15 approved date is absent: Passed.
- Seeded Attendance print integration confirms selected T with total 0 remains suppressed: Passed.
- Compact print integration confirms Employee / Shift + Attendance table and flex-packed chip container: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Five-Part .NET Version Sweep: Passed.
  1. Project Version = 3.3.0.5.
  2. File Version = 3.3.0.5.
  3. Assembly Version = 3.3.0.5.
  4. Manifest `assemblyIdentity` = 3.3.0.5.
  5. Runtime environment version = 3.3.0.5.
- All controlled version values contain no more than four numeric components: Passed.
- Lock-file runtime version aligned at 3.3.0.5: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.5: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Regression / Scope Integrity
- C# method inventory compared with v3.3.0.4: 52/52 preserved.
- Desktop `suite:*` bridge contract inventory compared with v3.3.0.4: 18/18 preserved.
- app/seed files byte-for-byte unchanged from v3.3.0.4: Passed.
- app/programs specialist tools byte-for-byte unchanged from v3.3.0.4: Passed.
- No Attendance source data, attendance definitions, discipline thresholds, notice logic, schedule authority, HPW rules, Shift Operations logic, or shared JSON contracts intentionally changed.
- No `.git` directory included: Passed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.


---

## Archived Source: `BUILD-VALIDATION-v3.3.0.md`

# Build Validation - v3.3.0

Validation date: August 19, 2026

## Release
- Display/release version: v3.3.0
- Internal .NET version: 3.3.0.0
- Release focus: Code Organization / Modularization

## Architecture Validation
- `app/index.html` reduced from the v3.2.6.3 monolithic application file to a lightweight document shell: Passed.
  - v3.2.6.3 baseline: 808,575 bytes.
  - v3.3.0 shell: 2,190 bytes.
- Primary application CSS externalized to `app/assets/styles.css`: Passed.
- Externalized application CSS is byte-equivalent to the v3.2.6.3 primary design-system stylesheet: Passed.
- Inline application `<style>` block removed from `index.html`: Passed.
- Inline application `<script>` block removed from `index.html`: Passed.
- Ordered front-end load contract contains 10 functional modules plus registry/startup gate: Passed.
- All 10 expected functional modules register successfully: Passed.
- Startup with the complete module set calls `init()` exactly once: Passed.
- Startup with a missing module is blocked and produces an explicit module-load failure: Passed.
- C# `MainForm` converted to partial-class ownership files: Passed.
- Baseline/new C# callable method inventory: 52 / 52, no missing or added method names: Passed.
- Desktop bridge message contracts: 18 baseline / 18 v3.3.0, exact contract list preserved: Passed.
- Seed JSON files unchanged from v3.2.6.3: Passed.
- Packaged standalone program files unchanged from v3.2.6.3: Passed.

## JavaScript and Render Validation
- `node --check` syntax validation for every `app/js/*.js` file: Passed.
- `tools/validate-frontend.js`: Passed.
- Required render/action function guard: Passed; 85 required functions present.
- Duplicate named function declaration sweep: Passed; 843 named functions / 843 unique.
- Inline action-handler target sweep: Passed; 205 bare named action targets resolved.
- Front-end module registry: Passed; 10/10 expected functional modules registered with no unexpected modules.
- Seeded major-module render smoke test: Passed for all 16 modules:
  - Home
  - Start Here
  - Attendance
  - Roster
  - Employee Profile
  - Training
  - Office Supplies
  - Shift Reports
  - Shift Intelligence
  - Reports
  - Settings
  - Task Tracker
  - Data Health
  - Backup & Restore
  - Change Log
  - Other Programs
- Attendance view smoke test: Passed for Daily Entry, 90-Day Grid, Attendance Review, Patterns, Notice Workflow, and Audit Log.
- Roster-area smoke test: Passed for roster, schedule, training routing, uniforms, and analytics.
- QA Guardrail panel exposes front-end module registry status: Passed.

## Functional Regression Control
v3.3.0 is intentionally structural. The following operational contracts were preserved:
- Attendance code definitions, including CO and NCNS: Preserved.
- Attendance Totals print workflow: Preserved.
- Live schedule authority for HPW and labor reporting: Preserved.
- Schedule copy/paste, guarded clear, and mock schedule workflows: Preserved.
- Mock schedules remain isolated from live reporting until explicitly applied: Preserved.
- Shift Reports / Shift Intelligence behavior: Preserved; no recalibration included.
- Reports / Data / Admin governance workflow: Preserved.
- Task Tracker behavior: Preserved.
- Shared data root and JSON file names: Preserved.
- PT / FT / TempToHire loaded-cost assumptions: Preserved.
- Role behavior and existing high-impact backup-first controls: Preserved.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All controlled runtime/build version locations use `3.3.0.0` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

The lock-file runtime version also matches `3.3.0.0`.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- Node 20 setup step present: Passed.
- Modular front-end validation step present before .NET build: Passed.
- .NET 8 setup present: Passed.
- `dotnet build` step present: Passed.
- self-contained win-x64 `dotnet publish` step present: Passed.
- GitHub artifact name aligned to v3.3.0: Passed.
- README updated for v3.3.0: Passed.
- `ROADMAP-v4.0.md` marks v3.3.0 complete and v3.4.0 next: Passed.
- `ARCHITECTURE-v3.3.0.md` present: Passed.
- `.git` folder excluded: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Scope / Delta Control
Compared with the v3.2.6.3 clean repository:
- 21 new architecture/validation/module files were added.
- 7 existing files were changed.
- No existing repository file was removed.
- Seed and packaged specialist-tool content is unchanged.

## Local Publish Status
A local Windows .NET build/publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.


---

## Archived Source: `CODE-ORGANIZATION-v3.3.0.md`

# v3.3.0 - Code Organization / Modularization

## Release Objective
Reduce code concentration and regression risk without redesigning PWADC workflows or changing shared data behavior.

## Completed
- Externalized the application design system from `app/index.html` to `app/assets/styles.css`.
- Replaced the single inline front-end script with 10 ordered functional JavaScript modules.
- Added a front-end module registry and startup validation gate.
- Preserved the existing render-function QA guard and added registry status to its panel.
- Reduced `app/index.html` to a lightweight document shell.
- Converted `MainForm` to a partial class and separated bridge, storage, backup, program/environment, and model responsibilities.
- Preserved all existing `suite:*` bridge message types.
- Preserved shared JSON file names, shared data root, schedule authority, attendance code definitions, role behavior, reporting routes, backup/restore behavior, and specialist tool boundaries.
- Updated GitHub Actions artifact naming for v3.3.0.
- Added `ARCHITECTURE-v3.3.0.md` as the ongoing source-ownership and dependency map.

## Intentional Non-Changes
- No UI redesign.
- No attendance policy changes.
- No schedule-authority changes.
- No Shift Intelligence recalibration.
- No data migration.
- No database introduction.
- No changes to loaded labor-cost assumptions.
- No emergency-procedure module integration.

## Operational Result
Users should experience the same suite behavior. The benefit is primarily engineering control: a defect or enhancement can now be isolated to a smaller ownership boundary instead of modifying one 800 KB application file.


---

## Archived Source: `DESIGN-SYSTEM-v3.2.2.1.md`

# v3.2.2.1 High-Intelligence Professional Design System Rerun

## Purpose

This pass reruns the v3.2.2 design-system work at higher review depth before moving into screen-specific redesign. The goal was not to add features. The goal was to make the shared UI foundation cleaner, safer, and less likely to create inconsistent screens as the suite moves toward v4.0.

## What was found

### 1. Good direction from v3.2.2
The first design-system pass correctly introduced shared polish for headers, cards, controls, tables, badges, screen guides, and empty states.

### 2. Duplicated design CSS leaked into print/export templates
A deeper static review found the v3.2.2 screen-guide CSS repeated inside several print/export HTML style blocks. That could make exported/printed pages carry unused app-only CSS and undefined CSS variables. It was not the kind of bug that ruins daily use, but it was messy and unprofessional.

Resolution: duplicate leaked `screen-guide` polish blocks were removed from generated print/export templates. The design-system CSS now lives in the main app style layer only.

### 3. Shared UI primitives needed clearer hierarchy
Several screens use different local patterns for filters, toolbar actions, empty rows, and modal actions. The pass added broader shared rules for labels, inputs, modal headers, modal action bars, empty states, table controls, and responsive page widths.

### 4. The app should not redesign every screen in this pass
The correct roadmap remains: shared design system first, then Home redesign, then People, Operations, and Admin workflows. Trying to redesign every screen inside v3.2.2.1 would mix foundation work with workflow surgery.

## Implemented refinements

- Consolidated shared design CSS into one main app layer.
- Added tighter max-width behavior for the main content area.
- Improved page-head responsiveness and action alignment.
- Improved form label readability and spacing.
- Improved table inputs/buttons for dense operational grids.
- Improved modal title/action/footer patterns.
- Improved status pill consistency.
- Improved generic `.empty` behavior so no-data rows feel intentional.
- Preserved roadmap tracking in README and ROADMAP-v4.0.

## Still recommended for v3.2.3

The Home screen should be redesigned around a simple command question: **What needs attention today?**

Recommended v3.2.3 sections:

1. Today’s Priority
2. Critical Action Queues
3. System/Data Confidence
4. Recent Activity
5. Secondary Signals collapsed by default

## Still recommended for later phases

- v3.2.4: connect Attendance, Roster, Employee Profile, Training, Uniforms into one People workflow.
- v3.2.5.1: clarify Shift Reports -> Shift Intelligence -> Tasks as one Operations workflow.
- v3.2.6: calm down Reports / Data / Admin screens with better risk language, previews, and audit visibility.
- v3.3.0: split the large front-end into maintainable JavaScript modules.

## Stack decision

No Rust or Ruby migration is recommended in the near term. The current C# / WebView / HTML / CSS / JavaScript stack remains the right v3.x path.

## Static UI inventory reviewed

The rerun reviewed the app as a large single-page operational interface. Static inventory from `app/index.html` at this pass:

- 338 button render points
- 135 input render points
- 77 select render points
- 46 table render points
- 146 card render points
- 16 screen-guide call sites
- 7 generated print/export style templates

The highest-risk shared patterns are dense tables, filter/toolbars, generated print styles, modals, and action-heavy page headers. Those should remain the focus as each screen-specific phase begins.


---

## Archived Source: `DESIGN-SYSTEM-v3.2.2.md`

# v3.2.2 Professional Design System Pass

## Purpose

This pass applies a shared professional design layer across the PWADC Security Operations Suite before deeper screen-specific redesign work. It is intentionally conservative: polish the common UI foundation without changing JSON data models or core workflows.

## Applied standards

### Page headers
- Stronger visual container with left red rule.
- Clear title/subtitle hierarchy.
- Action buttons stay grouped on the right when screen width allows.

### Screen guides
- Consistent three-part guidance pattern: title, purpose, numbered steps.
- Used to reduce confusion without adding new workflow modules.

### Controls
- Unified focus state for keyboard accessibility.
- More consistent button spacing, shape, and hover behavior.
- Danger controls retain red treatment and stronger hover feedback.

### Cards and KPIs
- Unified corner radius and shadow.
- Subtle hover border feedback.
- Card titles use a small gold marker for scanning.

### Tables
- Sticky headers remain.
- Cleaner row hover and alternating row tone.
- Rounded table container and stronger boundaries.

### Badges / chips
- More consistent pill shape for statuses, chips, ranks, task statuses, training statuses, and uniform chips.

### Empty states
- Introduced a shared empty-state block for major no-data conditions.
- Goal is to avoid blank or dead-looking screens.

## Not included
- No data model changes.
- No new modules.
- No large workflow redesign.
- No Rust/Ruby migration.

## Next build

`v3.2.3 - Home / Command Center Redesign` should use this shared design language and apply a screen-specific redesign to the dashboard.


---

## Archived Source: `HOME-COMMAND-CENTER-v3.2.3.md`

# v3.2.3 Home / Command Center Redesign

## Goal
Turn Home into a calmer daily command center. The old dashboard showed too many equal-weight signals at once, which made important decisions compete with secondary information.

## Design decisions
- Lead with one top priority instead of a wall of cards.
- Keep the remaining command queues visible, but compact.
- Move training, uniform, supply, dormant, source-report, and data-health supporting signals behind a collapsible Secondary Signals panel.
- Keep Admin Tools and Module Map collapsed by default.
- Add a Daily Workflow that mirrors the supervisor rhythm: Import -> Review -> People work -> Tasks -> Data Health -> Reports.
- Add Recent Activity so the screen feels alive without becoming noisy.

## Completed changes
- Rebuilt Home hero into a command summary.
- Added System Snapshot.
- Added Today’s Priority lead card.
- Added compact priority queue cards.
- Added Daily Workflow rail.
- Added Quick Actions panel.
- Added Recent Activity panel.
- Preserved live-data clarity and grouped navigation.

## Next phase
v3.2.4 should redesign the People workflow across Attendance, Attendance Review, Attendance Patterns, Notices, Roster, Employee Profile, Training, and Uniforms.


---

## Archived Source: `LIVE-DATA-CLARITY-v3.1.39.md`

# v3.2.1 Live Data Clarity / Startup Safety

## Purpose
Prevent confusion between live shared data, packaged recovery data, imported backups, and restored backups.

## Added
- Home data source strip.
- Data Health Live Data Clarity panel.
- Module load metadata from the desktop bridge:
  - source
  - source detail
  - live path
  - modified time
  - loaded time
  - data root
- Freshness summary for key modules.
- Live Module Files newest meaningful data date.

## Source labels
- Live Shared Data: existing JSON from the configured shared Data folder.
- Packaged Recovery Data: seed/recovery JSON copied from the packaged app because live data was missing, empty, or manually restored from seed.
- Imported Backup: JSON selected through an import control during the current session.
- Restored Backup: JSON restored through Restore Center during the current session.
- Missing / Unknown: no confirmed live source.

## Safety posture
No data model changes were made. Backup retention and restore hardening from v3.1.37-v3.1.38 remain in place.


---

## Archived Source: `OPERATIONS-WORKFLOW-v3.2.5.md`

# v3.2.5 Operations Workflow Redesign

## Purpose
This pass connects operational screens into one daily lane: **Import -> Review -> Track -> Resolve -> Report**.

## Screens touched
- Shift Reports
- Shift Intelligence
- Task Tracker
- Office Supplies
- Report Center quick handoff through the Operations Workflow strip

## Design decisions
- Shift Reports remains the source-document and raw intake screen.
- Shift Intelligence remains the decision and watchlist layer.
- Task Tracker is the destination for owner/date/action follow-ups.
- Office Supplies supports operational readiness without becoming a full procurement system.
- Report Center remains the executive/compliance output lane.

## Added UI patterns
- Operations Workflow strip
- Operational Lifecycle panel
- Operations KPI chips
- Shift Intelligence Create Task action

## Safety rule
Routine N/A, none, no-issue, or reference-only material should not become an operational issue. It should remain source history or reference-only intelligence unless it creates real operational impact.

## Next phase
v3.2.6 should redesign Reports / Data / Admin screens, especially Report Center, Data Health, Restore Center, Backup Manager, Change Log, Settings, and Other Programs.


---

## Archived Source: `PEOPLE-WORKFLOW-v3.2.4.md`

# v3.2.4 People Workflow Redesign

## Purpose
Make employee-related work feel connected and professional without changing the underlying data model.

## People lane covered
- Attendance
- Attendance Review
- Attendance Patterns
- Notice Workflow
- Roster
- Employee Profile
- Training
- Uniform Accountability

## Key changes
- Added a shared People Workflow strip to the major People screens.
- Added cross-module quick movement so supervisors can move from roster identity to attendance evidence, training readiness, and uniform accountability without hunting through menus.
- Added Employee Profile People Command tiles showing the employee-specific count of:
  - outstanding patterns
  - open notices
  - training exceptions
  - uniform follow-ups
  - schedule assignments
- Kept sensitive decisions in their source modules.

## Design principle
Employee Profile is the command snapshot. Attendance, Roster, Training, and Uniforms remain the source-of-truth screens where records are changed.

## No data model changes
This pass does not change JSON structure. It improves the workflow and UI layer only.

## Next roadmap item
v3.2.5.1 - Operations Workflow Redesign


---

## Archived Source: `REPORTING-v3.2.0.md`

# v3.2.1 Reporting Expansion

## Review scope
The suite now treats Reports as an executive/compliance hub, not just a list of exports.

## Added reports
1. Executive Operations Briefing
2. Compliance Readiness Report
3. Operations Full Summary
4. Shift Intelligence Summary

## Design principles
- Reports summarize decisions and risk, not just raw counts.
- Staffing HPW uses the published schedule as authority.
- Open/Pending schedule cells count as unfilled HPW.
- Pay/cost visibility remains role-based.
- Shift Intelligence stays focused on meaningful operational issues, not routine report noise.

## Verification
- JavaScript syntax check required.
- Required render function check required.
- Report Center render smoke check required.
- Existing data files and backup/restore flows unchanged.


---

## Archived Source: `REPORTS-DATA-ADMIN-v3.2.6.md`

# v3.2.6 - Reports / Data / Admin Redesign

## Objective
Convert Reports, Data Health, Backup & Restore, Change Log, and Admin Settings from separate utility pages into a connected PWADC governance workflow.

## Operating Model
The release introduces one governance sequence:

**Report → Verify → Recover → Govern**

- **Report:** Select the management output and confirm its source and scope.
- **Verify:** Review critical data findings and live-file confidence before relying on the output.
- **Recover:** Select scope, select backup, and preview replacement boundaries before restoration.
- **Govern:** Review high-impact audit activity and save controlled administrative changes.

## Implemented Changes
### Report Center
- Report library with operational categories.
- Selected-report detail and purpose statement.
- Source, access, and output-format visibility.
- Scope controls adjacent to report actions.
- Readiness rail with direct Data Health, Backup & Restore, and Change Log handoffs.

### Data Health
- Severity-first findings queue.
- Direct source-review action on each finding.
- Progressive disclosure for technical inventory, backup management, repair actions, QA guardrails, and regression controls.
- Existing backup-first repair and shared-file visibility retained.

### Backup & Restore
- Three-step workspace: scope, backup, preview.
- Replacement boundaries and recovery impact shown before restore.
- Existing reason, typed confirmation, module isolation, and pre-restore backup safeguards retained.

### Change Log
- Governance metrics and risk labels.
- Module, search, and row-limit controls.
- High-impact restore, deletion, settings, role, clearance, and archive actions elevated above routine saves.

### Admin Settings
- Section navigation for General, Users & Roles, Labor Assumptions, Coverage Requirements, Data & Recovery, Standalone Programs, and Restricted Actions.
- Unsaved section edits are captured before navigation.
- All settings are validated and saved in one controlled transaction.
- Existing Admin-only restrictions and active-Admin guardrail retained.

## Deliberate Exclusions
- No database conversion.
- No emergency-procedure module.
- No unrelated Shift Intelligence logic changes.
- No framework rewrite.
- No change to the specialist Other Programs execution model.

## Versioning
- Release/display version: v3.2.6
- .NET project, file, assembly, runtime, and manifest version: 3.2.6.0


---

## Archived Source: `SCHEDULE-ASSIGNMENT-PICKER-v3.3.0.1.md`

# v3.3.0.1 - Schedule Assignment Picker

## Purpose
Improve schedule staffing speed and mock-schedule flexibility without changing the live schedule authority, HPW methodology, or roster data contract.

## Changes
### Mock schedules
- Any active roster employee can be assigned to any mock schedule slot.
- Mock employee choices no longer filter by normal employee shift, gate shift, section, or post.
- The same unrestricted active-roster pool is used in mock cell reassignment and mock row day-assignment controls.
- Archived/inactive roster employees remain excluded.

### Schedule cell typeahead
- Replaces the schedule-cell employee dropdown with a searchable picker.
- Search matches partial employee name and employee number (EID).
- Results display name, EID, rank, and shift.
- Open/Pending/Closed cells autofocus the picker.
- Keyboard navigation supports Arrow Up, Arrow Down, Enter, and Escape.
- Selection writes the existing rank/name schedule label, preserving compatibility with HPW, reporting, employee matching, colors, printing, copy/paste, and existing roster data.

### Live schedule
- Live schedule employee suggestions retain the existing section/shift contextual filter.
- Closed, Open, Pending, copy, and paste controls remain available.

## Governance
- No changes to attendance codes, discipline thresholds, labor rates, schedule HPW rules, Shift Operations, reports, or shared JSON schema.
- v3.4.0 Data Layer / Reliability Upgrade remains the next major roadmap phase.


---

## Archived Source: `SCHEDULE-COLOR-ADJACENCY-v3.3.0.4.md`

# v3.3.0.4 - Schedule Color Adjacency Fix

## Objective
Improve Schedule readability by eliminating avoidable same-color collisions between different employees in neighboring occupied cells while preserving employee color continuity and all existing schedule authority rules.

## Root Cause
The prior color cache was built independently inside each schedule section. Each section restarted the same palette and honored section-specific preferred colors. As a result, two different employees could receive the same color when rows from different sections were visually adjacent, even though each section was internally valid.

## Controlled Changes
- Employee color assignment now evaluates the entire active live or mock schedule as one visual workspace.
- Horizontal neighbors are evaluated across adjacent days within the same schedule row.
- Vertical neighbors are evaluated across adjacent schedule rows on the same day, including section boundaries.
- Different employees that share a horizontal or vertical border are assigned different colors whenever another palette color is available.
- The same employee retains one consistent color throughout the active schedule.
- Existing section color mappings are treated as preferences, not absolute assignments when they would create an adjacent collision.
- The schedule palette was expanded from 20 to 36 colors to reduce reuse in larger staffing layouts.
- A schedule adjacency diagnostic helper was added for validation.

## Preserved Behavior
- Live Schedule remains the authority for HPW and labor reporting.
- Mock schedules remain isolated until explicitly applied to live.
- Copy/paste assignment behavior is unchanged.
- Name/EID typeahead assignment behavior is unchanged.
- Open, Pending, and Closed status cells retain their existing status presentation.
- No schedule assignments, roster records, attendance records, Shift Intelligence records, or shared JSON contracts are modified by this release.

## Important Visual Rule
If the same employee is intentionally assigned to adjacent cells, those cells retain the same color because color continuity represents employee identity. The adjacency guard applies to different employees.


---

## Archived Source: `SCHEDULE-WORKSPACE-v3.2.6.2.md`

# v3.2.6.2 - Schedule Workspace Enhancements

## Objective
Give PWADC Security management faster schedule-editing controls and a safe scenario-planning workspace without allowing draft schedules to become operational authority accidentally.

## Delivered
- Cell-level copy and paste for employee assignments and schedule statuses.
- Persistent clipboard indicator while working in the Schedule view.
- Guarded Clear Schedule action that preserves schedule structure and clears all daily cells to Closed.
- Backup-first handling for live schedule clearing.
- Persistent Mock Schedule Library stored in `roster.scheduleDrafts`.
- Create mock from live schedule.
- Create mock with blank assignments while retaining current live sections/posts.
- Open, edit, rename, duplicate, print/share, hold, and delete mock schedules.
- Clear a mock independently from live.
- Backup-first Apply to Live workflow with reason and `APPLY SCHEDULE` confirmation.
- Mock exports labeled MOCK / NOT PUBLISHED.

## Data Authority
`roster.schedule` remains the only published schedule authority. Draft data in `roster.scheduleDrafts` is intentionally excluded from live HPW, labor analytics, attendance coverage, executive reports, and other schedule-authority calculations.

## Destructive-Action Controls
### Clear Live Schedule
1. Admin-only.
2. Requires a reason.
3. Requires exact `CLEAR SCHEDULE`.
4. Creates a roster backup before modification.
5. Preserves rows, sections, coverage windows, cost hours, and notes.
6. Sets all seven daily cells in every live row to Closed (`None`).

### Apply Mock to Live
1. Admin-only.
2. Requires a reason.
3. Requires exact `APPLY SCHEDULE`.
4. Creates a roster backup before replacement.
5. Replaces `roster.schedule` with a deep copy of the selected mock.
6. Keeps the mock in the library after publication.

## Roadmap
This is a controlled insertion after v3.2.6.1. The next major phase remains v3.3.0 Code Organization / Modularization.


---

## Archived Source: `SHIFT-OPERATIONS-EXPERIENCE-v3.2.5.5.md`

# v3.2.5.5 - Shift Operations Experience Redesign

## Objective
Finish the Shift Reports and Shift Intelligence operating experience before starting v3.2.6. The previous screen structure contained the correct workflow concepts but still felt assembled from independent cards. This release consolidates the work into intentional operating surfaces.

## Shift Reports
- Replaced the stacked hero, metrics, workflow cards, rule drawer, filter card, and issue board with one intake workspace.
- Source report remains first and authoritative.
- Routine report facts render as metadata.
- Extraction is divided into Operational Signals, Reference Context, and Ignored Noise.
- The handoff rail makes Shift Intelligence the explicit next step.
- Source history, exports, filters, backups, and clear-memory controls remain available but secondary.

## Shift Intelligence
- Replaced the two large card boards with a three-pane decision center.
- Intake Queue provides compact selectable items.
- Decision Detail provides the selected item’s operational meaning, evidence, recommended handling, and suggested links.
- Active Watchlist provides compact selectable issues.
- Creating or linking an issue transfers focus directly to that issue.
- Reference and Ignore decisions advance to the next pending intake item.
- Watchlist detail centralizes owner/notes, task creation, status changes, and closure.

## Parser and Data Enhancements
- Report summaries now retain the extracted officer count and suppressed routine-noise count.
- Source history shows the number of routine fields suppressed from issue tracking.
- Existing repeated-alarm grouping, false-alarm handling, pass-down linking, trailer reference handling, and staffing-impact logic remain intact.

## Administrative Controls
- Clear Shift Report Memory remains Admin-only.
- Backups are created before clearing.
- The action still requires a reason and the exact confirmation phrase.
- No other module data is affected.

## Validation Requirements
- JavaScript syntax check.
- Required render-function check.
- Shift Reports / Shift Intelligence render smoke test.
- Major module render smoke test.
- XML project and manifest parse check.
- Manifest XML declaration check.
- Five-part .NET version sweep.
- Four-part maximum version validation.


---

## Archived Source: `SHIFT-OPERATIONS-FLOW-v3.2.5.4.md`

# v3.2.5.4 - Shift Operations Flow Redesign

## Purpose

This pass fixes the Shift Reports / Shift Intelligence interface flow after the parser rebuild. The logic was improved in v3.2.5.2 and the screen was cleaned in v3.2.5.3, but the layout still felt assembled instead of designed.

## Design principle

The Shift Operations lane now follows one visible operating path:

1. Import source report
2. Classify signal from noise
3. Review and decide
4. Track meaningful issues
5. Close or report

## Shift Reports screen

Shift Reports is now treated as the intake desk. It prioritizes importing the PDF, showing the parsed source preview, summarizing active/reference output, then showing the operational intake board. Source report history is still available, but tucked into a drawer so it does not crowd the primary workflow.

## Shift Intelligence screen

Shift Intelligence is now treated as the decision desk. Pending intake appears on the left and the active watchlist appears on the right. The user should be able to clear intake by choosing link, create issue, reference only, or ignore.

## No data model changes

This is an interface-flow redesign only. It does not change the shift report or shift intelligence JSON structure.


---

## Archived Source: `SHIFT-REPORT-INTELLIGENCE-REBUILD-v3.2.5.2.md`

# v3.2.5.2 - Shift Report Intelligence Rebuild

## Purpose
Rebuild Shift Reports and Shift Intelligence so the suite tracks operational meaning instead of raw extracted text.

## Source calibration report
Baseline report used for this pass:
- SEC-PWADC-2026-08-01-2
- Date: 2026-08-01
- Shift: 2nd 1600-0000
- Incidents: No
- Patrol / Safety: No issues reported
- Alarms: 5

## Expected interpretation
| Report content | New handling |
|---|---|
| Four M3-90 Jockey Pump Run Alarms | One Active Watch Item: repeated alarm pattern |
| M3-63 Pump House Smoke Alarm at 2326, checked false/no smoke, possible lightning cause | Reference / watching context unless repeated |
| 1st shift pump house tamper alarm pass-down | Suggested Link / Reference Only |
| Back log trucks on docks 106, 107, and 108 | Reference Only logistics/trailer monitoring |
| No incidents, no patrol issues, no notifications | No issue |
| Three officers listed as on-time | Metadata only unless schedule comparison shows coverage impact |

## New rules
- Group repeated alarms by normalized alarm type and location.
- Do not create five issues for five alarm rows when they are one system pattern.
- Keep false alarms/no-smoke weather events reference-only unless repeated or equipment trouble is stated.
- Keep pass-downs reference-only unless they carry unresolved work, repeat across shifts, or create operational impact.
- Staffing entries are reference-only unless they create coverage risk.
- N/A, none, no issues, no notifications, and nothing-else-of-note text is ignored.

## Roadmap impact
This build becomes a completed step between v3.2.5.1 and v3.2.6. Future v3.2.6 Reports / Data / Admin Redesign should use this new intelligence model when building reports.


---

## Archived Source: `SHIFT-REPORT-UI-CLEANUP-v3.2.5.3.md`

# v3.2.5.3 - Shift Report Interface Cleanup / Fresh Start Control

## Purpose
Clean up the rebuilt Shift Report Operational Intake and Shift Intelligence screens so they look like professional operational boards instead of raw extracted-data lists.

## Interface cleanup
- Added a professional operations hero layout to Shift Reports and Shift Intelligence.
- Reworked the intake screen around import, classification, visible metrics, and tracking rules.
- Reworked Shift Intelligence into a watchboard with clearer review standards and cleaner intake/watchlist lanes.
- Strengthened spacing, card design, section hierarchy, and responsive behavior for these two screens.

## Fresh start control
Added an admin-only **Clear Shift Report Memory** control. It:
- creates backups of Shift Reports and Shift Intelligence first,
- clears imported shift reports,
- clears shift report intake items,
- clears Shift Intelligence intake/watchlist/reference memory,
- keeps one audit entry documenting the clear,
- does not touch Attendance, Roster, Training, Uniforms, Supplies, Tasks, Reports, backups, Restore Center, or Settings.

## Safety model
The user must enter a reason and type `CLEAR SHIFT REPORTS` before the clear runs. If backup creation fails, the clear is not completed.


---

## Archived Source: `UI-RENDER-FIX-v3.2.3.1.md`

# v3.2.3.2 UI Render Fix / Undefined Helper Sweep

This emergency patch follows the Home / Command Center redesign.

## Issue Found

The Home screen called `shiftIntelPendingCount()` before that helper existed. The render guard correctly surfaced the failure instead of leaving a blank app.

## Additional Undefined Helper Sweep

A TypeScript/JavaScript undefined-name sweep also found older helper calls that needed explicit shared helpers:

- `shiftIntelPendingCount`
- `shiftIntelNeedsActionCount`
- `shiftIntelDormantCount`
- `workflowBanner`
- `rosterEmployeeById`
- `openReportWindow`

## Fix

The missing shared helpers were added so Home, Reports, Training print, Attendance, Shift Reports, Shift Intelligence, and Uniform workflow banners have concrete definitions.

## Verification

- JavaScript syntax check
- Required render-function check
- TypeScript undefined-name sweep for missing helper names
- Major module render smoke check
- README roadmap updated


---

## Archived Source: `UI-UX-AUDIT-v3.2.1.md`

# PWADC Security Operations Suite v3.2.1
# Full UI / UX Audit and Professional Design Recommendations

## Purpose

This audit starts the v4.0 preparation track. The goal is not to add another feature. The goal is to review the program as a professional operations platform: screen by screen, section by section, and shared UI element by shared UI element.

This document should be used as the source list for v3.2.2 through v3.2.6.

## Executive Summary

The suite has strong operational capability, but it still has the visual and structural fingerprints of a fast-growing internal tool. The product now needs a formal design system, cleaner screen hierarchy, standardized controls, and a calmer command-center experience.

The current strongest areas are data safety, backup/restore discipline, attendance intelligence, roster/schedule utility, and the emerging executive report center. The weakest areas are visual consistency, button density, table density, modal consistency, and the large single-file front-end structure.

The best professionalization path is:

1. Build a design system.
2. Rework Home into a command center.
3. Rework People screens as one connected workflow.
4. Rework Operations screens as one connected workflow.
5. Rework Reports/Data/Admin screens as a calm control plane.
6. Then modularize the code.

## Product-Wide Design Principles

### 1. One screen, one primary job
Every screen should make its primary job obvious within five seconds. Secondary tools should be grouped behind panels, subnavs, or action menus.

### 2. Primary actions must be visually rare
Each screen should usually have one primary button. Too many gold/primary actions causes decision fog.

### 3. Use progressive disclosure
The app handles complex operations. Complexity should still exist, but it should unfold when needed: filters, advanced actions, audit detail, backups, exports, and administrative controls should not all shout at once.

### 4. Empty states should teach
Every table and queue should have a helpful empty state: what it means, what to do next, and whether the empty condition is good or bad.

### 5. Risky actions need one standard pattern
Delete, restore, packaged recovery, import overwrite, bulk update, and cleanup should all share one visual pattern: warning message, preview, confirmation, final action.

### 6. Data source should always be visible
Live Shared Data, Packaged Recovery Data, Imported Backup, Restored Backup, and Unknown/Missing need consistent labeling. This prevents stale-data confusion.

## Shared UI Element Audit

### Top Bar and Navigation

Current state: improved by grouped dropdown navigation. This was the correct direction.

Issues:
- Global employee search competes with navigation and status blocks.
- Status area is useful but visually dense.
- Dropdown grouping works, but group naming should be refined around user workflows.

Recommendations:
- Keep grouped nav.
- Rename modules inside groups where useful: for example Shift Reports may become Import Reports; Shift Intelligence may become Issue Watchlist or Operations Intelligence if future testing supports it.
- Add current data source indicator in the top bar only if it can remain compact.
- Consider moving the global employee search to People context or making it visually quieter.

Priority: High for v3.2.2.

### Page Headers

Current state: mostly consistent but action areas vary in density and wording.

Issues:
- Some pages have too many top-right buttons.
- Primary, secondary, export, backup, and destructive actions mix together.
- Long page subtitles sometimes read like release notes.

Recommendations:
- Standardize page header structure: title, plain-language purpose, primary action, secondary action menu.
- Move export/import/backup actions into a secondary toolbar unless they are the main job.
- Remove release-version wording from routine page subtitles.

Priority: High.

### Buttons

Current state: functional but not yet fully systematic.

Issues:
- Primary/gold buttons sometimes mean different things depending on screen.
- Some destructive buttons are near common actions.
- Some toolbars have too many buttons at equal weight.

Recommendations:
- Define button classes: primary, secondary, quiet, warning, danger, admin.
- Restrict primary to the main next action.
- Put destructive actions at the end of a separated group.
- Use button labels that start with verbs: Import, Review, Create, Save, Print, Export, Restore, Clean Up.

Priority: High.

### Cards and KPI Tiles

Current state: helpful but sometimes too many appear at once.

Issues:
- KPI cards can become visual noise when every metric is displayed.
- Some cards mix explanation, metrics, filters, and actions.

Recommendations:
- Use KPI tiles only for decision-driving numbers.
- Move secondary stats into collapsible panels.
- Standardize card header, card body, card actions.

Priority: High.

### Tables

Current state: tables are practical but dense.

Issues:
- Many tables have too many columns.
- Actions are sometimes repeated on every row, creating button clutter.
- Wide tables need a more consistent overflow strategy.

Recommendations:
- Create compact row layout standards.
- Use row action menus for secondary actions.
- Freeze or emphasize name/status columns where possible.
- Add column grouping for print/export selectors.

Priority: Medium/High.

### Forms and Modals

Current state: workable but not yet polished as a system.

Issues:
- Modal layouts vary.
- Some forms are long and dense.
- Confirmation patterns differ by module.

Recommendations:
- Standard modal header, body, footer.
- Required fields should be visually consistent.
- Dangerous modals should use the same confirmation language and layout.
- Large forms should be divided into sections.

Priority: High.

### Badges, Chips, and Status Labels

Current state: useful but inconsistent.

Issues:
- Different modules use slightly different status language.
- Some statuses are operational, some are data state, some are action state.

Recommendations:
- Define status families: Attendance, Task, Shift Intelligence, Backup/Restore, Data Health, Uniform, Training.
- Use consistent color/emphasis rules: good, neutral, warning, critical, archived, reference-only.

Priority: Medium.

### Screen Guides and Workflow Banners

Current state: helpful but can become repetitive.

Issues:
- Some guides may be too instructional for frequent users.
- Screen guides should not push real work too far down the screen.

Recommendations:
- Use compact screen guides by default.
- Allow screen guide detail to collapse.
- Keep workflow banners only where workflow confusion is likely.

Priority: Medium.

## Screen-by-Screen Review

### 1. Home / Dashboard

Professional score: B-

What works:
- Dashboard is now less busy than earlier versions.
- Command queues are the right concept.
- Live data strip is valuable.

Issues:
- Still at risk of showing too many categories at once.
- Needs stronger visual hierarchy around “what needs action today.”
- Secondary signals and admin tools should stay subordinate.

Recommendations:
- Rebuild as three zones: Today’s Priority, System Health, Recent Activity.
- Only show 4 to 6 top priority cards above the fold.
- Move module map and secondary metrics farther down or behind collapsibles.
- Add a calm no-action state when everything is clear.

Target build: v3.2.3.

### 2. Start Here

Professional score: B

What works:
- Better as an operating guide than earlier release-note versions.
- Daily flow is useful.

Issues:
- Still risks becoming a changelog dumping ground.
- Needs separation between “how to use the suite” and “what changed in this version.”

Recommendations:
- Split into Quick Start, Daily Workflow, Admin Safety, Version Notes.
- Keep latest release notes concise.
- Link to roadmap and audit documents conceptually in text, not as giant changelog blocks.

Target build: v3.2.2.

### 3. Attendance Main Screen

Professional score: B

What works:
- Strong operational value.
- Daily entry, review, patterns, notices, and audit are correctly grouped.
- Import latest-date fix improves trust.

Issues:
- Top action area is crowded: import, packaged recovery, backup, export, remove employee.
- Packaged recovery should feel clearly secondary and risky.
- Subnav is useful but the page can feel heavy.

Recommendations:
- Make Daily Entry the default primary flow.
- Move import/backup/export/recovery under “Data Actions.”
- Keep Remove Employee visually separated as Admin / danger.
- Add a compact “latest populated date” indicator near date controls.

Target build: v3.2.4.

### 4. Daily Entry

Professional score: B

What works:
- Fast entry concept is correct.
- Date focus fix was important.

Issues:
- Status code meaning should be closer to the controls.
- Users need confidence that entries save correctly.

Recommendations:
- Add compact legend and save status near the grid.
- Make “latest imported date” visible when relevant.
- Keep keyboard-friendly operation.

Target build: v3.2.4.

### 5. 90-Day Grid

Professional score: B-

What works:
- Useful historical view.

Issues:
- Dense by nature.
- Needs clearer filtering and print/export purpose.

Recommendations:
- Add sticky context where practical.
- Add simplified summary above grid.
- Consider defaulting to exceptions-only view for supervisors.

Target build: v3.2.4.

### 6. Attendance Review

Professional score: B

What works:
- Correct place for review and exceptions.
- Policy-review mindset is strong.

Issues:
- Needs sharper distinction between raw record and actionable issue.

Recommendations:
- Group by employee and issue type more consistently.
- Show “recommended action” only when there is a rule reason.
- Make no-action / monitor / create-notice flow visually consistent.

Target build: v3.2.4.

### 7. Attendance Patterns

Professional score: B+

What works:
- Rule-based predictable design is good.
- Stable keys and status persistence matter.
- Employee grouping is the right direction.

Issues:
- Risk scoring and statuses need to stay explainable.
- Bulk actions need careful hierarchy.

Recommendations:
- Keep showing rule, threshold, count, dates, and status.
- Add pattern explainer text in a compact detail panel.
- Keep resolved/monitoring/not-an-issue out of the main action queue.

Target build: v3.2.4.

### 8. Attendance Notice Workflow

Professional score: B

What works:
- Important HR-sensitive workflow.
- Status lifecycle is useful.

Issues:
- Table is very dense.
- Actions can feel cramped.

Recommendations:
- Consider notice cards or expandable rows.
- Emphasize current status and next required action.
- Keep audit visibility strong.

Target build: v3.2.4.

### 9. Roster

Professional score: B

What works:
- Strong backbone for suite data.
- Print/export options are useful.

Issues:
- Roster risks becoming a spreadsheet wall.
- Cost visibility and operational fields need clean grouping.

Recommendations:
- Add roster summary header: active, archived, shift distribution, missing fields.
- Move advanced print/export to secondary actions.
- Use expandable employee detail for less common fields.

Target build: v3.2.4.

### 10. Employee Profile

Professional score: B-

What works:
- Good idea as a cross-module employee hub.

Issues:
- It should become more central to People workflow.
- Needs cleaner summary and clear module source labels.

Recommendations:
- Redesign into Overview, Attendance, Training, Uniforms, Roster Details, Notes.
- Show data source conflicts if roster and attendance names/ranks differ.
- Add action buttons that jump to source modules.

Target build: v3.2.4.

### 11. Schedule

Professional score: B

What works:
- Schedule authority logic is important.
- Print/share improvements are valuable.

Issues:
- It needs to remain visually clear, especially around Open/Pending/Closed logic.

Recommendations:
- Add compact schedule legend.
- Keep cost/admin-only info out of standard view.
- Preserve print clarity over screen cleverness.

Target build: v3.2.4.

### 12. Training

Professional score: B

What works:
- Good top-level People module.
- Optional/non-required training logic is valuable.

Issues:
- Needs stronger due-soon/missing-first hierarchy.

Recommendations:
- Default view should emphasize overdue, due soon, missing.
- Add training readiness cards.
- Add employee-level training summary links.

Target build: v3.2.4.

### 13. Uniform Accountability

Professional score: B+

What works:
- Practical and mature.
- Print selector and pants-needed action solve real work.

Issues:
- Could benefit from clearer issue queues.

Recommendations:
- Split by Needs Order, Issued, Replacement Due, Archived/Retired.
- Add employee-level uniform summary.
- Keep bulk actions admin-only and strongly labeled.

Target build: v3.2.4.

### 14. Office Supplies

Professional score: B-

What works:
- Useful simple tracker.

Issues:
- It can become a procurement system if not controlled.
- Table is wide.

Recommendations:
- Default to low/out/ordered view.
- Move cost to admin-only summary.
- Keep this module intentionally simple.

Target build: v3.2.5.1.

### 15. Task Tracker

Professional score: B

What works:
- Strong operational catch-all.
- Weekly update/draft concept is useful.

Issues:
- Toolbar is crowded.
- Task tables can be visually heavy.

Recommendations:
- Create primary tabs/filters: Open, Overdue, Blocked, Due Soon, Completed.
- Move draft/email/export/import/backup to action menu.
- Make next action and blocker visually prominent.

Target build: v3.2.5.1.

### 16. Shift Reports

Professional score: B

What works:
- Correct role as source intake/history.
- Handoff to Shift Intelligence is the right pattern.

Issues:
- Name may still confuse users who expect “reports” to be analysis.
- Intake and history should be visually separated.

Recommendations:
- Consider label “Import Shift Reports” in nav, keeping internal module ID unchanged.
- Show post-import result clearly: report saved, items created, review next.
- Keep raw source history separate from operational decisions.

Target build: v3.2.5.1.

### 17. Shift Intelligence

Professional score: B+

What works:
- Best strategic module for operational maturity.
- Intake buckets, matching, watchlist, dormancy, reference-only logic are correct.

Issues:
- Needs the most professional UX care because it is decision-heavy.
- Suggested matching should explain itself more clearly.

Recommendations:
- Redesign as Intake Review and Active Watchlist with stronger visual separation.
- Add match reason chips: same category, location, wording, repeated date.
- Make Reference Only and Ignore calm, not scary.
- Make Needs Action the dominant queue.

Target build: v3.2.5.1.

### 18. Executive Report Center

Professional score: B

What works:
- Good executive reporting expansion.
- Executive/compliance categories are promising.

Issues:
- Report list could become long.
- Report preview and export controls need clear hierarchy.

Recommendations:
- Group reports into cards with purpose statements.
- Add “best for” labels: executive briefing, supervisor review, audit support, monthly archive.
- Add preview-before-print standard.

Target build: v3.2.6 and v3.5.0.

### 19. Data Health

Professional score: B+

What works:
- Becoming a true control center.
- Live Data Clarity and Backup Manager are major trust improvements.

Issues:
- It is information-dense.
- Some panels may overwhelm non-admin users.

Recommendations:
- Split into Overview, Live Data, Backups, QA, Module Inventory.
- Show green/yellow/red summary first.
- Put technical details behind expandable panels.

Target build: v3.2.6.

### 20. Restore Center

Professional score: B

What works:
- Safer restore path is a major improvement.
- Preview and confirmations are correct.

Issues:
- Restore is inherently scary and needs calm wording.

Recommendations:
- Use a stepper: Select Module -> Choose Backup -> Preview -> Confirm -> Restore.
- Clearly show what will be replaced.
- Show before-restore backup status after completion.

Target build: v3.2.6.

### 21. Backup Manager

Professional score: B+

What works:
- Tiered retention is appropriate.
- Preview-first cleanup is correct.

Issues:
- Needs very clear protected-versus-cleanable language.

Recommendations:
- Add badges for protected backup types.
- Add estimated recovery point coverage.
- Add “why this backup is kept/deleted” explanations in cleanup preview.

Target build: v3.2.6.

### 22. Change Log

Professional score: B-

What works:
- Useful for version history.

Issues:
- Can become another wall of text.

Recommendations:
- Group by version and theme.
- Make current version summary first.
- Use expandable historical sections.

Target build: v3.2.6.

### 23. Other Programs

Professional score: B-

What works:
- Useful launcher.

Issues:
- Risk of becoming a dumping ground.

Recommendations:
- Add categories.
- Add last refreshed and path validity status.
- Keep it separate from operational data restore paths.

Target build: v3.2.6.

### 24. Settings / Roles

Professional score: B-

What works:
- Functional admin control.
- Security posture panel is useful.

Issues:
- PIN/role limitations need clear language.
- Settings can feel technical.

Recommendations:
- Split into Users/Roles, Suite Paths, Coverage Rules, Security Posture, System Defaults.
- Add permission matrix.
- Clarify that role gate is not network authentication.

Target build: v3.2.6 and v3.6.0.

## Code-Level UI Observations

### Main front-end file size
`app/index.html` is now large enough to be a maintainability risk. It contains markup, CSS, routing, state, business rules, reports, parsing, restore flows, UI helpers, and module renderers.

Recommendation:
- Do not rewrite immediately.
- Start by separating UI helpers and module render functions during v3.3.0.

### Inline styles
There are many inline style attributes inside templates. They make rapid development easy but weaken design consistency.

Recommendation:
- Move recurring inline styles into named CSS utility classes during v3.2.2.

### Render functions
Render functions are numerous and powerful. The required render-function guard is a good safety net and should remain.

Recommendation:
- Add a future lightweight smoke-test harness that renders each module and checks for thrown exceptions.

### Shared components
The app already has concepts of screenGuide, workflowBanner, cards, tables, chips, and notices. These should become a deliberate component library.

Recommendation:
- Create a Design System section in code comments and CSS.
- Convert one-off markup into reusable helpers over time.

## Priority Backlog

### Highest Priority
1. Standardize page headers and action bars.
2. Standardize buttons and destructive action patterns.
3. Rebuild Home as a calmer command center.
4. Move risky data actions into consistent Data Actions menus.
5. Improve restore/backup stepper language.
6. Reduce table/action clutter in Attendance, Tasks, Shift Intelligence, and Roster.

### Medium Priority
1. Improve empty states.
2. Standardize chips/badges.
3. Improve global employee search placement.
4. Add clearer report purpose labels.
5. Add expandable technical detail in Data Health.

### Lower Priority
1. Minor wording cleanup across release notes.
2. Historical Change Log compaction.
3. Optional visual polish for print headers.

## Recommended Next Build

### v3.2.2 - Professional Design System Pass

This should implement the shared visual system before redesigning individual screens. The design system should include:

- Page header standard
- Action bar standard
- Button hierarchy
- Card variants
- Table variants
- Filter toolbar pattern
- Empty state pattern
- Modal pattern
- Confirmation pattern
- Status badge/chip pattern
- Admin-only/danger action standard

After v3.2.2, the suite will be ready for targeted screen redesigns.


---

## Archived Source: `UI-UX-AUDIT-v3.2.2.2.md`

# v3.2.2.2 Navigation Dropdown Hover Fix

## Purpose
Small patch after the professional design-system rerun. The grouped top navigation dropdowns were closing when the pointer crossed the small gap between the group button and its menu.

## Fix
- Removed the dead hover gap by bringing the dropdown menu flush with the group button.
- Added a small invisible hover bridge under each nav group so moving downward into the dropdown remains natural.
- Kept focus-within behavior so keyboard/click focus still keeps menus open.
- No data model changes.
- v3.2.3 remains the next planned Home / Command Center Redesign.
