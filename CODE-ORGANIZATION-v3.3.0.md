# v3.3.0 - Code Organization / Modularization

## Release Objective
Reduce code concentration and regression risk without redesigning PWADC workflows or changing shared data behavior.

## Completed
- Externalized the application design system from `app/index.html` to `app/assets/styles.css`.
- Replaced the single inline front-end script with 10 ordered functional JavaScript modules.
- Added a front-end module registry and startup validation gate.
- Preserved the existing render-function QA guard and added registry status to its panel.
- Reduced `app/index.html` to a lightweight document shell.
- Converted `MainForm` to a partial class and separated bridge, storage, backup, program/environment, and model responsibilities.
- Preserved all existing `suite:*` bridge message types.
- Preserved shared JSON file names, shared data root, schedule authority, attendance code definitions, role behavior, reporting routes, backup/restore behavior, and specialist tool boundaries.
- Updated GitHub Actions artifact naming for v3.3.0.
- Added `ARCHITECTURE-v3.3.0.md` as the ongoing source-ownership and dependency map.

## Intentional Non-Changes
- No UI redesign.
- No attendance policy changes.
- No schedule-authority changes.
- No Shift Intelligence recalibration.
- No data migration.
- No database introduction.
- No changes to loaded labor-cost assumptions.
- No emergency-procedure module integration.

## Operational Result
Users should experience the same suite behavior. The benefit is primarily engineering control: a defect or enhancement can now be isolated to a smaller ownership boundary instead of modifying one 800 KB application file.
