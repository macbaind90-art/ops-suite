# v3.2.5.3 - Shift Report Interface Cleanup / Fresh Start Control

## Purpose
Clean up the rebuilt Shift Report Operational Intake and Shift Intelligence screens so they look like professional operational boards instead of raw extracted-data lists.

## Interface cleanup
- Added a professional operations hero layout to Shift Reports and Shift Intelligence.
- Reworked the intake screen around import, classification, visible metrics, and tracking rules.
- Reworked Shift Intelligence into a watchboard with clearer review standards and cleaner intake/watchlist lanes.
- Strengthened spacing, card design, section hierarchy, and responsive behavior for these two screens.

## Fresh start control
Added an admin-only **Clear Shift Report Memory** control. It:
- creates backups of Shift Reports and Shift Intelligence first,
- clears imported shift reports,
- clears shift report intake items,
- clears Shift Intelligence intake/watchlist/reference memory,
- keeps one audit entry documenting the clear,
- does not touch Attendance, Roster, Training, Uniforms, Supplies, Tasks, Reports, backups, Restore Center, or Settings.

## Safety model
The user must enter a reason and type `CLEAR SHIFT REPORTS` before the clear runs. If backup creation fails, the clear is not completed.
