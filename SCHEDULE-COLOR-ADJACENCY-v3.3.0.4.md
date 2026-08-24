# v3.3.0.4 - Schedule Color Adjacency Fix

## Objective
Improve Schedule readability by eliminating avoidable same-color collisions between different employees in neighboring occupied cells while preserving employee color continuity and all existing schedule authority rules.

## Root Cause
The prior color cache was built independently inside each schedule section. Each section restarted the same palette and honored section-specific preferred colors. As a result, two different employees could receive the same color when rows from different sections were visually adjacent, even though each section was internally valid.

## Controlled Changes
- Employee color assignment now evaluates the entire active live or mock schedule as one visual workspace.
- Horizontal neighbors are evaluated across adjacent days within the same schedule row.
- Vertical neighbors are evaluated across adjacent schedule rows on the same day, including section boundaries.
- Different employees that share a horizontal or vertical border are assigned different colors whenever another palette color is available.
- The same employee retains one consistent color throughout the active schedule.
- Existing section color mappings are treated as preferences, not absolute assignments when they would create an adjacent collision.
- The schedule palette was expanded from 20 to 36 colors to reduce reuse in larger staffing layouts.
- A schedule adjacency diagnostic helper was added for validation.

## Preserved Behavior
- Live Schedule remains the authority for HPW and labor reporting.
- Mock schedules remain isolated until explicitly applied to live.
- Copy/paste assignment behavior is unchanged.
- Name/EID typeahead assignment behavior is unchanged.
- Open, Pending, and Closed status cells retain their existing status presentation.
- No schedule assignments, roster records, attendance records, Shift Intelligence records, or shared JSON contracts are modified by this release.

## Important Visual Rule
If the same employee is intentionally assigned to adjacent cells, those cells retain the same color because color continuity represents employee identity. The adjacency guard applies to different employees.
