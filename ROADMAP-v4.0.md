# PWADC Security Operations Suite roadmap

The current application release is recorded in `VERSION`. This filename is retained for existing links. Release history is in `CHANGELOG.md`; current design is in `ARCHITECTURE.md`.

## Completed maintenance

- Audit batches 1–3: native session authorization, credential migration, protected projections, shared-file writer coordination, rollback and revision-bound recovery; save queue and promotion draft lifecycle fixes; Attendance, Training and portable promotion correctness.
- Core work from batches 4–6: active-screen rendering, scoped Attendance/Training calculation reuse, schedule-hour indexing, deferred affected-module diagnostics, one release-version source, discovered validator execution and current documentation.
- Windows release gates cover native behavior and actual WebView2 navigation and input.

## Excluded and deferred

- Add-on program maintenance, including Access and Badge Audit parsing, overnight matching and duplicate asset generation, was removed from this batch at the user's direction. Existing files remain unchanged.
- Emergency-response documents and modules are a separate future scope.
- No Badge matching policy or time-window decision is made by this release.

## Continuing rules

Keep the WinForms/WebView2/shared-folder architecture. Preserve backup, migration, capability and stale-write protections. Extend existing workflows before adding new screens. Keep discipline, incident assessment and management decisions with authorized staff. Require successful validation and a Windows package built from the final revision for a release.

Further feature priorities should follow operational use of the current build. There is no unapproved module expansion in this plan.
