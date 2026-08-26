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

## Documentation Packaging Cleanup - 2026-08-26
- Application version remains v3.3.0.5; no executable behavior or source logic changed in this packaging cleanup.
- Root Markdown reduced to six standing documents: README, ROADMAP, ARCHITECTURE, DESIGN-SYSTEM, CHANGELOG, and current BUILD-VALIDATION.
- 40 historical/version-specific Markdown documents consolidated into `docs/archive/HISTORICAL-RELEASE-NOTES.md`.
- Historical source filenames are retained inside the consolidated archive for traceability.
- Future version-specific release history is directed to `CHANGELOG.md` rather than separate root-level Markdown files.
