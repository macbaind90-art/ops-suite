# PWADC Security Operations Suite - Current Build Validation

## Build
- Version: **3.5.0.6**
- Release: **Live Schedule Attendance Authority**
- Baseline: **v3.5.0.5 - Roster to Attendance Population Reliability**

## Attendance Policy Contract
- Rolling negative-point window: **90 days**
- Rolling call-off classification window: **14 days**
- Tardy points: **T<5 = 0 / T5-14 = 0.5 / T15+ = 1**
- Historical generic tardies migrated to T<5 under v3.5.0.0 now calculate at **0 points** under the current tardy policy
- Positive attendance award: **+1 after 12 clean working days**
- Maximum positive credit bank: **3**
- Positive credits offset and are consumed by negative points
- Corrective thresholds: **3 / 6 / 9**
- NE remains zero-point Not Employed
- Daily Entry grouped in operational shift order: **3rd / 1st / 2nd / Gate / Reception**
- Attendance work/off authority: **Live Schedule primary / Roster RDO fallback**
- **Mock schedules are excluded** from Attendance work/off and positive-credit calculations
- **Past finalized attendance is not automatically rewritten** by current schedule changes
- 90-Day Grid supports **All Employees** and **Single Employee** views with operational shift sections
- 90-Day Grid date order: **ending/current date left; older dates right**
- Historical grid edits require a reason and create correction-history/audit records
- Manual current-point adjustments require a reason and pre-save backup; incidents through the effective date are excluded from future active-point calculations
- Grid visual status retained: **Present green / approved blue / Off unhighlighted / NE blacked out / low point actions yellow / high point actions red / positive award green**
- Employee-name point status retained: **green <3 / yellow 3-6.99 / red 7+**

## Source Validation Result
- Full modular front-end validator: **PASS**
- Major modules: **16/16 PASS**
- Attendance view smoke tests: **6/6 PASS**
- Roster/Schedule view smoke tests: **5/5 PASS**
- Named JavaScript functions: **936 / no duplicate declaration failure**
- Inline action targets: **229 resolved**
- Task Tracker print regression: **PASS**
- Attendance Point System regression: **PASS**
- New tardy-tier regression: **PASS**
- Historical/migrated T<5 zero-point regression: **PASS**
- 3-point positive bank regression: **PASS**
- 90-Day Grid newest-to-oldest regression: **PASS**
- 90-Day Grid reason-required historical-edit regression: **PASS**
- Manual point-adjustment / future-exclusion regression: **PASS**
- Point-adjustment backup/audit controls: **PASS**
- JavaScript syntax sweep: **PASS**
- Actual 2026-09-09 Attendance backup parsed successfully: **7,911 entries / 42 employee records**
- Actual-data migration simulation: **552 legacy records converted; 2 legacy U records preserved for manual review**
- Actual backup historical tardy check: **233 legacy T records identified; all migrate/recalculate as T<5 = 0 points in v3.5.0.6**
- `.git` in source package: **NOT PRESENT**
- Root Markdown control: **6 standing documents**

## Windows Build Status
The .NET Windows compile/publish is intentionally left for the GitHub Actions run after this source package is uploaded to `main`. The included workflow performs restore, build, self-contained `win-x64` publish, front-end validation, Task Tracker print validation, and Attendance Point System validation, Roster-to-Attendance population validation, and Live Schedule Attendance authority validation.

## v3.5.0.6 Targeted Regression
- Attendance Live Schedule authority regression: **PASS**.
- Published `roster.schedule` is the primary Attendance work/off authority.
- Named live-schedule assignments are scheduled workdays.
- Open/Pending marks a weekday as populated but does not assign an employee.
- Closed/None/blank days fall back to Roster RDO.
- Mock/draft schedules are excluded from Attendance.
- Current-day automatic Off entries carry provenance and can be reversed when the live schedule changes.
- Manual Attendance entries take priority over automatic Off determination.
- Past finalized records are protected from automatic rewrites.
- Positive-attendance clean-workday eligibility follows the schedule authority for current records.
- Roster-to-Attendance population regression remains **PASS**.
- Future Off status is derived from schedule authority without being persisted before the date arrives.
- Manual Sync Roster to Attendance can add missing active Roster employees while preserving history.
