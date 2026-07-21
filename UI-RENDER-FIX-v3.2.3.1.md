# v3.2.3.1 UI Render Fix / Undefined Helper Sweep

This emergency patch follows the Home / Command Center redesign.

## Issue Found

The Home screen called `shiftIntelPendingCount()` before that helper existed. The render guard correctly surfaced the failure instead of leaving a blank app.

## Additional Undefined Helper Sweep

A TypeScript/JavaScript undefined-name sweep also found older helper calls that needed explicit shared helpers:

- `shiftIntelPendingCount`
- `shiftIntelNeedsActionCount`
- `shiftIntelDormantCount`
- `workflowBanner`
- `rosterEmployeeById`
- `openReportWindow`

## Fix

The missing shared helpers were added so Home, Reports, Training print, Attendance, Shift Reports, Shift Intelligence, and Uniform workflow banners have concrete definitions.

## Verification

- JavaScript syntax check
- Required render-function check
- TypeScript undefined-name sweep for missing helper names
- Major module render smoke check
- README roadmap updated
