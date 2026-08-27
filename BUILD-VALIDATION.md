# Build Validation - v3.3.0.8

## Release
- Version: 3.3.0.8
- Release name: Roster Print Employee Scope
- Baseline: v3.3.0.7 clean repository

## Functional Scope
- Roster Print supports Current filtered roster: Passed.
- Roster Print supports All employees: Passed.
- Roster Print supports Selected employees: Passed.
- Selected employees supports one or multiple roster records: Passed.
- Employee picker includes name/EID search with rank and shift context: Passed.
- Select Visible / Select All / Clear controls present: Passed.
- Selected-employee output excludes non-selected roster records: Passed.
- Existing roster column selector remains active: Passed.
- Existing portrait/landscape threshold remains active: Passed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Required render/action function guard: Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Seeded selected-employee Roster print test: Passed.
- Roster print modal selected-employee controls: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Five-Part .NET Version Sweep: Passed.
  1. Project Version = 3.3.0.8.
  2. File Version = 3.3.0.8.
  3. Assembly Version = 3.3.0.8.
  4. Manifest `assemblyIdentity` = 3.3.0.8.
  5. Runtime environment version = 3.3.0.8.
- All controlled version values contain no more than four numeric components: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.8: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Regression / Scope Integrity
- Seed data unchanged from v3.3.0.7: Passed.
- Packaged specialist programs unchanged from v3.3.0.7: Passed.
- C# method inventory preserved: 52/52.
- Desktop bridge contracts preserved: 18/18.
- No Attendance, Shift Operations, Schedule assignment, HPW, labor, or shared JSON contract changes.
- Clean root documentation structure preserved.
- No `.git` directory included: Passed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.
