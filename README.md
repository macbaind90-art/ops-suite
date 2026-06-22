# PWADC Security Operations Suite v3.0.24

Data Health and Restore Guardrails build.

## GitHub Actions workflow

Path: `.github/workflows/build-windows.yml`

Run **Build PWADC Security Operations Suite** on the `main` branch.

Expected artifact: `PWADC-Security-Operations-Suite-v3-0-24-Windows`

## Build notes

- Clean upload ZIP. No `.git` folder.
- `.github/workflows/build-windows.yml` is included.
- All file and folder timestamps are refreshed during packaging.
- Data Health now includes guided fix buttons with pre-fix backups.
- Backup Status can show the newest backup by module.
- Restore Center now requires preview and a restore reason before restoring.
- The desktop bridge creates an emergency pre-restore backup before replacing live module data.
