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
