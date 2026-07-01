# PWADC Security Operations Suite v3.1.24

## v3.1.24 Shift Report Reset / Version Fix

Tunes the dedicated Shift Reports module for importing supervisor shift report PDFs/text files, extracting operational follow-up items, and tracking issues through Open, Monitoring, Closed, or No Action status.

The tracker captures report ID, date, shift, supervisor, incidents, patrol issues, overview, pass-down notes, officer roster concerns, and 3rd-shift off-duty officer notes. Routine Vehicle / Equipment sections remain stored with the imported report but do not create tracked issues.

Attendance Pattern persistence fixes from v3.1.21 remain in place.

### v3.1.24 Notes
- Routine Vehicle / Equipment report sections are stored with imported reports but no longer generate tracked issues.
- 3rd-shift off-duty officer notes are detected as an Off-Duty Officer issue type.
- Existing Shift Report import, dedupe, backup, export, and Task Tracker handoff behavior remains in place.

### v3.1.24 Notes
- One-time Shift Report reset button added for accidental bulk imports. Remove this button in the next build.
- Current version references aligned across app UI, .NET metadata, manifest, build.bat, and GitHub Actions artifact name.
