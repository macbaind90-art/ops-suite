# Build validation

Release identity comes from `VERSION`. Validation is attached to the exact commit through the Windows workflow, not inferred from an older release's results.

## Required checks

1. `node tools/validate-all.js` — all discovered browser/contract validators, generated-version consistency and portable assessment fixtures.
2. `dotnet build SecurityOperationsSuite.csproj --configuration Release` — native compilation.
3. `dotnet run --project tests/CoreTests/Suite.CoreTests.csproj --configuration Release` — coordinated persistence, rollback and qualification behavior.
4. `dotnet run --project tests/WindowsHostTests/Suite.WindowsHostTests.csproj --configuration Release` — actual host authorization, settings, recovery, simultaneous writers, promotion completion and deferred diagnostics.
5. `dotnet run --project tests/WebViewTests/Suite.WebViewTests.csproj --configuration Release` — actual packaged WebView2 page navigation, search input/caret preservation, Task Tracker print controls and filter retention.
6. Windows self-contained x64 publish after all checks succeed.

Linux can run JavaScript and CoreTests and compile Windows targets with `-p:EnableWindowsTargeting=true`. Native Windows and WebView2 execution require Windows and are CI release gates. WebView2 tests exercise real DOM events with a test account fixture; WindowsHostTests separately exercise real host authentication and persistence.

## Maintenance regression coverage

- Only the selected page renders, regardless of other available modules.
- Repeated Attendance calls compute one snapshot per employee/date in a context; a new context recalculates.
- Context cleanup also occurs after exceptions.
- Indexed schedule totals preserve expected hours and refresh after an edit.
- Training status changes after new signoffs and void events without retaining stale indexes.
- A successful save queues diagnostics without running a full health scan inside the write.
- Release fields and print footers agree with `VERSION`.

The add-on Access/Badge programs are excluded at the user's request. No audit parsing or matching changes are included in this release. Production shared-folder latency and real workplace workflows still require an operational smoke check; automated fixtures do not measure those conditions.
