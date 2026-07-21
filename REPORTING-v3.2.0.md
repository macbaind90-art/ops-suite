# v3.2.0 Reporting Expansion

## Review scope
The suite now treats Reports as an executive/compliance hub, not just a list of exports.

## Added reports
1. Executive Operations Briefing
2. Compliance Readiness Report
3. Operations Full Summary
4. Shift Intelligence Summary

## Design principles
- Reports summarize decisions and risk, not just raw counts.
- Staffing HPW uses the published schedule as authority.
- Open/Pending schedule cells count as unfilled HPW.
- Pay/cost visibility remains role-based.
- Shift Intelligence stays focused on meaningful operational issues, not routine report noise.

## Verification
- JavaScript syntax check required.
- Required render function check required.
- Report Center render smoke check required.
- Existing data files and backup/restore flows unchanged.
