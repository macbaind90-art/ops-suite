# Build Validation - v3.3.0.2

## Release
- Display/release version: v3.3.0.2
- Internal .NET version: 3.3.0.2
- Release name: Attendance Print Customization
- Baseline: v3.3.0.1 Schedule Assignment Picker

## Requested Behavior Validation
- Attendance Totals report orientation changed from landscape to portrait: Passed.
- User can select individual attendance-code boxes: Passed.
- Quick selectors for Discipline + Approved, Discipline Only, Approved Only, All, and Clear: Passed.
- Discipline Total can be independently included/excluded: Passed.
- Approved Total can be independently included/excluded: Passed.
- Recorded Total can be independently included/excluded: Passed.
- Each selected attendance code prints its count: Passed.
- Each selected attendance code prints occurrence dates beside the count in MM/DD format: Passed.
- CO integration test renders two occurrences as `08/01` and `08/11`: Passed.
- Existing employee/shift scope controls retained: Passed.
- Existing Week / Month / Rolling 90-Day controls retained: Passed.
- Print operation remains read-only: Passed by code-path review.

## Front-End Validation
- JavaScript syntax check across all app modules and validator: Passed.
- Required render/action function guard: Passed.
- Front-end module registry: 10 / 10 expected modules loaded.
- Major module render smoke: 16 / 16 passed.
- Attendance subview render smoke: 6 / 6 passed.
- Roster/Schedule/Training/Uniforms/Analytics view smoke: 5 / 5 passed.
- Named JavaScript functions: 856.
- Duplicate named function declarations: 0.
- Inline action targets: 210.
- Missing inline action targets: 0.
- Startup gate complete-module test: Passed.
- Startup gate missing-module rejection test: Passed.
- Permanent CI attendance-print helper test: Passed.
- Permanent CI attendance-print portrait integration test: Passed.

## XML / .NET Version Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Manifest XML declaration exactly `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Project `<Version>`: 3.3.0.2.
- Project `<FileVersion>`: 3.3.0.2.
- Project `<AssemblyVersion>`: 3.3.0.2.
- Manifest `assemblyIdentity`: 3.3.0.2.
- Runtime environment / lock-file version: 3.3.0.2.
- Four-part maximum .NET version format: Passed.

## Build / Repository Controls
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub workflow runs modular front-end validation before .NET build: Passed.
- GitHub Windows artifact name aligned to v3.3.0.2: Passed.
- `.git` folder absent: Passed.
- Seed JSON files unchanged from v3.3.0.1 baseline: Passed.
- Packaged standalone/specialist program files unchanged from v3.3.0.1 baseline: Passed.
- README updated: Passed.
- `ROADMAP-v4.0.md` updated and v3.4.0 remains next major phase: Passed.
- `ATTENDANCE-PRINT-CUSTOMIZATION-v3.3.0.2.md` present: Passed.

## Local Publish
A local .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the Windows EXE build authority.
