# PWADC Security Operations Suite v3.2.5.1

## v3.2.5.1 Manifest XML Startup Fix

This hotfix corrects a Windows startup failure caused by an invalid application manifest XML declaration.

### Fix
- Restored the manifest XML declaration to `<?xml version="1.0" encoding="utf-8"?>`.
- Kept the application identity/version at `3.2.5.1`.
- Updated `.csproj`, `app.manifest`, and GitHub artifact naming to valid four-part versioning.
- Added a manifest declaration check to prevent this side-by-side startup failure from returning.

### Included foundation
This build keeps the v3.2.5 Operations Workflow Redesign intact:
- Shift Reports, Shift Intelligence, Task Tracker, and Office Supplies share one Operations Workflow lane.
- Shift Intelligence watchlist issues can create Task Tracker follow-ups.
- README and roadmap continue tracking completed roadmap phases.

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
- **v3.2.6 - Reports / Data / Admin Redesign** Next
- v3.3.0 - Code Organization / Modularization
- v3.4.0 - Data Layer / Reliability Upgrade
- v3.5.0 - Reporting / Compliance Maturity
- v3.6.0 - Role / Security Maturity
- v3.7.0 - Workflow Intelligence / Smart Assist
- v3.8.0 - Performance / Scale Pass
- v3.9.0 - v4.0 Migration Planning
- v4.0 - Platform Architecture Release

## Architecture Direction
Continue with the current C# / WebView / HTML / CSS / JavaScript stack for now. The next architecture move is modularization, not Rust or Ruby migration.
