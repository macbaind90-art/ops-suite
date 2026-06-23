# PWADC Security Operations Suite v3.0.30

Report Methodology and Label Polish build.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-30-Windows`

## v3.0.30 notes

- Added HPW methodology notes to Weekly Staffing, Labor Cost, and Coverage Gap reports.
- Added attendance interpretation legend to schedule/attendance comparison reports.
- Added Data Confidence boxes showing schedule rows counted, Open/Pending cells, matched attendance HPW, and no-entry HPW.
- Clarified report labels:
  - Schedule Required HPW
  - Named Scheduled HPW
  - Open/Pending HPW
  - Attendance Covered HPW
  - Attendance Missed HPW
  - No Entry HPW
- Improved report preview controls with Print / Save PDF, Close Preview, and generated timestamp.
- Kept the schedule-authority HPW math intact.

## Build notes

- Clean upload ZIP. No `.git` folder.
- `.github/workflows/build-windows.yml` is included.
- All file and folder timestamps are refreshed during packaging.
- JavaScript syntax validation is included in the GitHub Actions workflow.
