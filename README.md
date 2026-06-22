# PWADC Security Operations Suite v3.0.25

Professional Report Center build.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-25-Windows`

## Build notes

- Clean upload ZIP. No `.git` folder.
- `.github/workflows/build-windows.yml` is included.
- All file and folder timestamps are refreshed during packaging.
- Adds a dedicated Reports page for Admin and Supervisor roles.
- Adds professional print layouts with executive summary, key metrics, detail tables, and footer.
- Adds reports for staffing, labor cost, coverage gaps, attendance, training, uniforms, and tasks.
- Keeps pay visibility role-based: Admin sees employee-level pay/cost detail; Supervisor sees summary loaded-cost totals only.
- CSV export is included for the report types where it is operationally useful.
