# PWADC Security Operations Suite v3.1.20

## v3.1.20 Pattern Employee Bulk Actions

- Adds employee-level **Monitor All**, **Not an Issue All**, and **Create Notice for All** buttons on the Attendance Patterns employee detail view.
- Keeps individual category buttons available for one-off decisions.
- Bulk notice creates one consolidated notice and marks all linked outstanding pattern categories as Notice Created after saving.
- Keeps the Attendance Review page largely intact.
- Shows patterns grouped by employee, with every category that employee falls into.
- Pattern cards now show:
  - Why the rule triggered
  - Threshold
  - Actual count
  - Related dates
  - Related attendance codes
  - Risk level and score
- Adds pattern statuses:
  - Outstanding
  - Monitoring
  - Not an Issue
  - Notice Created
- Adds a **Not an Issue** action with reason/note capture.
- Adds a **Monitor** action for reviewed patterns that should stay watched without creating a notice.
- Links **Create Notice** from a pattern and marks that pattern as Notice Created after saving.
- Front page Attendance Patterns count now uses only outstanding unresolved pattern findings.
- Reviewed/hidden pattern history remains visible on the Patterns page and still reopens when newer related behavior appears.
- Keeps v3.1.15/v3.1.16 render safety and dashboard improvements intact.
- No roster, schedule, HPW, labor, training, or uniform logic changed.

Expected artifact: `PWADC-Security-Operations-Suite-v3-1-20-Windows`

## Build

Use GitHub Actions workflow at `.github/workflows/build-windows.yml`.
