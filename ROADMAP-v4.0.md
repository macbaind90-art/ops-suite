# PWADC Security Operations Suite Roadmap to v4.0

Current build: **v3.2.5.1 - Manifest XML Startup Fix**.

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

## Next
- **v3.2.6 - Reports / Data / Admin Redesign**

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
The project should stay with the current C# / WebView / HTML / CSS / JavaScript stack for the near term. The main platform risk is not the language itself. The near-term need is cleaner modular structure, stronger data reliability, and more consistent UI patterns.

Rust is not recommended yet because it would add complexity without solving the main workflow/UI issues. Ruby is not recommended for this Windows desktop EXE distribution model.

Likely v4.0 target: C# / WebView2 shell, modular front-end, stronger data layer, improved audit/security controls, and possible SQLite or structured data-layer migration after v3.4/v3.9 planning.
