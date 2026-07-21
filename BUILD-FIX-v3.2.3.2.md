# v3.2.3.2 GitHub Version Format Fix

## Issue
GitHub Actions failed because generated assembly metadata contained the previous five-part version string, which has five numeric version parts. .NET assembly/file/manifest versions require `major[.minor[.build[.revision]]]`, so the maximum valid numeric version shape is four parts.

## Fix
- Updated display/product version to `v3.2.3.2`.
- Updated `<Version>`, `<FileVersion>`, and `<AssemblyVersion>` to `3.2.3.2`.
- Updated `app.manifest` assemblyIdentity version to `3.2.3.2`.
- Updated GitHub Actions artifact name to `PWADC-Security-Operations-Suite-v3-2-3-2-Windows`.
- Swept for invalid five-part version strings before packaging.

## Next planned roadmap step
`v3.2.4 - People Workflow Redesign` remains the next feature/design milestone.
