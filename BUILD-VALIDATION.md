# PWADC Security Operations Suite - Current Build Validation

## Build
- Version: **3.5.0.2**
- Release: **Attendance Grid Visual Status**
- Baseline: **v3.5.0.1 - Attendance Daily/Grid Usability**

## Attendance Policy Contract
- Rolling negative-point window: **90 days**
- Rolling call-off classification window: **14 days**
- Positive attendance award: **+1 after 12 clean working days**
- Maximum positive credit bank: **2**
- Positive credits offset and are consumed by negative points
- Corrective thresholds: **3 / 6 / 9**
- NE remains zero-point Not Employed
- Backup-first controlled legacy-data migration
- Daily Entry grouped in operational shift order: **3rd / 1st / 2nd / Gate / Reception**
- 90-Day Grid supports **All Employees** and **Single Employee** views
- All Employees grid is separated into **operational shift sections**
- Grid visual status: **Present green / approved blue / Off unhighlighted / NE blacked out**
- Point-action visual status: **0.5-1.5 yellow / 2+ red / earned positive credit green +1**
- Employee-name point status: **green <3 / yellow 3-6.99 / red 7+**

## Source Validation Result
- Full modular front-end validator: **PASS**
- Major modules: **16/16 PASS**
- Attendance view smoke tests: **6/6 PASS**
- Roster/Schedule view smoke tests: **5/5 PASS**
- Named JavaScript functions: **917 / no duplicate declaration failure**
- Inline action targets: **225 resolved**
- Task Tracker print regression: **PASS**
- Attendance Point System regression: **PASS**
- Daily Entry grouped-shift/order regression: **PASS**
- 90-Day Grid All Employees option regression: **PASS**
- 90-Day Grid shift-section regression: **PASS**
- 90-Day Grid status-color regression: **PASS**
- Employee-name point-status color regression: **PASS**
- JavaScript syntax sweep: **PASS**
- Actual 2026-09-09 Attendance backup parsed successfully: **7,911 entries / 42 employee records**
- Actual-data migration simulation: **552 legacy records converted; 2 legacy U records preserved for manual review**
- `.git` in source package: **NOT PRESENT**
- Root Markdown control: **6 standing documents**

## Windows Build Status
The .NET Windows compile/publish is intentionally left for the GitHub Actions run after this source package is uploaded to `main`. The included workflow performs restore, build, self-contained `win-x64` publish, front-end validation, Task Tracker print validation, and Attendance Point System validation.
