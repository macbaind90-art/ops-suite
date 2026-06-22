# PWADC Security Operations Suite v3.0.22

Schedule-based staffing rules build.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-22-Windows`

## Build notes

- Clean upload ZIP. No `.git` folder.
- `.github/workflows/build-windows.yml` is included.
- Coverage requirements are seeded from the current PWADC Security Schedule export dated 2026-06-22.
- Reception remains a 0800-1700 coverage window but uses 8 hours for labor/cost calculations because lunch is covered by relief.
