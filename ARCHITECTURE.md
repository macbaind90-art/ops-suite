# PWADC Security Operations Suite Architecture - Current Production v4.1.1

- **Windows runtime baseline:** .NET 10 (`net10.0-windows`) built with SDK `10.0.400`; self-contained x64 publish remains the production delivery model.
## v4.1.1 Attendance Schema 2 / Doctor-Note Policy Architecture

Attendance is the first core module to consume the controlled schema-migration framework in production. The current Attendance schema is `attendance-2`; `attendance-1` is the immediately previous supported schema and migrates automatically as a low-risk structural upgrade. The migration adds `pointSystem.policy.doctorNoteReductionPercent` with a 50% default and `editHistory` containers on existing doctor-note coverage records while preserving employee, attendance, doctor-note, adjustment, and corrective-action identities.

Doctor-note point treatment is now a global Attendance policy rather than a fixed per-note multiplier. `doctorNoteReductionPercent` is normalized to 0-100%; the charged share is `100 - reduction`. A covered range still counts as one attendance occurrence, only the first matching covered event bears the reduced charge, and additional matching days add no points. Changing the policy recalculates current Attendance snapshots and is recorded in the existing point-policy history.

Active doctor-note coverage is editable only by Admin users. The employee association is immutable; coverage dates, received date, covered event types, administrative reference, and administrative note may be corrected. Edits require a reason and backup, append a before/after `editHistory` record, reclassify affected call-offs, recalculate Attendance, and use the normal protected Attendance save path. Voiding remains a separate controlled action.

Legacy unstamped JSON is no longer stamped directly to the newest schema when a module has schema history. It is anchored to the immediately previous revision and then passed through the approved migration path, preserving the guarantee that a current schema marker reflects an actual structural upgrade.

## v4.1.0 Controlled Schema Migration Architecture

The suite now has a common migration control plane for registered core JSON modules. It does not change a module schema by itself; future releases register an explicit migration definition only when a real structural or business-rule change requires one.

Startup sequence is **Daily LKG -> schema metadata/compatibility -> migration queue -> normal application startup**. Only the current schema and immediately previous schema participate in automatic/controlled migration. Older schemas are legacy/manual-review states; newer schemas remain downgrade-protected.

Each migration definition identifies the module, source and target revisions, risk level, business-meaning impact, change summary, identity-preservation requirement, and transformation function. Low-risk definitions may execute automatically. Major/business-rule definitions remain pending until an active Admin supplies valid approval credentials.

Execution is per-module and one-at-a-time across workstations using `Locks\schema-migration.lock`. Before transformation, the source schema, loaded revision, and SHA-256 are rechecked against the preview to prevent stale approval. A deterministic pre-migration backup is created and hash-verified. Transformation occurs against an in-memory clone, then the target schema and writer version are stamped and validated. Where required, record counts and stable key identities are compared before promotion.

Promotion uses the existing atomic JSON write path and stale-revision gate. The resulting live file is then reopened from disk, schema-validated, and fingerprint-verified. A post-write verification failure triggers restoration from the verified pre-migration backup before the operation is reported failed.

Migration history is append-only JSONL under `Data Integrity\Schema Migrations`. The normal UI exposes status/review through bridge endpoints while the host remains authoritative for Admin credential validation and migration execution. Non-Admins cannot enter modules waiting for Admin approval, but unrelated modules remain operational.

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
9. `app/js/80-attendance.js` - legacy Attendance compatibility, shared Attendance utilities, audit/import/export helpers, and preserved historical functions
10. `app/js/82-attendance-points.js` - v3.5 Attendance Point System, backup-first migration, rolling 90-day points, rolling 14-day CO classification, Live Schedule work/off authority with Roster RDO fallback, positive-credit engine, controlled historical-grid corrections, editable doctor-note date-range coverage with configurable point reduction, manual current-point adjustments, Point Review and Corrective Action
11. `app/js/90-shift-operations.js` - Shift Reports and Shift Intelligence
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
- `MainForm.Storage.cs` - settings, folder creation, module load orchestration, storage health and seed recovery
- `MainForm.DataReliability.cs` - validated JSON transactions, durable staging, SHA-256 verification, pre-write recovery copies and write-audit records
- `MainForm.Backups.cs` - backup creation, retention, cleanup, inventory and restore
- `MainForm.Programs.cs` - approved path handling, packaged programs, suite lock files, environment information and module file status
- `MainForm.SchemaCompatibility.cs` - live JSON schema registration, compatibility classification, metadata stamping, and write guarding
- `MainForm.SchemaMigrations.cs` - startup migration queue, migration definitions, Admin approval, backup/staging/verification/rollback, and append-only migration history
- `Models.cs` - backup models, data-integrity/write outcomes, Suite Settings, coverage requirements and suite users

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
- The published live schedule is the authority for HPW and labor reporting and is also the primary Attendance source for scheduled/off status.
- For Attendance, a populated live-schedule weekday uses named assignments as scheduled work; active employees absent from that populated day are Off. When the weekday is not populated, Roster RDO is the fallback.
- Mock schedules remain excluded from live reporting and Attendance until explicitly applied to live.
- Attendance point definitions remain canonical in `82-attendance-points.js`; current-day automatic Off records carry provenance while past finalized records are protected from automatic schedule rewrites.
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
- Three-part PWADC application-version sweep with four-part Windows metadata validation where required.
- GitHub workflow presence/publish validation.
- Clean repository and ZIP integrity checks.

## Current Architecture Risk
The primary platform risks are controlled evolution of shared JSON schemas, recovery clarity, and long-term maintainability. Atomic persistence and stale-write detection remain the production concurrency controls. Shared-file locking is deferred unless production evidence justifies it. Database migration is not an active option in the current PWADC environment.


## v3.4 Persistence Contract
Critical shared JSON writes follow this host-side sequence:

`UI → existing suite:* bridge → JSON validation → live-file integrity guard → pre-write backup → same-directory durable temp write → temp parse/hash verification → atomic replace/move → final parse/hash verification → write audit`

Rules:
- Feature modules do not implement their own filesystem persistence.
- Normal saves must not overwrite malformed live JSON.
- Existing live data is preserved before replacement.
- A transaction is successful only after the final live file parses and matches the expected SHA-256.
- v3.4.0 does not yet resolve concurrent edits; stale-write detection is intentionally deferred to v3.4.1.
- Shared JSON remains the active persistence layer; no database dependency is introduced.


## v3.4 Data Reliability Boundary
Operational shared JSON modules load through the Windows host and receive a revision fingerprint. Normal saves return that expected revision through the existing bridge payload and are rejected when the live shared file no longer matches. v3.4.0 provides validated atomic replacement; v3.4.1 adds stale-write blocking. No feature module should bypass `saveModuleDataStrict` for operational shared JSON. Save coordination/short-duration live-data locks remain deferred unless production conflict evidence shows the current controls are insufficient.


## v3.5.0.11 Attendance Point Policy Configuration
Chargeable Attendance point values are persisted in `attendance.pointSystem.pointValues` and are resolved through one canonical calculation helper. Admin policy changes are backup-first, reason-required, audited, and immediately replay the existing Attendance event history. `pointValueHistory` preserves before/after policy values and recalculation metadata. Manual current-point adjustments remain explicit management baselines rather than being rewritten by a policy-value edit.


## v3.5.0.13 Doctor Note Point Treatment + Suspended Status
Doctor-note records remain stored in `attendance.medicalNotes`, but their calculation semantics are now single-occurrence rather than zero-point exclusion. For each active doctor-note record, the earliest matching covered attendance event is the point-bearing occurrence and is charged at `pointMultiplier` (default/current policy: 0.5) times the event's configured normal point value. Additional matching events under the same note remain visible but contribute no additional negative points. Doctor-note attendance issues reset clean-attendance progress. A doctor-note call-off range contributes exactly one occurrence to the rolling 14-day CO1/CO2 chain. Existing v3.5.0.12 records without an explicit multiplier are interpreted as 0.5 for forward compatibility.

`SUS` is a fixed zero-point attendance status. It is intentionally outside editable chargeable point values. It resets clean-attendance progress and does not count as a clean worked day.

## v3.5.0.12 Doctor Note Coverage Model
Doctor-note coverage is stored in `attendance.medicalNotes` as an audited administrative exception record. Each active record identifies one employee, a coverage start/end date, the received date, selected attendance event types, and an administrative reference. The original attendance code remains unchanged. The point engine checks active medical coverage while replaying attendance history, excludes covered events from negative-point totals, removes covered call-offs from the rolling CO1/CO2 chain, and preserves clean-workday progress for covered worked-day events. Voiding coverage is backup-first, reason-required, audited, and causes the point history to replay under the remaining active coverage records. Medical diagnosis/treatment data is intentionally outside this schema.

## v3.5.1.0 Daily Last-Known-Good Suite Snapshot
- The daily LKG is a **suite-state snapshot**, not a per-module save backup. Its source is the complete shared `Data` folder.
- Startup checks the current LKG manifest. If a verified snapshot already exists for the local calendar date, no new snapshot is created.
- Cross-workstation creation is coordinated with a short-duration `FileShare.None` handle under `Locks`. This coordination is limited to LKG capture and does not change the deferred live-data locking decision.
- All JSON sources must parse before capture. Files are copied to an isolated staging directory and verified with SHA-256.
- Source hashes are checked again after capture. If source data changed while the snapshot was being copied, promotion is blocked and the prior LKG is preserved.
- Promotion uses `Backups\Last Known Good\Current`. The prior `Current` directory is held as a temporary rollback copy until the staged snapshot has been promoted and its verified manifest reread successfully.
- `manifest.json` records snapshot date, timestamps, user, machine, application version, source root, scope, file count, total size, and per-file hash/size/modified metadata.
- Successful creation is logged under `Data Integrity\Write Audit`; failed capture attempts write a failure record in the LKG backup folder.
- Restoration UI is intentionally not duplicated in this release. LKG visibility/preview/controlled restore will be surfaced through the planned Data Health & Recovery Dashboard.



## v4.0.1 Schema Ownership Boundary
- Core schema compatibility guarding applies only to registered JSON files owned and written by the PWADC Security Operations Suite.
- The shared `Data` tree may also contain live JSON owned by specialist/standalone PWADC tools. Those files are treated as external operational data and are never automatically schema-stamped by the core suite.
- Any directory segment named `Backup` or `Backups` beneath `Data` is treated as a historical backup artifact rather than live data.
- Daily Last-Known-Good snapshots continue to include external live files beneath `Data`, but exclude nested backup-artifact folders to avoid backing up backups.

## v4.0.0 Schema Version & Compatibility Guarding
- Every current suite-managed live JSON module has a registered module-specific schema identifier: `attendance-1`, `roster-1`, `tasks-1`, `shift-reports-1`, `shift-intelligence-1`, and `suite-settings-1`.
- The host stamps `schemaVersion` and `lastWrittenByAppVersion` on every protected JSON write.
- On startup, legacy live files with no schema marker are upgraded only by adding metadata through the existing atomic, backup-first, revision-checked write path.
- Current schema data remains writable. A formally older schema is read-only until the Controlled Schema Migration Framework supplies an approved migration. A newer schema is read-only to protect data created by a later application build.
- Suite Settings is compatibility-checked before deserialization; an unsupported/newer settings schema blocks startup instead of silently reverting to defaults.
- Schema state is part of the module load envelope and live-file health status so the browser can block incompatible saves before reaching the host. Host-side enforcement remains authoritative.
- The host validates **both** the incoming JSON schema and the existing live target schema before protected writes. Current/legacy-missing targets may proceed; valid older/newer/wrong-module/unsupported targets are protected from overwrite. Explicit restore/reset can replace malformed JSON because no trustworthy schema can be read from damaged content.
- Core suite modules must register a schema before the suite can write them. JSON owned by separate specialist tools is outside the core schema-governance boundary and remains untouched.
- Versioning from this release forward is `Major.Feature.Minor`. Windows metadata may retain a fourth numeric component when the platform requires it.
- Pre-v4.0.0 executables are outside the schema-aware compatibility boundary and must not be treated as safe downgrade clients after live data has transitioned to v4.0.0 metadata.
