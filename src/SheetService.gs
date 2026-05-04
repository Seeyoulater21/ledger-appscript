function getActiveLedgerSpreadsheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('No active spreadsheet found. Open this script from a bound Google Sheet.');
  }

  return spreadsheet;
}

function getRequiredSheetDefinitions() {
  return REQUIRED_SHEETS.map(function (definition) {
    return {
      name: definition.name,
      headers: definition.headers.slice(),
    };
  });
}

function initRequiredSheets() {
  var spreadsheet = getActiveLedgerSpreadsheet_();
  var created = [];
  var updated = [];

  REQUIRED_SHEETS.forEach(function (definition) {
    var sheet = spreadsheet.getSheetByName(definition.name);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(definition.name);
      created.push(definition.name);
    }

    if (ensureHeaderRow_(sheet, definition.headers)) {
      updated.push(definition.name);
    }

    if (definition.defaults && sheet.getLastRow() === 1) {
      sheet
        .getRange(2, 1, definition.defaults.length, definition.headers.length)
        .setValues(definition.defaults);
      updated.push(definition.name);
    }
  });

  return {
    spreadsheetName: spreadsheet.getName(),
    created: created,
    updated: dedupe_(updated),
    sheets: getRequiredSheetDefinitions(),
  };
}

function getSheetSchema() {
  return {
    app: LEDGER_APP,
    sheets: getRequiredSheetDefinitions(),
  };
}

function ensureHeaderRow_(sheet, headers) {
  var existingValues = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasSameHeaders = headers.every(function (header, index) {
    return existingValues[index] === header;
  });

  if (hasSameHeaders) {
    return false;
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return true;
}

function dedupe_(values) {
  return values.filter(function (value, index) {
    return values.indexOf(value) === index;
  });
}
