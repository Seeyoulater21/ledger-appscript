# CHANGELOG.md

All notable changes to this project should be documented in this file.

This project follows a simple human-readable changelog format.

## [Unreleased]

### Added

- Added Phase 4 holdings and manual price cache MVP for issue #4:
  - Holding create, list, edit, and archive service functions.
  - Holdings summary with cost basis, current value, unrealized PNL, and allocation.
  - Manual `PriceCache` service functions using source labels aligned with the price-feed project.
  - Watchlist add/remove support with non-destructive soft removal.
  - Holding, manual price, and watchlist API wrappers for frontend calls.
  - Mobile-friendly holdings, manual price cache, and watchlist UI.
  - Static tests for holdings valuation, custom/fallback prices, manual prices, watchlist behavior, and UI/API hooks.
- Added Phase 3 position MVP for issue #3:
  - Position create/list/close/scale-out service functions.
  - Server-side realized PNL and basic closed-trade analytics.
  - Position API wrappers for frontend calls.
  - Mobile-friendly add position, open positions, close, scale-out, closed positions, and analytics UI.
  - Static tests for position validation, risk sizing, close, scale-out, and analytics behavior.
- Added Phase 2 portfolio MVP for issue #2:
  - Portfolio create, list, edit, and archive service functions.
  - Manual balance/deposit/withdraw entry support for manual portfolios.
  - Dashboard portfolio value summary.
  - Portfolio API wrappers for frontend calls.
  - Mobile-friendly portfolio list and forms.
- Added Apps Script web app skeleton for issue #1:
  - `appsscript.json`
  - `src/Code.gs`
  - `src/Config.gs`
  - `src/SheetService.gs`
  - `src/Index.html`
  - `src/styles.html`
  - `src/client.html`
- Added sheet initialization for required tabs using the active bound spreadsheet.
- Added `docs/sheet-schema.md` with required tabs, headers, defaults, and manual test steps.
- Added a lightweight Node static test for the Phase 1 skeleton.
- Initial project documentation package.
- Added `AGENTS.md` for Codex agent workflow and project guardrails.
- Added `README.md` for project overview.
- Added `PRD.md` for product requirements.
- Added `SETUP.md` for Google Sheet and Apps Script setup.
- Added `DEPLOYMENT.md` for script.google.com deployment workflow.
- Defined MVP architecture:
  - Google Sheet as personal database.
  - Apps Script as backend and web app.
  - GitHub as source/documentation repo only.
  - No GitHub Pages production deployment for MVP.
- Defined clone-friendly ownership model:
  - 1 user = 1 copied Sheet = 1 Apps Script deployment.
- Defined required Sheet tabs:
  - Settings
  - Portfolios
  - Positions
  - ManualEntries
  - Holdings
  - PriceCache
  - DailySnapshots
  - Watchlist

### Changed

- N/A

### Fixed

- Fixed manual portfolio values to use the latest manual entry by entry date instead of physical row order.
- Fixed dashboard summaries so mixed-currency portfolios are grouped by currency instead of being added into a mislabeled default-currency total.
- Fixed the manual-entry form so it cannot submit before a manual portfolio exists.
- Prevented sheet initialization from overwriting row 1 data on existing required-named tabs with mismatched headers.

### Security

- Added explicit rule to avoid committing:
  - OAuth tokens
  - `.clasprc.json`
  - private `.clasp.json`
  - Google credentials
  - private Sheet IDs
  - private Web App URLs

---

## Versioning Notes

Suggested version labels:

```text
v0.1.0 = documentation and skeleton
v0.2.0 = app shell and sheet initialization
v0.3.0 = portfolio MVP
v0.4.0 = position MVP
v0.5.0 = holdings MVP
v0.6.0 = dashboard MVP
v0.7.0 = price cache MVP
v0.8.0 = snapshots and simple charts
v0.9.0 = backup/import/reset
v1.0.0 = clone-ready personal MVP
```

---

## Changelog Rules for Agents

Agents should update this file whenever they:

```text
- add a new feature
- change setup/deployment workflow
- change data model
- change sheet schema
- add or remove a source file
- change backup/import/reset behavior
- change security-sensitive behavior
```

Keep entries short but clear.
