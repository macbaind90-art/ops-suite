# v3.2.6.3 - Attendance Totals Print Enhancement

## Objective
Add a concise management printout showing each active employee's attendance totals without changing the underlying attendance record or discipline logic.

## Workflow
Attendance → Attendance Review → Print Attendance Totals.

The print setup allows:
- All active employees or a selected shift.
- Current Week, Current Month, or Rolling 90 Days.
- An ending date tied to the Attendance Review window.
- Discipline Only, Discipline + Approved, or All Attendance Codes.

## Canonical Totals
- Discipline Total: T + U + UE + CO + NCNS.
- Approved Total: AL + V + E + LE.
- All-code mode additionally displays P, O, FL, and NE and a Recorded Total.

## Output
- Landscape print preview.
- One row per active employee.
- Final ALL EMPLOYEES aggregate row.
- Code definitions printed beneath the table.
- Print / Save PDF through the existing report preview workflow.

## Data Governance
This feature is read-only. It does not save, rewrite, clear, or reclassify Attendance data and does not change thresholds, notices, patterns, Schedule, Shift Operations, or labor reporting.
