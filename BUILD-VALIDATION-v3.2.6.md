# Build Validation - v3.2.6

Validation date: August 4, 2026

## Release
- Display/release version: v3.2.6
- Internal .NET version: 3.2.6.0
- Release focus: Reports / Data / Admin Redesign

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed.
- Inline action-handler function sweep: Passed.
- Duplicate top-level function declaration sweep: Passed.
- Full visible-module render: Passed.
- Major module render smoke test: Passed for:
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
- Report Center selection smoke test: Passed for all 14 production report identifiers.
- Report routing coverage: Passed. Every report catalog identifier has a matching preview/print route and CSV route.
- Settings section smoke test: Passed for all seven sections:
  - General
  - Users & Roles
  - Labor Assumptions
  - Coverage Requirements
  - Data & Recovery
  - Standalone Programs
  - Restricted Actions
- Data Health severity-state render test: Passed for All, Critical, Warning, and Informational findings.
- Restore Center populated-backup and preview-state render test: Passed.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.0` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- `.git` directory absent: Passed.
- README updated for v3.2.6: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6 complete: Passed.
- `ROADMAP-v4.0.md` marks v3.3.0 as next: Passed.
- Emergency procedure documents excluded from the application repository: Passed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.
