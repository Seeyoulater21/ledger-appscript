# Manual Test Checklist

Run these checks in a copied Google Sheet with a bound Apps Script deployment from `script.google.com`.

GitHub is source and documentation storage only. GitHub Pages is not used for MVP. Do not commit credentials, OAuth tokens, private Sheet URLs, private Web App URLs, or backup JSON.

## Fresh Setup

- [ ] Copy source files from `src/` into the bound Apps Script project.
- [ ] Copy `appsscript.json` into the Apps Script manifest.
- [ ] Run `initializeLedger()` or click `Initialize sheets`.
- [ ] Confirm all required tabs exist with documented headers.
- [ ] Deploy as Web App from `script.google.com`.
- [ ] Open the `/exec` URL.

## Core Ledger

- [ ] Create a trading portfolio.
- [ ] Create a manual portfolio.
- [ ] Add a manual balance entry.
- [ ] Add an open position.
- [ ] Close a position.
- [ ] Scale out a position.
- [ ] Add a holding.
- [ ] Update a manual price.
- [ ] Add and remove a watchlist symbol.
- [ ] Create a daily snapshot.
- [ ] Confirm dashboard totals refresh.

## Backup, Import, Reset

- [ ] Open Settings and export backup JSON.
- [ ] Confirm the export backup includes Settings, Portfolios, Positions, ManualEntries, Holdings, PriceCache, DailySnapshots, and Watchlist.
- [ ] Make a second copied Sheet for import testing.
- [ ] Import the trusted backup JSON into the copied Sheet by typing `IMPORT`.
- [ ] Confirm imported portfolios, positions, holdings, prices, snapshots, and settings appear.
- [ ] Export another backup before reset.
- [ ] Type `RESET` and confirm reset.
- [ ] Confirm app-owned rows are cleared and Settings defaults are restored.

## Mobile

- [ ] Open the `/exec` URL on iPhone Safari or Android Chrome.
- [ ] Use Add to Home Screen.
- [ ] Confirm Dashboard, Portfolios, Positions, Holdings, and Settings are reachable.
- [ ] Confirm forms fit and can be submitted without horizontal page scrolling.
