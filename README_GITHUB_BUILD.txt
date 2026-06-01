PWADC SECURITY OPERATIONS SUITE v2.0 BUILD KIT

This is the clean rebuild foundation. It is not a stitched bundle of the old standalone HTML apps.

WHAT THIS VERSION INCLUDES
- C# WinForms + WebView2 EXE shell
- Global PIN
- Global Settings panel
- Dark / Light / Auto theme
- Dashboard
- Health Check
- Shared data root support
- Backup / Export / Data / Lock folder creation
- Attendance v2 Daily Entry fast-entry screen foundation
- Roster v2 module placeholder
- Badge Audit / AMAG Audit / Access Audit module placeholders

DEFAULT DATA ROOT
\\pig-fs\Security\Security Operations Suite

FOLDERS CREATED
Data
Backups
Exports
Locks

GITHUB BUILD
Upload the contents of this folder to GitHub. If .github is hidden, manually create:
.github/workflows/build-windows.yml

Then run:
Actions -> Build PWADC Security Operations Suite v2 EXE -> Run workflow

ARTIFACT NAME
PWADC-Security-Operations-Suite-v2-0-Windows

DEFAULT PIN
1234

NEXT BUILD PHASES
v2.1 Attendance live data migration and full exceptions workflow
v2.2 Roster live data migration and full schedule/training/uniform workflow
v2.3 Badge Audit rebuild
v2.4 AMAG and Access Audit rebuild with offline XLSX support
