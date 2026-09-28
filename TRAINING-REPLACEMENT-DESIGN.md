# PWADC Security Operations Suite — Training Replacement Design

Status: Design decisions recorded September 28, 2026; revised for separate Promotion Packets module. Implementation baseline: v4.7.0.
Owner: Security Manager. Classification: Confidential Internal Security Use.

## Operational authority

The current Security Department policy, post handbooks, and controlled emergency instructions govern the actual procedure. The Training module tracks qualification and NEO evidence. A separate Promotion Packets module creates the current approved checklist and six-scenario written evaluation for each promotion. A completed packet does not grant a post assignment or promote an employee automatically. Security Manager decision and applicable HR approval remain distinct.

## Decisions

- The replacement starts with an empty training dataset. No legacy training topic or completion records are carried forward. Roster identity, schedule, attendance, and uniform records remain intact.
- The separate NEO document records essential orientation and supervised exposure. Training tracks its assigned version, completion evidence, and sign-offs. NEO completion does not certify independent post duty.
- T1 to T2 evaluates foundation skills and the employee's assigned primary post or posts. A pending post remains pending; no blanket assertion of all-post mastery is inferred.
- T2 to T3 requires independent qualification in Gate, Patrol, and Base/EOC. Other active specialist duties are tracked separately when assigned.
- T3 to T4 tests leadership, coaching, report review, escalation, and incident response. Core post mastery is inherited and checked for current status rather than reevaluated automatically.
- A T3 or higher may sign an observed competency. A Supervisor reviews the completed promotion packet; the Security Manager makes the promotion recommendation or decision. The candidate cannot sign their own evidence.
- The framework's probation, attendance, and documentation-accuracy criteria appear as review flags with evidence and an exception reason. They do not automatically block a recommendation.
- Crosswalk and Grocery Dock are retired posts and must not be seeded as requirements. The separate NEO-001 v1.2 document still mentions them; its replacement is handled in the onboarding-document project.

## Data ownership

Create `training-data.json` with schema `training-1` and `promotion-packets-data.json` with schema `promotion-packets-1` as two governed modules. Both reference roster employees by stable roster ID plus an identity snapshot on signed records. A promotion packet holds a frozen reference/snapshot of the qualification evidence considered, so a later training edit or restore cannot silently rewrite a decision. Never place new training or promotion writes in `roster-data.json`. Both modules join atomic writes, optimistic revision checks, backups, morning LKG, restore controls, health checks, and schema compatibility. A missing new file initializes from an empty packaged seed; a damaged live file never silently resets.

Training data has versioned requirement references, assignments, attempt/evaluation evidence, sign-offs, acknowledgments, renewal events, and an append-only audit. Promotion data has versioned checklist and scenario definitions, candidate answers or scanned-answer references, evaluator assessments, Supervisor recommendation, Manager decision, and an append-only audit. Definitions are deactivated/superseded instead of deleted after use. Signed attempts and decisions are immutable; corrections are appended with a reason and link to the superseded event. Document and evidence attachments are references to controlled storage, not binary content in JSON.

Each event records a unique ID, roster employee ID, requirement/version ID, outcome, observed or simulated method, dates, actor account ID and displayed name, evidence/reference, comments, and creation timestamp. Signed events include the signer's role/rank at the time. The backend verifies the actor and the allowed state transition; a browser-only permission check is insufficient.

## Workflow and status

Requirement lifecycle: Draft → Active → Superseded/Inactive. Assignment lifecycle: Not Started → In Progress → Ready for Evaluation → Qualified or Needs Practice. A qualification may become Due Soon or Expired by date; retraining produces a new attempt and sign-off, preserving earlier history. Acknowledgments have Assigned → Acknowledged, with a new assignment when the controlled document version changes.

Promotion packet lifecycle: Draft → Candidate Response → Evaluator Review → Supervisor Recommendation or Returned → Security Manager Decision → HR Follow-up/Closed. A returned packet keeps its record and can be revised in a new evaluation cycle. Submission freezes the checklist/scenario revision, candidate responses, and qualification evidence references. A completed packet states eligibility evidence, not an automatic promotion or pay change.

The evaluator records Pass, Needs Practice, or Not Observed against the current approved packet's competency reference. Simulation is clearly marked and can satisfy a scenario requirement only when that packet permits simulation. It cannot replace an observed live post qualification when live observation is required. An evaluator cannot sign their own evaluation. Supervisor review and Security Manager decision must be different audit events, even if one person legitimately holds both account capabilities.

## Promotion Packets module

The module has its own navigation and record ownership, with a shared employee identity and read-only links to Training qualifications. It generates three controlled packet templates: T1→T2, T2→T3, and T3→T4. Each includes employee/control fields, tier-specific competency checklist, **exactly six written candidate-answer scenarios**, space for candidate answers, evaluator assessment and comments, recheck record, Supervisor recommendation, Security Manager decision, and HR follow-up. NEO remains a separate onboarding document tracked in Training.

Print modes are Blank Candidate Packet and Completed Record. Candidate printing excludes evaluator guidance; the evaluator view can show expected elements and critical safety/authority points. Each scenario can be marked Meets Standard, Needs Development, or Not Answered, with a narrative reason. There is no arbitrary numeric pass score or automatic promotion. The evaluator can request a documented recheck; prior answers remain in history. The packet template and scenario wording are versioned, and an issued packet retains its exact revision.

Training prints its own record summary and exports its matrix/history. Promotion Packets prints the checklist and scenarios and exports a packet status register. The dashboard prioritizes pending sign-offs, upcoming renewals, overdue training, and promotion reviews waiting for management action.

### Draft print packet content, revision 0.1

Three nine-page candidate packet prototypes have been prepared from the current Gate v1.6, Patrol v1.1, Base v1.3, and Supervisor v1.1 handbooks. Each has a tier-specific 12-item competency checklist, six scenario pages with ample handwritten-response space, scenario review, Supervisor recommendation, Security Manager decision, and HR follow-up. They are drafts for Security Manager content review before being established as the versioned templates in the module.

| Tier | Six scenario subjects |
| --- | --- |
| T1→T2 | Denied badge read; unverified weekend delivery; outbound PWADC truck mismatch; patrol hazard and open door; competing Base messages; ammonia alarm. |
| T2→T3 | Gate surge and denied read; vendor verification failure; possible theft evidence; competing Base priorities; camera loss during incident; alarm and injury. |
| T3→T4 | Coverage gap; access error and coaching; simultaneous emergency demands; report and video review; questionable competency sign-off; acting authority. |

The candidate print copy contains no evaluator answer key. The eventual evaluator view will cite current procedure sections and assess safety, authority, verification, notifications, documentation, and judgment without an arbitrary numeric passing score. Scenario content must be reviewed whenever a controlling handbook or emergency procedure changes.

## Access control

Add a narrow Senior Officer application role for T3 evaluators; do not grant them the existing Lead permissions. Training capabilities: `training.view`, `training.record`, `training.signoff`, and `training.manage`. Promotion capabilities: `promotion.view`, `promotion.evaluate`, `promotion.review`, `promotion.decide`, and `promotion.manage`. Default role assignments must be migrated through Suite Settings with Admin immutable. The host validates each operation, actor identity, employee ID, state transition, revision, and self-sign prohibition. A generic whole-file save cannot let one capability impersonate another action.

## Cutover and checks

Replace the legacy Training screen, default-topic injection, and roster training arrays as active sources. Add Promotion Packets navigation and link it from employee profiles. Update the Employee Profile, Report Center, executive/health signals, Restore Center description, Data Health registry, module source panel, and documentation to use the two new governed files. Retired roster fields may remain inert for compatibility but never appear in new calculations. No historical training migration is needed.

Validate empty-data startup, three printable packet templates with six scenarios each, candidate/evaluator print separation, NEO not granting independent duty, all three T2→T3 core posts, a T3 sign-off, self-sign rejection, Supervisor recommendation, Manager decision, expired renewal, a recheck after Needs Development, stale revision conflict, backup/LKG recovery for both modules, role-preview reduction, print/CSV agreement, and no seeded Dock/Crosswalk requirement. Run the complete existing regression suite and Windows build before production status.
