# PWADC Security Operations Suite Design System

## v3.3.1.0 Responsive UI Standard

The shared design system now treats responsiveness as a platform rule rather than a screen-specific enhancement. Major pages must remain operational from the maximized desktop view down to the supported 900×600 Windows host minimum. Dense operational grids may use local scrolling, but routine controls and page structure should reflow rather than clip.

### Standing UI Rules
- Window resize behavior should be CSS-driven. Do not re-render whole application pages merely because the viewport changed.
- Text inputs, selects, and textareas may use available width; checkboxes and radio buttons must retain native compact dimensions.
- Page headers, button groups, toolbars, filters, modal actions, and navigation must wrap cleanly.
- Multi-column workspaces should use `minmax(0, ...)` and progressively collapse at narrower widths.
- Schedule and other genuinely dense tables should scroll inside their own workspace instead of forcing whole-page horizontal overflow.
- Modals must stay within the visible viewport and keep their action area accessible.
- Keyboard focus must remain visible on interactive controls.
- Fixed pixel dimensions should be reserved for controls that genuinely require them; use responsive `min()`, `max()`, `clamp()`, flex, and grid behavior for normal layout.

### Supported Window Range
- Normal operating target: maximized desktop window.
- Supported minimum Windows host size: 900×600.
- Smaller CSS breakpoints remain defensive for browser/WebView edge conditions, but the desktop host does not intentionally shrink below 900×600.

### Release Boundary
The v3.3.1.0 stabilization changes shared presentation and resizing behavior only. Operational logic, attendance classifications, schedule authority, reporting calculations, persistence contracts, and role controls remain outside this UI layer.


## Historical Foundation: v3.2.2.1

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
- v3.2.5.1: clarify Shift Reports -> Shift Intelligence -> Tasks as one Operations workflow.
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
