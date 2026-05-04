import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Apps Script skeleton exposes web app entrypoint and partial include helper', () => {
  const code = read('src/Code.gs');

  assert.match(code, /function\s+doGet\s*\(/);
  assert.match(code, /HtmlService\.createTemplateFromFile\(['"]Index['"]\)/);
  assert.match(code, /function\s+include\s*\(/);
});

test('Sheet service initializes every required sheet from the active spreadsheet', () => {
  const config = read('src/Config.gs');
  const sheetService = read('src/SheetService.gs');

  for (const tab of [
    'Settings',
    'Portfolios',
    'Positions',
    'ManualEntries',
    'Holdings',
    'PriceCache',
    'DailySnapshots',
    'Watchlist',
  ]) {
    assert.match(config, new RegExp(`name:\\s*['"]${tab}['"]`));
  }

  assert.match(sheetService, /function\s+initRequiredSheets\s*\(/);
  assert.match(sheetService, /SpreadsheetApp\.getActiveSpreadsheet\(\)/);
  assert.doesNotMatch(sheetService, /openById\s*\(/);
});

test('HTML shell includes style and client partials', () => {
  const index = read('src/Index.html');

  assert.match(index, /<\?!=\s*include\(['"]styles['"]\)\s*\?>/);
  assert.match(index, /<\?!=\s*include\(['"]client['"]\)\s*\?>/);
});

test('portfolio service creates, updates, archives, and values portfolios', () => {
  const spreadsheet = new FakeSpreadsheet();
  const context = loadAppsScript({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
    },
    Utilities: {
      getUuid: createUuidSequence(),
    },
  });

  context.initRequiredSheets();

  assert.throws(
    () =>
      context.createPortfolio({
        name: 'Missing Capital',
        type: 'trading',
        market: 'crypto',
        base_currency: 'USD',
      }),
    /initial_capital/
  );

  const trading = context.createPortfolio({
    name: 'Swing Trading',
    type: 'trading',
    market: 'us_stock',
    base_currency: 'USD',
    initial_capital: 10000,
    commission_rate: 0.001,
    risk_mode: 'percent',
    default_risk_pct: 1,
  });

  assert.equal(trading.name, 'Swing Trading');
  assert.equal(trading.initial_capital, 10000);
  assert.equal(trading.archived, false);

  const manual = context.createPortfolio({
    name: 'Long Term Stack',
    type: 'manual',
    market: 'custom',
    base_currency: 'USD',
    commission_rate: 0,
    risk_mode: 'none',
    default_risk_pct: 0,
  });

  assert.equal(manual.initial_capital, '');

  context.addManualEntry({
    portfolio_id: manual.portfolio_id,
    date: '2026-05-03',
    type: 'balance',
    amount: 5000,
    balance_after: 5000,
    currency: 'USD',
    note: 'opening balance',
  });
  context.addManualEntry({
    portfolio_id: manual.portfolio_id,
    date: '2026-05-04',
    type: 'withdraw',
    amount: 500,
    balance_after: 4500,
    currency: 'USD',
    note: 'cash out',
  });
  context.addManualEntry({
    portfolio_id: manual.portfolio_id,
    date: '2026-05-01',
    type: 'balance',
    amount: 100,
    balance_after: 100,
    currency: 'USD',
    note: 'backfilled older balance',
  });

  const updated = context.updatePortfolio(trading.portfolio_id, {
    name: 'US Swing Trading',
    market: 'us_stock',
    default_risk_pct: 1.5,
  });
  assert.equal(updated.name, 'US Swing Trading');
  assert.equal(updated.default_risk_pct, 1.5);
  assert.equal(updated.created_at, trading.created_at);

  const summary = context.getPortfolioSummary();
  assert.equal(summary.active_count, 2);
  assert.equal(summary.trading_value, 10000);
  assert.equal(summary.manual_value, 4500);
  assert.equal(summary.total_value, 14500);
  assert.equal(summary.has_mixed_currencies, false);
  assert.deepEqual(toPlainObject(summary.totals_by_currency), { USD: 14500 });

  context.archivePortfolio(manual.portfolio_id);
  assert.deepEqual(
    context.listPortfolios().map((portfolio) => portfolio.name),
    ['US Swing Trading']
  );
  assert.equal(context.listPortfolios({ includeArchived: true }).length, 2);
  assert.equal(spreadsheet.getSheetByName('ManualEntries').rows.length, 4);
});

test('portfolio summary does not add mixed currencies into one default total', () => {
  const spreadsheet = new FakeSpreadsheet();
  const context = loadAppsScript({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
    },
    Utilities: {
      getUuid: createUuidSequence(),
    },
  });

  context.initRequiredSheets();
  context.createPortfolio({
    name: 'USD Trading',
    type: 'trading',
    market: 'us_stock',
    base_currency: 'USD',
    initial_capital: 1000,
    commission_rate: 0,
    risk_mode: 'none',
    default_risk_pct: 0,
  });
  const manual = context.createPortfolio({
    name: 'THB Manual',
    type: 'manual',
    market: 'thai_stock',
    base_currency: 'THB',
    commission_rate: 0,
    risk_mode: 'none',
    default_risk_pct: 0,
  });
  context.addManualEntry({
    portfolio_id: manual.portfolio_id,
    date: '2026-05-04',
    type: 'balance',
    amount: 100000,
    balance_after: 100000,
    currency: 'THB',
  });

  const summary = context.getPortfolioSummary();

  assert.equal(summary.has_mixed_currencies, true);
  assert.equal(summary.total_value, '');
  assert.equal(summary.trading_value, '');
  assert.equal(summary.manual_value, '');
  assert.equal(summary.currency, 'MIXED');
  assert.deepEqual(toPlainObject(summary.totals_by_currency), {
    USD: 1000,
    THB: 100000,
  });
});

test('portfolio API and UI expose issue #2 workflows', () => {
  const code = read('src/Code.gs');
  const index = read('src/Index.html');
  const client = read('src/client.html');

  for (const fn of [
    'listPortfoliosApi',
    'createPortfolioApi',
    'updatePortfolioApi',
    'archivePortfolioApi',
    'addManualEntryApi',
    'getDashboardApi',
  ]) {
    assert.match(code, new RegExp(`function\\s+${fn}\\s*\\(`));
  }

  assert.match(index, /data-portfolio-list/);
  assert.match(index, /data-portfolio-form/);
  assert.match(index, /data-manual-entry-form/);
  assert.match(index, /data-manual-entry-submit/);
  assert.match(client, /savePortfolio/);
  assert.match(client, /archivePortfolio/);
  assert.match(client, /confirm\(/);
  assert.match(client, /saveManualEntry/);
  assert.match(client, /No manual portfolios/);
  assert.match(client, /manualSubmit\.disabled\s*=\s*select\.options\.length\s*===\s*0/);
});

test('position service adds, validates, closes, and analyzes trading positions', () => {
  const spreadsheet = new FakeSpreadsheet();
  const context = loadAppsScript({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
    },
    Utilities: {
      getUuid: createUuidSequence(),
    },
  });

  context.initRequiredSheets();
  const trading = context.createPortfolio({
    name: 'Crypto Trading',
    type: 'trading',
    market: 'crypto',
    base_currency: 'USD',
    initial_capital: 10000,
    risk_mode: 'percent',
    default_risk_pct: 1,
  });
  const manual = context.createPortfolio({
    name: 'Manual Stack',
    type: 'manual',
    market: 'custom',
    base_currency: 'USD',
  });

  assert.throws(
    () =>
      context.createPosition({
        portfolio_id: manual.portfolio_id,
        symbol: 'BTC',
        direction: 'long',
        entry_date: '2026-05-04',
        entry_price: 100,
        qty: 1,
        stop_loss: 90,
      }),
    /trading portfolio/
  );
  assert.throws(
    () =>
      context.createPosition({
        portfolio_id: trading.portfolio_id,
        symbol: 'BTC',
        direction: 'long',
        entry_date: '2026-05-04',
        entry_price: 100,
        qty: 1,
        stop_loss: 105,
      }),
    /Long stop loss/
  );

  const position = context.createPosition({
    portfolio_id: trading.portfolio_id,
    symbol: 'BTC',
    direction: 'long',
    entry_date: '2026-05-04',
    entry_price: 100,
    qty: 10,
    stop_loss: 90,
    note: 'breakout',
  });

  assert.equal(position.status, 'open');
  assert.equal(position.position_size, 1000);
  assert.equal(position.fee_entry, 1);
  assert.equal(context.listOpenPositions().length, 1);

  const closed = context.closePosition(position.position_id, {
    exit_date: '2026-05-05',
    exit_price: 110,
    fee_exit: 2,
    note: 'target hit',
  });

  assert.equal(closed.status, 'closed');
  assert.equal(closed.realized_pnl, 97);
  assert.equal(context.listOpenPositions().length, 0);
  assert.equal(context.listClosedPositions().length, 1);

  const analytics = context.getTradingAnalytics();
  assert.equal(analytics.closed_trade_count, 1);
  assert.equal(analytics.win_rate, 1);
  assert.equal(analytics.avg_win, 97);
  assert.equal(analytics.profit_factor, '');
  assert.equal(analytics.average_r_multiple, 0.97);
});

test('position service supports risk sizing and partial scale-out records', () => {
  const spreadsheet = new FakeSpreadsheet();
  const context = loadAppsScript({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
    },
    Utilities: {
      getUuid: createUuidSequence(),
    },
  });

  context.initRequiredSheets();
  const trading = context.createPortfolio({
    name: 'Risk Trading',
    type: 'trading',
    market: 'us_stock',
    base_currency: 'USD',
    initial_capital: 20000,
    commission_rate: 0.001,
    risk_mode: 'percent',
    default_risk_pct: 2,
  });

  const sized = context.createPosition({
    portfolio_id: trading.portfolio_id,
    symbol: 'AAPL',
    direction: 'long',
    entry_date: '2026-05-04',
    entry_price: 100,
    stop_loss: 95,
    sizing_mode: 'fixed_risk_percent',
    risk_percent: 2,
  });

  assert.equal(sized.position_size, 8000);
  assert.equal(sized.qty, 80);
  assert.equal(sized.fee_entry, 8);

  const partial = context.scaleOutPosition(sized.position_id, {
    exit_date: '2026-05-05',
    exit_qty: 20,
    exit_price: 110,
    fee_exit: 2,
    note: 'trim',
  });

  assert.equal(partial.status, 'closed');
  assert.equal(partial.parent_position_id, sized.position_id);
  assert.equal(partial.qty, 20);
  assert.equal(partial.realized_pnl, 196);

  const remaining = context.listOpenPositions()[0];
  assert.equal(remaining.qty, 60);
  assert.equal(remaining.position_size, 6000);
  assert.equal(remaining.fee_entry, 6);

  assert.throws(
    () =>
      context.scaleOutPosition(remaining.position_id, {
        exit_date: '2026-05-06',
        exit_qty: 60,
        exit_price: 111,
      }),
    /less than current qty/
  );
});

test('position API and UI expose issue #3 workflows', () => {
  const code = read('src/Code.gs');
  const index = read('src/Index.html');
  const client = read('src/client.html');

  for (const fn of [
    'listOpenPositionsApi',
    'listClosedPositionsApi',
    'createPositionApi',
    'closePositionApi',
    'scaleOutPositionApi',
    'getTradingAnalyticsApi',
  ]) {
    assert.match(code, new RegExp(`function\\s+${fn}\\s*\\(`));
  }

  assert.match(index, /data-position-form/);
  assert.match(index, /data-open-position-list/);
  assert.match(index, /data-closed-position-list/);
  assert.match(index, /data-position-close-form/);
  assert.match(index, /data-position-scale-form/);
  assert.match(index, /data-trading-analytics/);
  assert.match(client, /savePosition/);
  assert.match(client, /closePosition/);
  assert.match(client, /scaleOutPosition/);
  assert.match(client, /renderTradingAnalytics/);
});

test('sheet initialization refuses to overwrite row 1 data on existing tabs', () => {
  const existingSheet = new FakeSheet('Settings', [['personal', 'data', 'keep me']]);
  const context = loadAppsScript({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => new FakeSpreadsheet([existingSheet]),
    },
  });

  assert.throws(
    () => context.initRequiredSheets(),
    /Settings.*header row does not match/
  );
  assert.deepEqual(existingSheet.rows[0], ['personal', 'data', 'keep me']);
});

test('sheet initialization writes headers on empty existing tabs', () => {
  const existingSheet = new FakeSheet('Settings');
  const context = loadAppsScript({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => new FakeSpreadsheet([existingSheet]),
    },
  });

  context.initRequiredSheets();

  assert.deepEqual(existingSheet.rows[0], ['key', 'value', 'updated_at']);
  assert.equal(existingSheet.frozenRows, 1);
});

function loadAppsScript(globals = {}) {
  const context = vm.createContext(globals);
  vm.runInContext(read('src/Config.gs'), context);
  vm.runInContext(read('src/SheetService.gs'), context);
  vm.runInContext(read('src/PortfolioService.gs'), context);
  vm.runInContext(read('src/CalcService.gs'), context);
  vm.runInContext(read('src/PositionService.gs'), context);
  return context;
}

function createUuidSequence() {
  let index = 1;
  return () => `test-id-${index++}`;
}

function toPlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

class FakeSpreadsheet {
  constructor(sheets = []) {
    this.sheets = sheets;
  }

  getName() {
    return 'Test Ledger';
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.name === name) || null;
  }

  insertSheet(name) {
    const sheet = new FakeSheet(name);
    this.sheets.push(sheet);
    return sheet;
  }
}

class FakeSheet {
  constructor(name, rows = []) {
    this.name = name;
    this.rows = rows;
    this.frozenRows = 0;
  }

  getLastRow() {
    return this.rows.length;
  }

  getName() {
    return this.name;
  }

  setFrozenRows(rows) {
    this.frozenRows = rows;
  }

  appendRow(values) {
    this.rows.push(values.slice());
  }

  getRange(row, column, rowCount, columnCount) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }
}

class FakeRange {
  constructor(sheet, row, column, rowCount, columnCount) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
  }

  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowIndex) => {
      const sourceRow = this.sheet.rows[this.row - 1 + rowIndex] || [];
      return Array.from({ length: this.columnCount }, (_, columnIndex) => {
        return sourceRow[this.column - 1 + columnIndex] || '';
      });
    });
  }

  setValues(values) {
    values.forEach((sourceRow, rowIndex) => {
      const targetRowIndex = this.row - 1 + rowIndex;
      const targetRow = this.sheet.rows[targetRowIndex] || [];
      sourceRow.forEach((value, columnIndex) => {
        targetRow[this.column - 1 + columnIndex] = value;
      });
      this.sheet.rows[targetRowIndex] = targetRow;
    });
  }
}
