# PWADC Security Operations Suite v3.2.1
# Full UI / UX Audit and Professional Design Recommendations

## Purpose

This audit starts the v4.0 preparation track. The goal is not to add another feature. The goal is to review the program as a professional operations platform: screen by screen, section by section, and shared UI element by shared UI element.

This document should be used as the source list for v3.2.2 through v3.2.6.

## Executive Summary

The suite has strong operational capability, but it still has the visual and structural fingerprints of a fast-growing internal tool. The product now needs a formal design system, cleaner screen hierarchy, standardized controls, and a calmer command-center experience.

The current strongest areas are data safety, backup/restore discipline, attendance intelligence, roster/schedule utility, and the emerging executive report center. The weakest areas are visual consistency, button density, table density, modal consistency, and the large single-file front-end structure.

The best professionalization path is:

1. Build a design system.
2. Rework Home into a command center.
3. Rework People screens as one connected workflow.
4. Rework Operations screens as one connected workflow.
5. Rework Reports/Data/Admin screens as a calm control plane.
6. Then modularize the code.

## Product-Wide Design Principles

### 1. One screen, one primary job
Every screen should make its primary job obvious within five seconds. Secondary tools should be grouped behind panels, subnavs, or action menus.

### 2. Primary actions must be visually rare
Each screen should usually have one primary button. Too many gold/primary actions causes decision fog.

### 3. Use progressive disclosure
The app handles complex operations. Complexity should still exist, but it should unfold when needed: filters, advanced actions, audit detail, backups, exports, and administrative controls should not all shout at once.

### 4. Empty states should teach
Every table and queue should have a helpful empty state: what it means, what to do next, and whether the empty condition is good or bad.

### 5. Risky actions need one standard pattern
Delete, restore, packaged recovery, import overwrite, bulk update, and cleanup should all share one visual pattern: warning message, preview, confirmation, final action.

### 6. Data source should always be visible
Live Shared Data, Packaged Recovery Data, Imported Backup, Restored Backup, and Unknown/Missing need consistent labeling. This prevents stale-data confusion.

## Shared UI Element Audit

### Top Bar and Navigation

Current state: improved by grouped dropdown navigation. This was the correct direction.

Issues:
- Global employee search competes with navigation and status blocks.
- Status area is useful but visually dense.
- Dropdown grouping works, but group naming should be refined around user workflows.

Recommendations:
- Keep grouped nav.
- Rename modules inside groups where useful: for example Shift Reports may become Import Reports; Shift Intelligence may become Issue Watchlist or Operations Intelligence if future testing supports it.
- Add current data source indicator in the top bar only if it can remain compact.
- Consider moving the global employee search to People context or making it visually quieter.

Priority: High for v3.2.2.

### Page Headers

Current state: mostly consistent but action areas vary in density and wording.

Issues:
- Some pages have too many top-right buttons.
- Primary, secondary, export, backup, and destructive actions mix together.
- Long page subtitles sometimes read like release notes.

Recommendations:
- Standardize page header structure: title, plain-language purpose, primary action, secondary action menu.
- Move export/import/backup actions into a secondary toolbar unless they are the main job.
- Remove release-version wording from routine page subtitles.

Priority: High.

### Buttons

Current state: functional but not yet fully systematic.

Issues:
- Primary/gold buttons sometimes mean different things depending on screen.
- Some destructive buttons are near common actions.
- Some toolbars have too many buttons at equal weight.

Recommendations:
- Define button classes: primary, secondary, quiet, warning, danger, admin.
- Restrict primary to the main next action.
- Put destructive actions at the end of a separated group.
- Use button labels that start with verbs: Import, Review, Create, Save, Print, Export, Restore, Clean Up.

Priority: High.

### Cards and KPI Tiles

Current state: helpful but sometimes too many appear at once.

Issues:
- KPI cards can become visual noise when every metric is displayed.
- Some cards mix explanation, metrics, filters, and actions.

Recommendations:
- Use KPI tiles only for decision-driving numbers.
- Move secondary stats into collapsible panels.
- Standardize card header, card body, card actions.

Priority: High.

### Tables

Current state: tables are practical but dense.

Issues:
- Many tables have too many columns.
- Actions are sometimes repeated on every row, creating button clutter.
- Wide tables need a more consistent overflow strategy.

Recommendations:
- Create compact row layout standards.
- Use row action menus for secondary actions.
- Freeze or emphasize name/status columns where possible.
- Add column grouping for print/export selectors.

Priority: Medium/High.

### Forms and Modals

Current state: workable but not yet polished as a system.

Issues:
- Modal layouts vary.
- Some forms are long and dense.
- Confirmation patterns differ by module.

Recommendations:
- Standard modal header, body, footer.
- Required fields should be visually consistent.
- Dangerous modals should use the same confirmation language and layout.
- Large forms should be divided into sections.

Priority: High.

### Badges, Chips, and Status Labels

Current state: useful but inconsistent.

Issues:
- Different modules use slightly different status language.
- Some statuses are operational, some are data state, some are action state.

Recommendations:
- Define status families: Attendance, Task, Shift Intelligence, Backup/Restore, Data Health, Uniform, Training.
- Use consistent color/emphasis rules: good, neutral, warning, critical, archived, reference-only.

Priority: Medium.

### Screen Guides and Workflow Banners

Current state: helpful but can become repetitive.

Issues:
- Some guides may be too instructional for frequent users.
- Screen guides should not push real work too far down the screen.

Recommendations:
- Use compact screen guides by default.
- Allow screen guide detail to collapse.
- Keep workflow banners only where workflow confusion is likely.

Priority: Medium.

## Screen-by-Screen Review

### 1. Home / Dashboard

Professional score: B-

What works:
- Dashboard is now less busy than earlier versions.
- Command queues are the right concept.
- Live data strip is valuable.

Issues:
- Still at risk of showing too many categories at once.
- Needs stronger visual hierarchy around “what needs action today.”
- Secondary signals and admin tools should stay subordinate.

Recommendations:
- Rebuild as three zones: Today’s Priority, System Health, Recent Activity.
- Only show 4 to 6 top priority cards above the fold.
- Move module map and secondary metrics farther down or behind collapsibles.
- Add a calm no-action state when everything is clear.

Target build: v3.2.3.

### 2. Start Here

Professional score: B

What works:
- Better as an operating guide than earlier release-note versions.
- Daily flow is useful.

Issues:
- Still risks becoming a changelog dumping ground.
- Needs separation between “how to use the suite” and “what changed in this version.”

Recommendations:
- Split into Quick Start, Daily Workflow, Admin Safety, Version Notes.
- Keep latest release notes concise.
- Link to roadmap and audit documents conceptually in text, not as giant changelog blocks.

Target build: v3.2.2.

### 3. Attendance Main Screen

Professional score: B

What works:
- Strong operational value.
- Daily entry, review, patterns, notices, and audit are correctly grouped.
- Import latest-date fix improves trust.

Issues:
- Top action area is crowded: import, packaged recovery, backup, export, remove employee.
- Packaged recovery should feel clearly secondary and risky.
- Subnav is useful but the page can feel heavy.

Recommendations:
- Make Daily Entry the default primary flow.
- Move import/backup/export/recovery under “Data Actions.”
- Keep Remove Employee visually separated as Admin / danger.
- Add a compact “latest populated date” indicator near date controls.

Target build: v3.2.4.

### 4. Daily Entry

Professional score: B

What works:
- Fast entry concept is correct.
- Date focus fix was important.

Issues:
- Status code meaning should be closer to the controls.
- Users need confidence that entries save correctly.

Recommendations:
- Add compact legend and save status near the grid.
- Make “latest imported date” visible when relevant.
- Keep keyboard-friendly operation.

Target build: v3.2.4.

### 5. 90-Day Grid

Professional score: B-

What works:
- Useful historical view.

Issues:
- Dense by nature.
- Needs clearer filtering and print/export purpose.

Recommendations:
- Add sticky context where practical.
- Add simplified summary above grid.
- Consider defaulting to exceptions-only view for supervisors.

Target build: v3.2.4.

### 6. Attendance Review

Professional score: B

What works:
- Correct place for review and exceptions.
- Policy-review mindset is strong.

Issues:
- Needs sharper distinction between raw record and actionable issue.

Recommendations:
- Group by employee and issue type more consistently.
- Show “recommended action” only when there is a rule reason.
- Make no-action / monitor / create-notice flow visually consistent.

Target build: v3.2.4.

### 7. Attendance Patterns

Professional score: B+

What works:
- Rule-based predictable design is good.
- Stable keys and status persistence matter.
- Employee grouping is the right direction.

Issues:
- Risk scoring and statuses need to stay explainable.
- Bulk actions need careful hierarchy.

Recommendations:
- Keep showing rule, threshold, count, dates, and status.
- Add pattern explainer text in a compact detail panel.
- Keep resolved/monitoring/not-an-issue out of the main action queue.

Target build: v3.2.4.

### 8. Attendance Notice Workflow

Professional score: B

What works:
- Important HR-sensitive workflow.
- Status lifecycle is useful.

Issues:
- Table is very dense.
- Actions can feel cramped.

Recommendations:
- Consider notice cards or expandable rows.
- Emphasize current status and next required action.
- Keep audit visibility strong.

Target build: v3.2.4.

### 9. Roster

Professional score: B

What works:
- Strong backbone for suite data.
- Print/export options are useful.

Issues:
- Roster risks becoming a spreadsheet wall.
- Cost visibility and operational fields need clean grouping.

Recommendations:
- Add roster summary header: active, archived, shift distribution, missing fields.
- Move advanced print/export to secondary actions.
- Use expandable employee detail for less common fields.

Target build: v3.2.4.

### 10. Employee Profile

Professional score: B-

What works:
- Good idea as a cross-module employee hub.

Issues:
- It should become more central to People workflow.
- Needs cleaner summary and clear module source labels.

Recommendations:
- Redesign into Overview, Attendance, Training, Uniforms, Roster Details, Notes.
- Show data source conflicts if roster and attendance names/ranks differ.
- Add action buttons that jump to source modules.

Target build: v3.2.4.

### 11. Schedule

Professional score: B

What works:
- Schedule authority logic is important.
- Print/share improvements are valuable.

Issues:
- It needs to remain visually clear, especially around Open/Pending/Closed logic.

Recommendations:
- Add compact schedule legend.
- Keep cost/admin-only info out of standard view.
- Preserve print clarity over screen cleverness.

Target build: v3.2.4.

### 12. Training

Professional score: B

What works:
- Good top-level People module.
- Optional/non-required training logic is valuable.

Issues:
- Needs stronger due-soon/missing-first hierarchy.

Recommendations:
- Default view should emphasize overdue, due soon, missing.
- Add training readiness cards.
- Add employee-level training summary links.

Target build: v3.2.4.

### 13. Uniform Accountability

Professional score: B+

What works:
- Practical and mature.
- Print selector and pants-needed action solve real work.

Issues:
- Could benefit from clearer issue queues.

Recommendations:
- Split by Needs Order, Issued, Replacement Due, Archived/Retired.
- Add employee-level uniform summary.
- Keep bulk actions admin-only and strongly labeled.

Target build: v3.2.4.

### 14. Office Supplies

Professional score: B-

What works:
- Useful simple tracker.

Issues:
- It can become a procurement system if not controlled.
- Table is wide.

Recommendations:
- Default to low/out/ordered view.
- Move cost to admin-only summary.
- Keep this module intentionally simple.

Target build: v3.2.5.

### 15. Task Tracker

Professional score: B

What works:
- Strong operational catch-all.
- Weekly update/draft concept is useful.

Issues:
- Toolbar is crowded.
- Task tables can be visually heavy.

Recommendations:
- Create primary tabs/filters: Open, Overdue, Blocked, Due Soon, Completed.
- Move draft/email/export/import/backup to action menu.
- Make next action and blocker visually prominent.

Target build: v3.2.5.

### 16. Shift Reports

Professional score: B

What works:
- Correct role as source intake/history.
- Handoff to Shift Intelligence is the right pattern.

Issues:
- Name may still confuse users who expect “reports” to be analysis.
- Intake and history should be visually separated.

Recommendations:
- Consider label “Import Shift Reports” in nav, keeping internal module ID unchanged.
- Show post-import result clearly: report saved, items created, review next.
- Keep raw source history separate from operational decisions.

Target build: v3.2.5.

### 17. Shift Intelligence

Professional score: B+

What works:
- Best strategic module for operational maturity.
- Intake buckets, matching, watchlist, dormancy, reference-only logic are correct.

Issues:
- Needs the most professional UX care because it is decision-heavy.
- Suggested matching should explain itself more clearly.

Recommendations:
- Redesign as Intake Review and Active Watchlist with stronger visual separation.
- Add match reason chips: same category, location, wording, repeated date.
- Make Reference Only and Ignore calm, not scary.
- Make Needs Action the dominant queue.

Target build: v3.2.5.

### 18. Executive Report Center

Professional score: B

What works:
- Good executive reporting expansion.
- Executive/compliance categories are promising.

Issues:
- Report list could become long.
- Report preview and export controls need clear hierarchy.

Recommendations:
- Group reports into cards with purpose statements.
- Add “best for” labels: executive briefing, supervisor review, audit support, monthly archive.
- Add preview-before-print standard.

Target build: v3.2.6 and v3.5.0.

### 19. Data Health

Professional score: B+

What works:
- Becoming a true control center.
- Live Data Clarity and Backup Manager are major trust improvements.

Issues:
- It is information-dense.
- Some panels may overwhelm non-admin users.

Recommendations:
- Split into Overview, Live Data, Backups, QA, Module Inventory.
- Show green/yellow/red summary first.
- Put technical details behind expandable panels.

Target build: v3.2.6.

### 20. Restore Center

Professional score: B

What works:
- Safer restore path is a major improvement.
- Preview and confirmations are correct.

Issues:
- Restore is inherently scary and needs calm wording.

Recommendations:
- Use a stepper: Select Module -> Choose Backup -> Preview -> Confirm -> Restore.
- Clearly show what will be replaced.
- Show before-restore backup status after completion.

Target build: v3.2.6.

### 21. Backup Manager

Professional score: B+

What works:
- Tiered retention is appropriate.
- Preview-first cleanup is correct.

Issues:
- Needs very clear protected-versus-cleanable language.

Recommendations:
- Add badges for protected backup types.
- Add estimated recovery point coverage.
- Add “why this backup is kept/deleted” explanations in cleanup preview.

Target build: v3.2.6.

### 22. Change Log

Professional score: B-

What works:
- Useful for version history.

Issues:
- Can become another wall of text.

Recommendations:
- Group by version and theme.
- Make current version summary first.
- Use expandable historical sections.

Target build: v3.2.6.

### 23. Other Programs

Professional score: B-

What works:
- Useful launcher.

Issues:
- Risk of becoming a dumping ground.

Recommendations:
- Add categories.
- Add last refreshed and path validity status.
- Keep it separate from operational data restore paths.

Target build: v3.2.6.

### 24. Settings / Roles

Professional score: B-

What works:
- Functional admin control.
- Security posture panel is useful.

Issues:
- PIN/role limitations need clear language.
- Settings can feel technical.

Recommendations:
- Split into Users/Roles, Suite Paths, Coverage Rules, Security Posture, System Defaults.
- Add permission matrix.
- Clarify that role gate is not network authentication.

Target build: v3.2.6 and v3.6.0.

## Code-Level UI Observations

### Main front-end file size
`app/index.html` is now large enough to be a maintainability risk. It contains markup, CSS, routing, state, business rules, reports, parsing, restore flows, UI helpers, and module renderers.

Recommendation:
- Do not rewrite immediately.
- Start by separating UI helpers and module render functions during v3.3.0.

### Inline styles
There are many inline style attributes inside templates. They make rapid development easy but weaken design consistency.

Recommendation:
- Move recurring inline styles into named CSS utility classes during v3.2.2.

### Render functions
Render functions are numerous and powerful. The required render-function guard is a good safety net and should remain.

Recommendation:
- Add a future lightweight smoke-test harness that renders each module and checks for thrown exceptions.

### Shared components
The app already has concepts of screenGuide, workflowBanner, cards, tables, chips, and notices. These should become a deliberate component library.

Recommendation:
- Create a Design System section in code comments and CSS.
- Convert one-off markup into reusable helpers over time.

## Priority Backlog

### Highest Priority
1. Standardize page headers and action bars.
2. Standardize buttons and destructive action patterns.
3. Rebuild Home as a calmer command center.
4. Move risky data actions into consistent Data Actions menus.
5. Improve restore/backup stepper language.
6. Reduce table/action clutter in Attendance, Tasks, Shift Intelligence, and Roster.

### Medium Priority
1. Improve empty states.
2. Standardize chips/badges.
3. Improve global employee search placement.
4. Add clearer report purpose labels.
5. Add expandable technical detail in Data Health.

### Lower Priority
1. Minor wording cleanup across release notes.
2. Historical Change Log compaction.
3. Optional visual polish for print headers.

## Recommended Next Build

### v3.2.2 - Professional Design System Pass

This should implement the shared visual system before redesigning individual screens. The design system should include:

- Page header standard
- Action bar standard
- Button hierarchy
- Card variants
- Table variants
- Filter toolbar pattern
- Empty state pattern
- Modal pattern
- Confirmation pattern
- Status badge/chip pattern
- Admin-only/danger action standard

After v3.2.2, the suite will be ready for targeted screen redesigns.
