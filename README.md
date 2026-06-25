# PWADC Security Operations Suite v3.0.40

Clean full repo package with `.github` included and no `.git` folder.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-40-Windows`

## v3.0.40 notes

- Upgraded Task Tracker without removing the existing email draft behavior.
- Kept **Open Current Draft** for the existing weekly email draft workflow.
- Added **Generate Fresh Draft** for the improved weekly manager update.
- Added **Copy Draft Text** and **Print Draft** support.
- Added task fields: due date, follow-up date, assigned to, priority, status, category, blocked by, last update, next action, and recurring cadence.
- Added task statuses: Not Started, In Progress, Waiting, Blocked, Completed, and Archived.
- Added task priorities: Critical, High, Normal, and Low.
- Added recurring options: None, Daily, Weekly, Monthly, Quarterly, Annual, and Custom.
- Weekly update now organizes tasks by Completed This Week, In Progress, Waiting / Blocked, Needs Decision, and Upcoming Next Week.
- Dashboard now shows overdue task count.
- Task Status Report now includes overdue, due-this-week, blocked, high/critical, follow-up, blocker, and next-action detail.
- Task CSV export now includes follow-up, recurring, blocked by, last update, next action, completed, and archived fields.
- No `.git` folder is included.
- `.github/workflows/build-windows.yml` is included.
