# PWADC Security Operations Suite v3.1.1

Stable Operations Management release.

Expected artifact: `PWADC-Security-Operations-Suite-v3-1-1-Windows`

## Build

GitHub Actions workflow path:

`.github/workflows/build-windows.yml`

The workflow validates JavaScript in `app/index.html`, restores the .NET project, publishes a self-contained Windows x64 executable, and uploads the versioned artifact.

## v3.1.1 release notes

- Supervisor usability tweaks release on top of the v3.1.0 Operations Management baseline.
- Adds clearer Start Here quick links and a Dashboard Needs Attention Today panel.
- Adds direct daily workflow shortcuts for Attendance, Schedule Gaps, Tasks, Training, Uniforms, Supplies, and Reports.
- No intentional shared-data format break.

- Promotes the v3.0.x build-out line into the first stable Operations Management release.
- Updates version labels, build metadata, README, manifest, and artifact naming to v3.1.1.
- Adds a Start Here screen with supervisor workflow, admin workflow, module map, and included feature summary.
- Keeps current modules intact: Roster, Attendance, Schedule, Reports, Training, Uniforms, Office Supplies, Task Tracker, Attendance Notices, Data Health, Restore Center, Settings, Change Log, and Other Programs.
- No new heavy operational module was added in this milestone release.

## Data root

`\pig-fs\Security\MacBain\Security Operations Suite`

## Notes

This ZIP is a clean full repository package for GitHub upload. It intentionally excludes `.git` and includes `.github`.
