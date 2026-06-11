# PWADC Security Operations Suite v3.0.8

## Current Build

**Version:** v3.0.8

This build updates the Home screen into **Manager Dashboard 2.0** with Attendance, Staffing for Today, Task Watch, and Quick Actions.

## Current Updates in v3.0.8

- Rebuilt Home into Manager Dashboard 2.0
- Added Attendance section:
  - Today entered
  - Blanks
  - RDO
  - Open patterns
- Added Staffing for Today section:
  - By shift/section
  - Scheduled count
  - Entered count
  - Blank count
  - RDO count
- Added Task Watch section:
  - Active tasks
  - High priority tasks
  - Waiting/on hold
  - Archived/completed
- Added Quick Actions section:
  - Daily Entry
  - 90-Day Grid
  - Attendance Review
  - Patterns
  - Roster
  - Schedule
  - Task Tracker
  - Backup Everything
  - Data Health
  - Other Programs

## Major Version History

### v3.0

Stable production milestone for the PWADC Security Operations Suite.

Major capabilities included:

- Attendance module
- Roster module
- Schedule module
- Training tracking
- Uniform tracking
- Task Tracker
- Other Programs launcher
- Data Health
- Restore Center
- Change Log
- Backup Everything
- Pattern tracking
- Attendance Review
- Notice generator
- Shared data root support
- GitHub Actions Windows EXE build workflow

### v3.0.1 - v3.0.3

- Corrected Attendance Review and Patterns screen behavior
- Restored Attendance Review to the preferred table layout
- Moved grouped drill-down behavior to the Patterns screen
- Added pattern employee tiles
- Added single-tile drilldown so only one selected employee opens at a time
- Simplified build/artifact names to version-only format
- Included `.github/workflows/build-windows.yml` in build kits

### v3.0.4

- Added schedule row removal
- Added Remove Row option inside schedule row edit modal
- Added Manage Ranks
- Added custom rank support for roster employee add/edit
- Prevented deletion of ranks currently assigned to employees

### v3.0.5

- Task Tracker completed tasks now archive automatically
- Archived tasks hidden from normal open-status view
- Archived tasks can be reopened
- Removed Next Step from task table, modal, export, weekly update, and data health checks
- Hardened modal click behavior

### v3.0.6

- Added individual username + PIN login
- Added role tiers:
  - Admin
  - Supervisor
  - Guard
  - Viewer
- Added Settings → User Management
- Added current signed-in user display
- Added role-based module visibility
- Audit/change logs record signed-in user where supported

### v3.0.7

- Fixed v3.0.6 startup failure caused by missing `DEFAULT_USERS`
- Kept schedule row removal
- Kept custom rank management

### v3.0.8

- Added Manager Dashboard 2.0
- Added Attendance dashboard section
- Added Staffing for Today dashboard section
- Added Task Watch dashboard section
- Added Quick Actions dashboard section

## Build

Use GitHub Actions workflow at:

```text
.github/workflows/build-windows.yml
```

Expected artifact naming pattern:

```text
PWADC-Security-Operations-Suite-vX-X-X-Windows
```

## Shared Data Root

Default shared data path:

```text
\\pig-fs\Security\MacBain\Security Operations Suite
```

Primary folders:

```text
Data
Backups
Exports
Locks
Programs
Documents
```

## Other Programs

Standalone audit tools are launched from:

```text
\\pig-fs\Security\MacBain\Security Operations Suite\Programs
```

Expected tools:

```text
Badge Audit
AMAG Audit
Access Audit
```

## Build Kit Rules

Going forward, build kits should:

- Include `README.md`
- Include `.github/workflows/build-windows.yml`
- Use version-only names, such as `v3.0.8`
- Exclude `check*.js`
- Exclude scratch validation files
- Exclude QA audit notes
- Keep filenames and artifact names simple
