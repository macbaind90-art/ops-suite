# PWADC Security Operations Suite Roadmap to v4.0

## Current Position

Current milestone: **v3.2.5 - Operations Workflow Redesign**.

The suite is now beyond prototype stage. It has enough operational value that the next development era should be disciplined: design consistency, data reliability, modular code, security hardening, performance, and eventually a v4.0 platform architecture release.

## Architecture Decision: Language / Stack

### Recommendation
Stay with the current stack for the v3.x line:

- C# / .NET Windows wrapper
- WebView front-end
- HTML / CSS / JavaScript
- Shared network JSON data files
- GitHub Actions Windows build

### Do not move to Rust right now
Rust may be useful later for a hardened data engine, file-locking service, or high-integrity local service. It does not currently solve the biggest pain points: screen density, workflow clarity, UI consistency, and monolithic front-end code.

### Do not move to Ruby
Ruby is not a good fit for a Windows desktop operations suite distributed as an internal EXE. It would complicate distribution and would not materially improve the UI or data safety.

### Likely v4.0 architecture
The best v4.0 path is likely:

- C# / .NET shell remains
- WebView2 front-end remains
- front-end becomes modular
- shared data layer becomes stricter
- possible SQLite or structured local database layer
- stronger audit/security model
- migration tools from v3 JSON data

## Version Roadmap

## Roadmap Status

- ~~v3.2.1 - Full UI / UX Audit + Roadmap Anchor~~ Completed
- ~~v3.2.2 - Professional Design System Pass~~ Completed
- ~~v3.2.2.1 - High-Intelligence Professional Design System Rerun~~ Completed
- ~~v3.2.2.2 - Navigation Dropdown Hover Fix~~ Completed
- ~~v3.2.3 - Home / Command Center Redesign~~ Completed
- ~~v3.2.3.1 - UI Render Fix / Undefined Helper Sweep~~ Completed
- ~~v3.2.3.2 - GitHub Version Format Fix~~ Completed
- ~~v3.2.4 - People Workflow Redesign~~ Completed
- ~~v3.2.5 - Operations Workflow Redesign~~ Completed
- **v3.2.6 - Reports / Data / Admin Redesign** Next
- v3.3.0 - Code Organization / Modularization
- v3.4.0 - Data Layer / Reliability Upgrade
- v3.5.0 - Reporting / Compliance Maturity
- v3.6.0 - Role / Security Maturity
- v3.7.0 - Workflow Intelligence / Smart Assist
- v3.8.0 - Performance / Scale Pass
- v3.9.0 - v4.0 Migration Planning
- v4.0 - Platform Architecture Release



### ~~v3.2.1 - Full UI / UX Audit + Roadmap Anchor~~ Completed
- Screen-by-screen audit
- Shared UI element review
- Professional design recommendations
- v4.0 roadmap stored in repo
- No major operational feature expansion

### ~~v3.2.2 - Professional Design System Pass~~ Completed
- Standardize page headers
- Standardize screen guide cards
- Standardize button hierarchy
- Standardize cards, tables, chips, filters, toolbars, forms, modals, and empty states
- Add design tokens / CSS variables where needed
- Reduce inline styling

### ~~v3.2.2.1 - High-Intelligence Design System Rerun~~ Completed
- Re-audit shared UI primitives at higher depth before Home redesign
- Remove duplicated design CSS from print/export templates
- Tighten form labels, modal headers/actions, empty states, and responsive spacing
- Preserve v3.2.3 as the Home / Command Center redesign phase

### ~~v3.2.2.2 - Navigation Dropdown Hover Fix~~ Completed
- Fixed dropdown hover dead zone
- Preserved click/focus behavior for navigation menus

### ~~v3.2.3 - Home / Command Center Redesign~~ Completed
- Rebuilt Home around one lead priority and compact remaining queues
- Reduced noise by keeping secondary stats behind collapsible panels
- Added Today’s Priority area
- Added System Snapshot area
- Added Recent Activity area
- Kept daily decisions above the fold


### ~~v3.2.3.1 - UI Render Fix / Undefined Helper Sweep~~ Completed
- Fixed missing Home Shift Intelligence count helpers
- Added shared workflow banner helper used by People and Operations screens
- Added report-window and employee lookup helpers used by print/export paths
- Added stronger undefined-helper sweep and major screen render smoke test

### ~~v3.2.3.2 - GitHub Version Format Fix~~ Completed
Corrected .NET version metadata to four numeric components and swept the repo for invalid version strings so GitHub Actions can build successfully.

### ~~v3.2.4 - People Workflow Redesign~~ Completed
- Added a shared People Workflow strip across Attendance, Roster, Employee Profile, Training, and Uniforms
- Added Employee Profile People Command tiles for patterns, notices, training, uniforms, and schedule assignments
- Improved People lane action order and screen guidance
- Kept HR-sensitive decisions tied to source modules rather than hiding them in summary cards

### ~~v3.2.5 - Operations Workflow Redesign~~ Completed
- Added a shared Operations Workflow strip across Shift Reports, Shift Intelligence, Task Tracker, and Office Supplies
- Clarified Import -> Review -> Track -> Resolve -> Report
- Added operational lifecycle panel and decision rule language
- Added create-task handoff from Shift Intelligence watchlist issues

### v3.2.6 - Reports / Data / Admin Redesign
- Improve Executive Report Center, Data Health, Restore Center, Backup Manager, Change Log, Settings, Other Programs
- Make admin tools powerful but calm
- Improve restore and cleanup previews
- Improve audit review

### v3.3.0 - Code Organization / Modularization
- Split large front-end logic into maintainable files
- Separate UI helpers from business rules
- Separate report builders
- Separate attendance rules
- Separate shift intelligence matcher
- Separate backup/restore helpers
- Keep the same EXE and data files

### v3.4.0 - Data Layer / Reliability Upgrade
- Review JSON limits
- Improve file locking and save conflict detection
- Add module schema stamps
- Improve stale-data detection
- Prepare optional SQLite migration plan

### v3.5.0 - Reporting / Compliance Maturity
- Presentation-grade report layouts
- Compliance packs
- Attendance trend summaries
- Training readiness reports
- Shift Intelligence trend reports
- Staffing/cost packages

### v3.6.0 - Role / Security Maturity
- Improve permission model
- Improve audit filters
- Improve admin-only action consistency
- Improve export and restore permissions
- Clarify role-gate limitations

### v3.7.0 - Workflow Intelligence / Smart Assist
- Internal app reminders and prompts
- Dormant issue suggestions
- Training due soon prompts
- Recurring task templates
- Review queue suggestions
- Anomaly detection improvements

### v3.8.0 - Performance / Scale Pass
- Large data testing
- Faster rendering
- Table optimization
- Report generation performance
- Startup load behavior
- Backup manager speed

### v3.9.0 - v4.0 Migration Planning
- Decide JSON versus SQLite / structured layer
- Decide front-end framework or modular vanilla JS
- Map data migration
- Map backup migration
- Write v4.0 design specification

### v4.0 - Platform Architecture Release
- Modular front-end
- Stronger data layer
- Stronger audit/security model
- Migration tools
- Executive-grade reporting
- Stable platform identity

## Guardrail

Do not let roadmap work become feature confetti. Every build should answer one question: does this make the suite easier to use, safer to trust, easier to maintain, or more professional to present?

