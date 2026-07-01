# PWADC Security Operations Suite v3.1.21

## v3.1.21 Attendance Pattern Persistence Fix

This build keeps the v3.1.20 employee-level bulk pattern actions and fixes the persistence gap where resolved Attendance Pattern findings could return after restart or when the 90-day ending date changed. Pattern review actions now save both the generated pattern key and a stable employee/type key. Existing older review records are also matched by employee/type and latest reviewed date so prior cleanup work remains honored.

No unrelated module logic was changed.
