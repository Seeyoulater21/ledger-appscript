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
  };

  try {
    bootstrap.dashboard = getPortfolioSummary();
    bootstrap.portfolios = listPortfolios();
  } catch (error) {
    bootstrap.portfolioError = error.message;
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
