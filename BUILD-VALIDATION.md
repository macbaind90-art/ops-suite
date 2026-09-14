# PWADC Security Operations Suite - Current Build Validation

## Build
- Version: **3.5.0.8**
- Release: **Command Center Attendance Workflow Alignment**
- Baseline: **v3.5.0.7 - Positive Credit Immediate Paydown**

## Attendance Policy Contract
- Rolling negative-point window: **90 days**
- Rolling call-off classification window: **14 days**
- Tardy points: **T<5 = 0 / T5-14 = 0.5 / T15+ = 1**
- Historical generic tardies migrated to T<5 calculate at **0 points**
- Positive attendance award: **+1 after 12 clean scheduled working days**
- Newly earned positive credit first reduces active negative points immediately
- Any unused remainder is banked after active negative points are paid down
- Maximum positive credit balance: **3 at any one time**; there is **no lifetime earning cap**
- After credits are consumed, employees can earn back toward the 3-point maximum through later 12-workday clean cycles
- Banked positive credits continue to offset future chargeable attendance points dollar-for-dollar
- Positive credit can carry fractional remainder when only part of an award is required
- Positive awards earned after a manual current-point adjustment reduce the controlled adjusted balance before banking
- Corrective thresholds: **3 / 6 / 9**
- NE remains zero-point Not Employed
- Daily Entry grouped in operational shift order: **3rd / 1st / 2nd / Gate / Reception**
- Attendance work/off authority: **Live Schedule primary / Roster RDO fallback**
- Mock schedules are excluded from Attendance work/off and positive-credit calculations
- Past finalized attendance is not automatically rewritten by current schedule changes
- 90-Day Grid supports All Employees and Single Employee views with operational shift sections
- 90-Day Grid date order: ending/current date left; older dates right
- Historical grid edits require a reason and create correction-history/audit records
- Manual current-point adjustments require a reason and pre-save backup
- Grid visual status retained: Present green / approved blue / Off unhighlighted / NE blacked out / low point actions yellow / high point actions red / positive award green
- Employee-name point status retained: green <3 / yellow 3-6.99 / red 7+

## Source Validation Result
- Full modular front-end validator: **PASS** - 16 major modules / 6 Attendance views / 5 Roster views / 939 named functions / 229 inline action targets / 10 registered modules
- Task Tracker print regression: **PASS**
- Attendance Point System regression: **PASS**
- Roster-to-Attendance population regression: **PASS**
- Live Schedule Attendance authority regression: **PASS**
- Positive-credit immediate-paydown regression: **PASS**
- Home Attendance workflow regression: **PASS**
- Positive-credit partial/fractional carryover regression: **PASS**
- 3-point balance cap with re-earning after use: **PASS**
- Manual adjusted-balance positive-credit paydown: **PASS**
- Pre-adjustment credit chronology: **PASS**
- JavaScript syntax sweep: **PASS**
- `.git` in source package: **NOT PRESENT**
- Root Markdown control: **6 standing documents**

## Windows Build Status
The .NET Windows compile/publish is intentionally left for the GitHub Actions run after this source package is uploaded to `main`. The included workflow performs front-end and targeted regression validation, restore, build, and self-contained `win-x64` publish.

## v3.5.0.8 Targeted Regression
- Home no longer calls or navigates to legacy Attendance Pattern or Notice queues.
- Home Daily Attendance completion is schedule-aware and uses the same Live Schedule / Roster RDO authority as Attendance.
- Corrective-action due count is derived from current active points versus the employee's last recorded corrective action.
- Home exposes Point Review, Corrective Action, 90-Day Grid, current positive-credit bank, and 7+ point risk without changing underlying point calculations.
- People Workflow and Employee People Command use active points, positive bank, clean working days, and corrective-action status.
- Start Here reflects the current Attendance workflow: Daily Entry → 90-Day Grid → Point Review → Corrective Action → Audit.
- Historical legacy pattern/notice data is preserved for compatibility; it is simply removed from the current Home command workflow.
- Live Schedule authority, Roster RDO fallback, manual attendance protection, positive-credit rules, stale-write controls, and atomic saves remain unchanged.
