var PORTFOLIO_TYPES = ['trading', 'manual'];
var MANUAL_ENTRY_TYPES = ['balance', 'deposit', 'withdraw'];

function listPortfolios(options) {
  var includeArchived = options && options.includeArchived === true;
  var portfolios = readRows_('Portfolios').map(normalizePortfolio_);
  var latestManualBalances = getLatestManualBalances_();

  return portfolios
    .filter(function (portfolio) {
      return includeArchived || !portfolio.archived;
    })
    .map(function (portfolio) {
      return withPortfolioValue_(portfolio, latestManualBalances);
    });
}

function createPortfolio(input) {
  initRequiredSheets();

  var now = nowIso_();
  var portfolio = normalizePortfolioInput_(input || {}, null);
  portfolio.portfolio_id = createId_('portfolio');
  portfolio.created_at = now;
  portfolio.updated_at = now;
  portfolio.archived = false;

  appendRow_('Portfolios', portfolio);
  return normalizePortfolio_(portfolio);
}

function updatePortfolio(portfolioId, updates) {
  initRequiredSheets();

  var record = findRowById_('Portfolios', 'portfolio_id', portfolioId);
  var existing = normalizePortfolio_(record.row);
  var merged = normalizePortfolioInput_(updates || {}, existing);
  merged.portfolio_id = existing.portfolio_id;
  merged.created_at = existing.created_at;
  merged.updated_at = nowIso_();
  merged.archived = existing.archived;

  writeRow_('Portfolios', record.rowNumber, merged);
  return normalizePortfolio_(merged);
}

function archivePortfolio(portfolioId) {
  initRequiredSheets();

  var record = findRowById_('Portfolios', 'portfolio_id', portfolioId);
  var portfolio = normalizePortfolio_(record.row);
  portfolio.archived = true;
  portfolio.updated_at = nowIso_();

  writeRow_('Portfolios', record.rowNumber, portfolio);
  return portfolio;
}

function addManualEntry(input) {
  initRequiredSheets();

  var payload = input || {};
  var portfolio = getPortfolioById_(payload.portfolio_id, false);

  if (portfolio.type !== 'manual') {
    throw new Error('Manual entries can only be added to manual portfolios.');
  }

  var entryType = String(payload.type || '').trim();
  if (MANUAL_ENTRY_TYPES.indexOf(entryType) === -1) {
    throw new Error('Manual entry type must be balance, deposit, or withdraw.');
  }

  var amount = parseRequiredNumber_(payload.amount, 'amount');
  var balanceAfter = parseRequiredNumber_(payload.balance_after, 'balance_after');
  var date = String(payload.date || '').trim() || todayIsoDate_();
  var currency = normalizeCurrency_(payload.currency || portfolio.base_currency);

  var entry = {
    entry_id: createId_('entry'),
    portfolio_id: portfolio.portfolio_id,
    date: date,
    type: entryType,
    amount: amount,
    balance_after: balanceAfter,
    currency: currency,
    note: String(payload.note || '').trim(),
    created_at: nowIso_(),
  };

  appendRow_('ManualEntries', entry);
  return entry;
}

function getPortfolioSummary() {
  var portfolios = listPortfolios();

  var summary = portfolios.reduce(
    function (totals, portfolio) {
      var currency = normalizeCurrency_(portfolio.current_currency || portfolio.base_currency);
      var value = Number(portfolio.current_value || 0);

      totals.active_count += 1;
      totals.totals_by_currency[currency] = Number(totals.totals_by_currency[currency] || 0) + value;

      if (portfolio.type === 'trading') {
        totals.trading_count += 1;
        totals.trading_by_currency[currency] = Number(totals.trading_by_currency[currency] || 0) + value;
      } else if (portfolio.type === 'manual') {
        totals.manual_count += 1;
        totals.manual_by_currency[currency] = Number(totals.manual_by_currency[currency] || 0) + value;
      }

      return totals;
    },
    {
      active_count: 0,
      trading_count: 0,
      manual_count: 0,
      trading_value: 0,
      manual_value: 0,
      total_value: 0,
      currency: LEDGER_APP.defaultCurrency,
      has_mixed_currencies: false,
      totals_by_currency: {},
      trading_by_currency: {},
      manual_by_currency: {},
    }
  );

  return finalizePortfolioSummary_(summary);
}

function finalizePortfolioSummary_(summary) {
  var currencies = Object.keys(summary.totals_by_currency);

  if (currencies.length === 0) {
    return summary;
  }

  if (currencies.length === 1) {
    summary.currency = currencies[0];
    summary.total_value = summary.totals_by_currency[currencies[0]];
    summary.trading_value = summary.trading_by_currency[currencies[0]] || 0;
    summary.manual_value = summary.manual_by_currency[currencies[0]] || 0;
    summary.has_mixed_currencies = false;
    return summary;
  }

  summary.currency = 'MIXED';
  summary.total_value = '';
  summary.trading_value = '';
  summary.manual_value = '';
  summary.has_mixed_currencies = true;
  return summary;
}

function getPortfolioById_(portfolioId, includeArchived) {
  var record = findRowById_('Portfolios', 'portfolio_id', portfolioId);
  var portfolio = normalizePortfolio_(record.row);

  if (portfolio.archived && !includeArchived) {
    throw new Error('Portfolio is archived.');
  }

  return portfolio;
}

function normalizePortfolioInput_(input, existing) {
  var base = existing || {};
  var portfolio = {
    portfolio_id: base.portfolio_id || '',
    name: coalesceString_(input.name, base.name),
    type: coalesceString_(input.type, base.type || 'trading'),
    market: coalesceString_(input.market, base.market || 'custom'),
    base_currency: normalizeCurrency_(
      coalesceString_(input.base_currency, base.base_currency || LEDGER_APP.defaultCurrency)
    ),
    initial_capital: coalesceValue_(input.initial_capital, base.initial_capital),
    commission_rate: parseOptionalNumber_(coalesceValue_(input.commission_rate, base.commission_rate), 0),
    risk_mode: coalesceString_(input.risk_mode, base.risk_mode || 'none'),
    default_risk_pct: parseOptionalNumber_(coalesceValue_(input.default_risk_pct, base.default_risk_pct), 0),
    created_at: base.created_at || '',
    updated_at: base.updated_at || '',
    archived: toBoolean_(base.archived),
  };

  if (!portfolio.name) {
    throw new Error('Portfolio name is required.');
  }

  if (PORTFOLIO_TYPES.indexOf(portfolio.type) === -1) {
    throw new Error('Portfolio type must be trading or manual.');
  }

  if (!portfolio.market) {
    throw new Error('Portfolio market is required.');
  }

  if (portfolio.type === 'trading') {
    portfolio.initial_capital = parseRequiredNumber_(portfolio.initial_capital, 'initial_capital');
  } else if (
    portfolio.initial_capital === undefined ||
    portfolio.initial_capital === null ||
    portfolio.initial_capital === ''
  ) {
    portfolio.initial_capital = '';
  } else {
    portfolio.initial_capital = parseOptionalNumber_(portfolio.initial_capital, '');
  }

  return portfolio;
}

function normalizePortfolio_(row) {
  return {
    portfolio_id: String(row.portfolio_id || ''),
    name: String(row.name || ''),
    type: String(row.type || ''),
    market: String(row.market || ''),
    base_currency: normalizeCurrency_(row.base_currency || LEDGER_APP.defaultCurrency),
    initial_capital: row.initial_capital === '' ? '' : Number(row.initial_capital),
    commission_rate: row.commission_rate === '' ? 0 : Number(row.commission_rate),
    risk_mode: String(row.risk_mode || 'none'),
    default_risk_pct: row.default_risk_pct === '' ? 0 : Number(row.default_risk_pct),
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    archived: toBoolean_(row.archived),
  };
}

function withPortfolioValue_(portfolio, latestManualBalances) {
  var latestManualBalance = latestManualBalances[portfolio.portfolio_id];
  var value =
    portfolio.type === 'manual' && latestManualBalance
      ? latestManualBalance.balance_after
      : portfolio.initial_capital;
  var currency =
    portfolio.type === 'manual' && latestManualBalance ? latestManualBalance.currency : portfolio.base_currency;

  portfolio.current_value = Number(value || 0);
  portfolio.current_currency = normalizeCurrency_(currency || portfolio.base_currency);
  return portfolio;
}

function getLatestManualBalances_() {
  var balances = {};

  readRows_('ManualEntries').forEach(function (entry) {
    if (!entry.portfolio_id) {
      return;
    }

    var current = balances[entry.portfolio_id];
    if (!current || isLaterManualEntry_(entry, current)) {
      balances[entry.portfolio_id] = {
        balance_after: Number(entry.balance_after || 0),
        currency: normalizeCurrency_(entry.currency || LEDGER_APP.defaultCurrency),
        date: normalizeDateKey_(entry.date),
        created_at: normalizeDateTimeKey_(entry.created_at),
        row_number: Number(entry._rowNumber || 0),
      };
    }
  });

  return balances;
}

function isLaterManualEntry_(candidate, current) {
  var candidateDate = normalizeDateKey_(candidate.date);
  var currentDate = current.date || '';

  if (candidateDate !== currentDate) {
    return candidateDate > currentDate;
  }

  var candidateCreatedAt = normalizeDateTimeKey_(candidate.created_at);
  var currentCreatedAt = current.created_at || '';

  if (candidateCreatedAt !== currentCreatedAt) {
    return candidateCreatedAt > currentCreatedAt;
  }

  return Number(candidate._rowNumber || 0) > Number(current.row_number || 0);
}

function readRows_(sheetName) {
  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(sheetName);
  var headers = getHeadersForSheet_(sheetName);

  if (!sheet) {
    throw new Error(sheetName + ' sheet is missing. Initialize sheets first.');
  }

  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues()
    .map(function (values, index) {
      var row = {};
      headers.forEach(function (header, columnIndex) {
        row[header] = values[columnIndex];
      });
      row._rowNumber = index + 2;
      return row;
    });
}

function appendRow_(sheetName, row) {
  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(sheetName);
  sheet.appendRow(objectToRow_(sheetName, row));
}

function writeRow_(sheetName, rowNumber, row) {
  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(sheetName);
  var values = objectToRow_(sheetName, row);
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
}

function objectToRow_(sheetName, row) {
  return getHeadersForSheet_(sheetName).map(function (header) {
    return row[header] === undefined ? '' : row[header];
  });
}

function findRowById_(sheetName, idField, idValue) {
  var needle = String(idValue || '').trim();
  if (!needle) {
    throw new Error(idField + ' is required.');
  }

  var rows = readRows_(sheetName);
  for (var index = 0; index < rows.length; index += 1) {
    if (String(rows[index][idField]) === needle) {
      return {
        row: rows[index],
        rowNumber: rows[index]._rowNumber,
      };
    }
  }

  throw new Error('Portfolio not found.');
}

function getHeadersForSheet_(sheetName) {
  for (var index = 0; index < REQUIRED_SHEETS.length; index += 1) {
    if (REQUIRED_SHEETS[index].name === sheetName) {
      return REQUIRED_SHEETS[index].headers;
    }
  }

  throw new Error('Unknown sheet: ' + sheetName);
}

function createId_(prefix) {
  var id =
    typeof Utilities !== 'undefined' && Utilities.getUuid ? Utilities.getUuid() : String(new Date().getTime());
  return prefix + '_' + id;
}

function nowIso_() {
  return new Date().toISOString();
}

function todayIsoDate_() {
  return nowIso_().slice(0, 10);
}

function normalizeDateKey_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function normalizeDateTimeKey_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  return String(value);
}

function coalesceString_(value, fallback) {
  if (value === undefined || value === null) {
    return String(fallback || '').trim();
  }

  return String(value).trim();
}

function coalesceValue_(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

function normalizeCurrency_(value) {
  return String(value || LEDGER_APP.defaultCurrency).trim().toUpperCase();
}

function parseRequiredNumber_(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new Error(fieldName + ' is required.');
  }

  var numberValue = Number(value);
  if (!isFinite(numberValue)) {
    throw new Error(fieldName + ' must be a number.');
  }

  return numberValue;
}

function parseOptionalNumber_(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  var numberValue = Number(value);
  if (!isFinite(numberValue)) {
    return fallback;
  }

  return numberValue;
}

function toBoolean_(value) {
  return value === true || String(value).toUpperCase() === 'TRUE';
}
