# Sheet Schema

The app uses the active bound Google Sheet as its database.

Apps Script code should access the Sheet with:

```javascript
SpreadsheetApp.getActiveSpreadsheet()
```

Do not hardcode a personal Spreadsheet ID for the MVP clone workflow.

## Initialization

Run `initRequiredSheets()` from Apps Script, or click `Initialize sheets` in the web app shell.

The initializer:

- creates missing required tabs
- writes the expected header row
- freezes the first row
- seeds default Settings rows when Settings only has headers

It does not delete data and does not hard reset existing tabs.

## Required Tabs

### Settings

```text
key,value,updated_at
```

Default rows:

```text
base_currency,USD,
display_currency,USD,
usd_thb_rate_fallback,34.5,
app_version,0.1.0,
```

### Portfolios

```text
portfolio_id,name,type,market,base_currency,initial_capital,commission_rate,risk_mode,default_risk_pct,created_at,updated_at,archived
```

### Positions

```text
position_id,portfolio_id,parent_position_id,status,symbol,direction,entry_date,entry_price,qty,position_size,stop_loss,fee_entry,exit_date,exit_price,exit_qty,fee_exit,realized_pnl,note,created_at,updated_at
```

### ManualEntries

```text
entry_id,portfolio_id,date,type,amount,balance_after,currency,note,created_at
```

### Holdings

```text
holding_id,asset_type,symbol,name,amount,avg_cost,cost_currency,price_source,custom_current_price,note,created_at,updated_at,archived
```

### PriceCache

```text
symbol,source,price,currency,updated_at,is_stale
```

### DailySnapshots

```text
date,total_portfolio_value_usd,trading_value_usd,holdings_value_usd,cashflow_net_usd,created_at
```

### Watchlist

```text
symbol,source,created_at
```

## Manual Test

1. Copy files from `src/` into a bound Apps Script project.
2. Copy `appsscript.json` into the Apps Script manifest.
3. Save the project.
4. Run `initRequiredSheets()`.
5. Confirm all required tabs exist with the documented headers.
6. Deploy as a Web App from script.google.com.
7. Open the `/exec` URL on desktop and mobile.
8. Confirm the shell renders and the sheet list shows 8 required tabs.
