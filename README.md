# PWADC Security Operations Suite v3.1.10

Expected artifact: `PWADC-Security-Operations-Suite-v3-1-10-Windows`

## v3.1.10 Schedule Print Fit release notes

- Tightened Schedule print styling for landscape output.
- Updated print margins to fit more schedule rows on one page.
- Reduced nonessential print spacing while keeping table text readable.
- Hid the schedule print note during printing to recover vertical space.
- Compressed summary cards, section headers, row spacing, and closed/open/pending cells for cleaner one-page printing.
- Kept shared schedule HTML and in-app schedule printing aligned.
- No schedule math, HPW logic, roster data, or training logic changed.


Stable Operations Management release.

Expected artifact: `PWADC-Security-Operations-Suite-v3-1-10-Windows`

## Build

GitHub Actions workflow path:

`.github/workflows/build-windows.yml`

The workflow validates JavaScript in `app/index.html`, restores the .NET project, publishes a self-contained Windows x64 executable, and uploads the versioned artifact.

## v3.1.10 Training / Readiness polish release notes

- Added post readiness indicators for Gate, Base/EOC, Dock/Crosswalk, Supervisor, and Forklift/PLE readiness.
- Improved employee profile training readiness with post readiness summary.
- Added post readiness filters and summary cards on the Training screen.
- Improved Training Readiness Report with readiness by shift and post type.
- Kept certificate/document uploads out of this build.

## v3.1.10 Training / Readiness polish release notes

- Restores the Daily Entry render functions removed during the v3.1.3 pattern upgrade.
- Keeps the v3.1.3 Attendance Patterns upgrade intact.
- No data structure changes.

- Attendance Patterns Upgrade on top of the v3.1.0 Operations Management baseline.
- Adds smarter pattern detection for Monday/Friday issues, before/after RDO issues, repeated tardies, unauthorized early-outs, same day-of-week patterns, mixed issue types, and rolling 90-day occurrence risk.
- Adds pattern risk labels and scores: Low, Moderate, High, and Critical.
- Updates pattern workflow wording to Acknowledge / Monitor. Reviewed dates are hidden from current thresholds, but new behavior can reopen a pattern.
- Adds Attendance Pattern Report with open pattern detail, high-risk exposure, shift grouping, and acknowledged/monitored history.
- Keeps current modules intact: Roster, Attendance, Schedule, Reports, Training, Uniforms, Office Supplies, Task Tracker, Attendance Notices, Data Health, Restore Center, Settings, Change Log, and Other Programs.
- No intentional shared-data format break.

## Data root

`\\pig-fs\Security\MacBain\Security Operations Suite`

## Notes

This ZIP is a clean full repository package for GitHub upload. It intentionally excludes `.git` and includes `.github`.


## v3.1.10 QA guardrails

- Adds startup self-check for required module render functions.
- Improves render error screen to identify the missing function and affected module.
- Adds GitHub Actions required-function validation in addition to JavaScript syntax check.
- Adds Data Health QA Guardrails panel.


## v3.1.10 Notes
- Polished Attendance Notice Workflow packet formatting, delivery checklist, refused-to-sign language, and void reason handling.
- Added pattern-to-notice context for attendance patterns.
- Updated default PT loaded cost assumption from 27% to 20%.


## v3.1.10 Bugfix

- Fixed Training screen render failure caused by missing post readiness filter variable in the training matrix renderer.
- Kept v3.1.7 Training / Readiness polish intact.

## v3.1.10 Training Page Separation

- Moved Training out of the Roster sub-tab and into its own top-level Training page.
- Added Training navigation access for Admin, Supervisor, Lead, and Viewer roles consistent with roster visibility.
- Added a Training button on Roster rows that opens the Training page and jumps to that employee.
- Kept old roster-training render alias for safety, but the visible workflow is now a standalone page.
- Training cells now allow adding/editing records even when a topic is not required for that employee.
- Optional training records show as recorded/current instead of being hidden behind Not Required.
