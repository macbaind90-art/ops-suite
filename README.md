# PWADC Security Operations Suite v3.1.23

## v3.1.23 Shift Report Tuning

Tunes the dedicated Shift Reports module for importing supervisor shift report PDFs/text files, extracting operational follow-up items, and tracking issues through Open, Monitoring, Closed, or No Action status.

The tracker captures report ID, date, shift, supervisor, incidents, patrol issues, overview, pass-down notes, officer roster concerns, and 3rd-shift off-duty officer notes. Routine Vehicle / Equipment sections remain stored with the imported report but do not create tracked issues.

Attendance Pattern persistence fixes from v3.1.21 remain in place.

### v3.1.23 Notes
- Routine Vehicle / Equipment report sections are stored with imported reports but no longer generate tracked issues.
- 3rd-shift off-duty officer notes are detected as an Off-Duty Officer issue type.
- Existing v3.1.22 import, dedupe, backup, export, and Task Tracker handoff behavior remains in place.
