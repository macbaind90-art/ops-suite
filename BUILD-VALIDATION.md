# PWADC Security Operations Suite - Current Build Validation

## Build
- Version: **4.0.0**
- Release: **Schema Version & Compatibility Guarding**
- Baseline: **v3.5.1.0 - Daily Last-Known-Good Suite Snapshot**

## Attendance Policy Contract
- Rolling negative-point window: **90 days**
- Rolling call-off classification window: **14 days**
- Tardy points: **T<5 = 0 / T5-14 = 0.5 / T15+ = 1**
- Point values are Admin-editable for **T<5 / T5-14 / T15+ / CO1 / CO2 / NCNS / LE / EIA** and recalculate existing attendance after save
- Point-value policy changes require a reason, pre-save backup, audit record, and before/after policy history
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
- Doctor-note coverage can be applied across a selected date range and selected chargeable event types without rewriting the original attendance code
- One active doctor-note range is one attendance occurrence at **50% of the first matching event's configured normal point value**; additional matching days in that same note range add no additional points
- A doctor-note call-off range contributes one occurrence to the rolling 14-day CO1/CO2 chain
- Doctor-note-covered attendance issues reset clean-attendance progress
- Doctor-note add/void actions are Admin-only, backup-first, audited, and recalculate attendance immediately
- SUS / Suspended adds 0 points, resets clean-attendance progress, and does not count as a clean worked day
- Doctor-note records store administrative references only; the UI warns against storing diagnosis/treatment details

## Source Validation Result
- Full modular front-end validator: **PASS** - 16 major modules / 6 Attendance views / 5 Roster views / 842 named functions / 208 inline action targets / 10 registered modules
- Task Tracker print regression: **PASS**
- Attendance Point System regression: **PASS**
- Roster-to-Attendance population regression: **PASS**
- Live Schedule Attendance authority regression: **PASS**
- Positive-credit immediate-paydown regression: **PASS**
- Home Attendance workflow regression: **PASS**
- Attendance legacy retirement regression: **PASS**
- Browser startup binding regression: **PASS**
- Attendance point-value editor regression: **PASS**
- Doctor-note attendance coverage regression: **PASS**
- Suspended attendance status regression: **PASS**
- Daily Last-Known-Good source regression: **PASS**
- Schema Version & Compatibility Guarding regression: **PASS**
- September 9 production Attendance backup render smoke: **PASS** - 16 major modules / 6 Attendance views loaded against the real 42-employee backup; legacy data with no doctor-note field normalizes cleanly
- Positive-credit partial/fractional carryover regression: **PASS**
- 3-point balance cap with re-earning after use: **PASS**
- Manual adjusted-balance positive-credit paydown: **PASS**
- Pre-adjustment credit chronology: **PASS**
- JavaScript syntax sweep: **PASS**
- `.git` in source package: **NOT PRESENT**
- Root Markdown control: **6 standing documents**

## Windows Build Status
- The first v4.0.0 GitHub compile exposed `CS0509` because `SchemaCompatibilityException` inherited from the sealed `InvalidDataException` type. The source is corrected to inherit from `IOException`.
- `global.json` now pins SDK selection to .NET 8 (`8.0.100` with `latestFeature` roll-forward), preventing a newer preinstalled runner SDK from becoming the build SDK.
- The WinForms project removes the unused `Microsoft.Web.WebView2.Wpf` reference before `ResolveAssemblyReferences`, addressing the `WindowsBase` MSB3277 warning source from the WebView2 package.
- The authoritative compile/publish remains the GitHub Actions Windows run after this corrected source package is uploaded to `main`.




## v4.0.0 Targeted Regression
- Three-part application version is `4.0.0`; Windows file/assembly/manifest metadata retains four-part `4.0.0.0` where required: **PASS**.
- All six current suite-managed live JSON files have registered module-specific schema revision 1: **PASS**.
- Packaged recovery seeds contain the correct `schemaVersion` and `lastWrittenByAppVersion`: **PASS**.
- Legacy JSON with no schema marker is eligible for backup-first metadata initialization: **PASS**.
- Startup schema initialization uses the atomic write service and a loaded revision check: **PASS**.
- Newer formal schemas are detected and write-blocked: **PASS**.
- Older formal schemas are detected and write-blocked pending controlled migration: **PASS**.
- Wrong-module or malformed schema identifiers are write-blocked: **PASS**.
- Existing live targets with formally older/newer/wrong-module/unsupported schemas are host-side write-blocked even when the incoming payload is current: **PASS**.
- Explicit restore/reset may replace malformed JSON, but the recovery exception does not bypass valid incompatible-schema protection: **PASS**.
- Suite Settings compatibility is checked before deserialization; unsupported settings cannot silently fall back and overwrite configuration: **PASS**.
- Load envelopes expose schema, expected schema, last writer version, status, message, and write permission: **PASS**.
- Browser save path honors schema read-only state before attempting a write: **PASS**.
- Data Health live-file verification exposes schema status: **PASS**.
- Unknown live JSON files are surfaced as unregistered rather than modified automatically: **PASS**.

## v3.5.1.0 Targeted Regression
- First valid startup of a calendar day is wired to attempt LKG capture before the WebView UI is exposed: **PASS**.
- Existing verified `Current` manifest for the same date prevents duplicate daily capture: **PASS**.
- Snapshot scope is all live files under the shared `Data` folder rather than a hard-coded module subset: **PASS**.
- Every source JSON is validated before promotion: **PASS**.
- Staged copies are SHA-256 verified against their captured source hashes: **PASS**.
- Live source hashes are rechecked after copying; changed source data blocks promotion: **PASS**.
- Short-duration cross-workstation LKG coordinator uses `FileShare.None` and does not alter live-data save locking: **PASS**.
- Prior LKG is preserved until staged promotion verifies successfully: **PASS**.
- Verified manifest includes date, user, workstation, application version, source root, file count, total bytes, and per-file hash metadata: **PASS**.
- Success audit and failure-record paths are present: **PASS**.

## v3.5.0.13 Targeted Regression
- Doctor-note 50% single-occurrence calculation: **PASS**.
- Multi-day doctor-note events do not stack points: **PASS**.
- Covered call-off range counts as one rolling-14-day occurrence: **PASS**.
- Doctor-note-covered attendance issue resets clean-attendance progress: **PASS**.
- Later-entered matching event inside an active note range recalculates automatically: **PASS**.
- SUS / Suspended adds 0 points and resets clean-attendance progress: **PASS**.
- Positive attendance can restart and earn normally after a suspension: **PASS**.

## v3.5.0.12 Targeted Regression
- Doctor-note date-range coverage: **PASS**.
- Selectable covered event types: **PASS**.
- Original attendance record preservation: **PASS**.
- Covered event zero-point recalculation: **PASS**.
- Covered call-off exclusion from CO1/CO2 chain: **PASS**.
- Covered tardy clean-workday treatment: **PASS**.
- Future/later-entered matching event inside an authorized range: **PASS**.
- Void with required reason and recalculation: **PASS**.
- Backup-first add/void controls: **PASS**.
- Doctor Notes view and inline-action binding sweep: **PASS**.

## v3.5.0.11 Targeted Regression
- Admin-only point-value editor: **PASS**.
- Required policy-change reason: **PASS**.
- Backup-before-policy-save control: **PASS**.
- Configured point values drive historical and current point calculations: **PASS**.
- Existing Attendance history recalculates after a point-value change: **PASS**.
- Positive-credit paydown/bank replay under revised values: **PASS**.
- Manual current-point adjustment baseline preservation: **PASS**.
- Attendance report point-value display uses configured values: **PASS**.
- Point-policy before/after history and affected-employee metadata: **PASS**.

## v3.5.0.10 Targeted Regression
- Reproduced the Windows startup symptom: startup required-function gate reported `renderAttendance is not defined`.
- Root cause confirmed in `82-attendance-points.js`: strict-mode global reassignment remained after the base Attendance declaration was retired.
- `renderAttendance` is now an explicit function declaration.
- `autoFillRdosForDate` is now an explicit function declaration.
- Attendance script order remains `80-attendance.js` → `82-attendance-points.js` → `99-startup.js`.
- Dedicated browser-startup binding validator: **PASS**.
- Existing Attendance point, positive-credit, Live Schedule, Roster sync, Home workflow, and legacy-retirement validators remain **PASS**.

## v3.5.0.9 Targeted Regression
- Attendance legacy retirement validator: **PASS**.
- Report Center / Data Health current point-system contract: **PASS**.
- Historical raw legacy Attendance fields: **preserved read-only if present; not live workflow data**.
- Home no longer calls or navigates to legacy Attendance Pattern or Notice queues.
- Home Daily Attendance completion is schedule-aware and uses the same Live Schedule / Roster RDO authority as Attendance.
- Corrective-action due count is derived from current active points versus the employee's last recorded corrective action.
- Home exposes Point Review, Corrective Action, 90-Day Grid, current positive-credit bank, and 7+ point risk without changing underlying point calculations.
- People Workflow and Employee People Command use active points, positive bank, clean working days, and corrective-action status.
- Start Here reflects the current Attendance workflow: Daily Entry → 90-Day Grid → Point Review → Corrective Action → Audit.
- Historical raw legacy pattern/notice fields are preserved only if already present in older JSON; no live workflow, report, or Data Health action consumes them.
- Live Schedule authority, Roster RDO fallback, manual attendance protection, positive-credit rules, stale-write controls, and atomic saves remain unchanged.
