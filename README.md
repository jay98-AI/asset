# Asset Hub

A Vite-powered React single-page application for searching, browsing, and managing production assets.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Quality checks

From a clean checkout, use a Node version that satisfies `package.json`'s `engines` field, then run:

```bash
npm ci
npm run test:browser:install
npm run quality
```

`npm run test:browser:install` provisions Chromium once for the browser gate. `npm run quality` runs six independent gates in order: lint, production build, frontend tests, tooling contracts, browser tests, and requirement traceability. Each gate prints `[quality] START`, then `[quality] PASS` or `[quality] FAIL`; the runner attempts every gate and exits non-zero if any gate fails. Child diagnostics stay visible in the terminal, and browser failure artifacts are generated locally in `playwright-report/` and `test-results/`; the build output is local `dist/`.

Run any gate separately when narrowing down a failure:

```bash
npm run lint
npm run build
npm run test:frontend
npm run test:tooling
npm run test:browser
npm run test:traceability
```

A green Phase 1 quality run is repeatable tooling, smoke, and traceability readiness evidence. It is not comprehensive functional, browser-journey, responsive, accessibility, usability, or release sign-off; later phases supply those reviews.

## Prototype access

Switch to **Admin** and use `admin123` to open the prototype admin tools.

The original `.dc.html` discovery artifacts are retained in the project root for reference. The React application lives in `src/` and no longer depends on `support.js`.
