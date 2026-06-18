# PWADC Security Operations Suite v3.0.12 Roster/Attendance Sync Build

This package is the full repository for the v3.0.12 build. It preserves the working v3.0.11 baseline and adds one operational fix: removing/archiving an employee from Roster now also removes that person from active Attendance while preserving their historical attendance records.

## Change Summary

- Roster Remove now archives the matching Attendance employee automatically.
- Attendance history is preserved. The employee is hidden from active daily entry, 90-day grid, review, patterns, and dashboard counts.
- A pre-change Attendance backup is requested before the roster removal sync.
- Attendance audit now records the roster-removal sync.
- Version labels updated to v3.0.12.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-12-Windows`

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
          name: PWADC-Security-Operations-Suite-v3-0-12-Windows
          path: bin/Release/net8.0-windows/win-x64/publish/
```
