# Dash — personal dashboard

Static, no-build PWA hub (HTML/CSS/JS):

- `/` — Dash hub (tiles + live widgets), app registry in `apps.js`
- `/fitness/` — DashFit triathlon training tracker (data in localStorage, same origin as before)
- `/nba/` — DashHoops scores (ESPN public scoreboard/summary API, CORS-enabled, no key)
- `shared/` — base theme (`base.css`) and update/version script (`update.js`)
- `sw.js` — one service worker for the whole site (scope `/`), network-first for HTML/JS/JSON/CSS

## Adding an app
1. Create `/myapp/index.html` that loads `../shared/base.css` and `../shared/update.js`.
2. Add an entry to `DASH_APPS` in `apps.js` (optional `widget(el)` for a live tile).
3. Optionally add its files to `PRE` in `sw.js` for offline use.

Live: Live: https://jsal1218.github.io/ironman-tracker/

## Deploying
Just `git commit` and `git push` to `main` (GitHub Pages serves the branch root).

A pre-commit hook stamps a unique version (UTC time + parent commit) into `sw.js` and `shared/update.js`,
which makes installed apps pick up the new service worker within ~a minute of opening/foregrounding.
After cloning, enable the hook once:

    git config core.hooksPath .githooks

(Or run `sh scripts/stamp-version.sh` manually before committing.) The current version is shown in the app footer.
