# PWADC Security Operations Suite v3.0.18 Employee Profile Build

This package is the full repository for the v3.0.18 build. It keeps the clean upload format with `.github/workflows/build-windows.yml` included and no `.git` folder required.

## Changes in v3.0.18

- Added a Global Employee Search box in the top bar.
- Added an Employee Profile module/screen.
- Profile combines roster, attendance, schedule, training, uniform, and labor-cost details in one place.
- Added Profile action from the roster table.
- Added Print Profile support.
- Kept the v3.0.17 standard table sorting behavior.
- Kept v3.0.16 roster analytics render fix and v3.0.15 labor analytics features intact.

## Employee Profile Includes

- Employee name, EID, rank/title, shift/section, gate shift, employment class, status, and hourly rate.
- Scheduled HPW.
- Base weekly/monthly/yearly labor cost.
- Loaded weekly/monthly/yearly labor cost.
- Attendance counts for the last 30 and 90 days.
- Recent attendance entries.
- Schedule assignment summary.
- Training readiness summary.
- Uniform summary.

## Loaded cost assumptions

- FT Pig employees: 33%
- PT Pig employees: 27%
- TempToHire employees: 35%

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-18-Windows`

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
          name: PWADC-Security-Operations-Suite-v3-0-18-Windows
          path: bin/Release/net8.0-windows/win-x64/publish/

```
