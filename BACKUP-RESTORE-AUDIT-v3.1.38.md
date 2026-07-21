# Backup / Restore Audit - v3.1.39

## Reviewed flows
- Backup Now: Attendance, Roster, Task Tracker, Shift Reports, Shift Intelligence.
- Backup Everything: all JSON modules plus Standalone Programs folder backup.
- Restore Center: list backups, preview backup, restore backup with reason and confirmation.
- Packaged recovery data: Attendance, Roster, Task Tracker, and seed-based module reset.
- Data Health: module file status and newest backup visibility.
- Export and open-path guards.

## Fixes made
- Backup preview and restore now require the backup path to live inside the selected module's backup folder, not just somewhere under the general Backups folder.
- Program folder backups are no longer displayed as JSON restore candidates.
- Restore writes through a temporary restore file before replacing the live module JSON.
- Seed recovery restore now validates the selected JSON module, validates the seed JSON, backs up existing live data to the correct module backup folder, checks folder boundaries, and writes only under Data.
- Backup listings now only return .json files for JSON modules.
- Packaged recovery wording was standardized so it does not look like live/current data.

## Remaining limitation
Local .NET publish/build could not be run in the sandbox because dotnet is unavailable. GitHub Actions remains included for Windows EXE build verification.
