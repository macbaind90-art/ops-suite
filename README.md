# PWADC Security Operations Suite v3.0.33

Schedule Editing Improvements build.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-33-Windows`

## v3.0.33 notes

- Improved the Master Schedule editor so the schedule remains the authority for HPW, reports, and labor cost.
- Added clearer schedule row editing for section, post, coverage window, cost hours, row notes, and all daily assignments/statuses.
- Added row notes for items such as lunch relief, weekend-only posts, remote gate eligibility, and temp coverage.
- Added official day statuses in the editor: Closed, Open, Pending, or assigned employee.
- Added Duplicate Row for faster creation of similar posts.
- Added copy-pattern helpers: Copy Mon to Tue-Fri, Close Weekends, Mon-Fri Open, Copy Sun to Sat, and Close Entire Row.
- Added Schedule Data Check warnings for invalid/missing cost hours, coverage-window vs cost-hour mismatches, Open/Pending unfilled cells, inactive assigned employees, and employees scheduled above the FTE baseline.
- Kept role restrictions intact: Admin can edit schedule; other roles remain view-only for schedule editing controls.

## Build notes

- Clean upload ZIP. No `.git` folder.
- `.github/workflows/build-windows.yml` included.
- All timestamps refreshed during package creation.
