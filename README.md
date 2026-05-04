# Personal Trading Ledger for Google Apps Script

A simple personal trading ledger and portfolio tracker built with:

```text
Google Sheet = personal database
Google Apps Script = backend + web app
HTML/CSS/JavaScript = frontend
GitHub = source and documentation repository only
```

Repository:

```text
https://github.com/Seeyoulater21/ledger-appscript
```

## Important

This repo is **not** the production deployment target.

Production deployment is done through:

```text
script.google.com
```

The live app URL should come from a Google Apps Script Web App deployment.

GitHub Pages is not used for MVP.

---

## Product Goal

Build a personal tracker for:

```text
- trading portfolios
- manual portfolios
- open/closed positions
- holdings
- simple PNL
- dashboard
- manual price cache
- daily snapshots
- backup/export/import
```

The app is designed for personal use.

```text
1 user = 1 copied Google Sheet = 1 Apps Script deployment = 1 private ledger
```

---

## Who This Is For

This is for someone who wants to track their own trading and holdings manually.

Good fit:

```text
- crypto traders
- stock traders
- options traders who want manual accounting
- people with several portfolios
- people who want a simple mobile-friendly trading journal
```

Not a good fit:

```text
- high-frequency trading
- multi-user SaaS
- automatic exchange reconciliation
- realtime portfolio sync
- complex accounting compliance
```

---

## MVP Architecture

```text
Mobile/Desktop Browser
        ↓
Apps Script Web App
        ↓
Google Sheet
```

The Google Sheet stores all data.

Apps Script reads and writes the Sheet.

The frontend is served by Apps Script.

---

## Clone-Friendly Usage Model

For the owner:

```text
1. Open the Google Sheet template.
2. Open Extensions > Apps Script.
3. Add/update source files.
4. Deploy as Web App.
5. Use the generated /exec URL.
6. Add to Home Screen on mobile.
```

For a friend:

```text
1. Make a copy of the Google Sheet template.
2. Open Extensions > Apps Script.
3. Deploy their own Web App.
4. Use their own URL.
5. Their data stays in their own Sheet.
```

---

## Recommended Repository Structure

```text
ledger-appscript/
├── AGENTS.md
├── README.md
├── PRD.md
├── SETUP.md
├── DEPLOYMENT.md
├── CHANGELOG.md
├── appsscript.json
├── src/
│   ├── Code.gs
│   ├── Config.gs
│   ├── Api.gs
│   ├── SheetService.gs
│   ├── DashboardService.gs
│   ├── PortfolioService.gs
│   ├── PositionService.gs
│   ├── HoldingService.gs
│   ├── PriceService.gs
│   ├── SnapshotService.gs
│   ├── CalcService.gs
│   ├── BackupService.gs
│   ├── Index.html
│   ├── styles.html
│   └── client.html
└── docs/
    ├── sheet-schema.md
    ├── clone-guide.md
    └── mobile-usage.md
```

---

## Required Google Sheet Tabs

```text
Settings
Portfolios
Positions
ManualEntries
Holdings
PriceCache
DailySnapshots
Watchlist
```

Details are described in `PRD.md` and `SETUP.md`.

---

## MVP Screens

```text
Dashboard
Portfolios
Positions
Holdings
Price Feed
Settings / Backup
```

---

## Mobile Usage

This is a mobile web app.

On iPhone:

```text
Safari → open Web App URL → Share → Add to Home Screen
```

On Android:

```text
Chrome → open Web App URL → menu → Add to Home screen
```

---

## Non-Goals

Do not add these in MVP:

```text
- Supabase
- Firebase
- Postgres
- Next.js
- React
- custom login
- multi-user accounts
- GitHub Pages production deploy
- exchange auto-sync
- realtime price streaming
- GitHub Actions auto-deploy
```

---

## Development Notes

Agents and developers should read:

```text
AGENTS.md
PRD.md
SETUP.md
DEPLOYMENT.md
```

before making changes.

Keep the project simple, personal, and clone-friendly.
# ledger-appscript
