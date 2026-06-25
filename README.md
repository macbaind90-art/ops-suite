# PWADC Security Operations Suite v3.1.4

Stable Operations Management release.

Expected artifact: `PWADC-Security-Operations-Suite-v3-1-4-Windows`

## Build

GitHub Actions workflow path:

`.github/workflows/build-windows.yml`

The workflow validates JavaScript in `app/index.html`, restores the .NET project, publishes a self-contained Windows x64 executable, and uploads the versioned artifact.

## v3.1.4 bugfix release notes

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
