# v3.2.0 Live Data Clarity / Startup Safety

## Purpose
Prevent confusion between live shared data, packaged recovery data, imported backups, and restored backups.

## Added
- Home data source strip.
- Data Health Live Data Clarity panel.
- Module load metadata from the desktop bridge:
  - source
  - source detail
  - live path
  - modified time
  - loaded time
  - data root
- Freshness summary for key modules.
- Live Module Files newest meaningful data date.

## Source labels
- Live Shared Data: existing JSON from the configured shared Data folder.
- Packaged Recovery Data: seed/recovery JSON copied from the packaged app because live data was missing, empty, or manually restored from seed.
- Imported Backup: JSON selected through an import control during the current session.
- Restored Backup: JSON restored through Restore Center during the current session.
- Missing / Unknown: no confirmed live source.

## Safety posture
No data model changes were made. Backup retention and restore hardening from v3.1.37-v3.1.38 remain in place.
