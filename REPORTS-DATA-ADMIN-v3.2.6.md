# v3.2.6 - Reports / Data / Admin Redesign

## Objective
Convert Reports, Data Health, Backup & Restore, Change Log, and Admin Settings from separate utility pages into a connected PWADC governance workflow.

## Operating Model
The release introduces one governance sequence:

**Report → Verify → Recover → Govern**

- **Report:** Select the management output and confirm its source and scope.
- **Verify:** Review critical data findings and live-file confidence before relying on the output.
- **Recover:** Select scope, select backup, and preview replacement boundaries before restoration.
- **Govern:** Review high-impact audit activity and save controlled administrative changes.

## Implemented Changes
### Report Center
- Report library with operational categories.
- Selected-report detail and purpose statement.
- Source, access, and output-format visibility.
- Scope controls adjacent to report actions.
- Readiness rail with direct Data Health, Backup & Restore, and Change Log handoffs.

### Data Health
- Severity-first findings queue.
- Direct source-review action on each finding.
- Progressive disclosure for technical inventory, backup management, repair actions, QA guardrails, and regression controls.
- Existing backup-first repair and shared-file visibility retained.

### Backup & Restore
- Three-step workspace: scope, backup, preview.
- Replacement boundaries and recovery impact shown before restore.
- Existing reason, typed confirmation, module isolation, and pre-restore backup safeguards retained.

### Change Log
- Governance metrics and risk labels.
- Module, search, and row-limit controls.
- High-impact restore, deletion, settings, role, clearance, and archive actions elevated above routine saves.

### Admin Settings
- Section navigation for General, Users & Roles, Labor Assumptions, Coverage Requirements, Data & Recovery, Standalone Programs, and Restricted Actions.
- Unsaved section edits are captured before navigation.
- All settings are validated and saved in one controlled transaction.
- Existing Admin-only restrictions and active-Admin guardrail retained.

## Deliberate Exclusions
- No database conversion.
- No emergency-procedure module.
- No unrelated Shift Intelligence logic changes.
- No framework rewrite.
- No change to the specialist Other Programs execution model.

## Versioning
- Release/display version: v3.2.6
- .NET project, file, assembly, runtime, and manifest version: 3.2.6.0
