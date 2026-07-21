# PWADC Security Operations Suite v3.1.38

## v3.1.38 Backup Retention / Backup Manager

This release adds a controlled backup retention strategy and Backup Manager panel. It keeps the v3.1.30 workflow improvements, v3.1.31 data safety/security hardening, v3.1.32 regression guide, v3.1.35 UI render fix, v3.1.36 attendance import date focus fix, and backup/restore verification hardening.

### Backup Manager

- Inventory backup counts and size by module.
- Classify backups as Manual, Auto, Pre-Restore, Archive, or Legacy.
- Preview cleanup before deleting anything.
- Confirm cleanup twice.
- Write a cleanup log after deletion.
- Protect manual, archive, and legacy backups.

### Retention policy

- Keep all backups from the last 7 days.
- Keep one daily backup for 30 days.
- Keep one weekly backup for 12 weeks.
- Keep one monthly backup for 12 months.
- Keep pre-restore backups at least 90 days.

### Checks

JavaScript syntax and required render-function checks are expected for release packaging. GitHub Actions workflow is included for the Windows EXE build.
