# Build Validation - v3.2.6.1

Validation date: August 11, 2026

## Release
- Display/release version: v3.2.6.1
- Internal .NET version: 3.2.6.1
- Release focus: Attendance Review Discipline Code Fix

## Attendance Review Targeted Validation
- Canonical discipline set used by Attendance Review: Passed (`T`, `U`, `UE`, `CO`, `NCNS`).
- Canonical approved tracking set used by Attendance Review: Passed (`AL`, `V`, `E`, `LE`).
- Injected CO renders in Week, Month, and 90-Day discipline columns: Passed.
- Injected NCNS renders in Week, Month, and 90-Day discipline columns: Passed.
- CO appears in employee expandable Discipline Review history: Passed.
- NCNS appears in employee expandable Discipline Review history: Passed.
- Attendance Review table group column spans match the live code arrays: Passed.
- No attendance data migration or threshold change introduced: Passed.

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed.
- Inline action-handler function sweep: Passed.
- Duplicate named function declaration sweep: Passed.
- Major module render smoke test: Passed for all 16 modules:
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
- Attendance subview render smoke test: Passed for:
  - Daily Entry
  - 90-Day Grid
  - Attendance Review
  - Attendance Patterns
  - Notice Workflow
  - Audit Log
- Headless browser page-error check during render validation: Passed with zero page errors.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.1` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- README updated for v3.2.6.1: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6.1 complete: Passed.
- `ROADMAP-v4.0.md` retains v3.3.0 as next phase: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.
