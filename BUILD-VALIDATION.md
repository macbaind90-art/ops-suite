# Build Validation - v3.3.0.6

## Release
- Version: 3.3.0.6
- Release name: Attendance Print Date Detail Correction
- Baseline: v3.3.0.5 documentation-clean repository

## Functional Scope
- P / Present prints total only when selected: Passed.
- Approved codes AL, V, E, and LE print totals only: Passed.
- Neutral/schedule codes O, FL, and NE print totals only: Passed.
- Discipline codes T, U, UE, CO, and NCNS retain MM/DD occurrence dates: Passed.
- Zero-total category suppression remains active: Passed.
- Compact portrait Attendance Totals layout remains active: Passed.
- No attendance records, code meanings, thresholds, or notice rules changed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Required render/action function guard: Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Seeded Attendance print test confirms CO retains MM/DD dates: Passed.
- Seeded Attendance print test confirms AL date suppression: Passed.
- Seeded Attendance print test confirms P date suppression: Passed.
- Zero-value selected T suppression remains active: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Five-Part .NET Version Sweep: Passed.
  1. Project Version = 3.3.0.6.
  2. File Version = 3.3.0.6.
  3. Assembly Version = 3.3.0.6.
  4. Manifest `assemblyIdentity` = 3.3.0.6.
  5. Runtime environment version = 3.3.0.6.
- All controlled version values contain no more than four numeric components: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.6: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Regression / Scope Integrity
- Seed data unchanged from v3.3.0.5: Passed.
- Specialist programs unchanged from v3.3.0.5: Passed.
- No Shift Operations, Schedule, HPW, labor, or shared JSON contract changes.
- No `.git` directory included: Passed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.
