var PRICE_CACHE_SOURCES = ['manual', 'binance', 'bitkub', 'set', 'gold', 'fx', 'custom', 'fallback'];

function listPriceCache(options) {
  var filters = options || {};
  return readRows_('PriceCache')
    .map(normalizePriceCache_)
    .filter(function (price) {
      if (!price.symbol) {
        return false;
      }

      if (filters.symbol && price.symbol !== normalizeSymbol_(filters.symbol)) {
        return false;
      }

      if (filters.source && price.source !== normalizePriceSource_(filters.source)) {
        return false;
      }

      return true;
    })
    .sort(comparePriceCache_);
}

function getCachedPrice(symbol, source) {
  var normalizedSymbol = normalizeSymbol_(symbol);
  var normalizedSource = source ? normalizePriceSource_(source) : '';

  if (!normalizedSymbol) {
    return null;
  }

  var rows = listPriceCache({ symbol: normalizedSymbol });
  if (normalizedSource) {
    rows = rows.filter(function (price) {
      return price.source === normalizedSource;
    });
  }

  return rows.length ? rows[0] : null;
}

function upsertManualPrice(input) {
  initRequiredSheets();

  var payload = input || {};
  var symbol = normalizeSymbol_(payload.symbol);
  var source = normalizePriceSource_(payload.source || 'manual');
  var price = parsePositiveNumber_(payload.price, 'price');
  var currency = normalizeCurrency_(payload.currency || LEDGER_APP.defaultCurrency);
  var existing = findPriceCacheRow_(symbol, source);
  var row = {
    symbol: symbol,
    source: source,
    price: roundLedgerNumber_(price),
    currency: currency,
    updated_at: nowIso_(),
    is_stale: toBoolean_(payload.is_stale),
  };

  if (!symbol) {
    throw new Error('symbol is required.');
  }

  if (existing) {
    writeRow_('PriceCache', existing.rowNumber, row);
  } else {
    appendRow_('PriceCache', row);
  }

  return normalizePriceCache_(row);
}

function listWatchlist() {
  return readRows_('Watchlist')
    .map(normalizeWatchlistItem_)
    .filter(function (item) {
      return item.symbol && item.source !== 'removed';
    });
}

function addWatchlistSymbol(input) {
  initRequiredSheets();

  var payload = input || {};
  var item = {
    symbol: normalizeSymbol_(payload.symbol),
    source: normalizePriceSource_(payload.source || 'manual'),
    created_at: nowIso_(),
  };

  if (!item.symbol) {
    throw new Error('symbol is required.');
  }

  var existing = findWatchlistRow_(item.symbol, item.source);
  if (existing) {
    return normalizeWatchlistItem_(existing.row);
  }

  appendRow_('Watchlist', item);
  return item;
}

function removeWatchlistSymbol(symbol, source) {
  initRequiredSheets();

  var normalizedSymbol = normalizeSymbol_(symbol);
  var normalizedSource = normalizePriceSource_(source || 'manual');
  var existing = findWatchlistRow_(normalizedSymbol, normalizedSource);

  if (!existing) {
    return {
      symbol: normalizedSymbol,
      source: normalizedSource,
      removed: false,
    };
  }

  writeRow_('Watchlist', existing.rowNumber, {
    symbol: normalizedSymbol,
    source: 'removed',
    created_at: existing.row.created_at || nowIso_(),
  });

  return {
    symbol: normalizedSymbol,
    source: normalizedSource,
    removed: true,
  };
}

function normalizePriceCache_(row) {
  return {
    symbol: normalizeSymbol_(row.symbol),
    source: normalizePriceSource_(row.source || 'manual'),
    price: row.price === '' ? '' : Number(row.price),
    currency: normalizeCurrency_(row.currency || LEDGER_APP.defaultCurrency),
    updated_at: row.updated_at || '',
    is_stale: toBoolean_(row.is_stale),
    _rowNumber: row._rowNumber,
  };
}

function normalizeWatchlistItem_(row) {
  return {
    symbol: normalizeSymbol_(row.symbol),
    source: normalizeWatchlistSource_(row.source || 'manual'),
    created_at: row.created_at || '',
    _rowNumber: row._rowNumber,
  };
}

function findPriceCacheRow_(symbol, source) {
  var normalizedSymbol = normalizeSymbol_(symbol);
  var normalizedSource = normalizePriceSource_(source || 'manual');
  var rows = readRows_('PriceCache');

  for (var index = 0; index < rows.length; index += 1) {
    if (
      normalizeSymbol_(rows[index].symbol) === normalizedSymbol &&
      normalizePriceSource_(rows[index].source || 'manual') === normalizedSource
    ) {
      return {
        row: rows[index],
        rowNumber: rows[index]._rowNumber,
      };
    }
  }

  return null;
}

function findWatchlistRow_(symbol, source) {
  var normalizedSymbol = normalizeSymbol_(symbol);
  var normalizedSource = normalizePriceSource_(source || 'manual');
  var rows = readRows_('Watchlist');

  for (var index = 0; index < rows.length; index += 1) {
    if (
      normalizeSymbol_(rows[index].symbol) === normalizedSymbol &&
      normalizePriceSource_(rows[index].source || 'manual') === normalizedSource
    ) {
      return {
        row: rows[index],
        rowNumber: rows[index]._rowNumber,
      };
    }
  }

  return null;
}

function comparePriceCache_(left, right) {
  var leftTime = normalizeDateTimeKey_(left.updated_at);
  var rightTime = normalizeDateTimeKey_(right.updated_at);

  if (leftTime !== rightTime) {
    return leftTime > rightTime ? -1 : 1;
  }

  return left.symbol.localeCompare(right.symbol);
}

function normalizeSymbol_(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizePriceSource_(value) {
  var source = String(value || 'manual').trim().toLowerCase();
  return PRICE_CACHE_SOURCES.indexOf(source) === -1 ? 'manual' : source;
}

function normalizeWatchlistSource_(value) {
  var source = String(value || 'manual').trim().toLowerCase();
  return source === 'removed' ? source : normalizePriceSource_(source);
}
