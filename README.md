# PWADC Security Operations Suite v3.0.36

Clean full repo package with `.github` included and no `.git` folder.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-36-Windows`

## v3.0.36 notes

- Corrected the v3.0.35 Uniform / Equipment scope back to a focused Uniform Tracker.
- Removed radio, key, access card, badge, flashlight, and rain gear item types from the Uniform tracker.
- Uniform tracking now focuses on shirt, pants, jacket, safety vest, and other uniform-only items.
- Existing non-uniform items are filtered out of the Uniform view and should be handled by separate trackers/modules.
- Removed the separation/company-property checklist from the Uniform screen.
- Updated Employee Profile, Reports, Print Sheet, CSV export, and on-screen labels to say Uniforms only.
- Kept cost visibility restricted to Admin.
