# PWADC Security Operations Suite Architecture - v3.3.0

## Purpose
v3.3.0 establishes a maintainable module boundary without changing PWADC operational workflows, shared JSON contracts, or the C# / WebView2 platform.

The design objective is controlled separation, not a framework rewrite.

## Front-End Load Order
`app/index.html` is now a lightweight shell. It loads the design system and JavaScript in this controlled order:

1. `app/js/00-module-registry.js`
2. `app/js/10-bootstrap.js` - constants, global state, role controls, SuiteBridge, initialization and shared UI utilities
3. `app/js/20-data-core.js` - shared module normalization, save/load helpers, attendance/roster synchronization and employee profile data helpers
4. `app/js/30-shell-audits.js` - navigation shell, module dispatcher, specialist audit wrappers, Data Health backup/file controls
5. `app/js/40-reports-governance.js` - reporting, office supplies, Data Health findings, restore, change log and governance helpers
6. `app/js/50-workflows-home.js` - People/Operations workflow navigation, Start Here and Command Center
7. `app/js/60-roster-schedule.js` - roster maintenance, schedule workspace, mock schedules and schedule print/share
8. `app/js/70-training-uniforms.js` - training, uniform accountability, labor/coverage analytics and roster import/export helpers
9. `app/js/80-attendance.js` - all Attendance views, patterns, notices, totals printing and attendance import/export
10. `app/js/90-shift-operations.js` - Shift Reports and Shift Intelligence
11. `app/js/95-tasks-settings.js` - Task Tracker, Settings and viewport behavior
12. `app/js/99-startup.js` - validates module registration and then calls `init()`

## Front-End Module Contract
Every functional module registers exactly once with `PWADCModuleRegistry` after its source has loaded.

The startup gate expects these 10 functional registrations:

- `bootstrap`
- `data-core`
- `shell-audits`
- `reports-governance`
- `workflows-home`
- `roster-schedule`
- `training-uniforms`
- `attendance`
- `shift-operations`
- `tasks-settings`

If a required module is missing, startup is stopped and the existing startup error mechanism is used. This prevents a partially loaded suite from being mistaken for a healthy application.

## Shared JavaScript Rules
- Maintain the current classic-script load model until a future architecture phase explicitly approves a module-system migration.
- Shared constants/state belong in `10-bootstrap.js`.
- Shared persistence, normalization and cross-record matching belong in `20-data-core.js`.
- Feature-specific logic belongs in the owning functional file.
- Do not create a second copy of a canonical definition such as `DISCIPLINE_CODES`, `TRACKING_CODES`, loaded-cost assumptions, or schedule authority rules.
- Cross-feature calls are allowed when they reflect an intentional workflow handoff, but new shared helpers should move to the shared layer instead of being duplicated.
- `index.html` should remain a document shell. New application logic should not be added inline.
- Global render/action functions referenced by inline HTML handlers must remain reachable under the existing classic-script model unless the UI event architecture is intentionally redesigned later.

## Design System
The primary design system is now externalized to:

`app/assets/styles.css`

Feature-specific print styles embedded inside JavaScript-generated report windows remain feature-owned because they are runtime document payloads, not application-shell CSS.

## Windows Host Structure
`MainForm` remains one partial class with responsibilities separated by source file:

- `MainForm.cs` - WinForms/WebView lifecycle and primary fields
- `MainForm.Bridge.cs` - `suite:*` message routing and WebView response handling
- `MainForm.Storage.cs` - settings, folder creation, module load/save, storage health and seed recovery
- `MainForm.Backups.cs` - backup creation, retention, cleanup, inventory and restore
- `MainForm.Programs.cs` - approved path handling, packaged programs, suite lock files, environment information and module file status
- `Models.cs` - backup models, Suite Settings, coverage requirements and suite users

## Desktop Bridge Contract
v3.3.0 does not rename or remove existing WebView message contracts. Current contracts remain the compatibility boundary between the JavaScript application and the Windows host.

Any future bridge change must:
1. Preserve backward compatibility where practical.
2. Be documented in the release notes.
3. Be included in bridge contract validation.
4. Avoid silent changes to JSON payload meaning.

## Data Authority Rules Retained
- Shared data root remains `\\pig-fs\Security\MacBain\Security Operations Suite`.
- Shared JSON files remain the active persistence layer.
- The live schedule remains the authority for HPW and labor reporting.
- Mock schedules remain excluded from live reporting until explicitly applied.
- Attendance code meanings and discipline definitions are unchanged.
- Existing backup-first high-impact actions remain in force.

## Validation Requirements for Future Builds
At minimum, future changes should continue to run:
- JavaScript syntax checks for every `app/js/*.js` file.
- Front-end module registration/load-order validation.
- Existing required render-function guard validation.
- Inline action-handler target validation.
- Duplicate named-function validation.
- Major module render smoke tests.
- XML project/manifest parsing.
- Exact manifest XML declaration validation.
- Five-part .NET version sweep.
- GitHub workflow presence/publish validation.
- Clean repository and ZIP integrity checks.

## Next Architecture Risk
After code concentration, the primary platform risk is shared-file concurrency and data reliability. v3.4.0 should address stale writes, conflict detection, atomic persistence, schema/version awareness, validation, and recovery before a database migration is considered.
