# PWADC Security Operations Suite v3.0.14 Roster Labor Analytics Build

This package is the full repository for the v3.0.14 build. It preserves the working Attendance removal controls and adds roster PT/FT/TempToHire classification plus loaded-cost labor analytics.


## Changes in v3.0.14

- Added PT / FT / TempToHire employment class to Roster employee records.
- Added PT / FT / TempToHire column to the Roster table and printable roster options.
- Added loaded-cost logic to Analytics: FT Pig 33%, PT Pig 27%, TempToHire 35%.
- Added base weekly labor cost, loaded weekly labor cost, and loaded add-on reporting.
- Added section-level base cost and loaded cost in Analytics, print, and CSV export.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-14-Windows`

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
          name: PWADC-Security-Operations-Suite-v3-0-14-Windows
          path: bin/Release/net8.0-windows/win-x64/publish/
```
