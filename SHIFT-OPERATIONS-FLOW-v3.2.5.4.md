# v3.2.5.4 - Shift Operations Flow Redesign

## Purpose

This pass fixes the Shift Reports / Shift Intelligence interface flow after the parser rebuild. The logic was improved in v3.2.5.2 and the screen was cleaned in v3.2.5.3, but the layout still felt assembled instead of designed.

## Design principle

The Shift Operations lane now follows one visible operating path:

1. Import source report
2. Classify signal from noise
3. Review and decide
4. Track meaningful issues
5. Close or report

## Shift Reports screen

Shift Reports is now treated as the intake desk. It prioritizes importing the PDF, showing the parsed source preview, summarizing active/reference output, then showing the operational intake board. Source report history is still available, but tucked into a drawer so it does not crowd the primary workflow.

## Shift Intelligence screen

Shift Intelligence is now treated as the decision desk. Pending intake appears on the left and the active watchlist appears on the right. The user should be able to clear intake by choosing link, create issue, reference only, or ignore.

## No data model changes

This is an interface-flow redesign only. It does not change the shift report or shift intelligence JSON structure.
