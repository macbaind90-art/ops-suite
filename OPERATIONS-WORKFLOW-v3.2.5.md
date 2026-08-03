# v3.2.5 Operations Workflow Redesign

## Purpose
This pass connects operational screens into one daily lane: **Import -> Review -> Track -> Resolve -> Report**.

## Screens touched
- Shift Reports
- Shift Intelligence
- Task Tracker
- Office Supplies
- Report Center quick handoff through the Operations Workflow strip

## Design decisions
- Shift Reports remains the source-document and raw intake screen.
- Shift Intelligence remains the decision and watchlist layer.
- Task Tracker is the destination for owner/date/action follow-ups.
- Office Supplies supports operational readiness without becoming a full procurement system.
- Report Center remains the executive/compliance output lane.

## Added UI patterns
- Operations Workflow strip
- Operational Lifecycle panel
- Operations KPI chips
- Shift Intelligence Create Task action

## Safety rule
Routine N/A, none, no-issue, or reference-only material should not become an operational issue. It should remain source history or reference-only intelligence unless it creates real operational impact.

## Next phase
v3.2.6 should redesign Reports / Data / Admin screens, especially Report Center, Data Health, Restore Center, Backup Manager, Change Log, Settings, and Other Programs.
