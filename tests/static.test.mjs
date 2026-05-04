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
  return context;
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
