# v3.2.5.1 - Manifest XML Startup Fix

## Issue
Windows displayed a side-by-side configuration error before the application opened.

## Root cause
The application manifest XML declaration had been versioned as the application version. XML declarations must remain `version="1.0"`. The application version belongs in the manifest `assemblyIdentity` and project version fields.

## Fix
- Restored manifest XML declaration to `<?xml version="1.0" encoding="utf-8"?>`.
- Set manifest `assemblyIdentity` version to `3.2.5.1`.
- Set project `Version`, `FileVersion`, and `AssemblyVersion` to `3.2.5.1`.
- Updated GitHub artifact naming to `v3-2-5-1`.
- Added a manifest declaration check so future builds catch this before packaging.

## Result
The EXE should no longer fail at Windows startup with a side-by-side configuration error caused by the application manifest.
