# PWADC Security Operations Suite v3.0.13 Attendance Manual Removal Build

This package is the full repository for the v3.0.13 build. It preserves the working v3.0.12 roster-to-attendance sync and adds a backup control inside Attendance itself: an employee can be removed from active Attendance without deleting their historical attendance records.

## Changes in v3.0.13

- Added **Remove Employee** button to the Attendance module header.
- Manual Attendance removal archives the selected Attendance employee instead of deleting history.
- Removed employee is hidden from Daily Entry, 90-Day Grid, Attendance Review, Patterns, and dashboard active counts.
- Existing attendance history remains in the JSON for audit/history.
- A backup is requested before the manual removal save.
- Attendance audit log records who removed the employee and the reason/note.
- Version labels updated to v3.0.13.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-13-Windows`

## Full build-windows.yml

```yaml
name: Build PWADC Security Operations Suite

on:
  workflow_dispatch:
  push:
    branches:
      - main

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  build:
    runs-on: windows-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Validate JavaScript syntax
        shell: pwsh
        run: |
          $html = Get-Content -Raw -Path "app/index.html"
          $start = $html.IndexOf('<script>') + 8
          $end = $html.LastIndexOf('</script>')
          $js = $html.Substring($start, $end - $start)
          Set-Content -Path "app-check.js" -Value $js -Encoding UTF8
          node --check app-check.js
          Remove-Item "app-check.js" -Force

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore SecurityOperationsSuite.csproj

      - name: Publish single-file EXE
        run: dotnet publish SecurityOperationsSuite.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: PWADC-Security-Operations-Suite-v3-0-13-Windows
          path: bin/Release/net8.0-windows/win-x64/publish/
```
