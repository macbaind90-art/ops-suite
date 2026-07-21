# PWADC Security Operations Suite v3.2.1

## Backup Retention / Backup Manager

This release adds a tiered backup strategy so the suite does not keep creating unlimited backup files without a controlled cleanup process.

## Policy

- Keep all backups from the last 7 days.
- Keep one daily backup for the last 30 days.
- Keep one weekly backup for the last 12 weeks.
- Keep one monthly backup for the last 12 months.
- Protect manual backups.
- Protect archive backups.
- Protect legacy backups.
- Protect pre-restore backups for at least 90 days.
- Never delete silently. Cleanup requires preview plus confirmation.

## Added

- Backup Manager panel in Data Health.
- Backup inventory by module.
- Backup type classification: Manual, Auto, Pre-Restore, Archive, Legacy.
- Cleanup preview with file list, reason, size, and module.
- Confirmed cleanup that writes a cleanup log.
- Safer backup naming for new backups.

## Also fixed

- Removed duplicate open-path launch call so a folder is not opened twice.
