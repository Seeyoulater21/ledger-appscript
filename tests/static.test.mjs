import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
