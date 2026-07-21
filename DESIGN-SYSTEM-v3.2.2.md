# v3.2.2 Professional Design System Pass

## Purpose

This pass applies a shared professional design layer across the PWADC Security Operations Suite before deeper screen-specific redesign work. It is intentionally conservative: polish the common UI foundation without changing JSON data models or core workflows.

## Applied standards

### Page headers
- Stronger visual container with left red rule.
- Clear title/subtitle hierarchy.
- Action buttons stay grouped on the right when screen width allows.

### Screen guides
- Consistent three-part guidance pattern: title, purpose, numbered steps.
- Used to reduce confusion without adding new workflow modules.

### Controls
- Unified focus state for keyboard accessibility.
- More consistent button spacing, shape, and hover behavior.
- Danger controls retain red treatment and stronger hover feedback.

### Cards and KPIs
- Unified corner radius and shadow.
- Subtle hover border feedback.
- Card titles use a small gold marker for scanning.

### Tables
- Sticky headers remain.
- Cleaner row hover and alternating row tone.
- Rounded table container and stronger boundaries.

### Badges / chips
- More consistent pill shape for statuses, chips, ranks, task statuses, training statuses, and uniform chips.

### Empty states
- Introduced a shared empty-state block for major no-data conditions.
- Goal is to avoid blank or dead-looking screens.

## Not included
- No data model changes.
- No new modules.
- No large workflow redesign.
- No Rust/Ruby migration.

## Next build

`v3.2.3 - Home / Command Center Redesign` should use this shared design language and apply a screen-specific redesign to the dashboard.
