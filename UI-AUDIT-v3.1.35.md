# PWADC Security Operations Suite v3.1.35 UI Render Fix / Full Screen Verification Pass

## Reason for this build
The v3.1.34 screen polish build introduced calls to `screenGuide(...)` but did not include the shared helper definition. The app opened successfully, then failed during page rendering with `screenGuide is not defined`.

## Fix
- Added the shared `SCREEN_GUIDES` map.
- Added the shared `screenGuide(key)` rendering helper.
- Verified major module render paths directly instead of relying only on syntax checks.
- Moved the Task Tracker guide out of the button toolbar and into the normal screen body.
- Updated release/version language to v3.1.35.

## Verified module render paths
- Home / Dashboard
- Start Here
- Attendance
- Roster
- Employee Profile
- Training
- Office Supplies
- Shift Reports
- Shift Intelligence
- Reports
- Task Tracker
- Data Health
- Restore Center
- Change Log
- Other Programs
- Settings

## Result
The missing-helper crash is corrected, and the UI screen-guide pattern now has a single central helper instead of scattered inline markup.
