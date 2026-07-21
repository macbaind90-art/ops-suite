# v3.2.2.1 High-Intelligence Professional Design System Rerun

## Purpose

This pass reruns the v3.2.2 design-system work at higher review depth before moving into screen-specific redesign. The goal was not to add features. The goal was to make the shared UI foundation cleaner, safer, and less likely to create inconsistent screens as the suite moves toward v4.0.

## What was found

### 1. Good direction from v3.2.2
The first design-system pass correctly introduced shared polish for headers, cards, controls, tables, badges, screen guides, and empty states.

### 2. Duplicated design CSS leaked into print/export templates
A deeper static review found the v3.2.2 screen-guide CSS repeated inside several print/export HTML style blocks. That could make exported/printed pages carry unused app-only CSS and undefined CSS variables. It was not the kind of bug that ruins daily use, but it was messy and unprofessional.

Resolution: duplicate leaked `screen-guide` polish blocks were removed from generated print/export templates. The design-system CSS now lives in the main app style layer only.

### 3. Shared UI primitives needed clearer hierarchy
Several screens use different local patterns for filters, toolbar actions, empty rows, and modal actions. The pass added broader shared rules for labels, inputs, modal headers, modal action bars, empty states, table controls, and responsive page widths.

### 4. The app should not redesign every screen in this pass
The correct roadmap remains: shared design system first, then Home redesign, then People, Operations, and Admin workflows. Trying to redesign every screen inside v3.2.2.1 would mix foundation work with workflow surgery.

## Implemented refinements

- Consolidated shared design CSS into one main app layer.
- Added tighter max-width behavior for the main content area.
- Improved page-head responsiveness and action alignment.
- Improved form label readability and spacing.
- Improved table inputs/buttons for dense operational grids.
- Improved modal title/action/footer patterns.
- Improved status pill consistency.
- Improved generic `.empty` behavior so no-data rows feel intentional.
- Preserved roadmap tracking in README and ROADMAP-v4.0.

## Still recommended for v3.2.3

The Home screen should be redesigned around a simple command question: **What needs attention today?**

Recommended v3.2.3 sections:

1. Today’s Priority
2. Critical Action Queues
3. System/Data Confidence
4. Recent Activity
5. Secondary Signals collapsed by default

## Still recommended for later phases

- v3.2.4: connect Attendance, Roster, Employee Profile, Training, Uniforms into one People workflow.
- v3.2.5: clarify Shift Reports -> Shift Intelligence -> Tasks as one Operations workflow.
- v3.2.6: calm down Reports / Data / Admin screens with better risk language, previews, and audit visibility.
- v3.3.0: split the large front-end into maintainable JavaScript modules.

## Stack decision

No Rust or Ruby migration is recommended in the near term. The current C# / WebView / HTML / CSS / JavaScript stack remains the right v3.x path.

## Static UI inventory reviewed

The rerun reviewed the app as a large single-page operational interface. Static inventory from `app/index.html` at this pass:

- 338 button render points
- 135 input render points
- 77 select render points
- 46 table render points
- 146 card render points
- 16 screen-guide call sites
- 7 generated print/export style templates

The highest-risk shared patterns are dense tables, filter/toolbars, generated print styles, modals, and action-heavy page headers. Those should remain the focus as each screen-specific phase begins.
