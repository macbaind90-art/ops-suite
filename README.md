# PWADC Security Operations Suite v3.1.25

## v3.1.25 Shift Report N/A Noise Filter

Full clean repository package for the PWADC Security Operations Suite.

### Build notes
- GitHub Actions workflow included at `.github/workflows/build-windows.yml`.
- No `.git` folder included.
- Shared data root remains `\\pig-fs\Security\MacBain\Security Operations Suite`.

### v3.1.25 Notes
- Shift Reports now ignore N/A, NA, None, blank placeholders, and routine no-issue language during issue detection.
- Routine Vehicle / Equipment report content is stored but does not create issues.
- 3rd-shift off-duty officer notes remain detected.
- The temporary one-time Shift Report reset button from the prior cleanup build has been removed.
- Version labels and GitHub artifact naming are aligned to v3.1.25.
