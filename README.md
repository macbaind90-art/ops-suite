# PWADC Security Operations Suite v3.1.0

Stable Operations Management release.

Expected artifact: `PWADC-Security-Operations-Suite-v3-1-0-Windows`

## Build

GitHub Actions workflow path:

`.github/workflows/build-windows.yml`

The workflow validates JavaScript in `app/index.html`, restores the .NET project, publishes a self-contained Windows x64 executable, and uploads the versioned artifact.

## v3.1.0 release notes

- Promotes the v3.0.x build-out line into the first stable Operations Management release.
- Updates version labels, build metadata, README, manifest, and artifact naming to v3.1.0.
- Adds a Start Here screen with supervisor workflow, admin workflow, module map, and included feature summary.
- Keeps current modules intact: Roster, Attendance, Schedule, Reports, Training, Uniforms, Office Supplies, Task Tracker, Attendance Notices, Data Health, Restore Center, Settings, Change Log, and Other Programs.
- No new heavy operational module was added in this milestone release.

## Data root

`\pig-fs\Security\MacBain\Security Operations Suite`

## Notes

This ZIP is a clean full repository package for GitHub upload. It intentionally excludes `.git` and includes `.github`.
