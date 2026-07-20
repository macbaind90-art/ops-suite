# PWADC Security Operations Suite v3.1.28

## v3.1.28 Shift Intelligence

Adds a new top-level **Shift Intelligence** module. Shift Reports remains the raw report intake/import layer. Shift Intelligence is the controlled operational watchlist and trend layer.

### v3.1.28 Notes
- Adds intake review buckets: Auto-Link, Suggested Matches, New, and Ignored / Reference.
- Adds issue statuses: New, Watching, Recurring, Needs Action, Resolved, Ignored, and Reference Only.
- Uses hybrid matching across category, location, and wording.
- Auto-link is available for strong matches; moderate matches require review.
- Attendance is treated as reference-only unless it creates an actual operational issue such as uncovered coverage.
- Active watchlist sorts by Needs Action, Recurring, New, Watching, and Dormant.
- Dormant recommendation begins after 7 days with no repeat mention; resolution suggestion begins after 14 days with no repeat mention.
- Prior Roster/Uniform print polish, pants-needed update, Shift Report N/A filtering, routine vehicle/equipment ignore logic, and 3rd-shift off-duty officer detection remain in place.

Build artifact naming is aligned to v3.1.28.
