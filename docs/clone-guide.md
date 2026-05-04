# Clone Guide

This app is clone-friendly by design:

```text
1 user = 1 copied Sheet = 1 bound Apps Script = 1 script.google.com Web App URL
```

GitHub stores source code and documentation only. Production deployment is through `script.google.com`. GitHub Pages is not used for the MVP.

Do not copy, paste, or commit credentials, OAuth tokens, private Sheet URLs, private Web App URLs, or `.clasp.json` files containing a real `scriptId`.

## Owner Template Setup

1. Create the Google Sheet template.
2. Open `Extensions > Apps Script`.
3. Copy files from `src/` into matching Apps Script files.
4. Copy `appsscript.json` into the Apps Script manifest.
5. Save all files.
6. Run `initializeLedger()` or click `Initialize sheets` in the web app.
7. Deploy from `script.google.com` as a Web App.
8. Use the generated `/exec` URL.

## Friend Clone Flow

1. Friend opens the template Sheet.
2. Friend chooses `File > Make a copy`.
3. Friend opens their copied Sheet.
4. Friend opens `Extensions > Apps Script` from the copied Sheet.
5. Friend deploys their own Web App from `script.google.com`.
6. Friend uses their own `/exec` URL.

Because the script uses `SpreadsheetApp.getActiveSpreadsheet()`, the copied Sheet stays connected to the copied bound script.

## Backup Before Import Or Reset

1. Open the Web App `/exec` URL.
2. Open `Settings`.
3. Click `Export JSON`.
4. Keep the backup JSON somewhere private.

Import only trusted JSON backups. For the safest test, import into an empty copied Sheet first. Import replaces current app-owned rows instead of merging.

Reset requires typing `RESET`. It clears app-owned rows in the copied Sheet and keeps the Sheet file and tabs.
