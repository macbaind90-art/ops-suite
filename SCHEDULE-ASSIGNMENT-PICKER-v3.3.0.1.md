# v3.3.0.1 - Schedule Assignment Picker

## Purpose
Improve schedule staffing speed and mock-schedule flexibility without changing the live schedule authority, HPW methodology, or roster data contract.

## Changes
### Mock schedules
- Any active roster employee can be assigned to any mock schedule slot.
- Mock employee choices no longer filter by normal employee shift, gate shift, section, or post.
- The same unrestricted active-roster pool is used in mock cell reassignment and mock row day-assignment controls.
- Archived/inactive roster employees remain excluded.

### Schedule cell typeahead
- Replaces the schedule-cell employee dropdown with a searchable picker.
- Search matches partial employee name and employee number (EID).
- Results display name, EID, rank, and shift.
- Open/Pending/Closed cells autofocus the picker.
- Keyboard navigation supports Arrow Up, Arrow Down, Enter, and Escape.
- Selection writes the existing rank/name schedule label, preserving compatibility with HPW, reporting, employee matching, colors, printing, copy/paste, and existing roster data.

### Live schedule
- Live schedule employee suggestions retain the existing section/shift contextual filter.
- Closed, Open, Pending, copy, and paste controls remain available.

## Governance
- No changes to attendance codes, discipline thresholds, labor rates, schedule HPW rules, Shift Operations, reports, or shared JSON schema.
- v3.4.0 Data Layer / Reliability Upgrade remains the next major roadmap phase.
