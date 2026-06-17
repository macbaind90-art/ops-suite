# PWADC Security Operations Suite v3.0.10 QA Plan

## Goal

Make the program work reliably and look professional before it is treated as the next usable release.

## Current Known Status

- Login screen can now accept the Admin user and PIN.
- After login, the suite can remain stuck on Initializing and show empty information.
- Root cause under review: the WebView JavaScript bridge and the native Windows wrapper are not fully aligned on data load/save message names and payload shapes.

## QA Gates

### Gate 1: Startup and Login

- App opens without a Windows error dialog.
- User dropdown is populated.
- PIN pad is visible.
- David MacBain Admin user can sign in with PIN 6268.
- After login, status must change from Initializing to Ready.
- Navigation bar must render all allowed modules.

### Gate 2: Data Bridge

- Native wrapper must respond to the app's data-load calls.
- Attendance JSON must load from shared data or seed data.
- Roster JSON must load from shared data or seed data.
- Task Tracker JSON must load from shared data or seed data.
- Settings must load from shared data or defaults.
- Save operations must write back to the shared Data folder.
- Backup operations must create backup files in the shared Backups folder.

### Gate 3: Home Dashboard

- Manager Dashboard loads after login.
- Attendance Entered Today card displays real counts.
- Attendance Blanks card displays real counts.
- Open Attendance Patterns card does not crash if no data exists.
- Critical / Warning Health card displays without crashing.
- Staffing for Today displays shifts cleanly.
- Task Watch displays active/high/waiting/archived counts cleanly.
- Quick Actions navigate to the correct modules.

### Gate 4: Attendance

- Daily Entry renders names grouped by shift.
- Codes can be entered and saved.
- 90-Day Grid renders.
- Attendance Review renders.
- Patterns screen renders.
- Notice generator opens and prints.
- Audit log records changes.

### Gate 5: Roster

- Roster screen matches the v3.0.7-style workflow.
- Roster records load from roster-data.json.
- Add Employee opens.
- Edit Employee opens.
- Promote opens.
- Merit opens.
- Remove archives instead of hard deleting.
- Archive / Old Employees section works.
- Filters and sorting work.
- Import / export / backup controls do not crash.

### Gate 6: Schedule

- Schedule screen matches the v3.0.7-style workflow.
- Sections render correctly.
- Rows render correctly.
- Day cells render assignments.
- Cell reassignment modal opens.
- Save assignment writes to roster data.
- Add Row works.
- Add Section works.
- Share Schedule works.
- Print Schedule works.

### Gate 7: Task Tracker

- Tasks load from tasks-data.json.
- Add Task opens.
- Edit Task opens.
- Complete archives the task.
- Reopen works.
- Weekly Email opens or falls back cleanly.
- Task backups save.

### Gate 8: Other Programs

- Other Programs screen renders.
- Badge Audit launcher displays.
- AMAG Audit launcher displays.
- Access Audit launcher displays.
- Refresh Program Files does not block startup.
- Open Program uses the shared Programs folder.

### Gate 9: Data Health / Restore / Change Log

- Data Health renders.
- Findings do not crash if data is missing.
- Restore Center renders.
- Backup list can be refreshed.
- Change Log renders.

### Gate 10: Visual QA

- No overlapping text on 1080p screens.
- Dashboard cards fit without clipping.
- Roster table scrolls horizontally instead of crushing columns.
- Schedule grid scrolls instead of overlapping.
- Buttons are visible and not stacked awkwardly.
- Dark theme remains readable.
- Light theme remains readable.

## Release Rule

Do not call v3.0.10 production-ready until all gates pass.
