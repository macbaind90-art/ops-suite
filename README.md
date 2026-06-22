# PWADC Security Operations Suite v3.0.19

This build adds settings-based labor assumptions and first-pass role privileges.

## v3.0.19 changes

- Labor loaded-cost assumptions are now editable in Settings.
- Added FT Pig, PT Pig, and TempToHire loaded-rate settings.
- Added monthly multiplier, annual multiplier, and FTE baseline-hour settings.
- Added Admin / Supervisor / Lead / Viewer role model.
- Settings are Admin-only.
- Roster add/edit/remove, promotion, merit, schedule editing, and attendance employee removal are Admin-only.
- Individual pay rates and employee-level costs are hidden from users below Admin.
- Supervisor can view labor summaries and section-level loaded cost without individual pay rates.
- Lead and Viewer do not see labor-cost analytics.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-19-Windows`
