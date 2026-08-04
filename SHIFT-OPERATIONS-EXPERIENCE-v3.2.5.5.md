# v3.2.5.5 - Shift Operations Experience Redesign

## Objective
Finish the Shift Reports and Shift Intelligence operating experience before starting v3.2.6. The previous screen structure contained the correct workflow concepts but still felt assembled from independent cards. This release consolidates the work into intentional operating surfaces.

## Shift Reports
- Replaced the stacked hero, metrics, workflow cards, rule drawer, filter card, and issue board with one intake workspace.
- Source report remains first and authoritative.
- Routine report facts render as metadata.
- Extraction is divided into Operational Signals, Reference Context, and Ignored Noise.
- The handoff rail makes Shift Intelligence the explicit next step.
- Source history, exports, filters, backups, and clear-memory controls remain available but secondary.

## Shift Intelligence
- Replaced the two large card boards with a three-pane decision center.
- Intake Queue provides compact selectable items.
- Decision Detail provides the selected item’s operational meaning, evidence, recommended handling, and suggested links.
- Active Watchlist provides compact selectable issues.
- Creating or linking an issue transfers focus directly to that issue.
- Reference and Ignore decisions advance to the next pending intake item.
- Watchlist detail centralizes owner/notes, task creation, status changes, and closure.

## Parser and Data Enhancements
- Report summaries now retain the extracted officer count and suppressed routine-noise count.
- Source history shows the number of routine fields suppressed from issue tracking.
- Existing repeated-alarm grouping, false-alarm handling, pass-down linking, trailer reference handling, and staffing-impact logic remain intact.

## Administrative Controls
- Clear Shift Report Memory remains Admin-only.
- Backups are created before clearing.
- The action still requires a reason and the exact confirmation phrase.
- No other module data is affected.

## Validation Requirements
- JavaScript syntax check.
- Required render-function check.
- Shift Reports / Shift Intelligence render smoke test.
- Major module render smoke test.
- XML project and manifest parse check.
- Manifest XML declaration check.
- Five-part .NET version sweep.
- Four-part maximum version validation.
