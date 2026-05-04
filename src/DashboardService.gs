function getDashboardOverview(options) {
  var filters = options || {};
  var displayCurrency = normalizeDashboardCurrency_(filters.currency);
  var today = normalizeDateKey_(filters.today || todayIsoDate_());
  var fx = getDashboardFx_();
  var portfolios = listPortfolios();
  var holdings = listHoldings();
  var portfolioRows = buildDashboardPortfolioRows_(portfolios, fx);
  var holdingRows = buildDashboardHoldingRows_(holdings, fx);
  var tradingBalanceUsd = sumDashboardValues_(portfolioRows);
  var holdingsValueUsd = sumDashboardValues_(holdingRows);
  var totalValueUsd = roundLedgerNumber_(tradingBalanceUsd + holdingsValueUsd);
  var priorSnapshot = getLatestSnapshotBefore_(today);
  var todayPnlUsd = priorSnapshot
    ? roundLedgerNumber_(totalValueUsd - Number(priorSnapshot.total_portfolio_value_usd || 0))
    : 0;
  var snapshots = listDailySnapshots({ limit: 30 });
  var allocation = buildDashboardAllocation_(portfolioRows, holdingRows, totalValueUsd, displayCurrency, fx);
  var unconvertedItems = getDashboardUnconvertedItems_(portfolioRows, holdingRows);
  var hasUnconvertedValues = unconvertedItems.length > 0;

  return {
    currency: displayCurrency,
    fx: fx,
    generated_at: nowIso_(),
    totals: {
      total_portfolio_value_usd: totalValueUsd,
      trading_balance_usd: roundLedgerNumber_(tradingBalanceUsd),
      holdings_value_usd: roundLedgerNumber_(holdingsValueUsd),
      total_portfolio_value_display: displayDashboardAmount_(totalValueUsd, displayCurrency, fx),
      trading_balance_display: displayDashboardAmount_(tradingBalanceUsd, displayCurrency, fx),
      holdings_value_display: displayDashboardAmount_(holdingsValueUsd, displayCurrency, fx),
      has_unconverted_values: hasUnconvertedValues,
    },
    today_pnl: {
      value_usd: todayPnlUsd,
      value_display: displayDashboardAmount_(todayPnlUsd, displayCurrency, fx),
      has_prior_snapshot: Boolean(priorSnapshot),
      prior_snapshot_date: priorSnapshot ? priorSnapshot.date : '',
      label: priorSnapshot ? 'Since ' + priorSnapshot.date : 'No snapshot yet',
    },
    portfolios: portfolioRows,
    holdings: holdingRows,
    allocation: allocation,
    pnl_overview: buildDashboardPnlOverview_(snapshots),
    growth: buildDashboardGrowth_(snapshots),
    snapshots: snapshots,
    warnings: hasUnconvertedValues
      ? ['Some values use unsupported currencies and are excluded from USD totals.']
      : [],
    unconverted_items: unconvertedItems,
    empty_states: {
      allocation: allocation.length === 0,
      growth: snapshots.length < 2,
      pnl_overview: snapshots.length < 2,
    },
    notes: {
      historical_currency: 'Historical charts use USD snapshots.',
    },
  };
}

function buildDashboardPortfolioRows_(portfolios, fx) {
  return portfolios.map(function (portfolio) {
    var currency = normalizeCurrency_(portfolio.current_currency || portfolio.base_currency);
    var value = Number(portfolio.current_value || 0);
    var valueUsd = convertDashboardAmountToUsd_(value, currency, fx);
    var initialCapital = portfolio.initial_capital === '' ? '' : Number(portfolio.initial_capital || 0);
    var initialCapitalUsd =
      initialCapital === '' ? '' : convertDashboardAmountToUsd_(initialCapital, portfolio.base_currency, fx);
    var pnlPct =
      portfolio.type === 'manual' || valueUsd === '' || !initialCapitalUsd
        ? ''
        : roundLedgerNumber_(((valueUsd - initialCapitalUsd) / initialCapitalUsd) * 100);

    return {
      portfolio_id: portfolio.portfolio_id,
      name: portfolio.name,
      type: portfolio.type,
      market: portfolio.market,
      currency: currency,
      value: value,
      value_usd: valueUsd === '' ? '' : roundLedgerNumber_(valueUsd),
      initial_capital_usd: initialCapitalUsd === '' ? '' : roundLedgerNumber_(initialCapitalUsd),
      pnl_pct: pnlPct,
      conversion_status: valueUsd === '' ? 'unsupported_currency' : 'converted',
    };
  });
}

function buildDashboardHoldingRows_(holdings, fx) {
  return holdings.map(function (holding) {
    var currency = normalizeCurrency_(holding.current_price_currency || holding.cost_currency);
    var value = holding.current_value === '' ? 0 : Number(holding.current_value || 0);
    var valueUsd = convertDashboardAmountToUsd_(value, currency, fx);

    return {
      holding_id: holding.holding_id,
      symbol: holding.symbol,
      name: holding.name,
      asset_type: holding.asset_type,
      currency: currency,
      value: value,
      value_usd: valueUsd === '' ? '' : roundLedgerNumber_(valueUsd),
      unrealized_pnl_usd:
        holding.unrealized_pnl === '' || valueUsd === ''
          ? ''
          : roundLedgerNumber_(convertDashboardAmountToUsd_(holding.unrealized_pnl, currency, fx)),
      conversion_status: valueUsd === '' ? 'unsupported_currency' : 'converted',
    };
  });
}

function buildDashboardAllocation_(portfolios, holdings, totalValueUsd, displayCurrency, fx) {
  var rows = [];

  portfolios.forEach(function (portfolio) {
    if (portfolio.value_usd <= 0) {
      return;
    }

    rows.push({
      label: portfolio.name,
      kind: portfolio.type === 'manual' ? 'manual portfolio' : 'trading portfolio',
      value_usd: portfolio.value_usd,
      value_display: displayDashboardAmount_(portfolio.value_usd, displayCurrency, fx),
      pct: totalValueUsd ? roundLedgerNumber_(portfolio.value_usd / totalValueUsd) : 0,
    });
  });

  holdings.forEach(function (holding) {
    if (holding.value_usd <= 0) {
      return;
    }

    rows.push({
      label: holding.symbol,
      kind: 'holding',
      value_usd: holding.value_usd,
      value_display: displayDashboardAmount_(holding.value_usd, displayCurrency, fx),
      pct: totalValueUsd ? roundLedgerNumber_(holding.value_usd / totalValueUsd) : 0,
    });
  });

  return rows.sort(function (left, right) {
    return right.value_usd - left.value_usd;
  });
}

function getDashboardUnconvertedItems_(portfolios, holdings) {
  var items = [];

  portfolios.forEach(function (portfolio) {
    if (portfolio.conversion_status !== 'unsupported_currency') {
      return;
    }

    items.push({
      kind: portfolio.type === 'manual' ? 'manual portfolio' : 'trading portfolio',
      label: portfolio.name,
      currency: portfolio.currency,
      value: portfolio.value,
    });
  });

  holdings.forEach(function (holding) {
    if (holding.conversion_status !== 'unsupported_currency') {
      return;
    }

    items.push({
      kind: 'holding',
      label: holding.symbol,
      currency: holding.currency,
      value: holding.value,
    });
  });

  return items;
}

function buildDashboardGrowth_(snapshots) {
  return snapshots.map(function (snapshot) {
    return {
      date: snapshot.date,
      total_portfolio_value_usd: snapshot.total_portfolio_value_usd,
      trading_value_usd: snapshot.trading_value_usd,
      holdings_value_usd: snapshot.holdings_value_usd,
    };
  });
}

function buildDashboardPnlOverview_(snapshots) {
  var rows = [];

  for (var index = 1; index < snapshots.length; index += 1) {
    rows.push({
      date: snapshots[index].date,
      pnl_usd: roundLedgerNumber_(
        Number(snapshots[index].total_portfolio_value_usd || 0) -
          Number(snapshots[index - 1].total_portfolio_value_usd || 0)
      ),
    });
  }

  return rows;
}

function getDashboardFx_() {
  var fallback = Number(getSettingValue_('usd_thb_rate_fallback') || 34.5);
  var settingRate = Number(getSettingValue_('usd_thb') || getSettingValue_('usd_thb_rate') || 0);
  var cached = getCachedPrice('USDTHB', 'fx') || getCachedPrice('USDTHB');
  var cachedRate = cached && cached.price !== '' ? Number(cached.price || 0) : 0;
  var rate = cachedRate || settingRate || fallback || 34.5;

  return {
    usd_thb: rate,
    source: cachedRate ? 'PriceCache' : settingRate ? 'Settings' : 'fallback',
  };
}

function getSettingValue_(key) {
  var rows = readRows_('Settings');
  var target = String(key || '').trim();

  for (var index = 0; index < rows.length; index += 1) {
    if (String(rows[index].key || '').trim() === target) {
      return rows[index].value;
    }
  }

  return '';
}

function convertDashboardAmountToUsd_(amount, currency, fx) {
  var normalizedCurrency = normalizeCurrency_(currency);
  var value = Number(amount || 0);

  if (normalizedCurrency === 'USD') {
    return value;
  }

  if (normalizedCurrency === 'THB') {
    return value / Number(fx.usd_thb || 34.5);
  }

  return '';
}

function displayDashboardAmount_(amountUsd, displayCurrency, fx) {
  var value = Number(amountUsd || 0);
  return roundLedgerNumber_(displayCurrency === 'THB' ? value * Number(fx.usd_thb || 34.5) : value);
}

function sumDashboardValues_(rows) {
  return rows.reduce(function (total, row) {
    return total + Number(row.value_usd || 0);
  }, 0);
}

function normalizeDashboardCurrency_(currency) {
  var normalized = normalizeCurrency_(currency || getSettingValue_('display_currency') || 'USD');
  return normalized === 'THB' ? 'THB' : 'USD';
}
