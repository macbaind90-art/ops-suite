# Build Validation - v3.3.0

Validation date: August 19, 2026

## Release
- Display/release version: v3.3.0
- Internal .NET version: 3.3.0.0
- Release focus: Code Organization / Modularization

## Architecture Validation
- `app/index.html` reduced from the v3.2.6.3 monolithic application file to a lightweight document shell: Passed.
  - v3.2.6.3 baseline: 808,575 bytes.
  - v3.3.0 shell: 2,190 bytes.
- Primary application CSS externalized to `app/assets/styles.css`: Passed.
- Externalized application CSS is byte-equivalent to the v3.2.6.3 primary design-system stylesheet: Passed.
- Inline application `<style>` block removed from `index.html`: Passed.
- Inline application `<script>` block removed from `index.html`: Passed.
- Ordered front-end load contract contains 10 functional modules plus registry/startup gate: Passed.
- All 10 expected functional modules register successfully: Passed.
- Startup with the complete module set calls `init()` exactly once: Passed.
- Startup with a missing module is blocked and produces an explicit module-load failure: Passed.
- C# `MainForm` converted to partial-class ownership files: Passed.
- Baseline/new C# callable method inventory: 52 / 52, no missing or added method names: Passed.
- Desktop bridge message contracts: 18 baseline / 18 v3.3.0, exact contract list preserved: Passed.
- Seed JSON files unchanged from v3.2.6.3: Passed.
- Packaged standalone program files unchanged from v3.2.6.3: Passed.

## JavaScript and Render Validation
- `node --check` syntax validation for every `app/js/*.js` file: Passed.
- `tools/validate-frontend.js`: Passed.
- Required render/action function guard: Passed; 85 required functions present.
- Duplicate named function declaration sweep: Passed; 843 named functions / 843 unique.
- Inline action-handler target sweep: Passed; 205 bare named action targets resolved.
- Front-end module registry: Passed; 10/10 expected functional modules registered with no unexpected modules.
- Seeded major-module render smoke test: Passed for all 16 modules:
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
- Attendance view smoke test: Passed for Daily Entry, 90-Day Grid, Attendance Review, Patterns, Notice Workflow, and Audit Log.
- Roster-area smoke test: Passed for roster, schedule, training routing, uniforms, and analytics.
- QA Guardrail panel exposes front-end module registry status: Passed.

## Functional Regression Control
v3.3.0 is intentionally structural. The following operational contracts were preserved:
- Attendance code definitions, including CO and NCNS: Preserved.
- Attendance Totals print workflow: Preserved.
- Live schedule authority for HPW and labor reporting: Preserved.
- Schedule copy/paste, guarded clear, and mock schedule workflows: Preserved.
- Mock schedules remain isolated from live reporting until explicitly applied: Preserved.
- Shift Reports / Shift Intelligence behavior: Preserved; no recalibration included.
- Reports / Data / Admin governance workflow: Preserved.
- Task Tracker behavior: Preserved.
- Shared data root and JSON file names: Preserved.
- PT / FT / TempToHire loaded-cost assumptions: Preserved.
- Role behavior and existing high-impact backup-first controls: Preserved.

## XML and Manifest Validation
- `SecurityOperationsSuite.csproj` XML parse: Passed.
- `app.manifest` XML parse: Passed.
- Exact manifest XML declaration: Passed.

Required declaration retained exactly:

```xml
<?xml version="1.0" encoding="utf-8"?>
```

## Five-Part .NET Version Sweep
All controlled runtime/build version locations use `3.3.0.0` and contain no more than four numeric components:

1. Project Version: Passed.
2. File Version: Passed.
3. Assembly Version: Passed.
4. Manifest `assemblyIdentity`: Passed.
5. Runtime environment version: Passed.

The lock-file runtime version also matches `3.3.0.0`.

## Repository and Workflow Validation
- `.github/workflows/build-windows.yml` present: Passed.
- GitHub Actions Windows runner present: Passed.
- Node 20 setup step present: Passed.
- Modular front-end validation step present before .NET build: Passed.
- .NET 8 setup present: Passed.
- `dotnet build` step present: Passed.
- self-contained win-x64 `dotnet publish` step present: Passed.
- GitHub artifact name aligned to v3.3.0: Passed.
- README updated for v3.3.0: Passed.
- `ROADMAP-v4.0.md` marks v3.3.0 complete and v3.4.0 next: Passed.
- `ARCHITECTURE-v3.3.0.md` present: Passed.
- `.git` folder excluded: Passed.
- Emergency procedure documents remain excluded from the application repository: Passed.

## Scope / Delta Control
Compared with the v3.2.6.3 clean repository:
- 21 new architecture/validation/module files were added.
- 7 existing files were changed.
- No existing repository file was removed.
- Seed and packaged specialist-tool content is unchanged.

## Local Publish Status
A local Windows .NET build/publish was not performed because the sandbox does not have the .NET SDK installed. GitHub Actions remains the authoritative Windows EXE build environment.
