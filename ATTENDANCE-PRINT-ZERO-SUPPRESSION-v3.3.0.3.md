# v3.3.0.3 - Attendance Print Zero Suppression

## Purpose
Reduce clutter in the portrait Attendance Totals management report while preserving the user-selected reporting scope and attendance categories.

## Behavior
- A selected attendance-code box renders for an employee only when the code total is greater than zero for the selected period.
- MM/DD occurrence dates remain beside every displayed attendance code.
- Selected Discipline Total, Approved Total, and Recorded Total summary boxes render only when their value is greater than zero.
- Employees are not removed from the report solely because their selected totals are zero; the Selected Attendance cell remains blank.
- The ALL EMPLOYEES aggregate row applies the same zero-suppression rule.

## Scope Control
No Attendance source records, attendance code definitions, discipline thresholds, notice logic, pattern logic, Schedule authority, Shift Operations, or shared JSON contracts are changed.
