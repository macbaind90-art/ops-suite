# v3.2.2.2 Navigation Dropdown Hover Fix

## Purpose
Small patch after the professional design-system rerun. The grouped top navigation dropdowns were closing when the pointer crossed the small gap between the group button and its menu.

## Fix
- Removed the dead hover gap by bringing the dropdown menu flush with the group button.
- Added a small invisible hover bridge under each nav group so moving downward into the dropdown remains natural.
- Kept focus-within behavior so keyboard/click focus still keeps menus open.
- No data model changes.
- v3.2.3 remains the next planned Home / Command Center Redesign.
