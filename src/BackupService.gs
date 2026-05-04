var LEDGER_BACKUP_FORMAT = 'ledger-appscript-backup-v1';

function createLedgerBackup() {
  initRequiredSheets();

  var spreadsheet = getActiveLedgerSpreadsheet_();
  return {
    format: LEDGER_BACKUP_FORMAT,
    app: {
      name: LEDGER_APP.name,
      version: LEDGER_APP.version,
    },
    exported_at: nowIso_(),
    spreadsheet_name: spreadsheet.getName(),
    sheets: REQUIRED_SHEETS.map(function (definition) {
      return {
        name: definition.name,
        headers: definition.headers.slice(),
        rows: exportSheetRows_(definition.name),
      };
    }),
  };
}

function importLedgerBackup(backupInput, options) {
  assertBackupConfirmation_(options, 'IMPORT', 'Import');
  initRequiredSheets();

  var backup = parseLedgerBackup_(backupInput);
  validateLedgerBackup_(backup);

  var imported = {};
  REQUIRED_SHEETS.forEach(function (definition) {
    var backupSheet = getBackupSheet_(backup, definition.name);
    replaceSheetDataRows_(definition.name, backupSheet.rows || []);
    imported[definition.name] = (backupSheet.rows || []).length;
  });

  return {
    format: backup.format,
    imported_at: nowIso_(),
    imported: imported,
  };
}

function resetLedgerData(options) {
  assertBackupConfirmation_(options, 'RESET', 'Reset');
  initRequiredSheets();

  var cleared = {};
  REQUIRED_SHEETS.forEach(function (definition) {
    cleared[definition.name] = countSheetDataRows_(definition.name);
    clearSheetDataRows_(definition.name);
    seedSheetDefaults_(definition);
  });

  return {
    reset_at: nowIso_(),
    cleared: cleared,
  };
}

function exportSheetRows_(sheetName) {
  var headers = getHeadersForSheet_(sheetName);
  return readRows_(sheetName)
    .filter(function (row) {
      return headers.some(function (header) {
        return row[header] !== '' && row[header] !== undefined && row[header] !== null;
      });
    })
    .map(function (row) {
      var exported = {};
      headers.forEach(function (header) {
        exported[header] = normalizeBackupCellValue_(row[header]);
      });
      return exported;
    });
}

function normalizeBackupCellValue_(value) {
  if (value === undefined || value === null) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  return value;
}

function parseLedgerBackup_(backupInput) {
  if (typeof backupInput === 'string') {
    try {
      return JSON.parse(backupInput);
    } catch (error) {
      throw new Error('Backup JSON could not be parsed.');
    }
  }

  return backupInput || {};
}

function validateLedgerBackup_(backup) {
  if (!backup || backup.format !== LEDGER_BACKUP_FORMAT) {
    throw new Error('Backup format is not supported.');
  }

  if (!Array.isArray(backup.sheets)) {
    throw new Error('Backup sheets are missing.');
  }

  REQUIRED_SHEETS.forEach(function (definition) {
    var backupSheet = getBackupSheet_(backup, definition.name);

    if (!arraysEqual_(backupSheet.headers || [], definition.headers)) {
      throw new Error(definition.name + ' backup schema does not match this app version.');
    }

    if (!Array.isArray(backupSheet.rows)) {
      throw new Error(definition.name + ' backup rows are missing.');
    }
  });
}

function getBackupSheet_(backup, sheetName) {
  for (var index = 0; index < backup.sheets.length; index += 1) {
    if (backup.sheets[index].name === sheetName) {
      return backup.sheets[index];
    }
  }

  throw new Error(sheetName + ' backup sheet is missing.');
}

function replaceSheetDataRows_(sheetName, rows) {
  clearSheetDataRows_(sheetName);

  if (!rows.length) {
    return;
  }

  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(sheetName);
  var values = rows.map(function (row) {
    return objectToRow_(sheetName, row);
  });

  ensureSheetRowCapacity_(sheet, values.length + 1);
  sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
}

function clearSheetDataRows_(sheetName) {
  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(sheetName);
  var rowCount = countSheetDataRows_(sheetName);

  if (rowCount > 0) {
    sheet.deleteRows(2, rowCount);
  }
}

function countSheetDataRows_(sheetName) {
  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(sheetName);
  return Math.max(0, sheet.getLastRow() - 1);
}

function seedSheetDefaults_(definition) {
  if (!definition.defaults || definition.defaults.length === 0) {
    return;
  }

  var sheet = getActiveLedgerSpreadsheet_().getSheetByName(definition.name);
  ensureSheetRowCapacity_(sheet, definition.defaults.length + 1);
  sheet.getRange(2, 1, definition.defaults.length, definition.headers.length).setValues(definition.defaults);
}

function ensureSheetRowCapacity_(sheet, requiredRows) {
  if (typeof sheet.getMaxRows !== 'function' || typeof sheet.insertRowsAfter !== 'function') {
    return;
  }

  var currentRows = sheet.getMaxRows();
  if (currentRows < requiredRows) {
    sheet.insertRowsAfter(currentRows, requiredRows - currentRows);
  }
}

function assertBackupConfirmation_(options, expected, actionLabel) {
  var confirmation = options && options.confirmation;

  if (confirmation !== expected) {
    throw new Error(actionLabel + ' requires strong confirmation. Please type ' + expected + '.');
  }
}

function arraysEqual_(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  for (var index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}
