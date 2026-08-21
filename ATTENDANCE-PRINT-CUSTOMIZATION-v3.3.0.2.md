# v3.3.0.2 - Attendance Print Customization

## Purpose
Improve the Attendance Review management printout while preserving attendance records, attendance-code definitions, discipline thresholds, notice logic, and the v3.3.0 modular application architecture.

## Changes
- Attendance Totals now previews and prints in portrait orientation.
- Print setup allows the user to choose exactly which attendance-code boxes appear.
- Quick selections are available for Discipline + Approved, Discipline Only, Approved Only, Select All, and Clear.
- Individual codes can be independently checked or unchecked.
- Discipline Total, Approved Total, and Recorded Total are independently selectable summary boxes.
- Employee and Shift remain fixed report fields.
- Selected attendance items render inside a portrait-friendly Selected Attendance area instead of creating a wide landscape column for every code.
- Each selected attendance code shows its count and the related occurrence dates in MM/DD format beside the count.
- Example: `CO 2 | 08/04, 08/11`.
- The existing All Active Employees / shift scope and Week / Month / Rolling 90-Day controls are preserved.
- The ALL EMPLOYEES row continues to provide aggregate counts.

## Data / Policy Boundaries
- Printing does not write to Attendance data.
- Attendance code meanings are unchanged.
- Discipline and pattern thresholds are unchanged.
- Attendance Notice Workflow behavior is unchanged.
- Roster, Schedule, Shift Operations, labor, and governance logic are unchanged.
- Shared JSON schemas are unchanged.

## Validation Focus
- Portrait orientation is passed to the report renderer.
- Selected code boxes render independently.
- CO/T seeded test confirms count accuracy.
- Occurrence date conversion is verified as MM/DD.
- Permanent front-end validation now asserts portrait attendance print output and occurrence-date rendering.
