# Build Validation - v3.2.6.2

Validation date: August 18, 2026

## Release
- Display/release version: v3.2.6.2
- Internal .NET version: 3.2.6.2
- Release focus: Schedule Workspace Enhancements

## Schedule Workspace Targeted Validation
- Cell-level copy of a named employee assignment: Passed.
- Paste copied assignment into a different live schedule cell: Passed.
- Schedule clipboard persists while moving between cells: Passed.
- Copy/paste audit record includes source and destination context: Passed.
- Create mock schedule from the current live schedule: Passed.
- Create/hold persistent mock data in `roster.scheduleDrafts`: Passed.
- Editing a mock does not modify `roster.schedule`: Passed.
- Default `scheduleMetrics()` continues to use only the live schedule while a mock is open: Passed.
- Mock schedule export identifies the output as `MOCK / NOT PUBLISHED`: Passed.
- Return to live schedule leaves the mock saved in the library: Passed.
- Clear mock sets all daily cells to Closed while preserving rows/posts/hours: Passed.
- Clearing a mock does not change the live schedule: Passed.
- Apply Mock to Live replaces only `roster.schedule` and retains the source mock: Passed.
- Apply Mock to Live calls roster backup before live save: Passed.
- Clear Live Schedule calls roster backup before live save: Passed.
- Clear Live Schedule preserves rows, posts, coverage windows/cost hours, notes, and schedule structure: Passed.
- Clear Live Schedule sets all seven daily cells in every row to Closed (`None`): Passed.
- Apply/Clear audit entries recorded: Passed.

## JavaScript and Render Validation
- JavaScript syntax check with Node.js: Passed.
- Required render-function guard: Passed; 85 required functions present.
- Inline action-handler function sweep: Passed.
- Duplicate named function declaration sweep: Passed; 839 named functions / 839 unique.
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
- Schedule live-workspace render: Passed.
- Schedule mock-workspace render: Passed.
- Mock Schedule Library render: Passed.
- Headless Chromium page-error check during behavioral/render validation: Passed with zero page errors.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All five controlled version locations use `3.2.6.2` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- GitHub Actions `dotnet publish` step present: Passed.
- README updated for v3.2.6.2: Passed.
- `ROADMAP-v4.0.md` marks v3.2.6.2 complete: Passed.
- `ROADMAP-v4.0.md` retains v3.3.0 as next major phase: Passed.
- `.git` folder excluded: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Scope / Regression Control
The repository delta from v3.2.6.1 is limited to:
- `app/index.html`
- `MainForm.cs`
- `SecurityOperationsSuite.csproj`
- `app.manifest`
- `README.md`
- `ROADMAP-v4.0.md`
- New v3.2.6.2 release and validation documentation

No Shift Reports / Shift Intelligence logic, Attendance discipline logic, shared data path, coverage authority definitions, or loaded-cost assumptions were intentionally changed.

## Local Publish Status
A local Windows .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.
