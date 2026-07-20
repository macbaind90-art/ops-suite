# PWADC Security Operations Suite v3.1.31

## v3.1.31 Data Safety + Security Pass

This release keeps the prior workflow/dashboard improvements and hardens the data safety layer.

### v3.1.31 Notes
- Module saves now validate approved module names before writing.
- Saves validate JSON, write through a guarded temp file, create before-save backups, and return saved path/size details.
- Desktop open-path requests are restricted to approved suite folders.
- Data Health now includes a Live Module Files panel showing file path, exists status, size, modified date, lastSaved value, and newest backup.
- Restore requires a reason and a second final confirmation before overwriting live JSON.
- Backup, export, restore, and open-path handling now has tighter path boundary checks.
- Workflow and dashboard changes from the prior workflow build remain in place.

Build artifact naming is aligned to v3.1.31.
