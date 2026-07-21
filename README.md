# PWADC Security Operations Suite v3.1.37

## v3.1.37 Backup / Restore Verification Pass

This release keeps the attendance import date-focus fix and adds a safety review for backup, restore, packaged recovery, export, and open-path flows.

### Backup / restore hardening
- Restore and backup preview are locked to the selected module's backup folder.
- JSON restore no longer exposes Standalone Programs as a normal module restore target. Programs remain handled through the standalone programs backup flow.
- Restore writes through a temporary file before replacing live JSON.
- Packaged recovery restore now validates module, validates JSON, creates a before-seed backup safely, and writes only to the Data folder.
- Backup lists now show JSON backups only.
- Roster and Task packaged recovery labels were clarified.

### Verification notes
- JavaScript syntax check run.
- Required render-function check run.
- C# brace sanity check run.
- Backup/restore static path-safety review completed.
