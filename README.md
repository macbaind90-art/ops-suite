# PWADC Security Operations Suite v3.1.39

## v3.1.39 Live Data Clarity / Startup Safety

This release makes the suite clearer about which data it is using so old packaged recovery data, imported backups, restored backups, and live shared files are easier to tell apart.

### Highlights
- Home now shows a live data source strip.
- Data Health now includes a Live Data Clarity panel.
- Module load responses include source metadata from the desktop bridge.
- Attendance, roster, tasks, shift reports, and shift intelligence show session source details.
- Attendance import / restore still focuses to the latest populated attendance date.
- Live Module Files includes newest meaningful data date where available.
- Packaged recovery is labeled as recovery data, not current live data.
- Fixed a duplicate `Programs` source-line issue in `MainForm.cs` from the prior backup-manager pass.

### Recommended use
Use Data Health first if anything appears old. Confirm the configured data root, module file modified times, and newest attendance date before restoring or importing.
