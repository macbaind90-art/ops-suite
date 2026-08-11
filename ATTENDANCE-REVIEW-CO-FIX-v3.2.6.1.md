# v3.2.6.1 - Attendance Review Discipline Code Fix

## Purpose
Correct a display-layer inconsistency in Attendance Review. The suite already defined CO (Call-Out) and NCNS (No Call No Show) as discipline-review codes and used them in Daily Entry, Patterns, notices, and attendance reporting, but the Attendance Review table and employee detail panel were hard-coded to show only T, U, and UE.

## Changes
- Attendance Review discipline columns now use the existing `DISCIPLINE_CODES` set.
- Week, Month, and 90-Day review now display T, U, UE, CO, and NCNS.
- Employee expandable discipline history now displays dates for all five discipline codes.
- Approved tracking continues to use AL, V, E, and LE.
- Table group column spans are calculated from the active discipline/tracking arrays so future code-list changes cannot silently break the header layout.

## Scope Control
- No attendance records are migrated or rewritten.
- No thresholds are changed.
- No attendance code meanings are changed.
- No Shift Operations, Reports/Data/Admin, roster, schedule, training, uniform, task, or backup logic is changed.
- v3.3.0 remains the next roadmap phase.
