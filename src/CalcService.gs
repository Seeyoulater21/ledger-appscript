function calculatePositionSize_(input) {
  var mode = String(input.sizing_mode || 'manual_qty');
  var entryPrice = parsePositiveNumber_(input.entry_price, 'entry_price');
  var stopLoss = parseOptionalPositiveField_(input.stop_loss, 'stop_loss', '');
  var qty = parseOptionalPositiveField_(input.qty, 'qty', '');

  if (mode === 'manual_qty') {
    if (!qty) {
      throw new Error('qty is required.');
    }
    return {
      qty: roundLedgerNumber_(qty),
      position_size: roundLedgerNumber_(qty * entryPrice),
    };
  }

  if (!stopLoss) {
    throw new Error('stop_loss is required for risk sizing.');
  }

  var riskDistance = Math.abs(entryPrice - stopLoss) / entryPrice;
  if (riskDistance <= 0) {
    throw new Error('Risk distance must be greater than zero.');
  }

  var riskAmount;
  if (mode === 'fixed_risk_percent') {
    var equity = parsePositiveNumber_(input.equity, 'equity');
    var riskPercent = parsePositiveNumber_(input.risk_percent, 'risk_percent');
    riskAmount = equity * (riskPercent / 100);
  } else if (mode === 'fixed_cash') {
    riskAmount = parsePositiveNumber_(input.risk_cash, 'risk_cash');
  } else {
    throw new Error('Sizing mode must be manual_qty, fixed_risk_percent, or fixed_cash.');
  }

  var positionSize = riskAmount / riskDistance;
  qty = positionSize / entryPrice;

  return {
    qty: roundLedgerNumber_(qty),
    position_size: roundLedgerNumber_(positionSize),
  };
}

function calculateRealizedPnl_(position, exitQty, exitPrice, feeEntry, feeExit) {
  var entryPrice = Number(position.entry_price || 0);
  var qty = Number(exitQty || 0);
  var gross =
    position.direction === 'short'
      ? (entryPrice - Number(exitPrice || 0)) * qty
      : (Number(exitPrice || 0) - entryPrice) * qty;

  return roundLedgerNumber_(gross - Number(feeEntry || 0) - Number(feeExit || 0));
}

function calculateAverageRMultiple_(closedPositions) {
  var multiples = closedPositions
    .map(function (position) {
      var entryPrice = Number(position.entry_price || 0);
      var stopLoss = Number(position.stop_loss || 0);
      var exitQty = Number(position.exit_qty || position.qty || 0);
      var riskAmount = Math.abs(entryPrice - stopLoss) * exitQty;

      if (!entryPrice || !stopLoss || !riskAmount) {
        return '';
      }

      return Number(position.realized_pnl || 0) / riskAmount;
    })
    .filter(function (value) {
      return value !== '' && isFinite(value);
    });

  if (multiples.length === 0) {
    return '';
  }

  return roundLedgerNumber_(
    multiples.reduce(function (total, value) {
      return total + value;
    }, 0) / multiples.length
  );
}

function calculateTradingAnalytics_(closedPositions) {
  var closed = closedPositions.filter(function (position) {
    return position.status === 'closed';
  });
  var wins = closed.filter(function (position) {
    return Number(position.realized_pnl || 0) > 0;
  });
  var losses = closed.filter(function (position) {
    return Number(position.realized_pnl || 0) < 0;
  });
  var sumWins = sumPnl_(wins);
  var sumLosses = sumPnl_(losses);
  var avgWin = wins.length ? roundLedgerNumber_(sumWins / wins.length) : '';
  var avgLoss = losses.length ? roundLedgerNumber_(sumLosses / losses.length) : '';
  var winRate = closed.length ? roundLedgerNumber_(wins.length / closed.length) : 0;

  return {
    closed_trade_count: closed.length,
    win_rate: winRate,
    avg_win: avgWin,
    avg_loss: avgLoss,
    expectancy: closed.length ? roundLedgerNumber_((sumWins + sumLosses) / closed.length) : 0,
    profit_factor: sumLosses < 0 ? roundLedgerNumber_(sumWins / Math.abs(sumLosses)) : '',
    max_consecutive_loss: calculateMaxConsecutiveLoss_(closed),
    largest_win: wins.length ? maxPnl_(wins) : '',
    largest_loss: losses.length ? minPnl_(losses) : '',
    average_r_multiple: calculateAverageRMultiple_(closed),
  };
}

function sumPnl_(positions) {
  return positions.reduce(function (total, position) {
    return total + Number(position.realized_pnl || 0);
  }, 0);
}

function maxPnl_(positions) {
  return roundLedgerNumber_(
    Math.max.apply(
      null,
      positions.map(function (position) {
        return Number(position.realized_pnl || 0);
      })
    )
  );
}

function minPnl_(positions) {
  return roundLedgerNumber_(
    Math.min.apply(
      null,
      positions.map(function (position) {
        return Number(position.realized_pnl || 0);
      })
    )
  );
}

function calculateMaxConsecutiveLoss_(positions) {
  var maxLosses = 0;
  var currentLosses = 0;

  positions.forEach(function (position) {
    if (Number(position.realized_pnl || 0) < 0) {
      currentLosses += 1;
      maxLosses = Math.max(maxLosses, currentLosses);
    } else {
      currentLosses = 0;
    }
  });

  return maxLosses;
}

function parsePositiveNumber_(value, fieldName) {
  var numberValue = parseRequiredNumber_(value, fieldName);
  if (numberValue <= 0) {
    throw new Error(fieldName + ' must be positive.');
  }
  return numberValue;
}

function parseOptionalPositiveField_(value, fieldName, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  var numberValue = Number(value);
  if (!isFinite(numberValue)) {
    throw new Error(fieldName + ' must be a number.');
  }

  if (numberValue <= 0) {
    throw new Error(fieldName + ' must be positive.');
  }

  return numberValue;
}

function parseOptionalNonNegativeNumber_(value, fieldName, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  var numberValue = Number(value);
  if (!isFinite(numberValue)) {
    throw new Error(fieldName + ' must be a number.');
  }

  if (numberValue < 0) {
    throw new Error(fieldName + ' must be non-negative.');
  }

  return numberValue;
}

function roundLedgerNumber_(value) {
  if (value === '' || value === undefined || value === null) {
    return '';
  }

  return Math.round(Number(value) * 100000000) / 100000000;
}
