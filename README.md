# PWADC Security Operations Suite v3.1.35

## v3.1.35 UI Render Fix / Full Screen Verification Pass

This build corrects the v3.1.34 screen polish render failure caused by a missing `screenGuide` helper. It keeps the calmer dashboard, grouped navigation, workflow banners, Data Health improvements, guarded restore behavior, and security/safety hardening from the prior cleanup track.

### Fixes
- Added the shared `SCREEN_GUIDES` map.
- Added the shared `screenGuide(key)` helper.
- Moved the Task Tracker guide into the normal screen body instead of the button toolbar.
- Updated version language and GitHub artifact naming to v3.1.35.

### Verification
- JavaScript syntax check passes.
- Required render-function check passes.
- Major module render smoke test passes.
- GitHub Actions workflow is included.
- `.git` is not included in the clean repo ZIP.
