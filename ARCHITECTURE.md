# PWADC Security Operations Suite Architecture - Current Production v4.6.0

## v4.6.0 Attendance Trend & Risk Report

The Attendance Trend & Risk Report is a read-only aggregate view built on the existing Attendance event and point-calculation functions. `attendanceTrendMetricsForRange()` derives event and point measures for the selected period; it does not persist a parallel analytics dataset or introduce a schema revision.

The default scope is the current Attendance as-of date and preceding 90 days. The comparison period is the immediately preceding equal-length period. Weekly or monthly buckets and current-shift groupings are calculated from the same aggregate measures. The selectable trend focus drives a Rising, Stable, or Falling pressure signal. Rising/Falling requires at least two events of count movement, at least three combined observations, and a rate change greater than 20%; otherwise the signal remains Stable.

Point-bearing events and points charged are derived from `attendancePointSnapshot()` issue records. Doctor-note-covered multi-day ranges follow the existing single-occurrence treatment and expose only aggregate counts. Corrective thresholds are counted when a point event or controlled point adjustment moves the calculated level upward into Notice or Final Warning. Positive credits use the point engine's earned-credit history.

The default print/PDF and CSV views exclude employee names and doctor-note details. Shift attribution uses the employee's current Attendance assignment because the suite does not retain a historical shift-assignment ledger. Detailed employee investigation remains in Attendance and the Attendance Action Report.

## v4.5.0 Attendance Action Report

The Attendance Action Report is a derived management view in `app/js/40-reports-governance.js`; it does not persist a second attendance model. `attendanceActionReportRows()` evaluates `attendancePointSnapshot()` and `correctiveActionWorkflow()` as of the selected end date, then applies report-only shift, required-level, and lifecycle filters.

The default Open Attention scope contains Due, Generated, and Issued records. Acknowledged, Recorded, and No Notice Due records remain available for evidence or broader review. Period movement separates point additions from reductions and incorporates attendance charges, positive-credit offsets/paydown, policy-approved doctor-note reductions, and manual current-point adjustments. Doctor-note visibility is deliberately reduced to a Yes/No relevance indicator.

Print/PDF and CSV outputs use the same derived row set and filter state. The report does not reproduce the 90-Day Grid and does not introduce a schema revision because it adds no stored business record.

## v4.4.0 Attendance Notice Lifecycle

Attendance remains the authoritative source for notice eligibility. `attendancePointSnapshot()` calculates active points; `attendanceActionLevel()` maps 6–8.99 to Notice and 9+ to Final Warning. `correctiveActionWorkflow()` combines the current required level with persisted lifecycle records and prevents duplicate generation for the same or higher current notice level.

Generated records freeze employee identity, notice type, as-of date, active-point total, triggering event, and the active point-detail record. Generation and each status transition create a pre-change Attendance backup, append the Attendance audit, and save through the governed persistence path. Delivery is explicit: Generated -> Issued -> Acknowledged or Recorded. Recorded requires a note when acknowledgment is unavailable or declined.

Attendance schema revision 3 adds lifecycle metadata without changing prior record identities. The automatic `attendance-2` -> `attendance-3` migration normalizes historical Written/Final Written Warning labels and classifies prior one-step records as Recorded. The print view is generated from the frozen record, not from a later recalculation.

## v4.3.0 Role-Aware Interface & Centralized Permissions

`SuiteSettings.RoleCapabilities` is the durable role-only authorization matrix. Admin is always treated as a wildcard superuser in both browser and host code; persisted Admin edits cannot remove that safeguard. Supervisor, Lead, and Viewer assignments are initialized from the previous hard-coded access behavior and can be managed from the Admin Permissions workspace.

The browser resolves module visibility through `moduleCapability()` / `hasCapability()`, so unauthorized modules are omitted from navigation and page construction. Selected action controls use `data-capability` and direct function guards. Pay/cost fields retain a separate capability check. **Preview as Role** is available only to a signed-in Admin, can reduce the visible interface to Supervisor/Lead/Viewer, displays a persistent banner, and never replaces the actual signed-in identity.

`MainForm.Authorization.cs` is the shared host authorization boundary. Protected bridge operations revalidate an active user ID, exact PIN, and required capability against the host-loaded settings. Settings save and backup cleanup call the host guard directly; schema migration and recovery/reset/restore flows use the same centralized credential resolver. Browser visibility is therefore not the security boundary for high-impact operations.

Suite Settings schema revision 3 adds the capability matrix. The `suite-settings-2` -> `suite-settings-3` migration is low-risk, backup-first, and preserves users, PINs, data-root configuration, and labor assumptions. Governed module saves include the signed-in authorization envelope, and the Windows host requires a matching module-family write capability before persistence.

- **Windows runtime baseline:** .NET 10 (`net10.0-windows`) built with SDK `10.0.400`; self-contained x64 publish remains the production delivery model.

## v4.2.0 Data Health & Recovery Architecture

`MainForm.GovernedModules.cs` is the authoritative ownership registry for core suite JSON. It defines module identity, label, filename, schema revision, and backup/LKG/migration/recovery eligibility. Schema compatibility, storage paths, health evaluation, and recovery all resolve through this registry; specialist JSON remains outside the governance boundary.

`MainForm.DataHealthRecovery.cs` evaluates shared-storage access and each governed module independently. Health state combines JSON integrity, schema/access state, last verified write, LKG validation/age, migration result, recovery result, and the 30-day stale-write count. Meaningful transitions are appended to permanent JSONL history; routine healthy refreshes are not logged.

The browser dashboard is implemented in `app/js/42-data-health-recovery.js`. It is capability-gated and Admin-only by default, exposes a persistent severity/event indicator, and uses progressive disclosure: current status and recovery availability first, technical hashes/paths second. Dashboard actions call host-authoritative bridge endpoints for LKG preview/restore, event review, diagnostics export, and conflict-resolution recording.

LKG restore is constrained to one governed module and the current supported schema. It requires verified Admin credentials, a reason, the previewed live revision, a valid LKG hash/manifest, a pre-restore backup, atomic write, disk reopen/schema verification, and permanent recovery audit. Backup Center restore and packaged seed recovery use the same Admin/reason/backup/verification/audit boundary. No Restore All or automatic recovery path exists.

Shared-storage failure is isolated. Startup warns the user, offers the Admin dashboard after sign-in, and permits packaged fallback data to load read-only so unaffected interface functions can open without representing fallback data as live production data.

## v4.1.3 Employee Profile / Attendance Grid Reliability
- Employee Profile recent-Attendance rendering now uses the active `pointCodeLabel()` helper from the Attendance point module. The obsolete `codeLabel()` dependency is prohibited by regression validation.
- The 90-Day Attendance Grid is an explicit viewport-height scroll surface. Sticky semantics are applied to the table header group, header row, and individual header cells for WebView2/Chromium reliability, while the Employee corner remains sticky on both axes.

## v4.1.2 People Navigation / Attendance Grid UX
- Employee profile navigation is centralized through shared helpers in `20-data-core.js`. Roster records use their native IDs; Attendance records resolve to the linked Roster employee when available and fall back to the Attendance employee ID when not.
- Primary people-facing modules render the employee name itself as the profile action rather than requiring a separate Profile button. Existing surrounding row/cell actions remain intact because profile-link clicks stop propagation.
- The 90-Day Attendance Grid uses a dedicated `attendance-point-grid-wrap` scroll container. Its date header and Employee corner header are sticky within that container so dates remain visible during long vertical reviews while horizontal scrolling remains available for the full 90-day period.


## v4.1.1 Attendance Schema 2 / Doctor-Note Policy Architecture

Attendance first consumed the controlled schema-migration framework at schema 2. The current Attendance schema is `attendance-3`; `attendance-2` is the immediately previous supported schema and migrates automatically to add notice lifecycle metadata. The earlier 1->2 migration added `pointSystem.policy.doctorNoteReductionPercent` with a 50% default and `editHistory` containers while preserving record identities.

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
6. `app/js/42-data-health-recovery.js` - Admin health dashboard, persistent severity indicator, LKG preview/restore and diagnostic export
7. `app/js/50-workflows-home.js` - People/Operations workflow navigation, Start Here and Command Center
8. `app/js/60-roster-schedule.js` - roster maintenance, schedule workspace, mock schedules and schedule print/share
9. `app/js/70-training-uniforms.js` - training, uniform accountability, labor/coverage analytics and roster import/export helpers
10. `app/js/80-attendance.js` - legacy Attendance compatibility, shared Attendance utilities, audit/import/export helpers, and preserved historical functions
11. `app/js/82-attendance-points.js` - Attendance Point System and controlled Attendance workflows
12. `app/js/90-shift-operations.js` - Shift Reports and Shift Intelligence
13. `app/js/95-tasks-settings.js` - Task Tracker, Settings and viewport behavior
14. `app/js/99-startup.js` - validates module registration and then calls `init()`

## Front-End Module Contract
Every functional module registers exactly once with `PWADCModuleRegistry` after its source has loaded.

The startup gate expects these 11 functional registrations:

- `bootstrap`
- `data-core`
- `shell-audits`
- `reports-governance`
- `data-health-recovery`
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
- `Models.cs` - backup models, data-integrity/write outcomes, Suite Settings and suite users

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
- Every current suite-managed live JSON module has a registered module-specific schema identifier: `attendance-3`, `roster-1`, `tasks-1`, `shift-reports-1`, `shift-intelligence-1`, and `suite-settings-3`.
- The host stamps `schemaVersion` and `lastWrittenByAppVersion` on every protected JSON write.
- On startup, legacy live files with no schema marker are upgraded only by adding metadata through the existing atomic, backup-first, revision-checked write path.
- Current schema data remains writable. A formally older schema is read-only until the Controlled Schema Migration Framework supplies an approved migration. A newer schema is read-only to protect data created by a later application build.
- Suite Settings is compatibility-checked before deserialization; an unsupported/newer settings schema blocks startup instead of silently reverting to defaults.
- Schema state is part of the module load envelope and live-file health status so the browser can block incompatible saves before reaching the host. Host-side enforcement remains authoritative.
- The host validates **both** the incoming JSON schema and the existing live target schema before protected writes. Current/legacy-missing targets may proceed; valid older/newer/wrong-module/unsupported targets are protected from overwrite. Explicit restore/reset can replace malformed JSON because no trustworthy schema can be read from damaged content.
- Core suite modules must register a schema before the suite can write them. JSON owned by separate specialist tools is outside the core schema-governance boundary and remains untouched.
- Versioning from this release forward is `Major.Feature.Minor`. Windows metadata may retain a fourth numeric component when the platform requires it.
- Pre-v4.0.0 executables are outside the schema-aware compatibility boundary and must not be treated as safe downgrade clients after live data has transitioned to v4.0.0 metadata.
