# PWADC Security Operations Suite v3.0.17 Sortable Tables Build

This package is the full repository for the v3.0.17 build. It keeps the clean upload format with `.github/workflows/build-windows.yml` included and no `.git` folder required.

## Changes in v3.0.17

- Added click-to-sort behavior across standard tables.
- Table headers now sort ascending/descending without changing the saved data order.
- Sort handling supports text, numbers, currency, percentages, hours, and common date/time values.
- Keeps v3.0.16 roster analytics render fix and v3.0.15 labor analytics features intact.

## Changes in v3.0.15

- Expanded Roster labor cost visibility per employee.
- Added weekly, monthly, and yearly base cost and loaded cost calculations.
- Added scheduled HPW per employee, using master schedule assignments when found.
- Added planning fallback hours when an employee is not found on the schedule: FT/Temp 40 HPW and PT 24 HPW.
- Expanded Analytics to include coverage risk, scheduled vs required hours, open HPW gap, overtime exposure, RDO conflict flags, temp dependency, and readiness/risk indicators.
- Analytics print and CSV now include employee-level cost detail.

## Loaded cost assumptions

- FT Pig employees: 33%
- PT Pig employees: 27%
- TempToHire employees: 35%

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-17-Windows`

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
          name: PWADC-Security-Operations-Suite-v3-0-17-Windows
          path: bin/Release/net8.0-windows/win-x64/publish/
```
