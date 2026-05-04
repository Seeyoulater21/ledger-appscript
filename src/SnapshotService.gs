function listDailySnapshots(options) {
  var filters = options || {};
  var limit = filters.limit ? Number(filters.limit) : 0;
  var snapshots = readRows_('DailySnapshots')
    .map(normalizeDailySnapshot_)
    .filter(function (snapshot) {
      return Boolean(snapshot.date);
    })
    .sort(compareSnapshotsByDate_);

  if (limit > 0 && snapshots.length > limit) {
    return snapshots.slice(snapshots.length - limit);
  }

  return snapshots;
}

function createDailySnapshot(input) {
  initRequiredSheets();

  var payload = input || {};
  var date = normalizeDateKey_(payload.date || todayIsoDate_());
  var overview = getDashboardOverview({ currency: 'USD', today: date });
  var snapshot = {
    date: date,
    total_portfolio_value_usd: overview.totals.total_portfolio_value_usd,
    trading_value_usd: overview.totals.trading_balance_usd,
    holdings_value_usd: overview.totals.holdings_value_usd,
    cashflow_net_usd: Number(payload.cashflow_net_usd || 0),
    created_at: nowIso_(),
  };
  var existing = findDailySnapshotRow_(date);

  if (existing) {
    snapshot.created_at = existing.row.created_at || snapshot.created_at;
    writeRow_('DailySnapshots', existing.rowNumber, snapshot);
  } else {
    appendRow_('DailySnapshots', snapshot);
  }

  return normalizeDailySnapshot_(snapshot);
}

function getLatestSnapshotBefore_(date) {
  var targetDate = normalizeDateKey_(date || todayIsoDate_());
  var snapshots = listDailySnapshots();
  var latest = null;

  snapshots.forEach(function (snapshot) {
    if (snapshot.date < targetDate) {
      latest = snapshot;
    }
  });

  return latest;
}

function normalizeDailySnapshot_(row) {
  return {
    date: normalizeDateKey_(row.date),
    total_portfolio_value_usd: Number(row.total_portfolio_value_usd || 0),
    trading_value_usd: Number(row.trading_value_usd || 0),
    holdings_value_usd: Number(row.holdings_value_usd || 0),
    cashflow_net_usd: Number(row.cashflow_net_usd || 0),
    created_at: row.created_at || '',
    _rowNumber: row._rowNumber,
  };
}

function findDailySnapshotRow_(date) {
  var targetDate = normalizeDateKey_(date);
  var rows = readRows_('DailySnapshots');

  for (var index = 0; index < rows.length; index += 1) {
    if (normalizeDateKey_(rows[index].date) === targetDate) {
      return {
        row: rows[index],
        rowNumber: rows[index]._rowNumber,
      };
    }
  }

  return null;
}

function compareSnapshotsByDate_(left, right) {
  if (left.date === right.date) {
    return String(left.created_at || '').localeCompare(String(right.created_at || ''));
  }

  return left.date < right.date ? -1 : 1;
}
