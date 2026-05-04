var POSITION_DIRECTIONS = ['long', 'short'];

function listPositions(options) {
  var filters = options || {};
  var positions = readRows_('Positions').map(normalizePosition_);

  return positions.filter(function (position) {
    if (filters.status && position.status !== filters.status) {
      return false;
    }

    if (filters.portfolio_id && position.portfolio_id !== filters.portfolio_id) {
      return false;
    }

    return true;
  });
}

function listOpenPositions(options) {
  return listPositions(Object.assign({}, options || {}, { status: 'open' }));
}

function listClosedPositions(options) {
  return listPositions(Object.assign({}, options || {}, { status: 'closed' }));
}

function createPosition(input) {
  initRequiredSheets();

  var payload = input || {};
  var portfolio = getTradingPortfolioForPosition_(payload.portfolio_id);
  var now = nowIso_();
  var position = normalizePositionInput_(payload, portfolio);

  position.position_id = createId_('position');
  position.parent_position_id = '';
  position.portfolio_id = portfolio.portfolio_id;
  position.status = 'open';
  position.exit_date = '';
  position.exit_price = '';
  position.exit_qty = '';
  position.fee_exit = '';
  position.realized_pnl = '';
  position.created_at = now;
  position.updated_at = now;

  appendRow_('Positions', position);
  return normalizePosition_(position);
}

function closePosition(positionId, input) {
  initRequiredSheets();

  var record = findPositionRow_(positionId);
  var position = normalizePosition_(record.row);
  assertOpenPosition_(position);

  var payload = input || {};
  var exitPrice = parsePositiveNumber_(payload.exit_price, 'exit_price');
  var feeExit = parseOptionalNumber_(payload.fee_exit, 0);
  var exitDate = String(payload.exit_date || '').trim() || todayIsoDate_();
  var note = String(payload.note || '').trim();

  position.status = 'closed';
  position.exit_date = exitDate;
  position.exit_price = exitPrice;
  position.exit_qty = position.qty;
  position.fee_exit = feeExit;
  position.realized_pnl = calculateRealizedPnl_(
    position,
    position.qty,
    exitPrice,
    position.fee_entry,
    feeExit
  );
  position.note = mergePositionNote_(position.note, note);
  position.updated_at = nowIso_();

  writeRow_('Positions', record.rowNumber, position);
  return normalizePosition_(position);
}

function scaleOutPosition(positionId, input) {
  initRequiredSheets();

  var record = findPositionRow_(positionId);
  var position = normalizePosition_(record.row);
  assertOpenPosition_(position);

  var payload = input || {};
  var exitQty = parsePositiveNumber_(payload.exit_qty, 'exit_qty');
  if (exitQty >= position.qty) {
    throw new Error('exit_qty must be less than current qty.');
  }

  var now = nowIso_();
  var exitPrice = parsePositiveNumber_(payload.exit_price, 'exit_price');
  var feeExit = parseOptionalNumber_(payload.fee_exit, 0);
  var exitDate = String(payload.exit_date || '').trim() || todayIsoDate_();
  var ratio = exitQty / position.qty;
  var partialFeeEntry = roundLedgerNumber_(Number(position.fee_entry || 0) * ratio);
  var partialPositionSize = roundLedgerNumber_(Number(position.position_size || 0) * ratio);

  var partial = {
    position_id: createId_('position'),
    portfolio_id: position.portfolio_id,
    parent_position_id: position.position_id,
    status: 'closed',
    symbol: position.symbol,
    direction: position.direction,
    entry_date: position.entry_date,
    entry_price: position.entry_price,
    qty: roundLedgerNumber_(exitQty),
    position_size: partialPositionSize,
    stop_loss: position.stop_loss,
    fee_entry: partialFeeEntry,
    exit_date: exitDate,
    exit_price: exitPrice,
    exit_qty: roundLedgerNumber_(exitQty),
    fee_exit: feeExit,
    realized_pnl: calculateRealizedPnl_(position, exitQty, exitPrice, partialFeeEntry, feeExit),
    note: String(payload.note || '').trim(),
    created_at: now,
    updated_at: now,
  };

  position.qty = roundLedgerNumber_(position.qty - exitQty);
  position.position_size = roundLedgerNumber_(Number(position.position_size || 0) - partialPositionSize);
  position.fee_entry = roundLedgerNumber_(Number(position.fee_entry || 0) - partialFeeEntry);
  position.updated_at = now;

  writeRow_('Positions', record.rowNumber, position);
  appendRow_('Positions', partial);
  return normalizePosition_(partial);
}

function getTradingAnalytics(options) {
  var closed = listClosedPositions(options || {}).sort(compareClosedPositions_);
  return calculateTradingAnalytics_(closed);
}

function normalizePositionInput_(input, portfolio) {
  var entryPrice = parsePositiveNumber_(input.entry_price, 'entry_price');
  var stopLoss = parseOptionalPositiveNumber_(input.stop_loss, '');
  var direction = String(input.direction || '').trim().toLowerCase();
  var sizingMode = normalizeSizingMode_(input.sizing_mode, portfolio);
  var sizing = calculatePositionSize_({
    sizing_mode: sizingMode,
    entry_price: entryPrice,
    stop_loss: stopLoss,
    qty: input.qty,
    position_size: input.position_size,
    equity: input.equity || portfolio.initial_capital,
    risk_percent: input.risk_percent || portfolio.default_risk_pct,
    risk_cash: input.risk_cash,
  });

  if (!String(input.symbol || '').trim()) {
    throw new Error('symbol is required.');
  }

  if (POSITION_DIRECTIONS.indexOf(direction) === -1) {
    throw new Error('direction must be long or short.');
  }

  validateStopLoss_(direction, entryPrice, stopLoss);

  return {
    position_id: '',
    portfolio_id: portfolio.portfolio_id,
    parent_position_id: '',
    status: 'open',
    symbol: String(input.symbol || '').trim().toUpperCase(),
    direction: direction,
    entry_date: String(input.entry_date || '').trim() || todayIsoDate_(),
    entry_price: entryPrice,
    qty: sizing.qty,
    position_size: sizing.position_size,
    stop_loss: stopLoss || '',
    fee_entry: normalizeEntryFee_(input, portfolio, sizing.position_size),
    exit_date: '',
    exit_price: '',
    exit_qty: '',
    fee_exit: '',
    realized_pnl: '',
    note: String(input.note || '').trim(),
    created_at: '',
    updated_at: '',
  };
}

function normalizePosition_(row) {
  return {
    position_id: String(row.position_id || ''),
    portfolio_id: String(row.portfolio_id || ''),
    parent_position_id: String(row.parent_position_id || ''),
    status: String(row.status || ''),
    symbol: String(row.symbol || ''),
    direction: String(row.direction || ''),
    entry_date: normalizeDateKey_(row.entry_date),
    entry_price: row.entry_price === '' ? '' : Number(row.entry_price),
    qty: row.qty === '' ? '' : Number(row.qty),
    position_size: row.position_size === '' ? '' : Number(row.position_size),
    stop_loss: row.stop_loss === '' ? '' : Number(row.stop_loss),
    fee_entry: row.fee_entry === '' ? 0 : Number(row.fee_entry),
    exit_date: normalizeDateKey_(row.exit_date),
    exit_price: row.exit_price === '' ? '' : Number(row.exit_price),
    exit_qty: row.exit_qty === '' ? '' : Number(row.exit_qty),
    fee_exit: row.fee_exit === '' ? '' : Number(row.fee_exit),
    realized_pnl: row.realized_pnl === '' ? '' : Number(row.realized_pnl),
    note: String(row.note || ''),
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
  };
}

function getTradingPortfolioForPosition_(portfolioId) {
  var portfolio = getPortfolioById_(portfolioId, false);
  if (portfolio.type !== 'trading') {
    throw new Error('Position must belong to a non-archived trading portfolio.');
  }

  return portfolio;
}

function findPositionRow_(positionId) {
  try {
    return findRowById_('Positions', 'position_id', positionId);
  } catch (error) {
    throw new Error('Position not found.');
  }
}

function assertOpenPosition_(position) {
  if (position.status !== 'open') {
    throw new Error('Position must be open.');
  }
}

function validateStopLoss_(direction, entryPrice, stopLoss) {
  if (!stopLoss) {
    return;
  }

  if (direction === 'long' && stopLoss >= entryPrice) {
    throw new Error('Long stop loss must be lower than entry price.');
  }

  if (direction === 'short' && stopLoss <= entryPrice) {
    throw new Error('Short stop loss must be higher than entry price.');
  }
}

function normalizeSizingMode_(value, portfolio) {
  var mode = String(value || '').trim();
  if (mode) {
    return mode;
  }

  if (portfolio.risk_mode === 'percent') {
    return 'fixed_risk_percent';
  }

  if (portfolio.risk_mode === 'fixed') {
    return 'fixed_cash';
  }

  return 'manual_qty';
}

function normalizeEntryFee_(input, portfolio, positionSize) {
  if (input.fee_entry !== undefined && input.fee_entry !== null && input.fee_entry !== '') {
    return parseOptionalNumber_(input.fee_entry, 0);
  }

  return roundLedgerNumber_(Number(positionSize || 0) * getCommissionRateForMarket_(portfolio));
}

function getCommissionRateForMarket_(portfolio) {
  if (Number(portfolio.commission_rate || 0) > 0) {
    return Number(portfolio.commission_rate);
  }

  if (portfolio.market === 'crypto') {
    return 0.001;
  }

  if (portfolio.market === 'thai_stock') {
    return 0.00157;
  }

  return 0.0025;
}

function mergePositionNote_(existingNote, closeNote) {
  if (!closeNote) {
    return existingNote || '';
  }

  if (!existingNote) {
    return closeNote;
  }

  return existingNote + '\nClose: ' + closeNote;
}

function compareClosedPositions_(left, right) {
  var leftDate = normalizeDateKey_(left.exit_date || left.created_at);
  var rightDate = normalizeDateKey_(right.exit_date || right.created_at);

  if (leftDate !== rightDate) {
    return leftDate < rightDate ? -1 : 1;
  }

  return String(left.created_at || '').localeCompare(String(right.created_at || ''));
}
