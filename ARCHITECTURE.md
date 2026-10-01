# PWADC Security Operations Suite architecture

The current release is defined in `VERSION`. The application remains a .NET 10 WinForms host with a packaged WebView2 interface and shared-folder JSON storage. `CHANGELOG.md` contains historical release details; this file describes the current implementation.

## Authentication and persistence

The trusted packaged page signs in through the native host and receives a random session token. Protected bridge requests require that token and revalidate the settings-file revision. Account and permission changes require a new sign-in. Browser settings omit PINs and hashes. Successful sign-in migrates legacy plaintext PINs to salted PBKDF2-SHA256 hashes.

Host capability checks govern reads, commands, exports and saves. Roster projections remove unauthorized employee, pay, schedule, supply, uniform and legacy Training fields. Restricted saves merge allowed fields against the latest host data. Generic saves cannot alter governed Training or Promotion state.

`SharedFileLease` holds an exclusive handle from revision comparison through verification or rollback. Module saves, settings, migrations and recovery share this coordination. Loads parse and hash the same bytes. `GuardedFileCommit` restores preserved bytes if replacement verification fails; failed rollback reports an unknown outcome. Recovery validates both the previewed live revision and candidate hash and preserves corrupt originals.

The browser serializes immutable save snapshots per module. Conflicts and unknown outcomes block queued mutations until reload. Promotion draft generations retain edits made during a save; recovery and reload discard obsolete drafts. Request deadlines report uncertain mutation outcomes without silently retrying. Settings candidates commit before replacing runtime settings, and the selected data-root pointer persists across restarts.

## Rendering and calculation lifetime

`renderPages` builds only the active authorized page. Module data and filter state remain in JavaScript state when a page is replaced. Search inputs retain focus and selection after a render.

`withCalculationContext` creates one synchronous render/report context and discards it in `finally`, including on failure. Attendance snapshots are cached by employee and effective date within that context. Schedule hours are indexed once across unique schedule cell values, retaining the existing name-matching rules. Training employee/requirement/assignment lookups, effective events and computed rows share indexes in the same context. No context survives a render, save, reload, date change or report invocation. Callers outside a context calculate fresh values.

Save completion queues affected-module health checks. A debounced WinForms timer runs diagnostics after the write response and file lease finish, on the same UI thread as settings changes. Unaffected module results are reused from the last check of the same data root. Indicator requests reuse the snapshot and request a full refresh after one minute; opening the Data Health dashboard performs a full evaluation. These are deferred UI-thread diagnostics, not parallel filesystem scans.

## Operational modules

Attendance uses the America/Chicago facility calendar, governed policy dates and effective-date snapshots. Manual adjustments and positive-credit consumption replay chronologically. Live Schedule remains the schedule authority.

Training qualification uses effective, non-voided observations and signoffs with renewal expiry. A passing observer may sign off under the existing policy. An Admin override requires a documented reason and remains correctable in history.

Promotion Packets freezes the employee identity, checklist, random scenario selection and Training evidence at issuance. Manager decisions do not change roster rank or compensation. Offline evaluator workspaces and native completion checks share validation rules for all three levels.

## Build and tests

`VERSION` is the authoritative application version. `node tools/sync-release.js` updates the checked-in native, manifest, page, print and promotion-seed version fields; `--check` detects drift. Seed writer versions outside the updated promotion seed retain their original provenance.

`node tools/validate-all.js` discovers every `tools/validate-*.js` file except itself, checks generated release fields, runs all validators and produces portable-promotion fixtures. Windows CI also runs CoreTests, WindowsHostTests and actual WebView2 navigation/input tests before publishing the self-contained x64 package. Artifact names read `VERSION`; artifact retention remains seven days.

The retired add-on programs are outside this maintenance scope. Their files and behavior remain unchanged.
