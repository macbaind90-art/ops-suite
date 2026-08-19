# Build Validation - v3.3.0.1

## Release
- Display/release version: v3.3.0.1
- Internal .NET version: 3.3.0.1
- Release name: Schedule Assignment Picker
- Baseline: v3.3.0 Code Organization / Modularization

## Requested Behavior Validation
- Mock schedule employee pool uses the full active roster: Passed.
- Mock schedule assignment choices no longer filter by normal shift, gate shift, section, or post: Passed.
- Archived/inactive roster employees remain excluded: Passed.
- Cell assignment search matches partial employee name: Passed.
- Cell assignment search matches employee number (EID): Passed.
- Search results display employee name, EID, rank, and shift: Passed.
- Open/Pending/Closed schedule cells autofocus the search field: Implemented and static contract verified.
- Selection preserves the existing rank/name schedule-label format rather than storing EID: Passed by code-path review.
- Existing Closed/Open/Pending controls remain available: Passed.
- Existing schedule copy/paste controls remain available: Passed.
- Live schedule employee suggestions retain the existing section/shift contextual filter: Passed by code-path review.
- Mock schedule changes remain isolated from live schedule authority and reporting: Existing v3.2.6.2 contract preserved.

## Front-End Validation
- JavaScript syntax check across all app modules and validator: Passed.
- Required render/action function guard: Passed.
- Front-end module registry: 10 / 10 expected modules loaded.
- Major module render smoke: 16 / 16 passed.
- Attendance subview render smoke: 6 / 6 passed.
- Roster/Schedule/Training/Uniforms/Analytics view smoke: 5 / 5 passed.
- Named JavaScript functions: 851.
- Duplicate named function declarations: 0.
- Inline action targets: 209.
- Missing inline action targets: 0.
- Startup gate complete-module test: Passed.
- Startup gate missing-module rejection test: Passed.
- Permanent CI validation now includes mock full-roster and name/EID schedule-search assertions: Passed.

## XML / .NET Version Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Manifest XML declaration exactly `<?xml version="1.0" encoding="utf-8"?>`: Passed.
- Project `<Version>`: 3.3.0.1.
- Project `<FileVersion>`: 3.3.0.1.
- Project `<AssemblyVersion>`: 3.3.0.1.
- Manifest `assemblyIdentity`: 3.3.0.1.
- Runtime environment / lock-file version: 3.3.0.1.
- Four-part maximum .NET version format: Passed.

## Build / Repository Controls
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub workflow runs modular front-end validation before .NET build: Passed.
- GitHub Windows artifact name aligned to v3.3.0.1: Passed.
- `.git` folder absent: Passed.
- Seed JSON files unchanged from v3.3.0 baseline: Passed.
- Packaged standalone/specialist program files unchanged from v3.3.0 baseline: Passed.
- README updated: Passed.
- `ROADMAP-v4.0.md` updated and v3.4.0 remains next major phase: Passed.
- `SCHEDULE-ASSIGNMENT-PICKER-v3.3.0.1.md` present: Passed.

## Local Publish
A local .NET publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the Windows EXE build authority.
