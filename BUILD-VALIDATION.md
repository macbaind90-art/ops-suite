# Build Validation - v3.3.0.7

## Release
- Version: 3.3.0.7
- Release name: Attendance Print Employee Scope
- Baseline: v3.3.0.6 clean repository

## Functional Scope
- Print scope supports All Active Employees: Passed.
- Print scope supports By Shift: Passed.
- Print scope supports Selected Employees: Passed.
- Selected Employees supports one or multiple employees: Passed.
- Employee picker includes name search and Roster EID when a roster match exists: Passed.
- Custom-group report output excludes non-selected employees: Passed.
- Custom-group aggregate total uses only selected employees: Passed.
- Discipline-only MM/DD date rule remains active: Passed.
- P and all non-discipline categories remain totals-only: Passed.
- Zero-total category suppression remains active: Passed.
- Compact portrait layout remains active: Passed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Required render/action function guard: Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Seeded selected-employee print test: Passed.
- Attendance print modal selected-employee controls: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Five-Part .NET Version Sweep: Passed.
  1. Project Version = 3.3.0.7.
  2. File Version = 3.3.0.7.
  3. Assembly Version = 3.3.0.7.
  4. Manifest `assemblyIdentity` = 3.3.0.7.
  5. Runtime environment version = 3.3.0.7.
- All controlled version values contain no more than four numeric components: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.7: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Regression / Scope Integrity
- Seed data unchanged from v3.3.0.6: Passed.
- Specialist programs unchanged from v3.3.0.6: Passed.
- No Shift Operations, Schedule, HPW, labor, or shared JSON contract changes.
- No `.git` directory included: Passed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.
