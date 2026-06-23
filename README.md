# PWADC Security Operations Suite v3.0.39

Clean full repo package with `.github` included and no `.git` folder.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-39-Windows`

## v3.0.39 notes

- Added a dedicated Office Supplies module.
- Office Supplies is separate from Uniforms, Radios, and Keys.
- Added add, edit, remove/archive, and Admin restore for supply items.
- Added editable supply fields: item, category, current quantity, minimum quantity, order quantity, status, ordered date, received date, vendor, storage location, Admin-only cost, and notes.
- Added automatic status behavior for In Stock, Low, and Out, with manual Ordered and Discontinued options.
- Added low/out/ordered dashboard-style metrics on the Office Supplies page.
- Added office supplies print sheet and CSV export.
- Added Office Supplies Report to the Professional Report Center.
- Kept Uniform Accountability unchanged from v3.0.37.
- No `.git` folder is included.
- `.github/workflows/build-windows.yml` is included.


## v3.0.39 notes
- Added Attendance Notice Workflow under Attendance.
- Added notice history by employee, editable notice status, delivered/acknowledged/refused/escalated/no-notice workflow states.
- Added related attendance dates, employee response, manager notes, printable notice packet, report and CSV export.
