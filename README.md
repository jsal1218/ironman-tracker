# DashFit — Triathlon training tracker

Static, no-build PWA (HTML/CSS/JS). Live: https://jsal1218.github.io/ironman-tracker/

## Deploying
Just `git commit` and `git push` to `main` (GitHub Pages serves the branch root).

A pre-commit hook stamps a unique version (UTC time + parent commit) into `sw.js` and `app.js`,
which makes installed apps pick up the new service worker within ~a minute of opening/foregrounding.
After cloning, enable the hook once:

    git config core.hooksPath .githooks

(Or run `sh scripts/stamp-version.sh` manually before committing.) The current version is shown in the app footer.
