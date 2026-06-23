# PWADC Security Operations Suite v3.0.29

Report Print Isolation Fix build.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-29-Windows`

## v3.0.29 notes

- Weekly Staffing and Coverage Gap reports now use the published schedule as the staffing authority.
- Named schedule cells count as scheduled HPW.
- Open and Pending cells count as unfilled HPW.
- Closed and blank cells are ignored.
- Labor cost uses named schedule assignments only.
- Attendance comparison is added for the report week.

## Build notes

- Clean upload ZIP. No `.git` folder.
- `.github/workflows/build-windows.yml` is included.
- All file and folder timestamps are refreshed during packaging.
- Professional Report Center print buttons now open a report-only print window.
- Printing a report no longer includes the app navigation, report cards, search bar, or surrounding screen.
- No HPW math changes were made in this build. HPW/report calculation cleanup is intentionally deferred to the next build.
