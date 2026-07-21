# PWADC Security Operations Suite v3.2.3.2

## v3.2.3.2 GitHub Version Format Fix

This maintenance release keeps the v3.2.3 Home / Command Center redesign and v3.2.3.1 render fixes, then corrects the .NET version metadata so GitHub Actions can build the Windows artifact.

### Fixed in this build
- Updated `.csproj` version fields to the required four-part numeric format: `3.2.3.2`.
- Updated `app.manifest` assembly identity to `3.2.3.2`.
- Updated the GitHub Actions artifact name to `PWADC-Security-Operations-Suite-v3-2-3-2-Windows`.
- Swept the repository for invalid five-part numeric version strings.
- Kept the prior undefined-helper fixes from v3.2.3.1.

### Roadmap status
- ~~v3.2.1 - Full UI / UX Audit + Roadmap Anchor~~ Completed
- ~~v3.2.2 - Professional Design System Pass~~ Completed
- ~~v3.2.2.1 - High-Intelligence Professional Design System Rerun~~ Completed
- ~~v3.2.2.2 - Navigation Dropdown Hover Fix~~ Completed
- ~~v3.2.3 - Home / Command Center Redesign~~ Completed
- ~~v3.2.3.1 - UI Render Fix / Undefined Helper Sweep~~ Completed
- ~~v3.2.3.2 - GitHub Version Format Fix~~ Completed
- **v3.2.4 - People Workflow Redesign** Next
- v3.2.5 - Operations Workflow Redesign
- v3.2.6 - Reports / Data / Admin Redesign
- v3.3.0 - Code Organization / Modularization
- v3.4.0 - Data Layer / Reliability Upgrade
- v3.5.0 - Reporting / Compliance Maturity
- v3.6.0 - Role / Security Maturity
- v3.7.0 - Workflow Intelligence / Smart Assist
- v3.8.0 - Performance / Scale Pass
- v3.9.0 - v4.0 Migration Planning
- v4.0 - Platform Architecture Release

### Current strategic direction
- Stay with the current C# / WebView / HTML / CSS / JavaScript stack for the v3.x line.
- Do not move to Rust or Ruby in the near term.
- Continue screen/workflow redesign before architecture changes.

### Next planned build
`v3.2.4 - People Workflow Redesign`
