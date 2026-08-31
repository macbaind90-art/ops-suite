# PWADC Security Operations Suite - Current Build Validation

## Build
- Version: **3.4.1.1**
- Release: **Task Tracker Print Customization**
- Baseline: **v3.4.1.0 - Stale Write + Conflict Detection**

## Controlled Scope
- Added read-only Task Tracker printing.
- Added Current filtered view and All task records scopes.
- Added independently selectable operational print columns.
- Excluded Actions from printable Task Tracker fields.
- Preserved existing Task Tracker filters, sort behavior, JSON persistence, and revision-aware stale-write protection.
- No Attendance, Roster, Schedule, Shift Reports, Shift Intelligence, HPW, labor, seed-data, specialist-program, or shared-data architecture changes.

## Validation Result
- GitHub Actions Windows run **#200**: **PASS**.
- Full modular front-end validator: **PASS**.
- Major modules: **16/16 PASS**.
- Attendance views: **6/6 PASS**.
- Roster/Schedule views: **5/5 PASS**.
- Registered front-end modules: **10/10 PASS**.
- Named JavaScript functions: **879 / no duplicate declaration failure**.
- Inline action targets: **221 resolved**.
- Task Tracker print regression validator: **PASS**.
- Selectable Task Tracker columns: **10/10 PASS**.
- Actions column exclusion: **PASS**.
- Current-filter scope preservation: **PASS**.
- Read-only Task Tracker print contract: **PASS**.
- .NET restore: **PASS**.
- .NET build: **PASS with 0 errors**; the runner reported one WindowsBase/WebView2 reference-resolution warning.
- Self-contained Windows x64 publish: **PASS**.
- Windows build artifact upload: **PASS**.
- Manifest XML declaration/version checks: **PASS**.
- Four-part version controls / five-part version rejection sweep: **PASS**.
- Root documentation structure: **PASS - 6 controlled Markdown files**.
- `.git` in clean source package: **NOT PRESENT**.
- Final ZIP integrity: **PASS**.
- Extracted final ZIP critical revalidation: **PASS**.

GitHub Actions remains the authoritative Windows EXE build path for this release.
