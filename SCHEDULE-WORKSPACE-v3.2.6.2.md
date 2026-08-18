# v3.2.6.2 - Schedule Workspace Enhancements

## Objective
Give PWADC Security management faster schedule-editing controls and a safe scenario-planning workspace without allowing draft schedules to become operational authority accidentally.

## Delivered
- Cell-level copy and paste for employee assignments and schedule statuses.
- Persistent clipboard indicator while working in the Schedule view.
- Guarded Clear Schedule action that preserves schedule structure and clears all daily cells to Closed.
- Backup-first handling for live schedule clearing.
- Persistent Mock Schedule Library stored in `roster.scheduleDrafts`.
- Create mock from live schedule.
- Create mock with blank assignments while retaining current live sections/posts.
- Open, edit, rename, duplicate, print/share, hold, and delete mock schedules.
- Clear a mock independently from live.
- Backup-first Apply to Live workflow with reason and `APPLY SCHEDULE` confirmation.
- Mock exports labeled MOCK / NOT PUBLISHED.

## Data Authority
`roster.schedule` remains the only published schedule authority. Draft data in `roster.scheduleDrafts` is intentionally excluded from live HPW, labor analytics, attendance coverage, executive reports, and other schedule-authority calculations.

## Destructive-Action Controls
### Clear Live Schedule
1. Admin-only.
2. Requires a reason.
3. Requires exact `CLEAR SCHEDULE`.
4. Creates a roster backup before modification.
5. Preserves rows, sections, coverage windows, cost hours, and notes.
6. Sets all seven daily cells in every live row to Closed (`None`).

### Apply Mock to Live
1. Admin-only.
2. Requires a reason.
3. Requires exact `APPLY SCHEDULE`.
4. Creates a roster backup before replacement.
5. Replaces `roster.schedule` with a deep copy of the selected mock.
6. Keeps the mock in the library after publication.

## Roadmap
This is a controlled insertion after v3.2.6.1. The next major phase remains v3.3.0 Code Organization / Modularization.
