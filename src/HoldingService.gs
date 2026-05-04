var HOLDING_ASSET_TYPES = ['crypto', 'thai_stock', 'us_stock', 'cash', 'gold', 'fund', 'custom'];

function listHoldings(options) {
  var includeArchived = options && options.includeArchived === true;
  var holdings = readRows_('Holdings').map(normalizeHolding_);
  var totalCurrentValue = 0;

  holdings = holdings
    .filter(function (holding) {
      return includeArchived || !holding.archived;
    })
    .map(withHoldingValue_);

  totalCurrentValue = holdings.reduce(function (total, holding) {
    return total + Number(holding.current_value || 0);
  }, 0);

  return holdings.map(function (holding) {
    holding.allocation = totalCurrentValue
      ? Number(holding.current_value || 0) / totalCurrentValue
      : '';
    return holding;
  });
}

function createHolding(input) {
  initRequiredSheets();

  var now = nowIso_();
  var holding = normalizeHoldingInput_(input || {}, null);
  holding.holding_id = createId_('holding');
  holding.created_at = now;
  holding.updated_at = now;
  holding.archived = false;

  appendRow_('Holdings', holding);
  return normalizeHolding_(holding);
}

function updateHolding(holdingId, updates) {
  initRequiredSheets();

  var record = findHoldingRow_(holdingId);
  var existing = normalizeHolding_(record.row);
  var merged = normalizeHoldingInput_(updates || {}, existing);
  merged.holding_id = existing.holding_id;
  merged.created_at = existing.created_at;
  merged.updated_at = nowIso_();
  merged.archived = existing.archived;

  writeRow_('Holdings', record.rowNumber, merged);
  return normalizeHolding_(merged);
}

function archiveHolding(holdingId) {
  initRequiredSheets();

  var record = findHoldingRow_(holdingId);
  var holding = normalizeHolding_(record.row);
  holding.archived = true;
  holding.updated_at = nowIso_();

  writeRow_('Holdings', record.rowNumber, holding);
  return holding;
}

function getHoldingsSummary() {
  var holdings = listHoldings();
  var summary = holdings.reduce(
    function (totals, holding) {
      var currency = normalizeCurrency_(holding.cost_currency || LEDGER_APP.defaultCurrency);

      totals.active_count += 1;
      totals.cost_basis_by_currency[currency] =
        Number(totals.cost_basis_by_currency[currency] || 0) + Number(holding.cost_basis || 0);
      totals.current_value_by_currency[currency] =
        Number(totals.current_value_by_currency[currency] || 0) + Number(holding.current_value || 0);
      totals.unrealized_pnl_by_currency[currency] =
        Number(totals.unrealized_pnl_by_currency[currency] || 0) + Number(holding.unrealized_pnl || 0);
      return totals;
    },
    {
      active_count: 0,
      total_cost_basis: 0,
      total_current_value: 0,
      total_unrealized_pnl: 0,
      currency: LEDGER_APP.defaultCurrency,
      has_mixed_currencies: false,
      cost_basis_by_currency: {},
      current_value_by_currency: {},
      unrealized_pnl_by_currency: {},
    }
  );

  return finalizeHoldingsSummary_(summary);
}

function normalizeHoldingInput_(input, existing) {
  var base = existing || {};
  var holding = {
    holding_id: base.holding_id || '',
    asset_type: coalesceString_(input.asset_type, base.asset_type || 'custom').toLowerCase(),
    symbol: normalizeSymbol_(coalesceString_(input.symbol, base.symbol)),
    name: coalesceString_(input.name, base.name),
    amount: parsePositiveNumber_(coalesceValue_(input.amount, base.amount), 'amount'),
    avg_cost: parseOptionalNonNegativeNumber_(coalesceValue_(input.avg_cost, base.avg_cost), 'avg_cost', 0),
    cost_currency: normalizeCurrency_(
      coalesceString_(input.cost_currency, base.cost_currency || LEDGER_APP.defaultCurrency)
    ),
    price_source: normalizePriceSource_(coalesceString_(input.price_source, base.price_source || 'manual')),
    custom_current_price: parseOptionalNonNegativeNumber_(
      coalesceValue_(input.custom_current_price, base.custom_current_price),
      'custom_current_price',
      ''
    ),
    note: coalesceString_(input.note, base.note),
    created_at: base.created_at || '',
    updated_at: base.updated_at || '',
    archived: toBoolean_(base.archived),
  };

  if (HOLDING_ASSET_TYPES.indexOf(holding.asset_type) === -1) {
    throw new Error('asset_type must be crypto, thai_stock, us_stock, cash, gold, fund, or custom.');
  }

  if (!holding.symbol) {
    throw new Error('symbol is required.');
  }

  if (!holding.name) {
    holding.name = holding.symbol;
  }

  return holding;
}

function normalizeHolding_(row) {
  return {
    holding_id: String(row.holding_id || ''),
    asset_type: String(row.asset_type || ''),
    symbol: normalizeSymbol_(row.symbol),
    name: String(row.name || ''),
    amount: row.amount === '' ? '' : Number(row.amount),
    avg_cost: row.avg_cost === '' ? 0 : Number(row.avg_cost),
    cost_currency: normalizeCurrency_(row.cost_currency || LEDGER_APP.defaultCurrency),
    price_source: normalizePriceSource_(row.price_source || 'manual'),
    custom_current_price: row.custom_current_price === '' ? '' : Number(row.custom_current_price),
    note: String(row.note || ''),
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    archived: toBoolean_(row.archived),
  };
}

function withHoldingValue_(holding) {
  var priceResult = resolveHoldingPrice_(holding);
  var currentPrice = priceResult.price;
  var costBasis = roundLedgerNumber_(Number(holding.amount || 0) * Number(holding.avg_cost || 0));
  var currentValue =
    currentPrice === ''
      ? ''
      : roundLedgerNumber_(Number(holding.amount || 0) * Number(currentPrice || 0));

  holding.current_price = currentPrice;
  holding.current_price_currency = priceResult.currency || holding.cost_currency;
  holding.price_label = priceResult.label;
  holding.price_updated_at = priceResult.updated_at || '';
  holding.cost_basis = costBasis;
  holding.current_value = currentValue;
  holding.unrealized_pnl =
    currentValue === '' ? '' : roundLedgerNumber_(Number(currentValue || 0) - Number(costBasis || 0));

  return holding;
}

function resolveHoldingPrice_(holding) {
  if (holding.custom_current_price !== '') {
    return {
      price: Number(holding.custom_current_price),
      currency: holding.cost_currency,
      label: 'custom',
      updated_at: holding.updated_at,
    };
  }

  var cached = getCachedPrice(holding.symbol, holding.price_source);
  if (cached && cached.price !== '') {
    return {
      price: Number(cached.price),
      currency: cached.currency || holding.cost_currency,
      label: cached.source || 'manual',
      updated_at: cached.updated_at,
    };
  }

  if (holding.asset_type === 'custom' || holding.avg_cost !== '') {
    return {
      price: Number(holding.avg_cost || 0),
      currency: holding.cost_currency,
      label: 'fallback',
      updated_at: '',
    };
  }

  return {
    price: '',
    currency: holding.cost_currency,
    label: 'missing',
    updated_at: '',
  };
}

function finalizeHoldingsSummary_(summary) {
  var currencies = Object.keys(summary.current_value_by_currency);

  if (currencies.length === 0) {
    return summary;
  }

  if (currencies.length === 1) {
    var currency = currencies[0];
    summary.currency = currency;
    summary.total_cost_basis = roundLedgerNumber_(summary.cost_basis_by_currency[currency] || 0);
    summary.total_current_value = roundLedgerNumber_(summary.current_value_by_currency[currency] || 0);
    summary.total_unrealized_pnl = roundLedgerNumber_(summary.unrealized_pnl_by_currency[currency] || 0);
    summary.has_mixed_currencies = false;
    return summary;
  }

  summary.currency = 'MIXED';
  summary.total_cost_basis = '';
  summary.total_current_value = '';
  summary.total_unrealized_pnl = '';
  summary.has_mixed_currencies = true;
  return summary;
}

function findHoldingRow_(holdingId) {
  try {
    return findRowById_('Holdings', 'holding_id', holdingId);
  } catch (error) {
    throw new Error('Holding not found.');
  }
}
