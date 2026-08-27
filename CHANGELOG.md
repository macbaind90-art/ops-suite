# PWADC Security Operations Suite - Changelog

This file is the controlled release history for the PWADC Security Operations Suite. Detailed historical build notes that previously existed as separate root-level Markdown files are consolidated in `docs/archive/HISTORICAL-RELEASE-NOTES.md`.

## Current Release

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
