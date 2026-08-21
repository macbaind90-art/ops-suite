# PWADC Security Operations Suite Roadmap to v4.0

Current build: **v3.3.0.3 - Attendance Print Zero Suppression**.

## Completed
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
- ~~v3.3.0.1 - Schedule Assignment Picker~~ Completed
- ~~v3.3.0.2 - Attendance Print Customization~~ Completed
- ~~v3.3.0.3 - Attendance Print Zero Suppression~~ Completed

## Current Governance Model
### Command Center
- Home remains the daily command summary.
- Live data source and freshness remain visible so stale, preview, or recovery data is not mistaken for current live data.

### People Lane
- Attendance, Notice Workflow, Roster, Employee Profile, Training, and Uniform Accountability remain connected as the People Workflow.
- v3.2.6.1 aligns Attendance Review with the canonical discipline codes: T, U, UE, CO, and NCNS.

### Operations Lane
- Shift Reports is the source intake and extraction workspace.
- Shift Intelligence is the decision center and active watchlist.
- The operating path remains Import → Extract → Decide → Follow Up → Close.
- Task Tracker receives owned follow-up actions.
- The backup-first Clear Shift Report Memory control remains Admin-only and affects only Shift Reports and Shift Intelligence.
- Operational calibration against additional real reports remains a deferred stabilization item, not a blocker for v3.3.0.
- v3.2.6.2 adds a controlled schedule workspace: cell copy/paste, backup-first live schedule clearing, and persistent mock schedules that remain excluded from live HPW and labor reporting until explicitly applied.
- v3.2.6.3 adds a print-ready Attendance Totals list from Attendance Review with employee/shift scope, selectable week/month/90-day periods, canonical CO/NCNS discipline totals, approved-code totals, and optional all-code detail.
- v3.3.0.1 removes mock-schedule assignment restrictions so any active roster employee can fill any mock slot and adds cell-level name/EID typeahead assignment while preserving the live schedule authority and existing schedule-label format.
- v3.3.0.2 converts Attendance Totals printing to portrait, adds user-selectable attendance and summary boxes, and prints each selected code total with MM/DD occurrence dates while leaving attendance records and thresholds unchanged.
- v3.3.0.3 suppresses selected attendance and summary boxes when the employee total is 0, leaving only meaningful attendance activity visible on the portrait management printout.

### Governance Lane
- Report Center answers the management decision and identifies the supporting source data.
- Data Health verifies whether the source data is usable and elevates critical findings first.
- Backup & Restore requires scope selection, backup selection, preview, reason, and confirmation before replacement.
- Change Log elevates high-impact actions above routine activity.
- Admin Settings separates users, labor assumptions, coverage authority, data controls, and recovery controls into governed sections.
- The governing sequence is Report → Verify → Recover → Govern.

### Specialist Tools
- Other Programs remains a controlled launcher for independent specialist tools.
- Independent tools remain isolated from the main application script to limit collision and regression risk.

### Future Emergency Operations Module
- Uploaded emergency procedure and contact documents remain intentionally excluded from v3.2.6.
- A future phase may consolidate them into an Emergency Operations Manual / Procedure module after core workflow, modularization, and data-reliability priorities are addressed.

## v3.3.0 Architecture Baseline
- `app/index.html` is now a lightweight document shell instead of the application monolith.
- CSS is externalized to `app/assets/styles.css`.
- Front-end code is separated into 10 ordered functional modules plus a module registry and startup gate.
- The module registry validates dependency presence before initialization.
- Existing render-function guardrails remain active.
- `MainForm` is separated into partial classes for the WebView shell, bridge routing, storage, backups, programs/environment, and shared models.
- Existing UI workflows, shared JSON contracts, `suite:*` bridge message types, schedule authority, attendance codes, reporting behavior, and role controls are intentionally preserved.
- `ARCHITECTURE-v3.3.0.md` is the maintenance map for future development.

## Next
### v3.4.0 - Data Layer / Reliability Upgrade
Primary objectives:
- Add explicit read/write conflict detection for shared JSON files.
- Strengthen atomic-save, validation, and recovery behavior.
- Add schema/version awareness and safer migration boundaries.
- Improve source freshness and stale-write protection.
- Preserve backup-first recovery and auditable high-impact actions.
- Evaluate SQLite only after persistence requirements and migration controls are documented.

## Future Phases
- v3.5.0 - Reporting / Compliance Maturity
- v3.6.0 - Role / Security Maturity
- v3.7.0 - Workflow Intelligence / Smart Assist
- v3.8.0 - Performance / Scale Pass
- v3.9.0 - v4.0 Migration Planning
- v4.0 - Platform Architecture Release

## Architecture Direction
The project remains on C# / WebView2 / HTML / CSS / JavaScript in the near term. v3.3.0 resolves the immediate code-concentration risk by establishing controlled front-end and Windows-host modules. The primary remaining platform risk is shared-file concurrency and data reliability. v3.4.0 should strengthen persistence, conflict handling, validation, and recovery. A structured data layer such as SQLite should be evaluated only after those requirements and migration controls are documented.
