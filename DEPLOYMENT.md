# DEPLOYMENT.md

This project deploys through Google Apps Script, not GitHub Pages.

## 1. Deployment Summary

```text
GitHub repo = source and docs
script.google.com = production deployment
Google Sheet = runtime database
```

The live app URL must come from an Apps Script Web App deployment.

---

## 2. Before Deployment

Make sure you have:

```text
- a Google Sheet with required tabs
- bound Apps Script project
- source files copied into Apps Script
- no hardcoded personal Sheet ID unless explicitly intended
```

Recommended runtime model:

```javascript
SpreadsheetApp.getActiveSpreadsheet()
```

---

## 3. Deploy as Web App

In Apps Script:

```text
1. Open script.google.com or Extensions > Apps Script from the Sheet.
2. Click Deploy.
3. Click New deployment.
4. Select type: Web app.
5. Add description, for example: v0.1.0 MVP.
6. Execute as: Me.
7. Who has access: Only myself for personal use.
8. Click Deploy.
9. Authorize permissions.
10. Copy the Web App URL.
```

The production URL usually ends with:

```text
/exec
```

Use the `/exec` URL for normal usage.

---

## 4. Do Not Use /dev for Normal Usage

Apps Script may provide a `/dev` URL for testing.

Use `/exec` for normal usage.

```text
/exec = deployed version
/dev = development/testing version
```

---

## 5. Updating a Deployment

After changing code:

```text
1. Save Apps Script files.
2. Deploy > Manage deployments.
3. Select existing Web App deployment.
4. Edit.
5. Choose New version.
6. Deploy.
7. Reopen the /exec URL.
```

If you do not create/update a version, users may still see the older deployed version.

---

## 6. Recommended Personal Deployment Settings

For personal use:

```text
Execute as: Me
Who has access: Only myself
```

This keeps the app private to the owner's Google account.

---

## 7. Friend Clone Deployment

For a friend:

```text
1. Friend copies the Google Sheet template.
2. Friend opens their copied Sheet.
3. Friend opens Extensions > Apps Script.
4. Friend deploys as Web App.
5. Friend authorizes with their Google account.
6. Friend uses their own /exec URL.
```

This ensures:

```text
- friend has their own Sheet
- friend has their own Web App
- friend does not write to the owner's Sheet
```

---

## 8. Mobile Deployment Usage

After deployment:

### iPhone

```text
1. Open the /exec URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open from the home screen icon.
```

### Android

```text
1. Open the /exec URL in Chrome.
2. Tap menu.
3. Tap Add to Home screen.
4. Open from the home screen icon.
```

---

## 9. GitHub Pages Policy

Do not use GitHub Pages for MVP production deployment.

Reason:

```text
- MVP should be simple.
- Apps Script can serve the frontend.
- Apps Script is already connected to the bound Google Sheet.
- GitHub Pages adds extra deployment and API complexity.
```

GitHub Pages may be considered later only after explicit approval.

---

## 10. clasp Policy

`clasp` may be introduced later as an optional developer convenience.

MVP does not require it.

If using clasp later:

```text
npm install -g @google/clasp
clasp login
clasp push
clasp deploy
```

Important:

```text
- do not commit .clasprc.json
- do not commit OAuth tokens
- do not commit personal script IDs unless explicitly intended
- do not require clasp for non-technical clone users
```

---

## 11. GitHub Actions Policy

Do not set up automatic GitHub Actions deployment in MVP.

Reason:

```text
- requires Google OAuth credentials
- increases security risk
- makes clone workflow harder
- overengineers a personal tracker
```

GitHub Actions auto-deploy requires explicit human approval.

---

## 12. Deployment Checklist

Before marking a deployment as successful:

```text
[ ] Web App opens from /exec URL
[ ] Dashboard loads
[ ] App can read Settings tab
[ ] App can create portfolio
[ ] App can add position
[ ] App can close position
[ ] App can add holding
[ ] App can update manual price
[ ] Dashboard totals refresh
[ ] Data appears in the correct Google Sheet
[ ] Mobile browser opens the app
[ ] No private Sheet ID is committed to GitHub
[ ] No credentials are committed to GitHub
```

---

## 13. Rollback

If a deployment breaks:

```text
1. Open Apps Script.
2. Deploy > Manage deployments.
3. Select the previous working version if available.
4. Redeploy or create a new fixed version.
```

Also keep a backup copy of the Google Sheet before testing destructive features.

---

## 14. Production Safety

This app stores personal financial tracking data.

Do not publicly share:

```text
- personal Google Sheet URL
- Web App URL if access is public
- exported backup files
- screenshots with private financial data
```

Prefer private access settings for personal use.
