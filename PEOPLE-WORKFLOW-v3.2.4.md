# v3.2.4 People Workflow Redesign

## Purpose
Make employee-related work feel connected and professional without changing the underlying data model.

## People lane covered
- Attendance
- Attendance Review
- Attendance Patterns
- Notice Workflow
- Roster
- Employee Profile
- Training
- Uniform Accountability

## Key changes
- Added a shared People Workflow strip to the major People screens.
- Added cross-module quick movement so supervisors can move from roster identity to attendance evidence, training readiness, and uniform accountability without hunting through menus.
- Added Employee Profile People Command tiles showing the employee-specific count of:
  - outstanding patterns
  - open notices
  - training exceptions
  - uniform follow-ups
  - schedule assignments
- Kept sensitive decisions in their source modules.

## Design principle
Employee Profile is the command snapshot. Attendance, Roster, Training, and Uniforms remain the source-of-truth screens where records are changed.

## No data model changes
This pass does not change JSON structure. It improves the workflow and UI layer only.

## Next roadmap item
v3.2.5.1 - Operations Workflow Redesign
