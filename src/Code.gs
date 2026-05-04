function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(LEDGER_APP.name)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppBootstrap() {
  var bootstrap = {
    app: LEDGER_APP,
    schema: getSheetSchema(),
    dashboard: getEmptyPortfolioSummary_(),
    portfolios: [],
    openPositions: [],
    closedPositions: [],
    tradingAnalytics: getEmptyTradingAnalytics_(),
    holdings: [],
    holdingsSummary: getEmptyHoldingsSummary_(),
    priceCache: [],
    watchlist: [],
  };

  try {
    bootstrap.dashboard = getPortfolioSummary();
    bootstrap.portfolios = listPortfolios();
  } catch (error) {
    bootstrap.portfolioError = error.message;
  }

  try {
    bootstrap.openPositions = listOpenPositions();
    bootstrap.closedPositions = listClosedPositions();
    bootstrap.tradingAnalytics = getTradingAnalytics();
  } catch (error) {
    bootstrap.positionError = error.message;
  }

  try {
    bootstrap.holdings = listHoldings();
    bootstrap.holdingsSummary = getHoldingsSummary();
    bootstrap.priceCache = listPriceCache();
    bootstrap.watchlist = listWatchlist();
  } catch (error) {
    bootstrap.holdingError = error.message;
  }

  return bootstrap;
}

function getEmptyPortfolioSummary_() {
  return {
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
  };
}

function getEmptyTradingAnalytics_() {
  return {
    closed_trade_count: 0,
    win_rate: 0,
    avg_win: '',
    avg_loss: '',
    expectancy: 0,
    profit_factor: '',
    max_consecutive_loss: 0,
    largest_win: '',
    largest_loss: '',
    average_r_multiple: '',
  };
}

function getEmptyHoldingsSummary_() {
  return {
    active_count: 0,
    total_cost_basis: 0,
    total_current_value: 0,
    total_unrealized_pnl: 0,
    currency: LEDGER_APP.defaultCurrency,
    has_mixed_currencies: false,
    cost_basis_by_currency: {},
    current_value_by_currency: {},
    unrealized_pnl_by_currency: {},
  };
}

function initializeLedger() {
  return initRequiredSheets();
}

function getDashboardApi() {
  return getPortfolioSummary();
}

function listPortfoliosApi(options) {
  return listPortfolios(options || {});
}

function createPortfolioApi(payload) {
  return createPortfolio(payload || {});
}

function updatePortfolioApi(portfolioId, payload) {
  return updatePortfolio(portfolioId, payload || {});
}

function archivePortfolioApi(portfolioId) {
  return archivePortfolio(portfolioId);
}

function addManualEntryApi(payload) {
  return addManualEntry(payload || {});
}

function listOpenPositionsApi(options) {
  return listOpenPositions(options || {});
}

function listClosedPositionsApi(options) {
  return listClosedPositions(options || {});
}

function createPositionApi(payload) {
  return createPosition(payload || {});
}

function closePositionApi(positionId, payload) {
  return closePosition(positionId, payload || {});
}

function scaleOutPositionApi(positionId, payload) {
  return scaleOutPosition(positionId, payload || {});
}

function getTradingAnalyticsApi(options) {
  return getTradingAnalytics(options || {});
}

function listHoldingsApi(options) {
  return listHoldings(options || {});
}

function createHoldingApi(payload) {
  return createHolding(payload || {});
}

function updateHoldingApi(holdingId, payload) {
  return updateHolding(holdingId, payload || {});
}

function archiveHoldingApi(holdingId) {
  return archiveHolding(holdingId);
}

function getHoldingsSummaryApi() {
  return getHoldingsSummary();
}

function listPriceCacheApi(options) {
  return listPriceCache(options || {});
}

function upsertManualPriceApi(payload) {
  return upsertManualPrice(payload || {});
}

function listWatchlistApi() {
  return listWatchlist();
}

function addWatchlistSymbolApi(payload) {
  return addWatchlistSymbol(payload || {});
}

function removeWatchlistSymbolApi(symbol, source) {
  return removeWatchlistSymbol(symbol, source || 'manual');
}
