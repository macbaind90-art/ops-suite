# PWADC Security Operations Suite v3.0.41

Clean full repo package with `.github` included and no `.git` folder.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-41-Windows`

## v3.0.41 notes

- Stability, navigation, and data-polish pass before the v3.1 milestone.
- Cleaned version labels and footer/report metadata to v3.0.41.
- Added a Data Health module inventory panel so Attendance, Roster/Schedule, Training, Uniforms, Office Supplies, Tasks, Notices, Settings, and Other Programs can be checked from one place.
- Expanded Data Health checks for Office Supplies, Training, Uniforms, Attendance Notices, and Task Tracker data quality.
- Added module ownership notes so shared data boundaries are clearer:
  - Attendance owns attendance records, notes, patterns, and notices.
  - Roster owns employee records, schedule, training, uniforms, and office supplies.
  - Task Tracker owns project/task data.
  - Settings owns users, roles, labor assumptions, coverage requirements, and app settings.
  - Programs are kept separate as standalone tools.
- Added clearer backup/restore wording that explains which modules are covered by each shared JSON file.
- No `.git` folder is included.
- `.github/workflows/build-windows.yml` is included.
