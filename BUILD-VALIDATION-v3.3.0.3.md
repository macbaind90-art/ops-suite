# Build Validation - v3.3.0.3

## Release
- Version: 3.3.0.3
- Release name: Attendance Print Zero Suppression
- Baseline: v3.3.0.2

## Functional Scope
- Selected attendance-code boxes render only when that employee's code total is greater than 0 for the selected reporting period: Passed.
- Nonzero selected code boxes retain MM/DD occurrence dates: Passed.
- Selected Discipline Total, Approved Total, and Recorded Total boxes are suppressed when their calculated value is 0: Passed.
- Employees with no selected nonzero activity remain on the report with a blank Selected Attendance cell: Passed by implementation review.
- ALL EMPLOYEES aggregate row uses the same zero-suppression rule: Passed by implementation review.
- Portrait orientation and user-selectable attendance categories remain unchanged: Passed.

## Front-End Validation
- JavaScript syntax check across all front-end modules and validator: Passed.
- Permanent front-end validator: Passed.
- Major module render smoke: 16/16 Passed.
- Attendance view render smoke: 6/6 Passed.
- Roster/Schedule view render smoke: 5/5 Passed.
- Named JavaScript functions: 856, no duplicate named declarations.
- Inline action targets: 210, all resolved.
- Module registry: 10/10 expected functional modules registered.
- Startup missing-module gate: Passed.
- Targeted integration test selecting CO + T with only CO activity confirms CO 2 and MM/DD dates render while `T 0` does not render: Passed.

## Project / Manifest / Version Validation
- SecurityOperationsSuite.csproj XML parse: Passed.
- app.manifest XML parse: Passed.
- Manifest XML declaration exact match `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Version / FileVersion / AssemblyVersion valid four-part values: Passed.
- Version / FileVersion / AssemblyVersion aligned at 3.3.0.3: Passed.
- app.manifest assemblyIdentity version aligned at 3.3.0.3: Passed.
- GitHub Actions Windows artifact name aligned to v3.3.0.3: Passed.
- `.github/workflows/build-windows.yml` present: Passed.

## Data / Scope Integrity
- app/seed files byte-for-byte unchanged from v3.3.0.2: Passed.
- app/programs specialist tools byte-for-byte unchanged from v3.3.0.2: Passed.
- No `.git` directory included: Passed.
- No Attendance source records, code definitions, discipline thresholds, notice logic, pattern logic, Schedule authority, Shift Operations logic, or shared JSON contracts intentionally changed.

## Local Windows Publish
- .NET SDK is not installed in the ChatGPT sandbox, so local Windows publish was not run.
- GitHub Actions remains the Windows EXE build authority.
