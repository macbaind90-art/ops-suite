# PWADC Security Operations Suite v3.2.6.1


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
- **v3.3.0 - Code Organization / Modularization** Next
- v3.4.0 - Data Layer / Reliability Upgrade
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
7. **Road to v4.0:** The next priority is breaking the monolithic front end into maintainable modules before changing the data layer.

## Architecture Direction
Continue with the current C# / WebView2 / HTML / CSS / JavaScript stack. v3.3.0 should reduce monolithic-code risk through controlled modularization without changing user workflows or shared-data behavior.
