# PWADC Security Operations Suite Development Roadmap

Current production build: **v4.2.0 - Data Health & Recovery Dashboard**.

This roadmap is the active development plan for the PWADC Security Operations Suite. Detailed release history belongs in `CHANGELOG.md`; system design and implementation details belong in `ARCHITECTURE.md`.

## Development Rules

1. **Operational value first.** New work must solve a real PWADC Security management, supervisor, reporting, reliability, or emergency-response need.
2. **Extend before adding.** New functionality should extend an existing operational workflow when one already exists rather than automatically creating another module.
3. **Do not duplicate working screens.** Reports and dashboards should answer a management question or support a recurring decision, not reproduce an existing workspace.
4. **Protect production data.** Backups, validation, auditability, stale-write protection, recovery controls, and migration safety remain mandatory for material data changes.
5. **Keep permissions unobtrusive.** Users should primarily see the functions they are authorized to use instead of seeing a suite full of locked controls.
6. **Human decisions stay human.** Automation may identify objective conditions requiring attention, but discipline, incident significance, policy decisions, and management judgment remain with authorized PWADC personnel.
7. **No architecture rewrite without a demonstrated need.** The current C# / WebView2 / HTML / CSS / JavaScript architecture remains the production platform unless PWADC's operating environment materially changes.

---
## Versioning Standard

Effective with v4.0.0, application releases use **Major.Feature.Minor**:
- **Major** - major revision of the overall suite.
- **Feature** - significant feature upgrade, module rebuild, or new operational capability.
- **Minor** - fixes and smaller upgrades within the current feature line.

Windows assembly/manifest metadata may carry a required fourth `.0`, but the PWADC application/release number remains three-part.

---

# Active Build Plan

## Phase 1 - Data Reliability Foundation

### 1. Daily Last-Known-Good Suite Snapshot
**Status: Completed in v3.5.1.0**

Create one verified suite-state recovery point on the first successful application startup of each calendar day.

Implemented scope:
- every live file under the shared `Data` folder
- all current module data and governed configuration stored there
- future Data-folder modules are automatically included without extending a hard-coded snapshot list

Controls:
- validate every live JSON source before promotion
- copy to staging and verify SHA-256 hashes
- recheck live source hashes after capture to detect concurrent source changes
- use short-duration cross-workstation coordination for the daily snapshot only
- preserve the previous LKG if validation, capture, verification, or promotion fails
- store a manifest with date/time, user, workstation, application version, file list, sizes, and hashes
- keep normal pre-save/manual/automatic backups separate
- never silently restore or replace live production data

Admin preview/restore surfacing is implemented through the **Data Health & Recovery Dashboard** and remains module-specific.

### 2. Schema Version & Compatibility Guarding
**Status: Completed in v4.0.0**

Every current suite-managed live JSON file now carries module-specific `schemaVersion` and `lastWrittenByAppVersion` metadata.

Implemented behavior:
- current compatible schema loads/saves normally
- legacy files with no marker receive a backup-first metadata stamp through the atomic write path
- formally older schemas are write-blocked pending controlled migration
- newer schemas are write-blocked to prevent downgrade damage
- incompatible Suite Settings block startup because settings are security/data-root authority
- schema state is exposed through load envelopes and Data Health file verification
- schema governance applies only to registered core-suite JSON; specialist/standalone tool JSON under the shared Data tree remains untouched and does not block suite startup

Current schemas: `attendance-2`, `roster-1`, `tasks-1`, `shift-reports-1`, `shift-intelligence-1`, `suite-settings-1`.

### 3. Controlled Schema Migration Framework
**Status: Completed in v4.1.0**

Implemented behavior:
- startup order: Daily LKG -> schema compatibility -> migration queue -> normal module use
- current + immediately previous schema support; older schemas require manual review
- low-risk structural migrations may run automatically after backup and validation
- major/business-rule migrations require verified Admin approval and an impact preview
- deterministic hash-verified pre-migration backup before any transform/write
- migration occurs in memory/staging first and is schema-validated before promotion
- optional record-count and key-identity preservation checks protect business records
- protected atomic write plus stale-source SHA/revision recheck prevents approval against changed data
- disk reopen/schema/fingerprint verification is required before a migration is considered complete
- post-write verification failure restores and verifies the pre-migration backup
- a suite-wide short-duration migration coordinator processes migration writes one module at a time
- non-Admins can continue using unaffected modules while a major migration waits for Admin review
- migration history is permanent append-only JSONL and records actor/workstation/version/schema/backup/outcome metadata

No production schema revision was advanced solely to test the framework. v4.1.1 delivered the first real registered migration, `attendance-1` -> `attendance-2`, for configurable doctor-note reduction policy and doctor-note edit-history containers.

### 4. Data Health & Recovery Dashboard
**Status: Completed in v4.2.0**

Upgrade Data Health into the central view for determining whether shared suite data is healthy, current, compatible, and recoverable.

Implemented indicators and controls:
- valid / invalid live data
- schema version and compatibility
- last successful verified save
- Last-Known-Good availability, age, validation, preview, and controlled restore
- 30-day stale-write/conflict count, latest source, resolution, and trend
- pending and most recent migration status/history
- fallback/recovery data currently in use and shared-storage availability
- Green / Yellow / Red / Gray severity with persistent Admin navigation indicator
- permanent meaningful-event history and unreviewed count
- metadata-only diagnostic ZIP export
- specialist-data presence/JSON validation without expanding core-suite ownership

Recovery is Admin-only, reason-required, backup-first, atomic, verified, and audited. There is no Restore All and no automatic restore decision.

### Deferred: Shared-File Locking / Save Coordination
**Status: Deferred pending evidence**

Atomic persistence and stale-write detection remain the production concurrency controls. Additional file locking will be reconsidered only if Data Health or a real production event shows recurring collisions that the current protections do not adequately address.

---

## Phase 2 - Role-Aware Interface & Centralized Permissions

### 5. Role-Aware Interface & Permission Enforcement
**Status: Approved**

Create a centralized permission model that controls both visibility and action authorization.

Design goals:
- users see only modules and actions relevant to their role
- unauthorized modules disappear from navigation rather than appearing as locked areas
- unauthorized buttons and sensitive fields are hidden where appropriate
- sensitive operations remain blocked underneath the UI even if invoked directly
- denied high-impact actions may be audited where appropriate

### 6. Admin Permission Configuration
**Status: Approved**

Add an Admin-only configuration workspace for managing role capabilities.

The configuration should support capability-based controls such as:
- view / edit Attendance
- manage Attendance policy
- adjust points
- generate or issue corrective action
- manage Shift Reports
- manage Task Tracker
- manage Training
- execute Emergency Protocols
- manage Emergency Protocols
- view reports
- restore data
- manage schema / migration controls
- manage users / roles

Avoid unnecessary per-user permission complexity unless a real PWADC need appears.

### 7. Preview as Role
**Status: Approved**

Allow Admin to preview the application as another role before saving or deploying permission changes.

---

## Phase 3 - Attendance Completion

### 8. Attendance Corrective Action Notice Generator
**Status: Approved**

Build corrective-action notice generation directly into Attendance rather than as a separate report module.

Current thresholds:
- 3 points - Verbal Counseling
- 6 points - Written Warning
- 9 points - Final Written Warning

Target workflow:
**Attendance Event -> Points -> Threshold -> Generate Notice -> Issue Notice -> Acknowledge / Record -> Audit**

The notice should draw from the authoritative Attendance record, including applicable point events and controlled point adjustments.

Notice lifecycle should distinguish at minimum:
- Due
- Generated
- Issued
- Acknowledged / recorded

Generating a notice must not automatically mark the corrective action as completed.

### 9. Attendance Action Report
**Status: Approved**

Manager-facing report answering:
**Who currently requires attention, and why?**

Target content:
- employee
- shift
- current active points
- positive attendance credit balance
- current corrective-action level
- corrective-action status
- most recent point-bearing event
- points gained or reduced during the selected period
- manual current-point adjustment indicator when applicable
- doctor-note indicator when relevant, without medical detail

Do not duplicate the full 90-Day Grid.

### 10. Attendance Trend & Risk Report
**Status: Approved**

Aggregate management report for detecting developing attendance pressure by period, shift, and event type.

Potential measures include:
- point-bearing events
- call-offs
- tardies by severity
- NCNS
- left early
- suspended days
- doctor-note-covered occurrences
- corrective actions triggered
- positive attendance credits earned

Employee names should not be the default view; detailed employee review remains in Attendance.

### 11. Standardized Report Controls
**Status: Approved**

Standardize common report behavior where applicable:
- date range
- shift filter
- employee / status filters when relevant
- screen preview
- print
- export
- consistent PWADC formatting
- report title / reporting period / generated-by information

Reports may retain specialized controls when their operational purpose requires them.

---

## Phase 4 - Training Module Replacement

### 12. Remove and Replace the Existing Training Function
**Status: Approved**

The current Training function is not the foundation for future Training development. The replacement will be designed as a new function from the ground up around PWADC Security requirements.

Before removal or conversion of existing Training data, preserve an export / backup sufficient to prevent accidental historical-data loss.

### 13. New Training Module - Ground-Up Design and Build
**Status: Approved**

Design the new module before implementation.

Target lifecycle:
**Employee -> Requirement -> Assignment -> Completion -> Sign-Off -> Renewal / Expiration -> Retraining -> History**

Design areas to resolve with PWADC Security before build:
- new-hire training
- recurring training
- certifications / expirations
- post-specific qualifications
- training requirements by rank / role / assignment
- instructor or supervisor sign-off
- policy / procedure acknowledgments
- retraining after an incident or performance issue
- due-soon / overdue management
- employee training history
- attachments / references where appropriate
- printable / exportable records
- role-aware permissions
- audit requirements

The old Training structure should not constrain the new data model or workflow.

---

## Phase 5 - PWADC Emergency Response Protocol System

### 14. Dispatcher-Style Guided Emergency Protocols
**Status: Approved**

Build an emergency-response decision-support system modeled on the guided protocol concept used by emergency dispatch environments rather than a static procedure library.

Target workflow:
**Select Incident -> Guided Question -> Required Action -> Next Decision -> Notifications / Escalation -> Stabilization or Handoff**

Initial protocol candidates are based on existing PWADC emergency materials and may include:
- ammonia release
- fire
- bomb threat
- fuel spill
- power outage
- employee / automation injury
- evacuation
- severe weather
- security threat / suspicious person
- other approved PWADC emergency procedures

Protocol content may include:
- key questions
- immediate actions
- prohibited / do-not-do actions
- required notifications
- evacuation / shelter instructions
- outside-agency notifications
- escalation criteria
- completion / handoff point
- underlying approved procedure
- protocol revision / version

Operational interface goals:
- large, clear controls
- one decision step at a time
- minimal clutter during emergency use
- operators execute approved protocols but do not edit them
- protocol editing / publishing remains governed and Admin-controlled

### 15. Emergency Protocol Session Log
**Status: Approved as part of Item 14**

Capture a defensible operational timeline including:
- protocol selected
- start time
- operator
- answers given
- actions displayed / acknowledged where appropriate
- notifications recorded
- completion or handoff time
- protocol version used

The first release should remain focused on guided response and documentation, not become a full incident-management platform unless a later PWADC requirement justifies that expansion.

---

## Phase 6 - Operational Exception & Follow-Up Engine

### 16. Objective Exception Detection
**Status: Approved**

Create a focused engine that surfaces objective conditions requiring human attention without making management decisions.

Potential conditions:
- Attendance corrective action due but not issued
- new Attendance threshold crossed
- Shift Intelligence item unresolved beyond an approved interval
- Task Tracker item overdue
- repeated objective issue across Shift Reports
- future Training qualification overdue
- emergency protocol session started but not formally closed
- repeated Data Health conflict / recovery events

Command Center presentation may group conditions such as:
- Needs Attention
- Overdue
- New Since Last Review
- Repeated Issue

The engine identifies and links to source records. Authorized PWADC personnel decide the response.

---

## Phase 7 - Performance & Maintenance Hardening

### 17. Performance & Maintenance Hardening
**Status: Approved - Later Phase**

Maintain responsiveness and stability as operational data grows.

Focus areas:
- identify modules that become slow with larger histories
- reduce unnecessary full-module rerenders
- paginate or archive large history / audit views when necessary
- keep startup time reasonable
- prevent long tables from freezing the UI
- verify backup / restore practicality as data size grows
- remove obsolete compatibility code after migrations are safely complete
- continue automated regression validation before every release

Optimization should respond to measured production needs rather than trigger speculative rewrites.

---

# Removed From the Active Plan

The following items were reviewed and intentionally removed:

- **SQLite / database migration** - not an available option in the current PWADC environment.
- **Staffing & Coverage Report** - the Schedule module represents baseline assignment structure, not a live day-to-day staffing schedule.
- **Legacy Training Compliance Report** - superseded by the complete Training replacement.
- **Standalone Corrective Action Report** - corrective-action document generation belongs inside Attendance.
- **Executive Security Summary** - not required as a standing suite-generated report.
- **Planned v4 platform rewrite** - no committed rewrite is justified. The current platform remains supported unless PWADC's environment materially changes.

# Build Discipline Going Forward

For each approved roadmap item, use the following sequence:

1. **Define the operational problem.** Confirm who uses it, what decision or task it supports, and what existing workflow it touches.
2. **Check for redundancy.** Extend an existing module when possible instead of creating a new destination in navigation.
3. **Design before coding.** Agree on workflow, data ownership, permissions, audit behavior, and failure / recovery behavior.
4. **Build the smallest complete version.** Avoid combining unrelated roadmap items into one high-risk release.
5. **Validate locally.** Run suite-wide regression checks plus targeted feature tests and exact-ZIP revalidation.
6. **Package a full clean repository ZIP.** The user handles GitHub upload/build; ChatGPT does not make GitHub changes.
7. **Production verify.** Confirm the Windows build and real PWADC workflow before starting the next major item.

# Immediate Next Work

The next planned roadmap item is **Role-Aware Interface & Centralized Permissions**. Its implementation should consolidate visibility and action authorization without duplicating the host-side Admin controls already used by migration and recovery workflows.

Shared-file locking remains deferred unless this dashboard or a real production event provides evidence that the current atomic-save and stale-write controls are insufficient.
