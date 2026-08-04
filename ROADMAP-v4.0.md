# PWADC Security Operations Suite Roadmap to v4.0

Current build: **v3.2.5.5 - Shift Operations Experience Redesign**.

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

## Next
- **v3.2.6 - Reports / Data / Admin Redesign**

## Current Project Map
### Command Center
- Home / Dashboard remains the daily command summary.
- Live data source and freshness remain visible so stale or recovery data is not mistaken for current live data.

### People Lane
- Attendance, Notice Workflow, Roster, Employee Profile, Training, and Uniform Accountability remain connected as the People Workflow.

### Operations Lane
- Shift Reports is the source intake and extraction workspace.
- Shift Intelligence is the decision center and active watchlist.
- The operating path is Import → Extract → Decide → Follow Up → Close.
- Shift Reports separates Operational Signals, Reference Context, and Ignored Noise.
- Shift Intelligence uses Intake Queue → Decision Detail → Active Watchlist.
- Task Tracker receives owned follow-up actions.
- The backup-first Clear Shift Report Memory control remains Admin-only and affects only Shift Reports and Shift Intelligence.
- Office Supplies supports operational readiness but should not become a procurement system.

### Shift Report Intelligence Model
- Active Watch Item: repeated alarm/system pattern, unresolved equipment/facility concern, safety issue, staffing coverage impact, or incident follow-up.
- Suggested Link: same location, system, alarm, or pass-down topic appears across reports and needs approval before linking.
- Reference Only: routine pass-down, false alarm with no repeat, normal staffing, trailer/dock monitoring with no stated issue, or historical context.
- Ignored / Noise: N/A, none, blank, no issues, no notifications, nothing-else-of-note language, and normal on-time roster rows.

### Future Emergency Operations Module
- The uploaded emergency procedure and contact documents are intentionally excluded from v3.2.5.5.
- A future phase may consolidate them into an Emergency Operations Manual / Procedure module after Shift Operations and the Reports / Data / Admin lane are stable.

## Future Phases
- v3.3.0 - Code Organization / Modularization
- v3.4.0 - Data Layer / Reliability Upgrade
- v3.5.0 - Reporting / Compliance Maturity
- v3.6.0 - Role / Security Maturity
- v3.7.0 - Workflow Intelligence / Smart Assist
- v3.8.0 - Performance / Scale Pass
- v3.9.0 - v4.0 Migration Planning
- v4.0 - Platform Architecture Release

## Architecture Direction
The project should remain on the current C# / WebView2 / HTML / CSS / JavaScript stack in the near term. The primary platform risks are monolithic code, shared-file reliability, inconsistent workflow patterns, and limited data-layer controls, not the programming language.

Likely v4.0 target: C# / WebView2 shell, modular front end, stronger data layer, improved audit/security controls, and possible SQLite or another structured data layer after the v3.4 and v3.9 planning phases.
