# AGENTS.md

Guidance for Codex agents and AI coding assistants working on this repository.

Repository:

```text
https://github.com/Seeyoulater21/ledger-appscript
```

## 1. Project Summary

This project is a **personal trading ledger web app** built with:

```text
Google Sheet = personal database
Google Apps Script = backend + web app runtime
HTML/CSS/JavaScript = frontend
GitHub = source-code and documentation repository only
script.google.com = real deployment target
```

The app is designed for **personal use first**.

Each user should own their own Google Sheet and their own Apps Script deployment.

```text
1 user = 1 copied Google Sheet = 1 bound Apps Script = 1 deployed Web App URL
```

This is not a SaaS product, not a centralized database app, and not a multi-user platform.

---

## 2. Non-Negotiable Architecture Rules

Agents must follow these rules unless the human owner explicitly changes the architecture.

### GitHub Role

GitHub is used for:

```text
- source files
- documentation
- templates
- issue planning
- pull request review
- version history
```

GitHub is **not** the production runtime for MVP.

### Deployment Role

Production deployment is done through:

```text
script.google.com
```

The live URL must come from a Google Apps Script Web App deployment, usually an `/exec` URL.

Do not deploy to GitHub Pages for MVP.

### Google Sheet Role

Google Sheet is the runtime database.

Preferred model:

```text
Google Sheet Template
└── Bound Apps Script
```

Use:

```javascript
SpreadsheetApp.getActiveSpreadsheet()
```

whenever possible so that when another user copies the template, the script automatically points to that user's copied Sheet.

---

## 3. What Agents May Do

Agents may:

```text
- edit files in this GitHub repository
- create documentation
- create Apps Script source files
- create HTML/CSS/JS frontend files
- create sheet schema docs
- create setup/deployment guides
- open issues
- open pull requests
- review code
- propose implementation plans
```

Agents may create or edit files such as:

```text
README.md
PRD.md
SETUP.md
DEPLOYMENT.md
CHANGELOG.md
AGENTS.md
appsscript.json
src/Code.gs
src/Config.gs
src/SheetService.gs
src/PortfolioService.gs
src/PositionService.gs
src/HoldingService.gs
src/PriceService.gs
src/SnapshotService.gs
src/CalcService.gs
src/BackupService.gs
src/Index.html
src/client.html
src/styles.html
docs/sheet-schema.md
docs/clone-guide.md
docs/mobile-usage.md
```

---

## 4. What Agents Must Not Do

Agents must not:

```text
- add Supabase
- add Firebase
- add Postgres
- add Next.js
- add React/Vue/Svelte for MVP
- add custom user registration
- add custom password login
- add multi-user tenant architecture
- add billing/subscription
- add exchange auto-sync in MVP
- add realtime price streaming in MVP
- add GitHub Pages deployment for MVP
- add GitHub Actions auto-deploy unless explicitly approved
- hardcode the owner's Spreadsheet ID
- commit .clasprc.json
- commit .clasp.json if it contains a real scriptId
- commit OAuth tokens
- commit API keys
- commit Google credentials
- commit private Sheet URLs
- silently delete user data
```

---

## 5. Credential and Secret Policy

Never commit secrets.

Never create files containing:

```text
- Google OAuth tokens
- .clasprc.json
- private .clasp.json with real scriptId
- service account JSON
- API keys
- real user Sheet IDs
- private Web App URLs
```

If `clasp` is introduced later, document it separately and keep credentials local.

Allowed placeholder examples:

```text
YOUR_SCRIPT_ID
YOUR_SPREADSHEET_ID
YOUR_WEB_APP_URL
```

---

## 6. Deployment Workflow

MVP workflow:

```text
1. Agent edits GitHub repo.
2. Human reviews and merges.
3. Human opens Google Sheet Template.
4. Human opens Extensions > Apps Script.
5. Human copies Apps Script files from repo into script.google.com.
6. Human deploys as Web App.
7. Human tests with their own Sheet.
```

Agents should not attempt to deploy to Google Apps Script unless explicitly instructed by the human owner.

Later optional workflow:

```text
GitHub repo / local machine
↓
clasp push
↓
script.google.com
↓
manual deploy or clasp deploy
```

This must remain optional and documented.

---

## 7. Development Workflow for Agents

Before changing code:

```text
1. Read README.md.
2. Read PRD.md.
3. Read SETUP.md.
4. Read DEPLOYMENT.md.
5. Check current git status.
6. Identify the target phase or issue.
7. Make the smallest useful change.
8. Update CHANGELOG.md.
9. Report changed files and test status.
```

Preferred work style:

```text
- one issue = one small PR
- keep changes readable
- avoid introducing tooling unless needed
- keep Apps Script compatible
- keep UI mobile-first
- prefer simple HTML/CSS/vanilla JS
- prefer clear comments over clever abstractions
```

---

## 8. Decision Gates

Agents must stop and ask for human approval before:

```text
- changing the architecture
- introducing a build step
- adding a package manager requirement
- adding clasp as a required workflow
- adding GitHub Actions
- adding external APIs
- adding exchange sync
- adding any credential handling
- changing deployment target
- implementing hard delete
- changing backup/import behavior
- touching destructive reset logic
```

---

## 9. MVP Implementation Order

Follow this order unless an issue explicitly says otherwise:

```text
Phase 0: Repo documentation and skeleton
Phase 1: Sheet schema + app shell
Phase 2: Portfolio MVP
Phase 3: Position MVP
Phase 4: Holdings MVP
Phase 5: Dashboard MVP
Phase 6: Price Cache MVP
Phase 7: Snapshots + simple charts
Phase 8: Backup / Import / Reset
Phase 9: Clone polish and mobile usage docs
```

---

## 10. Coding Guidelines

### Apps Script

Use plain Google Apps Script.

Prefer readable service modules:

```text
Code.gs
Config.gs
SheetService.gs
PortfolioService.gs
PositionService.gs
HoldingService.gs
PriceService.gs
SnapshotService.gs
CalcService.gs
BackupService.gs
```

### Frontend

Use:

```text
Index.html
styles.html
client.html
```

Do not require React/Next/Vite/Webpack in MVP.

Use `google.script.run` for calling server-side Apps Script functions from the frontend.

### Data Access

Use the active bound spreadsheet:

```javascript
const ss = SpreadsheetApp.getActiveSpreadsheet();
```

Provide fallback only if a later standalone-script mode is explicitly requested.

### Deletion

Prefer soft delete / archive:

```text
archived = TRUE
```

Avoid hard delete unless there is a clear, confirmed destructive action.

---

## 11. Testing Expectations

Apps Script has limited local testing in this workflow.

Agents should provide:

```text
- manual test steps
- expected result
- files changed
- known limitations
```

For calculation-heavy code, isolate pure functions in `CalcService.gs` where possible.

Manual testing should include:

```text
- fresh Sheet setup
- create portfolio
- add position
- close position
- add holding
- update manual price
- dashboard refresh
- mobile browser check
```

---

## 12. Definition of Done

A task is done when:

```text
- files are updated in repo
- docs are updated if workflow changed
- CHANGELOG.md is updated
- no credentials are added
- no personal Sheet ID is hardcoded
- manual test steps are provided
- deployment remains script.google.com based
- clone-friendly behavior is preserved
```

---

## 13. Summary for Agents

Build a simple, personal, clone-friendly trading ledger.

Optimize for:

```text
- easy to understand
- easy to copy
- easy to deploy manually
- safe with personal data
- mobile-friendly usage
- minimal dependencies
```

Do not optimize for:

```text
- enterprise scale
- multi-user SaaS
- automated exchange sync
- realtime trading
- complex CI/CD
- heavy frontend frameworks
```
