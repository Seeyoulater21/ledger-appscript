# PRD: Personal Trading Ledger

## 1. Product Name

Working name:

```text
Personal Trading Ledger
```

Alternative names:

```text
SheetTrade
TradeLog Lite
Ledger Apps Script
```

---

## 2. Product Vision

Create a simple personal web app for tracking trading portfolios, holdings, PNL, and trade journal data using Google Sheet and Google Apps Script.

The product should be easy to clone and deploy manually.

The owner of each Sheet owns their own data.

---

## 3. Core Principles

### 3.1 Personal-first

```text
1 user = 1 Google Sheet = 1 Apps Script Web App
```

### 3.2 Clone-friendly

Users should be able to copy the Sheet template and deploy their own app.

### 3.3 No Overengineering

This is a personal tracker, not a SaaS platform.

Avoid:

```text
- centralized database
- multi-user auth
- custom password system
- backend server
- heavy frontend framework
- GitHub Actions deployment
```

---

## 4. Target Users

Primary users:

```text
- individual traders
- crypto traders
- stock traders
- options traders
- people tracking multiple portfolios manually
```

Main need:

```text
Track personal trading performance and portfolio value without building a full financial platform.
```

---

## 5. MVP Scope

### Included

```text
- Dashboard
- Portfolio list
- Trading portfolio
- Manual portfolio
- Add/open/close positions
- Scale out positions
- Holdings
- Manual price cache
- Watchlist
- Daily snapshots
- Simple analytics
- Export/import backup
- Mobile-friendly UI
```

### Excluded from MVP

```text
- exchange sync
- live streaming prices
- broker integration
- multi-user accounts
- SaaS deployment
- paid plans
- native mobile app
- complex tax reports
```

---

## 6. Data Model

Required Sheet tabs:

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

### Settings

Columns:

```text
key
value
updated_at
```

Purpose:

```text
Store basic app settings.
```

Examples:

```text
base_currency = USD
display_currency = USD
usd_thb_rate_fallback = 34.5
app_version = 0.1.0
```

---

### Portfolios

Columns:

```text
portfolio_id
name
type
market
base_currency
initial_capital
commission_rate
risk_mode
default_risk_pct
created_at
updated_at
archived
```

Types:

```text
trading
manual
```

Markets:

```text
crypto
thai_stock
us_stock
options
custom
```

---

### Positions

Columns:

```text
position_id
portfolio_id
parent_position_id
status
symbol
direction
entry_date
entry_price
qty
position_size
stop_loss
fee_entry
exit_date
exit_price
exit_qty
fee_exit
realized_pnl
note
created_at
updated_at
```

Statuses:

```text
open
closed
partial
```

Directions:

```text
long
short
```

---

### ManualEntries

Columns:

```text
entry_id
portfolio_id
date
type
amount
balance_after
currency
note
created_at
```

Types:

```text
balance
deposit
withdraw
adjustment
```

---

### Holdings

Columns:

```text
holding_id
asset_type
symbol
name
amount
avg_cost
cost_currency
price_source
custom_current_price
note
created_at
updated_at
archived
```

Asset types:

```text
crypto
thai_stock
us_stock
cash
gold
fund
custom
```

---

### PriceCache

Columns:

```text
symbol
source
price
currency
updated_at
is_stale
```

Sources:

```text
manual
binance
bitkub
set
custom
fallback
```

MVP can start with manual prices only.

---

### DailySnapshots

Columns:

```text
date
total_portfolio_value_usd
trading_value_usd
holdings_value_usd
cashflow_net_usd
created_at
```

---

### Watchlist

Columns:

```text
symbol
source
created_at
```

---

## 7. Dashboard Requirements

### 7.1 Total Portfolio Value

Definition:

```text
Total value of trading portfolios + manual portfolios + holdings
```

Logic:

```text
total_value = trading_value + manual_value + holdings_value
```

Normalize to USD internally. If display currency is THB, convert using USDTHB rate.

Acceptance criteria:

```text
- Shows total value on Dashboard.
- Updates when portfolio, position, holding, or manual balance changes.
- Handles missing price data gracefully.
```

---

### 7.2 Today PNL

Definition:

```text
current total value - latest snapshot before today
```

If no previous snapshot exists:

```text
show 0 or "No snapshot yet"
```

Acceptance criteria:

```text
- Does not crash with no snapshots.
- Uses DailySnapshots when available.
```

---

### 7.3 Trading Balance

Definition:

```text
Trading portfolio equity + latest manual portfolio balance
```

Does not include holdings.

Acceptance criteria:

```text
- Changes when positions are closed.
- Changes when manual balance is updated.
```

---

### 7.4 Allocation

Definition:

```text
Breakdown of value by portfolio or asset group
```

MVP can be a list instead of chart.

Acceptance criteria:

```text
- Shows value and percentage.
- Handles total value = 0.
```

---

### 7.5 Portfolio List

Shows:

```text
name
type
market
currency
current value
open position count
pnl %
```

Acceptance criteria:

```text
- User can open portfolio detail.
- User can create a new portfolio.
```

---

### 7.6 PNL Overview

Shows daily, weekly, or monthly PNL using snapshots.

Acceptance criteria:

```text
- Empty state if fewer than 2 snapshots.
- Does not imply realtime accuracy.
```

---

### 7.7 Portfolio Growth

Shows value over time.

Ranges:

```text
1W
1M
3M
6M
1Y
ALL
```

Acceptance criteria:

```text
- Uses DailySnapshots.
- Has empty state.
```

---

### 7.8 Currency Toggle

Supports:

```text
USD
THB
```

Logic:

```text
THB = USD × USDTHB
USD = THB ÷ USDTHB
```

Fallback:

```text
34.5
```

Acceptance criteria:

```text
- Main stat widgets change display currency.
- Historical chart units can remain USD in MVP if clearly labeled.
```

---

## 8. Portfolio and Trading Requirements

### 8.1 Portfolio Types

```text
trading
manual
```

Trading portfolio:

```text
Uses positions.
Requires initial capital.
Equity = initial capital + realized PNL + unrealized PNL.
```

Manual portfolio:

```text
Uses latest balance entry.
Does not require positions.
Useful for broker accounts, funds, or strategy-level tracking.
```

---

### 8.2 Add/Edit/Archive Portfolio

Fields:

```text
name
type
market
base_currency
initial_capital
commission_rate
risk_mode
default_risk_pct
```

Rules:

```text
- trading portfolio requires initial capital
- manual portfolio does not require initial capital
- archive is preferred over hard delete
```

---

### 8.3 Add Position

Fields:

```text
portfolio
symbol
direction
entry_date
entry_price
qty
position_size
stop_loss
fee
note
```

Validation:

```text
Long stop loss must be lower than entry price.
Short stop loss must be higher than entry price.
qty must be positive.
entry price must be positive.
```

---

### 8.4 Open Position List

Shows:

```text
symbol
direction
entry price
last price
qty
unrealized PNL
unrealized R
actions
```

If price is missing:

```text
show ---
```

---

### 8.5 Close Full Position

Fields:

```text
exit_date
exit_price
fee_exit
note
```

Server calculates realized PNL.

---

### 8.6 Scale Out

Fields:

```text
exit_qty
exit_price
exit_date
fee_exit
note
```

Rules:

```text
exit_qty < current qty
```

MVP should keep implementation simple.

---

### 8.7 Risk and Size

Modes:

```text
Fixed Risk %
Fixed Cash
Manual Qty
```

Formula:

```text
risk_amount = equity × risk_percent
risk_distance = abs(entry_price - stop_loss) / entry_price
position_size = risk_amount / risk_distance
qty = position_size / entry_price
```

---

### 8.8 Commission

Defaults:

```text
crypto = 0.1%
thai_stock = 0.157%
fallback = 0.25%
```

Use portfolio commission rate when available.

---

### 8.9 Analytics

Use closed trades only.

Metrics:

```text
Win Rate
Avg Win
Avg Loss
Expectancy
Profit Factor
Max Consecutive Loss
Largest Win
Largest Loss
Average R
```

---

## 9. Holdings Requirements

### 9.1 Holding Types

```text
crypto
thai_stock
us_stock
cash
gold
fund
custom
```

### 9.2 Holding Fields

```text
asset_type
symbol
name
amount
avg_cost
cost_currency
price_source
custom_current_price
note
```

### 9.3 Calculations

```text
cost_basis = amount × avg_cost
current_value = amount × current_price
unrealized_pnl = current_value - cost_basis
allocation = current_value / total_holdings_value
```

### 9.4 Custom Holdings

For assets without market price feed.

Logic:

```text
current_price = custom_current_price if available
else avg_cost
```

Label clearly as manual/fallback.

---

## 10. Price Feed Requirements

MVP:

```text
manual price cache only
```

Optional later:

```text
Binance
Bitkub
SET
Gold
USDTHB
```

PriceCache fields:

```text
symbol
source
price
currency
updated_at
is_stale
```

Features:

```text
- price list
- manual price update
- watchlist
- last updated display
```

No realtime streaming in MVP.

---

## 11. Backup Requirements

### Export

Export:

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

### Import

MVP import should be conservative.

Rules:

```text
- warn before import
- recommend import into empty Sheet
- do not perform complex merge unless explicitly designed
```

### Reset

Dangerous action.

Rules:

```text
- require clear confirmation
- prefer typing RESET
- explain that recovery requires backup
```

---

## 12. Mobile Requirements

Mobile-first UI.

Prioritize:

```text
- large buttons
- simple forms
- dashboard cards
- card layout for positions and holdings
- fast add trade flow
```

Usage path:

```text
Open Web App URL → Add to Home Screen
```

---

## 13. Acceptance Criteria for MVP

The MVP is acceptable when:

```text
- app deploys from script.google.com
- app uses Google Sheet as database
- no external backend is required
- user can create portfolio
- user can add/open/close position
- user can add holdings
- user can manually update prices
- dashboard shows useful totals
- data persists in user's Sheet
- a copied Sheet can become a separate app
- mobile browser usage works
- docs explain manual deployment
```

---

## 14. Future Enhancements

Potential future work:

```text
- clasp workflow
- simple chart library
- CSV import from exchanges
- optional price refresh APIs
- portfolio screenshots
- better backup/restore
- GitHub Actions only if explicitly approved
```
