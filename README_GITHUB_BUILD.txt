PWADC SECURITY OPERATIONS SUITE v2.2.1.0 BUILD KIT

This is the clean v2 suite with the first real rebuilt module: Attendance.

WHAT THIS VERSION INCLUDES
- C# WinForms + WebView2 EXE shell
- Global PIN
- Global Settings panel
- Dark / Light / Auto theme
- Dashboard
- Health Check
- Shared data root support
- Backup / Export / Data / Lock folder creation
- Attendance v2.2.1.0 live module using the provided 2026-06-01 attendance JSON as the seed data
- Attendance Daily Entry fast-entry workflow
- Attendance 90-Day Grid with newest date on the left
- Attendance Exceptions grouped by person and code buckets
- Clear individual exception, clear code, and clear person
- Attendance CSV export
- Attendance audit log

DEFAULT PIN
1234

DEFAULT DATA ROOT
\\pig-fs\Security\Security Operations Suite

BUILD ON GITHUB
Create .github/workflows/build-windows.yml if the hidden folder does not upload.
Run the Actions workflow named: Build PWADC Security Operations Suite v2.2.1.0
Download artifact: PWADC-Security-Operations-Suite-v2-2-3-2-Windows

NOTES
The first time Attendance opens in the EXE, the C# shell will create Data\attendance-data.json from app\seed\attendance-data.json if the shared data file does not already exist.
Future saves go to the shared JSON file, with backup copies created before saves.


v2.2.1.0 patch: Daily Entry now groups employees by shift and the desktop bridge replaces an empty/stub attendance-data.json with the seeded live attendance backup.
