# CHANGELOG.md

All notable changes to this project should be documented in this file.

This project follows a simple human-readable changelog format.

## [Unreleased]

### Added

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

- N/A

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
