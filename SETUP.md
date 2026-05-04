# SETUP.md

This guide explains how to set up the Personal Trading Ledger for development and first use.

## 1. Required Accounts

You need:

```text
- Google account
- GitHub account
```

GitHub is only for storing source files and docs.

Google is used for the actual Sheet and Web App.

---

## 2. Recommended MVP Setup

Use a Google Sheet with a bound Apps Script.

```text
Google Sheet
└── Extensions > Apps Script
```

This makes the app easier to clone because the script can use:

```javascript
SpreadsheetApp.getActiveSpreadsheet()
```

When another user copies the Sheet, the copied script points to the copied Sheet.

---

## 3. Create the Google Sheet

Create a new Google Sheet named:

```text
Personal Trading Ledger Template
```

Create these tabs:

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

---

## 4. Sheet Headers

### Settings

```text
key,value,updated_at
```

Example rows:

```text
base_currency,USD,
display_currency,USD,
usd_thb_rate_fallback,34.5,
app_version,0.1.0,
```

---

### Portfolios

```text
portfolio_id,name,type,market,base_currency,initial_capital,commission_rate,risk_mode,default_risk_pct,created_at,updated_at,archived
```

---

### Positions

```text
position_id,portfolio_id,parent_position_id,status,symbol,direction,entry_date,entry_price,qty,position_size,stop_loss,fee_entry,exit_date,exit_price,exit_qty,fee_exit,realized_pnl,note,created_at,updated_at
```

---

### ManualEntries

```text
entry_id,portfolio_id,date,type,amount,balance_after,currency,note,created_at
```

---

### Holdings

```text
holding_id,asset_type,symbol,name,amount,avg_cost,cost_currency,price_source,custom_current_price,note,created_at,updated_at,archived
```

---

### PriceCache

```text
symbol,source,price,currency,updated_at,is_stale
```

---

### DailySnapshots

```text
date,total_portfolio_value_usd,trading_value_usd,holdings_value_usd,cashflow_net_usd,created_at
```

---

### Watchlist

```text
symbol,source,created_at
```

---

## 5. Open Apps Script

In the Google Sheet:

```text
Extensions > Apps Script
```

Create files that match the repo source files.

Recommended files:

```text
Code.gs
Config.gs
Api.gs
SheetService.gs
DashboardService.gs
PortfolioService.gs
PositionService.gs
HoldingService.gs
PriceService.gs
SnapshotService.gs
CalcService.gs
BackupService.gs
Index.html
styles.html
client.html
```

Copy content from the GitHub repo's `src/` folder.

---

## 6. Recommended Source File Mapping

Repo path:

```text
src/Code.gs
```

Apps Script file:

```text
Code.gs
```

Repo path:

```text
src/Index.html
```

Apps Script file:

```text
Index.html
```

Same for other files.

---

## 7. App Script Project Settings

Create or update:

```text
appsscript.json
```

Recommended basic manifest:

```json
{
  "timeZone": "Asia/Bangkok",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

Do not add unnecessary OAuth scopes manually unless required.

Apps Script usually detects required scopes.

---

## 8. Local Development Optional

MVP does not require local development.

Optional later:

```text
clasp
```

Do not make `clasp` mandatory for MVP.

If `clasp` is used later, do not commit:

```text
.clasprc.json
.clasp.json with real scriptId
OAuth credentials
```

---

## 9. First Manual Test

After adding the source files:

```text
1. Save all Apps Script files.
2. Run setup/init function if available.
3. Authorize permissions.
4. Deploy as Web App.
5. Open the /exec URL.
6. Create a test portfolio.
7. Add a test position.
8. Close the test position.
9. Add a test holding.
10. Check Dashboard.
11. Export a backup from Settings.
12. Import the trusted backup into a copied test Sheet by typing IMPORT.
13. Reset only after exporting a backup and typing RESET.
```

For the full clone and mobile checks, see:

```text
docs/clone-guide.md
docs/mobile-usage.md
docs/manual-test-checklist.md
```

GitHub remains source storage only. Production deployment is through `script.google.com`; GitHub Pages is not used for MVP. Do not commit credentials, OAuth tokens, private Sheet URLs, private Web App URLs, or backup JSON.

---

## 10. Test Data Suggestions

Portfolio examples:

```text
Crypto USD
Thai Stock THB
Manual Broker Track
```

Position examples:

```text
BTCUSDT long
ETHUSDT short
PTT long
```

Holding examples:

```text
BTC
PTT
CUSTOM_FUND
CASH_THB
```

---

## 11. Clone Setup for a Friend

For a friend:

```text
1. Share the Google Sheet Template.
2. Friend clicks File > Make a copy.
3. Friend opens their copied Sheet.
4. Friend opens Extensions > Apps Script.
5. Friend deploys their own Web App.
6. Friend uses their own /exec URL.
```

The friend's data stays in their own copied Sheet.

---

## 12. Security Notes

Do not share private Web App URLs publicly if the app contains personal financial data.

Recommended access for personal use:

```text
Execute as: Me
Who has access: Only myself
```

If sharing with your own Google account only, keep it private.

For friend usage, let the friend copy and deploy their own version.

---

## 13. Troubleshooting

### The app opens but data does not save

Check:

```text
- required tabs exist
- headers are correct
- Apps Script permission is authorized
- script is bound to the correct Sheet
```

### Dashboard is empty

Check:

```text
- at least one portfolio exists
- holdings or positions exist
- prices exist in PriceCache if needed
```

### Price shows missing

Check:

```text
- symbol exists in PriceCache
- manual price is set
- currency is set
```

### Web App did not update after code change

You may need to create a new deployment version or update the deployment from Apps Script.

See `DEPLOYMENT.md`.

---

## 14. Setup Philosophy

Keep setup simple.

The MVP should be usable by copying files into Apps Script and deploying manually.

Do not require a complex development environment.
